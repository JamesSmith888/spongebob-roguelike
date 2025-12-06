import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../data/constants';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const { width, height } = this.cameras.main;

    // ===== 渐变背景 =====
    this.createBackground();

    // ===== 装饰性气泡粒子 =====
    this.createBubbles();

    // ===== 主标题 =====
    const titleContainer = this.add.container(width / 2, height / 4);
    
    // 标题阴影
    const titleShadow = this.add.text(3, 3, '🧽 海绵宝宝', {
      font: 'bold 56px Arial',
      color: '#000000'
    }).setOrigin(0.5).setAlpha(0.3);
    titleContainer.add(titleShadow);

    // 标题主体
    const title = this.add.text(0, 0, '🧽 海绵宝宝', {
      font: 'bold 56px Arial',
      color: '#FFD700',
      stroke: '#B8860B',
      strokeThickness: 4
    }).setOrigin(0.5);
    titleContainer.add(title);

    // 副标题
    const subtitle = this.add.text(0, 60, 'ROGUELIKE 大冒险', {
      font: 'bold 28px Arial',
      color: '#4FC3F7',
      stroke: '#0288D1',
      strokeThickness: 2
    }).setOrigin(0.5);
    titleContainer.add(subtitle);

    // 标题动画
    this.tweens.add({
      targets: titleContainer,
      y: height / 4 - 10,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // ===== 角色预览 =====
    this.createCharacterPreview();

    // ===== 开始按钮 =====
    this.createButton(width / 2, height / 2 + 80, '🎮 开始游戏', () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(500, () => {
        this.scene.start('HubScene');
      });
    });

    // ===== 快速开始按钮 =====
    this.createButton(width / 2, height / 2 + 150, '⚡ 快速开始', () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(500, () => {
        this.scene.start('Level1Scene');
      });
    }, true);

    // ===== 操作模式切换 =====
    this.createControlModeToggle(width / 2, height / 2 + 210);

    // ===== 底部信息 =====
    this.add.text(width / 2, height - 80, '← → 移动  |  空格 跳跃  |  X 攻击  |  E 装备', {
      font: '16px Arial',
      color: '#888888'
    }).setOrigin(0.5);

    this.add.text(width / 2, height - 50, '📱 移动端支持虚拟摇杆', {
      font: '14px Arial',
      color: '#666666'
    }).setOrigin(0.5);

    this.add.text(width - 10, height - 20, 'v0.2.0 | Phaser ' + Phaser.VERSION, {
      font: '12px Arial',
      color: '#444444'
    }).setOrigin(1, 0.5);

    // ===== 入场动画 =====
    this.cameras.main.fadeIn(800);
  }

  private createBackground(): void {
    // 深海背景渐变
    const graphics = this.add.graphics();
    
    // 渐变背景
    for (let y = 0; y < CANVAS_HEIGHT; y++) {
      const ratio = y / CANVAS_HEIGHT;
      const r = Math.floor(10 + ratio * 20);
      const g = Math.floor(30 + ratio * 40);
      const b = Math.floor(60 + ratio * 80);
      graphics.fillStyle(Phaser.Display.Color.GetColor(r, g, b));
      graphics.fillRect(0, y, CANVAS_WIDTH, 1);
    }

    // 海底沙地
    graphics.fillStyle(0x8B7355);
    graphics.fillRect(0, CANVAS_HEIGHT - 60, CANVAS_WIDTH, 60);

    // 沙地细节
    graphics.fillStyle(0x9C8565);
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * CANVAS_WIDTH;
      const w = 30 + Math.random() * 50;
      graphics.fillEllipse(x, CANVAS_HEIGHT - 30 + Math.random() * 20, w, 15);
    }

    // 装饰性海草
    this.drawSeaweed(50, CANVAS_HEIGHT - 60, 80);
    this.drawSeaweed(150, CANVAS_HEIGHT - 60, 100);
    this.drawSeaweed(CANVAS_WIDTH - 100, CANVAS_HEIGHT - 60, 90);
    this.drawSeaweed(CANVAS_WIDTH - 200, CANVAS_HEIGHT - 60, 70);
  }

  private drawSeaweed(x: number, baseY: number, height: number): void {
    const graphics = this.add.graphics();
    graphics.lineStyle(8, 0x2E7D32);
    
    graphics.beginPath();
    graphics.moveTo(x, baseY);
    
    const segments = 8;
    for (let i = 1; i <= segments; i++) {
      const progress = i / segments;
      const sway = Math.sin(progress * Math.PI * 2) * 15;
      graphics.lineTo(x + sway, baseY - height * progress);
    }
    graphics.strokePath();

    // 海草叶子
    graphics.fillStyle(0x388E3C);
    graphics.fillEllipse(x - 10, baseY - height * 0.4, 12, 6);
    graphics.fillEllipse(x + 12, baseY - height * 0.6, 12, 6);
    graphics.fillEllipse(x - 8, baseY - height * 0.8, 10, 5);
  }

  private createBubbles(): void {
    // 创建漂浮的气泡
    for (let i = 0; i < 15; i++) {
      this.time.delayedCall(i * 300, () => {
        this.spawnBubble();
      });
    }

    // 持续生成气泡
    this.time.addEvent({
      delay: 500,
      callback: () => this.spawnBubble(),
      loop: true
    });
  }

  private spawnBubble(): void {
    const x = Math.random() * CANVAS_WIDTH;
    const size = 5 + Math.random() * 15;
    
    const bubble = this.add.graphics();
    bubble.fillStyle(0xFFFFFF, 0.2);
    bubble.fillCircle(0, 0, size);
    bubble.lineStyle(1, 0xFFFFFF, 0.4);
    bubble.strokeCircle(0, 0, size);
    
    // 高光
    bubble.fillStyle(0xFFFFFF, 0.5);
    bubble.fillCircle(-size / 3, -size / 3, size / 4);
    
    bubble.setPosition(x, CANVAS_HEIGHT + size);

    this.tweens.add({
      targets: bubble,
      y: -size,
      x: x + (Math.random() - 0.5) * 100,
      duration: 4000 + Math.random() * 3000,
      ease: 'Sine.easeInOut',
      onComplete: () => bubble.destroy()
    });
  }

  private createCharacterPreview(): void {
    const { width, height } = this.cameras.main;
    
    // 创建角色预览（使用动态生成的精灵）
    try {
      const character = this.add.sprite(width / 2, height / 2 - 20, 'player-idle-0');
      character.setScale(1.5);
      character.play('player-idle');
      
      // 角色轻微浮动
      this.tweens.add({
        targets: character,
        y: height / 2 - 30,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    } catch (e) {
      // 如果精灵未加载，使用占位符
      const placeholder = this.add.graphics();
      placeholder.fillStyle(0xFFEB3B);
      placeholder.fillRoundedRect(width / 2 - 40, height / 2 - 60, 80, 100, 10);
      placeholder.lineStyle(3, 0xE6A800);
      placeholder.strokeRoundedRect(width / 2 - 40, height / 2 - 60, 80, 100, 10);
    }
  }

  private createButton(x: number, y: number, text: string, callback: () => void, secondary: boolean = false): void {
    const container = this.add.container(x, y);
    
    // 按钮背景
    const bg = this.add.graphics();
    const bgColor = secondary ? 0x37474F : 0x4CAF50;
    const borderColor = secondary ? 0x607D8B : 0x81C784;
    
    bg.fillStyle(bgColor, 0.9);
    bg.fillRoundedRect(-120, -25, 240, 50, 12);
    bg.lineStyle(3, borderColor);
    bg.strokeRoundedRect(-120, -25, 240, 50, 12);
    container.add(bg);

    // 按钮文字
    const btnText = this.add.text(0, 0, text, {
      font: 'bold 22px Arial',
      color: '#FFFFFF'
    }).setOrigin(0.5);
    container.add(btnText);

    // 交互区域
    const hitArea = this.add.rectangle(0, 0, 240, 50, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    container.add(hitArea);

    // 悬停效果
    hitArea.on('pointerover', () => {
      this.tweens.add({
        targets: container,
        scale: 1.05,
        duration: 150
      });
      bg.clear();
      bg.fillStyle(bgColor, 1);
      bg.fillRoundedRect(-120, -25, 240, 50, 12);
      bg.lineStyle(4, 0xFFFFFF);
      bg.strokeRoundedRect(-120, -25, 240, 50, 12);
    });

    hitArea.on('pointerout', () => {
      this.tweens.add({
        targets: container,
        scale: 1,
        duration: 150
      });
      bg.clear();
      bg.fillStyle(bgColor, 0.9);
      bg.fillRoundedRect(-120, -25, 240, 50, 12);
      bg.lineStyle(3, borderColor);
      bg.strokeRoundedRect(-120, -25, 240, 50, 12);
    });

    hitArea.on('pointerdown', () => {
      this.tweens.add({
        targets: container,
        scale: 0.95,
        duration: 50,
        yoyo: true,
        onComplete: callback
      });
    });
  }

  /**
   * 创建操作模式切换按钮
   */
  private createControlModeToggle(x: number, y: number): void {
    // 从本地存储读取当前模式
    let controlMode = localStorage.getItem('spongebob_control_mode') || 'auto';
    
    const container = this.add.container(x, y);
    
    const getModeText = (mode: string) => {
      switch (mode) {
        case 'mobile': return '📱 手机模式';
        case 'pc': return '💻 电脑模式';
        default: return '🔄 自动检测';
      }
    };
    
    // 背景
    const bg = this.add.graphics();
    bg.fillStyle(0x333366, 0.8);
    bg.fillRoundedRect(-100, -18, 200, 36, 8);
    bg.lineStyle(2, 0x6666AA);
    bg.strokeRoundedRect(-100, -18, 200, 36, 8);
    container.add(bg);
    
    // 文字
    const text = this.add.text(0, 0, getModeText(controlMode), {
      font: 'bold 16px Arial',
      color: '#AABBFF'
    }).setOrigin(0.5);
    container.add(text);
    
    // 点击区域
    const hitArea = this.add.rectangle(0, 0, 200, 36, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    container.add(hitArea);
    
    hitArea.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x4444AA, 0.9);
      bg.fillRoundedRect(-100, -18, 200, 36, 8);
      bg.lineStyle(2, 0x8888CC);
      bg.strokeRoundedRect(-100, -18, 200, 36, 8);
    });
    
    hitArea.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x333366, 0.8);
      bg.fillRoundedRect(-100, -18, 200, 36, 8);
      bg.lineStyle(2, 0x6666AA);
      bg.strokeRoundedRect(-100, -18, 200, 36, 8);
    });
    
    hitArea.on('pointerdown', () => {
      // 切换模式
      const modes = ['auto', 'mobile', 'pc'];
      const currentIndex = modes.indexOf(controlMode);
      controlMode = modes[(currentIndex + 1) % modes.length];
      
      // 保存设置
      localStorage.setItem('spongebob_control_mode', controlMode);
      
      // 更新显示
      text.setText(getModeText(controlMode));
      
      // 点击反馈
      this.tweens.add({
        targets: container,
        scale: 0.95,
        duration: 50,
        yoyo: true
      });
    });
  }
}
