import Phaser from 'phaser';
import { useGemFusionStore } from '../store';
import { GEM_COLORS, LEVELS, LevelConfig, SPECIAL_GEMS, BLOCKER_TYPES } from '../gameData';
import { FUN_PLANET_COLORS, GEM_VISUAL_STYLES } from '../gemFusionStyles';

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
    const isMobile = width < 400;
    
    // Fun Planet themed background (Sky blue to Rose gold)
    const bg = this.add.graphics();
    bg.fillGradientStyle(
      FUN_PLANET_COLORS.bgGradient.top1,
      FUN_PLANET_COLORS.bgGradient.top2,
      FUN_PLANET_COLORS.bgGradient.bottom1,
      FUN_PLANET_COLORS.bgGradient.bottom2,
      1
    );
    bg.fillRect(0, 0, width, height);
    
    // Dynamic cell size based on screen
    const maxGridWidth = width - 24; // 12px padding each side
    const hudHeight = isMobile ? 140 : 180;
    const maxGridHeight = height - hudHeight - 20; // Space for HUD + bottom padding
    
    this.cellSize = Math.min(
      Math.floor(maxGridWidth / this.gridWidth),
      Math.floor(maxGridHeight / this.gridHeight),
      56 // Max cell size (reduced for better fit)
    );
    
    // Center grid horizontally
    this.gridOffsetX = (width - this.gridWidth * this.cellSize) / 2;
    
    // Center grid vertically in available space
    const gridTotalHeight = this.gridHeight * this.cellSize;
    const availableHeight = height - hudHeight;
    this.gridOffsetY = hudHeight + (availableHeight - gridTotalHeight) / 2;
    this.gridOffsetY = Math.max(hudHeight, this.gridOffsetY);
    
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
    
    // Grid container with glassmorphism effect
    bg.fillStyle(0xFFFFFF, 0.4);
    bg.fillRoundedRect(
      this.gridOffsetX - 10,
      this.gridOffsetY - 10,
      this.gridWidth * this.cellSize + 20,
      this.gridHeight * this.cellSize + 20,
      15
    );
    // Golden border
    bg.lineStyle(3, FUN_PLANET_COLORS.cell.border, 0.6);
    bg.strokeRoundedRect(
      this.gridOffsetX - 10,
      this.gridOffsetY - 10,
      this.gridWidth * this.cellSize + 20,
      this.gridHeight * this.cellSize + 20,
      15
    );
    
    // Cell backgrounds with Fun Planet colors
    for (let row = 0; row < this.gridHeight; row++) {
      for (let col = 0; col < this.gridWidth; col++) {
        const x = this.gridOffsetX + col * this.cellSize;
        const y = this.gridOffsetY + row * this.cellSize;
        
        // Check for holes
        const isHole = this.level.holes?.some(h => h[0] === col && h[1] === row);
        
        if (!isHole) {
          // Alternating cream/white cells
          bg.fillStyle((row + col) % 2 === 0 ? FUN_PLANET_COLORS.cell.even : FUN_PLANET_COLORS.cell.odd, 0.85);
          bg.fillRoundedRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4, 8);
          // Subtle golden border
          bg.lineStyle(1, FUN_PLANET_COLORS.cell.border, 0.3);
          bg.strokeRoundedRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4, 8);
        }
      }
    }
  }
  
  createHUD() {
    const { width } = this.cameras.main;
    const isMobile = width < 400;
    const fontSize = isMobile ? '20px' : '28px';
    const labelSize = isMobile ? '11px' : '14px';
    const titleSize = isMobile ? '18px' : '24px';
    const topOffset = isMobile ? 20 : 30;
    
    // Level indicator
    this.add.text(width / 2, topOffset, `Level ${this.level.id}`, {
      fontFamily: 'Arial Black',
      fontSize: titleSize,
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);
    
    // Score
    this.add.text(15, isMobile ? 50 : 70, 'SCORE', {
      fontSize: labelSize,
      color: '#a8d8ff',
    });
    this.scoreText = this.add.text(15, isMobile ? 65 : 90, '0', {
      fontFamily: 'Arial Black',
      fontSize: fontSize,
      color: '#ffd93d',
      stroke: '#000000',
      strokeThickness: 2,
    });
    
    // Moves
    this.add.text(width - 15, isMobile ? 50 : 70, 'MOVES', {
      fontSize: labelSize,
      color: '#a8d8ff',
    }).setOrigin(1, 0);
    this.movesText = this.add.text(width - 15, isMobile ? 65 : 90, this.movesLeft.toString(), {
      fontFamily: 'Arial Black',
      fontSize: fontSize,
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(1, 0);
    
    // Objectives
    this.objectivesContainer = this.add.container(width / 2, isMobile ? 110 : 140);
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
    let startPos: { x: number; y: number; row: number; col: number } | null = null;
    let isDragging = false;
    const SWIPE_THRESHOLD = 25; // pixels - more responsive
    
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isProcessing) return;
      
      const pos = this.getGridPosition(pointer.x, pointer.y);
      if (pos && this.grid[pos.row]?.[pos.col]) {
        startPos = { x: pointer.x, y: pointer.y, ...pos };
        isDragging = true;
        this.selectGem(this.grid[pos.row][pos.col]!);
      }
    });
    
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!isDragging || !startPos || this.isProcessing) return;
      
      const dx = pointer.x - startPos.x;
      const dy = pointer.y - startPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance >= SWIPE_THRESHOLD) {
        // Determine direction and swap
        if (Math.abs(dx) > Math.abs(dy)) {
          const targetCol = startPos.col + (dx > 0 ? 1 : -1);
          if (targetCol >= 0 && targetCol < this.gridWidth) {
            this.trySwap(startPos.row, startPos.col, startPos.row, targetCol);
          }
        } else {
          const targetRow = startPos.row + (dy > 0 ? 1 : -1);
          if (targetRow >= 0 && targetRow < this.gridHeight) {
            this.trySwap(startPos.row, startPos.col, targetRow, startPos.col);
          }
        }
        isDragging = false;
        this.deselectGem();
        startPos = null;
      }
    });
    
    this.input.on('pointerup', () => {
      isDragging = false;
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

    // Prevent re-entry
    if (this.isProcessing) return;
    this.isProcessing = true;

    // Safety: never let the game get stuck in processing state
    const safetyTimeout = this.time.delayedCall(8000, () => {
      // If any tween/promise chain fails, recover input
      this.isProcessing = false;
    });

    try {
      // Animate swap
      await this.animateSwap(gem1, gem2);

      // Actually swap in grid
      this.grid[row1][col1] = gem2;
      this.grid[row2][col2] = gem1;
      gem1.row = row2;
      gem1.col = col2;
      gem2.row = row1;
      gem2.col = col1;

      // Special-gem swap activation (prevents "stuck" boards)
      const didActivateSpecial = await this.tryActivateSpecialSwap(gem1, gem2);

      // Check for matches
      const matches = this.findMatches();

      if (didActivateSpecial || matches.length > 0) {
        this.movesLeft--;
        this.movesText.setText(this.movesLeft.toString());

        this.cascadeCount = 0;

        if (matches.length > 0) {
          await this.processMatches(matches);
        } else {
          // Special activation may have cleared gems without creating a normal match
          await this.dropGems();
          await this.fillEmptySpaces();

          const newMatches = this.findMatches();
          if (newMatches.length > 0) {
            await this.processMatches(newMatches);
          }
        }

        // Check win/lose conditions
        this.checkGameEnd();
      } else {
        // Swap back (invalid move)
        await this.animateSwap(gem1, gem2);
        this.grid[row1][col1] = gem1;
        this.grid[row2][col2] = gem2;
        gem1.row = row1;
        gem1.col = col1;
        gem2.row = row2;
        gem2.col = col2;
      }
    } finally {
      safetyTimeout.remove(false);
      this.isProcessing = false;
    }
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

  private isHoleAt(row: number, col: number) {
    return !!this.level.holes?.some(h => h[0] === col && h[1] === row);
  }

  private async destroyGems(gems: Gem[]) {
    const unique = new Map<string, Gem>();
    for (const g of gems) unique.set(`${g.row},${g.col}`, g);

    await Promise.all(
      Array.from(unique.values()).map(async gem => {
        // Skip already cleared
        if (!this.grid[gem.row]?.[gem.col]) return;
        this.createMatchParticles(gem);
        this.clearAdjacentBlockers(gem.row, gem.col);
        await this.animateGemDestroy(gem);
        this.grid[gem.row][gem.col] = null;
      })
    );
  }

  /**
   * Activates special gem swaps so the board never gets into a "no-match but should-clear" stuck state.
   * Returns true if any special effect was triggered.
   */
  private async tryActivateSpecialSwap(gem1: Gem, gem2: Gem): Promise<boolean> {
    // Rainbow clears target color
    if (gem1.special === 'rainbow') {
      await this.activateRainbowGem(gem1, gem2.colorIndex);
      return true;
    }
    if (gem2.special === 'rainbow') {
      await this.activateRainbowGem(gem2, gem1.colorIndex);
      return true;
    }

    // Line gems clear a full row/column
    if (gem1.special === 'line_h' || gem1.special === 'line_v') {
      await this.activateLineGem(gem1, gem1.special);
      return true;
    }
    if (gem2.special === 'line_h' || gem2.special === 'line_v') {
      await this.activateLineGem(gem2, gem2.special);
      return true;
    }

    // Burst (if ever present)
    if (gem1.special === 'burst') {
      await this.activateBurstGem(gem1);
      return true;
    }
    if (gem2.special === 'burst') {
      await this.activateBurstGem(gem2);
      return true;
    }

    return false;
  }

  private async activateRainbowGem(rainbowGem: Gem, targetColorIndex: number) {
    const gemsToClear: Gem[] = [];

    // Always consume the rainbow gem itself
    gemsToClear.push(rainbowGem);

    for (let row = 0; row < this.gridHeight; row++) {
      for (let col = 0; col < this.gridWidth; col++) {
        if (this.isHoleAt(row, col)) continue;
        const gem = this.grid[row][col];
        if (!gem) continue;
        if (gem.blocker) continue;
        if (gem.colorIndex === targetColorIndex) gemsToClear.push(gem);
      }
    }

    await this.destroyGems(gemsToClear);
  }

  private async activateLineGem(lineGem: Gem, type: 'line_h' | 'line_v') {
    const gemsToClear: Gem[] = [lineGem];

    if (type === 'line_h') {
      const row = lineGem.row;
      for (let col = 0; col < this.gridWidth; col++) {
        if (this.isHoleAt(row, col)) continue;
        const gem = this.grid[row][col];
        if (!gem) continue;
        if (gem.blocker) continue;
        gemsToClear.push(gem);
      }
    } else {
      const col = lineGem.col;
      for (let row = 0; row < this.gridHeight; row++) {
        if (this.isHoleAt(row, col)) continue;
        const gem = this.grid[row][col];
        if (!gem) continue;
        if (gem.blocker) continue;
        gemsToClear.push(gem);
      }
    }

    await this.destroyGems(gemsToClear);
  }

  private async activateBurstGem(burstGem: Gem) {
    const gemsToClear: Gem[] = [burstGem];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const row = burstGem.row + dr;
        const col = burstGem.col + dc;
        if (row < 0 || row >= this.gridHeight || col < 0 || col >= this.gridWidth) continue;
        if (this.isHoleAt(row, col)) continue;
        const gem = this.grid[row][col];
        if (!gem) continue;
        if (gem.blocker) continue;
        gemsToClear.push(gem);
      }
    }

    await this.destroyGems(gemsToClear);
  }

  async dropGems() {
    const promises: Promise<void>[] = [];

    for (let col = 0; col < this.gridWidth; col++) {
      let targetRow = this.gridHeight - 1;

      for (let row = this.gridHeight - 1; row >= 0; row--) {
        if (this.isHoleAt(row, col)) continue;
        const gem = this.grid[row][col];
        if (!gem) continue;

        // Find next valid landing row (skip holes)
        while (targetRow >= 0 && this.isHoleAt(targetRow, col)) targetRow--;
        if (targetRow < 0) break;

        if (row !== targetRow) {
          this.grid[targetRow][col] = gem;
          this.grid[row][col] = null;
          gem.row = targetRow;

          const targetY = this.gridOffsetY + targetRow * this.cellSize + this.cellSize / 2;
          promises.push(
            new Promise(resolve => {
              this.tweens.add({
                targets: gem.sprite,
                y: targetY,
                duration: 200 + Math.abs(targetRow - row) * 30,
                ease: 'Bounce.easeOut',
                onComplete: () => resolve(),
              });
            })
          );
        }

        targetRow--;
      }

      // Clear any remaining above-target non-hole cells (safety)
      for (let r = targetRow; r >= 0; r--) {
        if (!this.isHoleAt(r, col) && this.grid[r][col] && (this.grid[r][col] as Gem).row !== r) {
          this.grid[r][col] = null;
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
    const isMobile = this.cameras.main.width < 400;
    const btnSize = isMobile ? '32px' : '36px';
    // Position below the React header overlay (header is ~60px tall)
    const topY = isMobile ? 70 : 80;
    
    // Back button - left side with background for visibility
    const backBg = this.add.circle(35, topY, 24, 0x000000, 0.6);
    backBg.setDepth(200);
    
    const backBtn = this.add.text(35, topY, '⬅️', {
      fontSize: btnSize,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(201);
    
    backBtn.on('pointerdown', () => {
      this.scene.start('WorldMap');
    });
    
    // Pause button - right side with background
    const pauseBg = this.add.circle(this.cameras.main.width - 35, topY, 24, 0x000000, 0.6);
    pauseBg.setDepth(200);
    
    const pauseBtn = this.add.text(this.cameras.main.width - 35, topY, '⏸️', {
      fontSize: btnSize,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(201);
    
    pauseBtn.on('pointerdown', () => {
      this.showPauseMenu();
    });
  }
  
  showPauseMenu() {
    const { width, height } = this.cameras.main;
    const isMobile = width < 400;
    const titleSize = isMobile ? '32px' : '42px';
    const btnSize = isMobile ? '22px' : '28px';
    
    const overlay = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.7);
    overlay.setInteractive();
    overlay.setDepth(100);
    
    const pauseText = this.add.text(width/2, height/2 - 60, 'PAUSED', {
      fontFamily: 'Arial Black',
      fontSize: titleSize,
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(101);
    
    const resumeBtn = this.add.text(width/2, height/2, '▶️ Resume', {
      fontSize: btnSize,
      color: '#2ecc71',
      backgroundColor: '#1a1a2e',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(101);
    
    const restartBtn = this.add.text(width/2, height/2 + 55, '🔄 Restart', {
      fontSize: btnSize,
      color: '#f39c12',
      backgroundColor: '#1a1a2e',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(101);
    
    const quitBtn = this.add.text(width/2, height/2 + 110, '🏠 Quit to Map', {
      fontSize: btnSize,
      color: '#e74c3c',
      backgroundColor: '#1a1a2e',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(101);
    
    const cleanupMenu = () => {
      overlay.destroy();
      pauseText.destroy();
      resumeBtn.destroy();
      restartBtn.destroy();
      quitBtn.destroy();
    };
    
    resumeBtn.on('pointerdown', () => {
      cleanupMenu();
    });
    
    restartBtn.on('pointerdown', () => {
      cleanupMenu();
      this.scene.restart();
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
