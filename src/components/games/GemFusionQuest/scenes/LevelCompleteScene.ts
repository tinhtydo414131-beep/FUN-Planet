import Phaser from 'phaser';
import { useGemFusionStore } from '../store';

interface LevelCompleteData {
  levelId: number;
  score: number;
  stars: number;
  isWin: boolean;
}

export class LevelCompleteScene extends Phaser.Scene {
  private data!: LevelCompleteData;
  
  constructor() {
    super({ key: 'LevelComplete' });
  }
  
  init(data: LevelCompleteData) {
    this.data = data;
  }
  
  create() {
    const { width, height } = this.cameras.main;
    
    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(
      this.data.isWin ? 0x2ecc71 : 0xe74c3c,
      this.data.isWin ? 0x27ae60 : 0xc0392b,
      this.data.isWin ? 0x1e8449 : 0x962d22,
      this.data.isWin ? 0x1e8449 : 0x962d22,
      1
    );
    bg.fillRect(0, 0, width, height);
    
    // Particle effects for win
    if (this.data.isWin) {
      this.createConfetti();
    }
    
    // Result text
    const resultEmoji = this.data.isWin ? '🎉' : '😢';
    const resultText = this.data.isWin ? 'LEVEL COMPLETE!' : 'LEVEL FAILED';
    
    this.add.text(width / 2, 120, resultEmoji, {
      fontSize: '80px',
    }).setOrigin(0.5);
    
    const title = this.add.text(width / 2, 200, resultText, {
      fontFamily: 'Arial Black',
      fontSize: '32px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);
    
    // Animate title
    this.tweens.add({
      targets: title,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
    
    // Level info
    this.add.text(width / 2, 260, `Level ${this.data.levelId}`, {
      fontSize: '24px',
      color: '#ffffff',
    }).setOrigin(0.5).setAlpha(0.8);
    
    // Stars (for win)
    if (this.data.isWin) {
      this.createStarsDisplay(width / 2, 320);
    }
    
    // Score
    this.add.text(width / 2, 400, 'SCORE', {
      fontSize: '18px',
      color: '#ffffff',
    }).setOrigin(0.5).setAlpha(0.7);
    
    const scoreText = this.add.text(width / 2, 440, '0', {
      fontFamily: 'Arial Black',
      fontSize: '48px',
      color: '#ffd93d',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    
    // Animate score counting
    this.tweens.addCounter({
      from: 0,
      to: this.data.score,
      duration: 1500,
      ease: 'Power2',
      onUpdate: (tween) => {
        scoreText.setText(Math.floor(tween.getValue()).toString());
      },
    });
    
    // Buttons
    const btnY = 550;
    
    if (this.data.isWin) {
      // Next level button
      this.createButton(width / 2, btnY, '▶️ Next Level', 0x2ecc71, () => {
        const store = useGemFusionStore.getState();
        const nextLevel = this.data.levelId + 1;
        store.setCurrentLevel(nextLevel);
        this.scene.start('GamePlay', { levelId: nextLevel });
      });
    } else {
      // Retry button
      this.createButton(width / 2, btnY, '🔄 Try Again', 0xf1c40f, () => {
        this.scene.start('GamePlay', { levelId: this.data.levelId });
      });
    }
    
    // Map button
    this.createButton(width / 2, btnY + 70, '🗺️ World Map', 0x3498db, () => {
      this.scene.start('WorldMap');
    });
    
    // Share button (placeholder)
    this.add.text(width / 2, height - 60, '📤 Share Score', {
      fontSize: '18px',
      color: '#ffffff',
    }).setOrigin(0.5).setAlpha(0.7).setInteractive({ useHandCursor: true });
  }
  
  createStarsDisplay(x: number, y: number) {
    const starsContainer = this.add.container(x, y);
    const starSpacing = 60;
    
    for (let i = 0; i < 3; i++) {
      const starX = (i - 1) * starSpacing;
      const earned = i < this.data.stars;
      
      const star = this.add.text(starX, 0, '⭐', {
        fontSize: earned ? '50px' : '40px',
      }).setOrigin(0.5).setAlpha(earned ? 1 : 0.3);
      
      starsContainer.add(star);
      
      if (earned) {
        star.setScale(0);
        this.tweens.add({
          targets: star,
          scale: 1,
          duration: 400,
          delay: 500 + i * 300,
          ease: 'Back.easeOut',
          onStart: () => {
            // Star sound effect would go here
          },
        });
      }
    }
  }
  
  createButton(x: number, y: number, text: string, color: number, callback: () => void) {
    const container = this.add.container(x, y);
    const btnWidth = 200;
    const btnHeight = 50;
    
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.3);
    bg.fillRoundedRect(-btnWidth/2 + 3, 3, btnWidth, btnHeight, 12);
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(-btnWidth/2, 0, btnWidth, btnHeight, 12);
    bg.fillStyle(0xffffff, 0.2);
    bg.fillRoundedRect(-btnWidth/2 + 5, 5, btnWidth - 10, btnHeight/2 - 5, 8);
    
    const btnText = this.add.text(0, btnHeight/2, text, {
      fontFamily: 'Arial Black',
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);
    
    container.add([bg, btnText]);
    container.setSize(btnWidth, btnHeight);
    container.setInteractive({ useHandCursor: true });
    
    container.on('pointerover', () => {
      this.tweens.add({
        targets: container,
        scaleX: 1.05,
        scaleY: 1.05,
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
      this.tweens.add({
        targets: container,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 50,
        yoyo: true,
        onComplete: callback,
      });
    });
    
    // Entrance animation
    container.setScale(0);
    this.tweens.add({
      targets: container,
      scale: 1,
      duration: 300,
      delay: 1500,
      ease: 'Back.easeOut',
    });
  }
  
  createConfetti() {
    const { width, height } = this.cameras.main;
    const colors = ['🎊', '🎉', '✨', '⭐', '💫'];
    
    for (let i = 0; i < 30; i++) {
      const confetti = this.add.text(
        Phaser.Math.Between(0, width),
        -50,
        colors[Phaser.Math.Between(0, colors.length - 1)],
        { fontSize: `${Phaser.Math.Between(20, 36)}px` }
      );
      
      this.tweens.add({
        targets: confetti,
        y: height + 50,
        x: confetti.x + Phaser.Math.Between(-100, 100),
        rotation: Phaser.Math.Between(-3, 3),
        duration: Phaser.Math.Between(2000, 4000),
        delay: Phaser.Math.Between(0, 1500),
        onComplete: () => confetti.destroy(),
      });
    }
  }
}
