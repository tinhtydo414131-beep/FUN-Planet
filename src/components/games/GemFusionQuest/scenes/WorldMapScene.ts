import Phaser from 'phaser';
import { useGemFusionStore } from '../store';
import { WORLDS, LEVELS } from '../gameData';

export class WorldMapScene extends Phaser.Scene {
  private selectedWorld: number = 1;
  private levelNodes: Phaser.GameObjects.Container[] = [];
  private scrollY: number = 0;
  private maxScroll: number = 0;
  
  constructor() {
    super({ key: 'WorldMap' });
  }
  
  create() {
    const { width, height } = this.cameras.main;
    const store = useGemFusionStore.getState();
    this.selectedWorld = store.currentWorld;
    
    // Background
    this.createBackground();
    
    // World selector at top
    this.createWorldSelector();
    
    // Level nodes
    this.createLevelNodes();
    
    // Enable scrolling
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) {
        this.scrollY += pointer.velocity.y * 0.02;
        this.scrollY = Phaser.Math.Clamp(this.scrollY, -this.maxScroll, 0);
        this.updateNodePositions();
      }
    });
    
    // Back button
    this.createBackButton();
  }
  
  createBackground() {
    const { width, height } = this.cameras.main;
    const world = WORLDS[this.selectedWorld - 1];
    
    // Gradient background based on world
    const bg = this.add.graphics();
    const topColor = world.color;
    const bottomColor = Phaser.Display.Color.ValueToColor(world.color).darken(40).color;
    bg.fillGradientStyle(topColor, topColor, bottomColor, bottomColor, 1);
    bg.fillRect(0, 0, width, height);
    
    // World title
    this.add.text(width / 2, 100, world.bgEmoji, {
      fontSize: '50px',
    }).setOrigin(0.5);
    
    this.add.text(width / 2, 155, world.name, {
      fontFamily: 'Arial Black',
      fontSize: '28px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    
    // Floating decorations
    for (let i = 0; i < 10; i++) {
      const deco = this.add.text(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(180, height),
        world.bgEmoji,
        { fontSize: `${Phaser.Math.Between(20, 40)}px` }
      ).setAlpha(0.15);
      
      this.tweens.add({
        targets: deco,
        y: deco.y - 50,
        alpha: 0.05,
        duration: Phaser.Math.Between(3000, 5000),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000),
      });
    }
  }
  
  createWorldSelector() {
    const { width } = this.cameras.main;
    const store = useGemFusionStore.getState();
    
    // World navigation arrows
    if (this.selectedWorld > 1) {
      const leftArrow = this.add.text(30, 130, '◀', {
        fontSize: '36px',
        color: '#ffffff',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      
      leftArrow.on('pointerdown', () => {
        this.selectedWorld--;
        store.setCurrentWorld(this.selectedWorld);
        this.scene.restart();
      });
    }
    
    if (this.selectedWorld < 10 && store.unlockedWorlds.includes(this.selectedWorld + 1)) {
      const rightArrow = this.add.text(width - 30, 130, '▶', {
        fontSize: '36px',
        color: '#ffffff',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      
      rightArrow.on('pointerdown', () => {
        this.selectedWorld++;
        store.setCurrentWorld(this.selectedWorld);
        this.scene.restart();
      });
    }
    
    // World indicator dots
    const dotsContainer = this.add.container(width / 2, 45);
    for (let i = 1; i <= 10; i++) {
      const isUnlocked = store.unlockedWorlds.includes(i);
      const isCurrent = i === this.selectedWorld;
      
      const dot = this.add.circle(
        (i - 5.5) * 20,
        0,
        isCurrent ? 8 : 5,
        isUnlocked ? 0xffffff : 0x666666,
        isCurrent ? 1 : 0.5
      );
      dotsContainer.add(dot);
    }
  }
  
  createLevelNodes() {
    const { width, height } = this.cameras.main;
    const store = useGemFusionStore.getState();
    
    const worldLevels = LEVELS.filter(l => l.worldId === this.selectedWorld);
    const startY = 220;
    const spacing = 100;
    
    this.maxScroll = Math.max(0, (worldLevels.length * spacing) - (height - startY - 100));
    
    worldLevels.forEach((level, index) => {
      const progress = store.levelProgress.find(p => p.levelId === level.id);
      const isCompleted = progress?.completed || false;
      const stars = progress?.stars || 0;
      const isUnlocked = level.id === 1 || 
                         store.levelProgress.some(p => p.levelId === level.id - 1 && p.completed);
      
      // Zigzag pattern
      const xOffset = index % 2 === 0 ? -60 : 60;
      const x = width / 2 + xOffset;
      const y = startY + index * spacing + this.scrollY;
      
      const node = this.createLevelNode(x, y, level.id, stars, isUnlocked, isCompleted);
      this.levelNodes.push(node);
      
      // Path line to next level
      if (index < worldLevels.length - 1) {
        const nextXOffset = (index + 1) % 2 === 0 ? -60 : 60;
        const nextX = width / 2 + nextXOffset;
        const nextY = startY + (index + 1) * spacing + this.scrollY;
        
        const path = this.add.graphics();
        path.lineStyle(4, isCompleted ? 0xffd93d : 0x666666, isUnlocked ? 1 : 0.5);
        path.beginPath();
        path.moveTo(x, y + 30);
        path.lineTo(nextX, nextY - 30);
        path.strokePath();
        
        // Store path for updates
        (node as any).pathLine = path;
        (node as any).pathData = { x1: x, y1: y + 30, x2: nextX, y2: nextY - 30 };
      }
    });
  }
  
  createLevelNode(
    x: number, 
    y: number, 
    levelId: number, 
    stars: number, 
    isUnlocked: boolean,
    isCompleted: boolean
  ) {
    const container = this.add.container(x, y);
    
    // Node background
    const bg = this.add.graphics();
    if (isUnlocked) {
      bg.fillStyle(isCompleted ? 0x2ecc71 : 0x3498db, 1);
    } else {
      bg.fillStyle(0x666666, 0.7);
    }
    bg.fillCircle(0, 0, 35);
    
    // Border
    bg.lineStyle(4, isCompleted ? 0xffd93d : 0xffffff, isUnlocked ? 1 : 0.5);
    bg.strokeCircle(0, 0, 35);
    
    container.add(bg);
    
    // Level number
    const levelText = this.add.text(0, 0, levelId.toString(), {
      fontFamily: 'Arial Black',
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);
    container.add(levelText);
    
    // Stars
    const starsContainer = this.add.container(0, 45);
    for (let i = 0; i < 3; i++) {
      const star = this.add.text((i - 1) * 20, 0, i < stars ? '⭐' : '☆', {
        fontSize: '18px',
      }).setOrigin(0.5);
      starsContainer.add(star);
    }
    container.add(starsContainer);
    
    // Lock icon for locked levels
    if (!isUnlocked) {
      const lock = this.add.text(0, 0, '🔒', {
        fontSize: '24px',
      }).setOrigin(0.5);
      container.add(lock);
    }
    
    // Make interactive if unlocked
    if (isUnlocked) {
      container.setSize(70, 70);
      container.setInteractive({ useHandCursor: true });
      
      container.on('pointerover', () => {
        this.tweens.add({
          targets: container,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 100,
        });
      });
      
      container.on('pointerout', () => {
        this.tweens.add({
          targets: container,
          scaleX: 1,
          scaleY: 1,
          duration: 100,
        });
      });
      
      container.on('pointerdown', () => {
        const store = useGemFusionStore.getState();
        store.setCurrentLevel(levelId);
        
        this.tweens.add({
          targets: container,
          scaleX: 0.9,
          scaleY: 0.9,
          duration: 100,
          yoyo: true,
          onComplete: () => {
            this.cameras.main.fade(300, 0, 0, 0);
            this.time.delayedCall(300, () => {
              this.scene.start('GamePlay', { levelId });
            });
          },
        });
      });
    }
    
    // Store original Y for scrolling
    (container as any).baseY = y - this.scrollY;
    
    return container;
  }
  
  updateNodePositions() {
    this.levelNodes.forEach((node) => {
      const baseY = (node as any).baseY;
      node.y = baseY + this.scrollY;
      
      // Update path lines
      const pathLine = (node as any).pathLine;
      const pathData = (node as any).pathData;
      if (pathLine && pathData) {
        pathLine.clear();
        pathLine.lineStyle(4, 0xffd93d, 1);
        pathLine.beginPath();
        pathLine.moveTo(pathData.x1, pathData.y1 + this.scrollY);
        pathLine.lineTo(pathData.x2, pathData.y2 + this.scrollY);
        pathLine.strokePath();
      }
    });
  }
  
  createBackButton() {
    const backBtn = this.add.container(40, this.cameras.main.height - 40);
    
    const bg = this.add.circle(0, 0, 25, 0x2d3436, 0.8);
    const icon = this.add.text(0, 0, '🏠', { fontSize: '24px' }).setOrigin(0.5);
    
    backBtn.add([bg, icon]);
    backBtn.setSize(50, 50);
    backBtn.setInteractive({ useHandCursor: true });
    
    backBtn.on('pointerdown', () => {
      this.cameras.main.fade(300, 0, 0, 0);
      this.time.delayedCall(300, () => {
        this.scene.start('MainMenu');
      });
    });
  }
}
