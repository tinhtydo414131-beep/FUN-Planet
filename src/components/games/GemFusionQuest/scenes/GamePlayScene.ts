import Phaser from 'phaser';
import { useGemFusionStore } from '../store';
import { GEM_COLORS, LEVELS, LevelConfig, SPECIAL_GEMS, BLOCKER_TYPES } from '../gameData';

interface Gem {
  row: number;
  col: number;
  colorIndex: number;
  sprite: Phaser.GameObjects.Text;
  special?: 'line_h' | 'line_v' | 'burst' | 'rainbow';
  blocker?: string;
  blockerLayer?: number;
}

export class GamePlayScene extends Phaser.Scene {
  private grid: (Gem | null)[][] = [];
  private level!: LevelConfig;
  private gridWidth = 7;
  private gridHeight = 8;
  private cellSize = 60;
  private gridOffsetX = 0;
  private gridOffsetY = 0;
  
  private selectedGem: Gem | null = null;
  private isSwapping = false;
  private isProcessing = false;
  
  private score = 0;
  private movesLeft = 30;
  private objectives: Map<string, { current: number; target: number }> = new Map();
  
  private scoreText!: Phaser.GameObjects.Text;
  private movesText!: Phaser.GameObjects.Text;
  private objectivesContainer!: Phaser.GameObjects.Container;
  
  private comboMultiplier = 1;
  private cascadeCount = 0;
  
  constructor() {
    super({ key: 'GamePlay' });
  }
  
  init(data: { levelId: number }) {
    const levelId = data.levelId || useGemFusionStore.getState().currentLevel;
    this.level = LEVELS.find(l => l.id === levelId) || LEVELS[0];
    this.gridWidth = this.level.gridWidth;
    this.gridHeight = this.level.gridHeight;
    this.movesLeft = this.level.moves;
    this.score = 0;
    this.comboMultiplier = 1;
    this.cascadeCount = 0;
    
    // Initialize objectives
    this.objectives.clear();
    this.level.objectives.forEach(obj => {
      if (obj.type === 'score') {
        this.objectives.set('score', { current: 0, target: obj.target });
      } else if (obj.type === 'collect') {
        this.objectives.set(`collect_${obj.gemId}`, { current: 0, target: obj.amount });
      } else if (obj.type === 'clear_crystals') {
        this.objectives.set('crystals', { current: 0, target: obj.amount });
      }
    });
  }
  
  create() {
    const { width, height } = this.cameras.main;
    
    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x2d3436, 0x2d3436, 1);
    bg.fillRect(0, 0, width, height);
    
    // Calculate grid position
    this.cellSize = Math.min(60, (width - 40) / this.gridWidth);
    this.gridOffsetX = (width - this.gridWidth * this.cellSize) / 2;
    this.gridOffsetY = 200;
    
    // Draw grid background
    this.drawGridBackground();
    
    // Create HUD
    this.createHUD();
    
    // Initialize grid
    this.initializeGrid();
    
    // Remove initial matches
    this.removeInitialMatches();
    
    // Setup input
    this.setupInput();
    
    // Add pause button
    this.createPauseButton();
    
    // Entry animation
    this.playEntryAnimation();
  }
  
  drawGridBackground() {
    const bg = this.add.graphics();
    
    // Grid container background
    bg.fillStyle(0x000000, 0.3);
    bg.fillRoundedRect(
      this.gridOffsetX - 10,
      this.gridOffsetY - 10,
      this.gridWidth * this.cellSize + 20,
      this.gridHeight * this.cellSize + 20,
      15
    );
    
    // Cell backgrounds
    for (let row = 0; row < this.gridHeight; row++) {
      for (let col = 0; col < this.gridWidth; col++) {
        const x = this.gridOffsetX + col * this.cellSize;
        const y = this.gridOffsetY + row * this.cellSize;
        
        // Check for holes
        const isHole = this.level.holes?.some(h => h[0] === col && h[1] === row);
        
        if (!isHole) {
          bg.fillStyle((row + col) % 2 === 0 ? 0x3d3d5c : 0x4a4a6a, 0.8);
          bg.fillRoundedRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4, 8);
        }
      }
    }
  }
  
  createHUD() {
    const { width } = this.cameras.main;
    
    // Level indicator
    this.add.text(width / 2, 30, `Level ${this.level.id}`, {
      fontFamily: 'Arial Black',
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);
    
    // Score
    this.add.text(30, 70, 'SCORE', {
      fontSize: '14px',
      color: '#a8d8ff',
    });
    this.scoreText = this.add.text(30, 90, '0', {
      fontFamily: 'Arial Black',
      fontSize: '28px',
      color: '#ffd93d',
      stroke: '#000000',
      strokeThickness: 2,
    });
    
    // Moves
    this.add.text(width - 30, 70, 'MOVES', {
      fontSize: '14px',
      color: '#a8d8ff',
    }).setOrigin(1, 0);
    this.movesText = this.add.text(width - 30, 90, this.movesLeft.toString(), {
      fontFamily: 'Arial Black',
      fontSize: '28px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(1, 0);
    
    // Objectives
    this.objectivesContainer = this.add.container(width / 2, 140);
    this.updateObjectivesDisplay();
    
    // Star progress bar
    this.createStarProgressBar();
  }
  
  createStarProgressBar() {
    const { width } = this.cameras.main;
    const barWidth = 200;
    const barX = (width - barWidth) / 2;
    const barY = 165;
    
    // Background
    const bgBar = this.add.graphics();
    bgBar.fillStyle(0x333333, 0.8);
    bgBar.fillRoundedRect(barX, barY, barWidth, 10, 5);
    
    // Star markers
    const thresholds = this.level.starThresholds;
    for (let i = 0; i < 3; i++) {
      const ratio = thresholds[i] / thresholds[2];
      const starX = barX + ratio * barWidth;
      this.add.text(starX, barY + 5, '⭐', {
        fontSize: '16px',
      }).setOrigin(0.5);
    }
  }
  
  updateObjectivesDisplay() {
    this.objectivesContainer.removeAll(true);
    
    let offsetX = 0;
    this.objectives.forEach((obj, key) => {
      if (key === 'score') return; // Score shown separately
      
      const emoji = key.startsWith('collect_') 
        ? GEM_COLORS.find(g => key.includes(g.id))?.emoji || '💎'
        : key === 'crystals' ? '💠' : '📦';
      
      const text = this.add.text(offsetX, 0, `${emoji} ${obj.current}/${obj.target}`, {
        fontSize: '18px',
        color: obj.current >= obj.target ? '#2ecc71' : '#ffffff',
      }).setOrigin(0.5);
      
      this.objectivesContainer.add(text);
      offsetX += 80;
    });
    
    // Center the container
    this.objectivesContainer.x = this.cameras.main.width / 2 - (offsetX - 80) / 2;
  }
  
  initializeGrid() {
    this.grid = [];
    
    for (let row = 0; row < this.gridHeight; row++) {
      this.grid[row] = [];
      for (let col = 0; col < this.gridWidth; col++) {
        // Check for holes
        const isHole = this.level.holes?.some(h => h[0] === col && h[1] === row);
        
        if (isHole) {
          this.grid[row][col] = null;
        } else {
          this.createGem(row, col);
        }
      }
    }
    
    // Add blockers
    this.addBlockers();
  }
  
  createGem(row: number, col: number, animate = false): Gem {
    const colorIndex = Phaser.Math.Between(0, this.level.gemTypes - 1);
    const color = GEM_COLORS[colorIndex];
    
    const x = this.gridOffsetX + col * this.cellSize + this.cellSize / 2;
    const y = animate 
      ? this.gridOffsetY - this.cellSize 
      : this.gridOffsetY + row * this.cellSize + this.cellSize / 2;
    
    const sprite = this.add.text(x, y, color.emoji, {
      fontSize: `${this.cellSize - 12}px`,
    }).setOrigin(0.5);
    
    const gem: Gem = {
      row,
      col,
      colorIndex,
      sprite,
    };
    
    this.grid[row][col] = gem;
    
    if (animate) {
      this.tweens.add({
        targets: sprite,
        y: this.gridOffsetY + row * this.cellSize + this.cellSize / 2,
        duration: 300 + row * 50,
        ease: 'Bounce.easeOut',
      });
    }
    
    return gem;
  }
  
  addBlockers() {
    if (!this.level.blockers) return;
    
    this.level.blockers.forEach(blocker => {
      const positions = blocker.positions || this.getRandomPositions(blocker.count || 5);
      
      positions.forEach(([col, row]) => {
        const gem = this.grid[row]?.[col];
        if (gem) {
          gem.blocker = blocker.type;
          const blockerInfo = BLOCKER_TYPES[blocker.type.toUpperCase() as keyof typeof BLOCKER_TYPES];
          gem.blockerLayer = ('layers' in blockerInfo ? blockerInfo.layers : 1) || 1;
          this.updateGemVisual(gem);
        }
      });
    });
  }
  
  getRandomPositions(count: number): [number, number][] {
    const positions: [number, number][] = [];
    while (positions.length < count) {
      const col = Phaser.Math.Between(0, this.gridWidth - 1);
      const row = Phaser.Math.Between(0, this.gridHeight - 1);
      if (!positions.some(p => p[0] === col && p[1] === row)) {
        positions.push([col, row]);
      }
    }
    return positions;
  }
  
  updateGemVisual(gem: Gem) {
    const color = GEM_COLORS[gem.colorIndex];
    let emoji = color.emoji;
    
    // Add special indicator
    if (gem.special) {
      switch (gem.special) {
        case 'line_h': emoji = '↔️'; break;
        case 'line_v': emoji = '↕️'; break;
        case 'burst': emoji = '💥'; break;
        case 'rainbow': emoji = '🌈'; break;
      }
    }
    
    // Add blocker overlay
    if (gem.blocker) {
      const blockerEmoji = gem.blocker === 'crystal' ? '💠' :
                          gem.blocker === 'ice' ? '🧊' :
                          gem.blocker === 'lock' ? '🔒' : '';
      if (gem.blockerLayer && gem.blockerLayer > 0) {
        gem.sprite.setText(`${emoji}\n${blockerEmoji}`);
        gem.sprite.setFontSize(this.cellSize / 2);
      }
    } else {
      gem.sprite.setText(emoji);
    }
  }
  
  removeInitialMatches() {
    let hasMatches = true;
    let iterations = 0;
    
    while (hasMatches && iterations < 100) {
      hasMatches = false;
      iterations++;
      
      for (let row = 0; row < this.gridHeight; row++) {
        for (let col = 0; col < this.gridWidth; col++) {
          const gem = this.grid[row][col];
          if (!gem) continue;
          
          // Check horizontal match
          if (col >= 2) {
            const left1 = this.grid[row][col - 1];
            const left2 = this.grid[row][col - 2];
            if (left1 && left2 && 
                gem.colorIndex === left1.colorIndex && 
                gem.colorIndex === left2.colorIndex) {
              gem.colorIndex = (gem.colorIndex + 1) % this.level.gemTypes;
              gem.sprite.setText(GEM_COLORS[gem.colorIndex].emoji);
              hasMatches = true;
            }
          }
          
          // Check vertical match
          if (row >= 2) {
            const up1 = this.grid[row - 1][col];
            const up2 = this.grid[row - 2][col];
            if (up1 && up2 && 
                gem.colorIndex === up1.colorIndex && 
                gem.colorIndex === up2.colorIndex) {
              gem.colorIndex = (gem.colorIndex + 1) % this.level.gemTypes;
              gem.sprite.setText(GEM_COLORS[gem.colorIndex].emoji);
              hasMatches = true;
            }
          }
        }
      }
    }
  }
  
  setupInput() {
    let startPos: { row: number; col: number } | null = null;
    
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isProcessing) return;
      
      const pos = this.getGridPosition(pointer.x, pointer.y);
      if (pos && this.grid[pos.row]?.[pos.col]) {
        startPos = pos;
        this.selectGem(this.grid[pos.row][pos.col]!);
      }
    });
    
    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.isProcessing || !startPos) return;
      
      const endPos = this.getGridPosition(pointer.x, pointer.y);
      if (endPos) {
        const dx = endPos.col - startPos.col;
        const dy = endPos.row - startPos.row;
        
        // Determine swipe direction
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) >= 0.3) {
          // Horizontal swipe
          const targetCol = startPos.col + (dx > 0 ? 1 : -1);
          if (targetCol >= 0 && targetCol < this.gridWidth) {
            this.trySwap(startPos.row, startPos.col, startPos.row, targetCol);
          }
        } else if (Math.abs(dy) >= 0.3) {
          // Vertical swipe
          const targetRow = startPos.row + (dy > 0 ? 1 : -1);
          if (targetRow >= 0 && targetRow < this.gridHeight) {
            this.trySwap(startPos.row, startPos.col, targetRow, startPos.col);
          }
        }
      }
      
      this.deselectGem();
      startPos = null;
    });
  }
  
  getGridPosition(x: number, y: number): { row: number; col: number } | null {
    const col = Math.floor((x - this.gridOffsetX) / this.cellSize);
    const row = Math.floor((y - this.gridOffsetY) / this.cellSize);
    
    if (col >= 0 && col < this.gridWidth && row >= 0 && row < this.gridHeight) {
      return { row, col };
    }
    return null;
  }
  
  selectGem(gem: Gem) {
    this.selectedGem = gem;
    
    this.tweens.add({
      targets: gem.sprite,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 100,
    });
  }
  
  deselectGem() {
    if (this.selectedGem) {
      this.tweens.add({
        targets: this.selectedGem.sprite,
        scaleX: 1,
        scaleY: 1,
        duration: 100,
      });
      this.selectedGem = null;
    }
  }
  
  async trySwap(row1: number, col1: number, row2: number, col2: number) {
    const gem1 = this.grid[row1]?.[col1];
    const gem2 = this.grid[row2]?.[col2];
    
    if (!gem1 || !gem2) return;
    if (gem1.blocker || gem2.blocker) return; // Can't swap blocked gems
    
    this.isProcessing = true;
    
    // Animate swap
    await this.animateSwap(gem1, gem2);
    
    // Actually swap in grid
    this.grid[row1][col1] = gem2;
    this.grid[row2][col2] = gem1;
    gem1.row = row2;
    gem1.col = col2;
    gem2.row = row1;
    gem2.col = col1;
    
    // Check for matches
    const matches = this.findMatches();
    
    if (matches.length > 0) {
      this.movesLeft--;
      this.movesText.setText(this.movesLeft.toString());
      
      this.cascadeCount = 0;
      await this.processMatches(matches);
      
      // Check win/lose conditions
      this.checkGameEnd();
    } else {
      // Swap back
      await this.animateSwap(gem1, gem2);
      this.grid[row1][col1] = gem1;
      this.grid[row2][col2] = gem2;
      gem1.row = row1;
      gem1.col = col1;
      gem2.row = row2;
      gem2.col = col2;
    }
    
    this.isProcessing = false;
  }
  
  animateSwap(gem1: Gem, gem2: Gem): Promise<void> {
    return new Promise(resolve => {
      const x1 = gem1.sprite.x;
      const y1 = gem1.sprite.y;
      const x2 = gem2.sprite.x;
      const y2 = gem2.sprite.y;
      
      this.tweens.add({
        targets: gem1.sprite,
        x: x2,
        y: y2,
        duration: 150,
        ease: 'Power2',
      });
      
      this.tweens.add({
        targets: gem2.sprite,
        x: x1,
        y: y1,
        duration: 150,
        ease: 'Power2',
        onComplete: () => resolve(),
      });
    });
  }
  
  findMatches(): Gem[][] {
    const matches: Gem[][] = [];
    const visited = new Set<string>();
    
    // Check horizontal matches
    for (let row = 0; row < this.gridHeight; row++) {
      for (let col = 0; col < this.gridWidth - 2; col++) {
        const gem = this.grid[row][col];
        if (!gem) continue;
        
        const match: Gem[] = [gem];
        let nextCol = col + 1;
        
        while (nextCol < this.gridWidth) {
          const nextGem = this.grid[row][nextCol];
          if (nextGem && nextGem.colorIndex === gem.colorIndex && !nextGem.blocker) {
            match.push(nextGem);
            nextCol++;
          } else {
            break;
          }
        }
        
        if (match.length >= 3) {
          const key = match.map(g => `${g.row},${g.col}`).sort().join('|');
          if (!visited.has(key)) {
            visited.add(key);
            matches.push(match);
          }
        }
      }
    }
    
    // Check vertical matches
    for (let col = 0; col < this.gridWidth; col++) {
      for (let row = 0; row < this.gridHeight - 2; row++) {
        const gem = this.grid[row][col];
        if (!gem) continue;
        
        const match: Gem[] = [gem];
        let nextRow = row + 1;
        
        while (nextRow < this.gridHeight) {
          const nextGem = this.grid[nextRow][col];
          if (nextGem && nextGem.colorIndex === gem.colorIndex && !nextGem.blocker) {
            match.push(nextGem);
            nextRow++;
          } else {
            break;
          }
        }
        
        if (match.length >= 3) {
          const key = match.map(g => `${g.row},${g.col}`).sort().join('|');
          if (!visited.has(key)) {
            visited.add(key);
            matches.push(match);
          }
        }
      }
    }
    
    return matches;
  }
  
  async processMatches(matches: Gem[][]) {
    this.cascadeCount++;
    this.comboMultiplier = 1 + (this.cascadeCount - 1) * 0.5;
    
    // Show combo text
    if (this.cascadeCount > 1) {
      this.showComboText();
    }
    
    for (const match of matches) {
      // Calculate points
      const basePoints = match.length * 50;
      const points = Math.floor(basePoints * this.comboMultiplier);
      this.addScore(points);
      
      // Update objectives
      const colorId = GEM_COLORS[match[0].colorIndex].id;
      const collectKey = `collect_${colorId}`;
      if (this.objectives.has(collectKey)) {
        const obj = this.objectives.get(collectKey)!;
        obj.current += match.length;
        this.updateObjectivesDisplay();
      }
      
      // Check for special gem creation
      if (match.length >= 5) {
        // Create rainbow orb
        const centerGem = match[Math.floor(match.length / 2)];
        centerGem.special = 'rainbow';
        this.updateGemVisual(centerGem);
        match.splice(match.indexOf(centerGem), 1);
      } else if (match.length === 4) {
        // Create line gem
        const centerGem = match[Math.floor(match.length / 2)];
        centerGem.special = match[0].row === match[1].row ? 'line_h' : 'line_v';
        this.updateGemVisual(centerGem);
        match.splice(match.indexOf(centerGem), 1);
      }
      
      // Animate and remove matched gems
      for (const gem of match) {
        this.createMatchParticles(gem);
        
        // Clear adjacent blockers
        this.clearAdjacentBlockers(gem.row, gem.col);
        
        await this.animateGemDestroy(gem);
        this.grid[gem.row][gem.col] = null;
      }
    }
    
    // Drop gems
    await this.dropGems();
    
    // Fill empty spaces
    await this.fillEmptySpaces();
    
    // Check for new matches
    const newMatches = this.findMatches();
    if (newMatches.length > 0) {
      await this.processMatches(newMatches);
    }
  }
  
  clearAdjacentBlockers(row: number, col: number) {
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    
    for (const [dr, dc] of directions) {
      const gem = this.grid[row + dr]?.[col + dc];
      if (gem?.blocker && gem.blockerLayer) {
        gem.blockerLayer--;
        if (gem.blockerLayer <= 0) {
          gem.blocker = undefined;
          gem.blockerLayer = undefined;
          
          // Update crystals objective
          if (this.objectives.has('crystals')) {
            const obj = this.objectives.get('crystals')!;
            obj.current++;
            this.updateObjectivesDisplay();
          }
        }
        this.updateGemVisual(gem);
      }
    }
  }
  
  createMatchParticles(gem: Gem) {
    const x = gem.sprite.x;
    const y = gem.sprite.y;
    const color = GEM_COLORS[gem.colorIndex];
    
    // Create sparkle particles
    for (let i = 0; i < 8; i++) {
      const particle = this.add.text(x, y, '✨', {
        fontSize: '16px',
      });
      
      const angle = (i / 8) * Math.PI * 2;
      const distance = 50;
      
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0,
        duration: 400,
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }
  }
  
  animateGemDestroy(gem: Gem): Promise<void> {
    return new Promise(resolve => {
      this.tweens.add({
        targets: gem.sprite,
        scale: 0,
        alpha: 0,
        duration: 200,
        ease: 'Back.easeIn',
        onComplete: () => {
          gem.sprite.destroy();
          resolve();
        },
      });
    });
  }
  
  async dropGems() {
    const promises: Promise<void>[] = [];
    
    for (let col = 0; col < this.gridWidth; col++) {
      let emptyRow = this.gridHeight - 1;
      
      for (let row = this.gridHeight - 1; row >= 0; row--) {
        const gem = this.grid[row][col];
        
        if (gem) {
          if (row !== emptyRow) {
            // Move gem down
            this.grid[emptyRow][col] = gem;
            this.grid[row][col] = null;
            gem.row = emptyRow;
            
            const targetY = this.gridOffsetY + emptyRow * this.cellSize + this.cellSize / 2;
            
            promises.push(new Promise(resolve => {
              this.tweens.add({
                targets: gem.sprite,
                y: targetY,
                duration: 200 + (emptyRow - row) * 30,
                ease: 'Bounce.easeOut',
                onComplete: () => resolve(),
              });
            }));
          }
          emptyRow--;
        }
      }
    }
    
    await Promise.all(promises);
  }
  
  async fillEmptySpaces() {
    const promises: Promise<void>[] = [];
    
    for (let col = 0; col < this.gridWidth; col++) {
      for (let row = 0; row < this.gridHeight; row++) {
        if (!this.grid[row][col] && !this.level.holes?.some(h => h[0] === col && h[1] === row)) {
          const gem = this.createGem(row, col, true);
          promises.push(new Promise(resolve => {
            this.time.delayedCall(300 + row * 50, resolve);
          }));
        }
      }
    }
    
    await Promise.all(promises);
  }
  
  addScore(points: number) {
    this.score += points;
    this.scoreText.setText(this.score.toString());
    
    // Update score objective
    if (this.objectives.has('score')) {
      this.objectives.get('score')!.current = this.score;
    }
    
    // Animate score
    this.tweens.add({
      targets: this.scoreText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 100,
      yoyo: true,
    });
  }
  
  showComboText() {
    const { width, height } = this.cameras.main;
    
    const comboText = this.add.text(width / 2, height / 2, `${this.cascadeCount}x COMBO!`, {
      fontFamily: 'Arial Black',
      fontSize: '36px',
      color: '#ffd93d',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0);
    
    this.tweens.add({
      targets: comboText,
      alpha: 1,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 300,
      yoyo: true,
      hold: 200,
      onComplete: () => comboText.destroy(),
    });
  }
  
  checkGameEnd() {
    // Check if all objectives are met
    let allObjectivesMet = true;
    this.objectives.forEach(obj => {
      if (obj.current < obj.target) {
        allObjectivesMet = false;
      }
    });
    
    if (allObjectivesMet) {
      this.winLevel();
    } else if (this.movesLeft <= 0) {
      this.loseLevel();
    }
  }
  
  winLevel() {
    const store = useGemFusionStore.getState();
    
    // Calculate stars
    const thresholds = this.level.starThresholds;
    let stars = 0;
    if (this.score >= thresholds[0]) stars = 1;
    if (this.score >= thresholds[1]) stars = 2;
    if (this.score >= thresholds[2]) stars = 3;
    
    store.completeLevel(this.level.id, stars, this.score);
    
    this.time.delayedCall(500, () => {
      this.scene.start('LevelComplete', {
        levelId: this.level.id,
        score: this.score,
        stars,
        isWin: true,
      });
    });
  }
  
  loseLevel() {
    const store = useGemFusionStore.getState();
    store.useLife();
    
    this.time.delayedCall(500, () => {
      this.scene.start('LevelComplete', {
        levelId: this.level.id,
        score: this.score,
        stars: 0,
        isWin: false,
      });
    });
  }
  
  createPauseButton() {
    const pauseBtn = this.add.text(this.cameras.main.width - 50, 35, '⏸️', {
      fontSize: '32px',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    pauseBtn.on('pointerdown', () => {
      this.showPauseMenu();
    });
  }
  
  showPauseMenu() {
    // Simple pause menu implementation
    const { width, height } = this.cameras.main;
    
    const overlay = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.7);
    overlay.setInteractive();
    
    const pauseText = this.add.text(width/2, height/2 - 50, 'PAUSED', {
      fontFamily: 'Arial Black',
      fontSize: '42px',
      color: '#ffffff',
    }).setOrigin(0.5);
    
    const resumeBtn = this.add.text(width/2, height/2 + 30, '▶️ Resume', {
      fontSize: '28px',
      color: '#2ecc71',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    const quitBtn = this.add.text(width/2, height/2 + 80, '🏠 Quit', {
      fontSize: '28px',
      color: '#e74c3c',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    resumeBtn.on('pointerdown', () => {
      overlay.destroy();
      pauseText.destroy();
      resumeBtn.destroy();
      quitBtn.destroy();
    });
    
    quitBtn.on('pointerdown', () => {
      this.scene.start('WorldMap');
    });
  }
  
  playEntryAnimation() {
    // Animate all gems entering
    for (let row = 0; row < this.gridHeight; row++) {
      for (let col = 0; col < this.gridWidth; col++) {
        const gem = this.grid[row][col];
        if (gem) {
          gem.sprite.setScale(0);
          this.tweens.add({
            targets: gem.sprite,
            scale: 1,
            duration: 300,
            delay: (row + col) * 30,
            ease: 'Back.easeOut',
          });
        }
      }
    }
  }
}
