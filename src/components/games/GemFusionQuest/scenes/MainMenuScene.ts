import Phaser from 'phaser';
import { useGemFusionStore } from '../store';
import { FUN_PLANET_COLORS, GEM_VISUAL_STYLES } from '../gemFusionStyles';

export class MainMenuScene extends Phaser.Scene {
  private particles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  
  constructor() {
    super({ key: 'MainMenu' });
  }
  
  create() {
    const { width, height } = this.cameras.main;
    
    // Fun Planet themed gradient background (Sky blue to Rose gold)
    const bg = this.add.graphics();
    bg.fillGradientStyle(
      FUN_PLANET_COLORS.bgGradient.top1,
      FUN_PLANET_COLORS.bgGradient.top2,
      FUN_PLANET_COLORS.bgGradient.bottom1,
      FUN_PLANET_COLORS.bgGradient.bottom2,
      1
    );
    bg.fillRect(0, 0, width, height);
    
    // Add golden stars background
    this.createStarsBackground();
    
    // Floating gems background
    this.createFloatingGems();
    
    // Title with golden glow
    const titleShadow = this.add.text(width / 2 + 3, 143, '💎 GEM FUSION', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '42px',
      color: '#8B4513',
      align: 'center',
    }).setOrigin(0.5).setAlpha(0.3);
    
    const title = this.add.text(width / 2, 140, '💎 GEM FUSION', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '42px',
      color: '#FFFFFF',
      stroke: '#FFD700',
      strokeThickness: 3,
      align: 'center',
    }).setOrigin(0.5);
    
    const subtitle = this.add.text(width / 2, 190, 'QUEST', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '56px',
      color: '#FFD700',
      stroke: '#FF6B9D',
      strokeThickness: 4,
      align: 'center',
    }).setOrigin(0.5);
    
    // Animate title
    this.tweens.add({
      targets: [title, titleShadow],
      y: '+=10',
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    
    this.tweens.add({
      targets: subtitle,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    
    // Tagline
    this.add.text(width / 2, 250, '✨ Worlds of Wonder ✨', {
      fontFamily: 'Georgia, serif',
      fontSize: '24px',
      color: '#5D3FD3',
      fontStyle: 'italic',
    }).setOrigin(0.5);
    
    // Character with golden glow
    const kira = this.add.text(width / 2, 350, '👧', {
      fontSize: '80px',
    }).setOrigin(0.5);
    
    this.tweens.add({
      targets: kira,
      y: '+=15',
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    
    // Companion
    const luna = this.add.text(width / 2 + 70, 380, '🦊', {
      fontSize: '40px',
    }).setOrigin(0.5);
    
    this.tweens.add({
      targets: luna,
      y: '+=10',
      x: '+=5',
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 500,
    });
    
    // Play Button - Fun Planet green
    this.createButton(width / 2, 500, '▶️ CHƠI NGAY', FUN_PLANET_COLORS.button.primary, () => {
      this.cameras.main.fade(300, 0, 0, 0);
      this.time.delayedCall(300, () => {
        this.scene.start('WorldMap');
      });
    });
    
    // Daily Reward Button - Golden
    this.createButton(width / 2, 580, '🎁 Quà Hàng Ngày', FUN_PLANET_COLORS.button.secondary, () => {
      this.showDailyReward();
    }, 0.8);
    
    // Endless Mode Button (unlocks at level 50)
    const store = useGemFusionStore.getState();
    if (store.currentLevel >= 50) {
      this.createButton(width / 2, 650, '♾️ Vô Tận Mode', FUN_PLANET_COLORS.button.purple, () => {
        // Start endless mode
      }, 0.7);
    }
    
    // Version
    this.add.text(width / 2, height - 30, 'v1.0 - Fun Planet 🌍', {
      fontSize: '14px',
      color: '#5D3FD3',
    }).setOrigin(0.5).setAlpha(0.7);
    
    // Sparkle effect around title
    this.time.addEvent({
      delay: 300,
      callback: () => this.createSparkle(
        Phaser.Math.Between(50, width - 50),
        Phaser.Math.Between(100, 280)
      ),
      loop: true,
    });
  }
  
  createStarsBackground() {
    const { width, height } = this.cameras.main;
    
    // Add golden stars
    for (let i = 0; i < 15; i++) {
      const star = this.add.text(
        Phaser.Math.Between(20, width - 20),
        Phaser.Math.Between(20, height - 100),
        '⭐',
        { fontSize: `${Phaser.Math.Between(12, 24)}px` }
      ).setAlpha(0.3);
      
      // Twinkle animation
      this.tweens.add({
        targets: star,
        alpha: 0.6,
        duration: Phaser.Math.Between(1000, 2000),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 1000),
      });
    }
  }
  
  createFloatingGems() {
    const { width, height } = this.cameras.main;
    // Use Fun Planet gem styles
    const gems = GEM_VISUAL_STYLES.map(g => g.emoji);
    
    for (let i = 0; i < 20; i++) {
      const gem = this.add.text(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        gems[Phaser.Math.Between(0, gems.length - 1)],
        { fontSize: `${Phaser.Math.Between(16, 32)}px` }
      ).setAlpha(0.25);
      
      this.tweens.add({
        targets: gem,
        y: gem.y - 100,
        alpha: 0,
        duration: Phaser.Math.Between(3000, 6000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 3000),
        onRepeat: () => {
          gem.y = height + 50;
          gem.x = Phaser.Math.Between(0, width);
          gem.alpha = 0.25;
        },
      });
    }
  }
  
  createButton(
    x: number, 
    y: number, 
    text: string, 
    color: number, 
    callback: () => void,
    scale = 1
  ) {
    const container = this.add.container(x, y);
    
    // Button background
    const bg = this.add.graphics();
    const btnWidth = 220 * scale;
    const btnHeight = 60 * scale;
    
    // Shadow
    bg.fillStyle(0x000000, 0.3);
    bg.fillRoundedRect(-btnWidth/2 + 4, 4, btnWidth, btnHeight, 15);
    
    // Main button
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(-btnWidth/2, 0, btnWidth, btnHeight, 15);
    
    // Highlight
    bg.fillStyle(0xffffff, 0.3);
    bg.fillRoundedRect(-btnWidth/2 + 5, 5, btnWidth - 10, btnHeight/2 - 5, 10);
    
    // Text
    const btnText = this.add.text(0, btnHeight/2, text, {
      fontFamily: 'Arial Black, Arial',
      fontSize: `${22 * scale}px`,
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
    
    return container;
  }
  
  createSparkle(x: number, y: number) {
    const sparkle = this.add.text(x, y, '✨', {
      fontSize: `${Phaser.Math.Between(16, 28)}px`,
    }).setAlpha(0);
    
    this.tweens.add({
      targets: sparkle,
      alpha: 1,
      scale: 1.5,
      duration: 300,
      yoyo: true,
      onComplete: () => sparkle.destroy(),
    });
  }
  
  showDailyReward() {
    const store = useGemFusionStore.getState();
    const reward = store.claimDailyReward();
    
    const { width, height } = this.cameras.main;
    
    // Overlay with soft blur effect
    const overlay = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.5);
    overlay.setInteractive();
    
    // Popup with Fun Planet theme
    const popup = this.add.container(width/2, height/2);
    
    const bg = this.add.graphics();
    // Cream/white background
    bg.fillStyle(0xFFFAF0, 1);
    bg.fillRoundedRect(-150, -150, 300, 300, 20);
    // Golden border
    bg.lineStyle(4, 0xFFD700);
    bg.strokeRoundedRect(-150, -150, 300, 300, 20);
    
    popup.add(bg);
    
    if (reward) {
      popup.add(this.add.text(0, -100, '🎁', { fontSize: '60px' }).setOrigin(0.5));
      popup.add(this.add.text(0, -30, 'Quà Hàng Ngày!', {
        fontSize: '28px',
        color: '#FFD700',
        fontFamily: 'Arial Black',
        stroke: '#8B4513',
        strokeThickness: 2,
      }).setOrigin(0.5));
      popup.add(this.add.text(0, 20, `+${reward.coins} 💰`, {
        fontSize: '24px',
        color: '#5D3FD3',
      }).setOrigin(0.5));
      if (reward.boosters > 0) {
        popup.add(this.add.text(0, 55, `+${reward.boosters} 🔨`, {
          fontSize: '20px',
          color: '#5D3FD3',
        }).setOrigin(0.5));
      }
      popup.add(this.add.text(0, 90, `Chuỗi: Ngày ${store.dailyStreak} 🔥`, {
        fontSize: '16px',
        color: '#FF6B9D',
      }).setOrigin(0.5));
    } else {
      popup.add(this.add.text(0, -50, '⏰', { fontSize: '60px' }).setOrigin(0.5));
      popup.add(this.add.text(0, 30, 'Quay lại ngày mai\nđể nhận thêm quà!', {
        fontSize: '18px',
        color: '#5D3FD3',
        align: 'center',
      }).setOrigin(0.5));
    }
    
    // Close button with mint green
    const closeBtn = this.add.text(0, 120, 'OK', {
      fontSize: '24px',
      color: '#FFFFFF',
      backgroundColor: '#2ECC71',
      padding: { x: 30, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    closeBtn.on('pointerdown', () => {
      popup.destroy();
      overlay.destroy();
    });
    
    popup.add(closeBtn);
    
    popup.setScale(0);
    this.tweens.add({
      targets: popup,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut',
    });
  }
}
