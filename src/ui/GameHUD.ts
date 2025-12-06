import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../data/constants';

/**
 * 游戏HUD界面 - 显示生命值、技能、房间信息等
 */
export class GameHUD {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  
  // UI元素
  private healthBar!: Phaser.GameObjects.Graphics;
  private healthText!: Phaser.GameObjects.Text;
  private roomLabel!: Phaser.GameObjects.Text;
  private waveLabel!: Phaser.GameObjects.Text;
  private skillIcons: Phaser.GameObjects.Container[] = [];
  private comboText!: Phaser.GameObjects.Text;
  private goldText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private expBar!: Phaser.GameObjects.Graphics;
  private equipHint!: Phaser.GameObjects.Text;

  // 数据
  private maxHealth = 100;
  private currentHealth = 100;
  private currentRoom = 1;
  private currentWave = 1;
  private totalWaves = 3;
  private gold = 0;
  private level = 1;
  private exp = 0;
  private expToNext = 100;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createHUD();
  }

  private createHUD(): void {
    this.container = this.scene.add.container(0, 0);
    this.container.setDepth(100);

    // ===== 顶部状态栏背景 =====
    const topBar = this.scene.add.graphics();
    topBar.fillStyle(0x000000, 0.7);
    topBar.fillRoundedRect(10, 10, CANVAS_WIDTH - 20, 50, 10);
    topBar.lineStyle(2, 0xFFD700);
    topBar.strokeRoundedRect(10, 10, CANVAS_WIDTH - 20, 50, 10);
    this.container.add(topBar);

    // ===== 角色头像框 =====
    const portrait = this.scene.add.graphics();
    portrait.fillStyle(0xFFEB3B, 1);
    portrait.fillRoundedRect(20, 15, 40, 40, 8);
    portrait.lineStyle(2, 0xE6A800);
    portrait.strokeRoundedRect(20, 15, 40, 40, 8);
    
    // 简单的海绵宝宝脸
    portrait.fillStyle(0xFFFFFF);
    portrait.fillCircle(32, 28, 5);
    portrait.fillCircle(48, 28, 5);
    portrait.fillStyle(0x42A5F5);
    portrait.fillCircle(33, 28, 2);
    portrait.fillCircle(47, 28, 2);
    portrait.lineStyle(2, 0x000000);
    portrait.beginPath();
    portrait.arc(40, 42, 8, 0.2, Math.PI - 0.2, false);
    portrait.strokePath();
    this.container.add(portrait);

    // ===== 生命值条 =====
    this.healthBar = this.scene.add.graphics();
    this.container.add(this.healthBar);
    this.updateHealthBar();

    this.healthText = this.scene.add.text(140, 35, `${this.currentHealth}/${this.maxHealth}`, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.container.add(this.healthText);

    // ===== 房间/波次信息 =====
    this.roomLabel = this.scene.add.text(CANVAS_WIDTH / 2, 25, `🏠 房间 ${this.currentRoom}`, {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#FFD700',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0);
    this.container.add(this.roomLabel);

    this.waveLabel = this.scene.add.text(CANVAS_WIDTH / 2, 42, `波次 ${this.currentWave}/${this.totalWaves}`, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#ffffff'
    }).setOrigin(0.5, 0);
    this.container.add(this.waveLabel);

    // ===== 金币显示 =====
    this.goldText = this.scene.add.text(CANVAS_WIDTH - 100, 25, `💰 ${this.gold}`, {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#FFD700',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.container.add(this.goldText);
    
    // ===== 等级显示 =====
    this.levelText = this.scene.add.text(CANVAS_WIDTH - 100, 45, `Lv.${this.level}`, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#4FC3F7',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.container.add(this.levelText);
    
    // ===== 经验条 =====
    this.expBar = this.scene.add.graphics();
    this.container.add(this.expBar);
    this.updateExpBar();
    
    // ===== 装备提示 =====
    this.equipHint = this.scene.add.text(CANVAS_WIDTH - 40, 35, '📦', {
      fontSize: '20px'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.equipHint.on('pointerdown', () => {
      // 触发装备界面打开事件
      this.scene.events.emit('openEquipment');
    });
    this.container.add(this.equipHint);
    
    // 装备提示悬浮
    const equipTooltip = this.scene.add.text(CANVAS_WIDTH - 40, 55, '按E打开', {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: '#888888'
    }).setOrigin(0.5);
    this.container.add(equipTooltip);
    this.container.add(this.goldText);

    // ===== 连击显示 (中央) =====
    this.comboText = this.scene.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 100, '', {
      fontFamily: 'Arial',
      fontSize: '32px',
      color: '#FF6600',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    this.comboText.setAlpha(0);
    this.container.add(this.comboText);

    // ===== 技能槽 (底部) =====
    this.createSkillSlots();
  }

  private createSkillSlots(): void {
    const startX = CANVAS_WIDTH / 2 - 80;
    const y = CANVAS_HEIGHT - 60;

    for (let i = 0; i < 3; i++) {
      const slotContainer = this.scene.add.container(startX + i * 60, y);
      
      const bg = this.scene.add.graphics();
      bg.fillStyle(0x1a1a1a, 0.8);
      bg.fillRoundedRect(-25, -25, 50, 50, 8);
      bg.lineStyle(2, 0x666666);
      bg.strokeRoundedRect(-25, -25, 50, 50, 8);
      slotContainer.add(bg);

      const keyLabel = this.scene.add.text(0, 20, `${i + 1}`, {
        fontFamily: 'Arial',
        fontSize: '12px',
        color: '#888888'
      }).setOrigin(0.5);
      slotContainer.add(keyLabel);

      // 空技能槽图标
      const icon = this.scene.add.text(0, -5, '❓', {
        fontSize: '24px'
      }).setOrigin(0.5);
      slotContainer.add(icon);

      this.skillIcons.push(slotContainer);
      this.container.add(slotContainer);
    }
  }

  private updateHealthBar(): void {
    this.healthBar.clear();
    
    // 背景
    this.healthBar.fillStyle(0x333333);
    this.healthBar.fillRoundedRect(70, 25, 140, 20, 5);
    
    // 生命值
    const healthPercent = this.currentHealth / this.maxHealth;
    const barColor = healthPercent > 0.5 ? 0x4CAF50 : healthPercent > 0.25 ? 0xFFC107 : 0xF44336;
    this.healthBar.fillStyle(barColor);
    this.healthBar.fillRoundedRect(72, 27, Math.max(0, 136 * healthPercent), 16, 4);
    
    // 边框
    this.healthBar.lineStyle(2, 0xFFFFFF, 0.5);
    this.healthBar.strokeRoundedRect(70, 25, 140, 20, 5);
  }

  private updateExpBar(): void {
    this.expBar.clear();
    
    // 背景
    this.expBar.fillStyle(0x333333);
    this.expBar.fillRoundedRect(CANVAS_WIDTH - 150, 52, 100, 6, 3);
    
    // 经验值
    const expPercent = this.exp / this.expToNext;
    this.expBar.fillStyle(0x4FC3F7);
    this.expBar.fillRoundedRect(CANVAS_WIDTH - 149, 53, Math.max(0, 98 * expPercent), 4, 2);
  }

  // ===== 公开方法 =====

  setHealth(current: number, max: number): void {
    this.currentHealth = current;
    this.maxHealth = max;
    this.updateHealthBar();
    this.healthText.setText(`${Math.max(0, current)}/${max}`);
  }

  setRoom(room: number): void {
    this.currentRoom = room;
    this.roomLabel.setText(`🏠 房间 ${room}`);
  }

  setWave(wave: number, total: number): void {
    this.currentWave = wave;
    this.totalWaves = total;
    this.waveLabel.setText(`波次 ${wave}/${total}`);
  }

  setGold(gold: number): void {
    this.gold = gold;
    this.goldText.setText(`💰 ${gold}`);
  }

  showCombo(count: number): void {
    if (count < 2) {
      this.comboText.setAlpha(0);
      return;
    }
    
    this.comboText.setText(`${count} COMBO!`);
    this.comboText.setAlpha(1);
    this.comboText.setScale(1.5);
    
    this.scene.tweens.add({
      targets: this.comboText,
      scale: 1,
      duration: 200,
      ease: 'Back.out'
    });

    // 2秒后淡出
    this.scene.time.delayedCall(2000, () => {
      this.scene.tweens.add({
        targets: this.comboText,
        alpha: 0,
        duration: 300
      });
    });
  }

  setSkill(index: number, emoji: string, _name?: string): void {
    if (index >= 0 && index < this.skillIcons.length) {
      const container = this.skillIcons[index];
      // 更新图标
      const oldIcon = container.getAt(2) as Phaser.GameObjects.Text;
      oldIcon.setText(emoji);
    }
  }

  showDamage(x: number, y: number, damage: number): void {
    const damageText = this.scene.add.text(x, y, `-${damage}`, {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#FF0000',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.scene.tweens.add({
      targets: damageText,
      y: y - 50,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => damageText.destroy()
    });
  }

  showHeal(x: number, y: number, amount: number): void {
    const healText = this.scene.add.text(x, y, `+${amount}`, {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#00FF00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.scene.tweens.add({
      targets: healText,
      y: y - 50,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => healText.destroy()
    });
  }

  showMessage(message: string, color: string = '#FFFFFF'): void {
    const msgText = this.scene.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 100, message, {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(200);

    this.scene.tweens.add({
      targets: msgText,
      y: CANVAS_HEIGHT / 2 - 130,
      alpha: 0,
      duration: 1500,
      ease: 'Power2',
      delay: 500,
      onComplete: () => msgText.destroy()
    });
  }

  setLevel(level: number, exp: number, expToNext: number): void {
    this.level = level;
    this.exp = exp;
    this.expToNext = expToNext;
    this.levelText.setText(`Lv.${level}`);
    this.updateExpBar();
  }

  destroy(): void {
    this.container.destroy();
  }
}
