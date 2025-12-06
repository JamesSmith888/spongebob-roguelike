import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const { width, height } = this.cameras.main;

    // 标题
    const title = this.add.text(width / 2, height / 3, '海绵宝宝 Roguelike', {
      font: 'bold 48px Arial',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 6
    });
    title.setOrigin(0.5);

    // 副标题
    const subtitle = this.add.text(width / 2, height / 3 + 60, '保卫蟹堡王', {
      font: '24px Arial',
      color: '#ffffff'
    });
    subtitle.setOrigin(0.5);

    // 开始按钮
    const startButton = this.add.text(width / 2, height / 2 + 50, '[ 开始游戏 ]', {
      font: '32px Arial',
      color: '#00FF00'
    }).setOrigin(0.5).setInteractive();

    startButton.on('pointerover', () => {
      startButton.setColor('#FFFF00');
      startButton.setScale(1.1);
    });

    startButton.on('pointerout', () => {
      startButton.setColor('#00FF00');
      startButton.setScale(1);
    });

    startButton.on('pointerdown', () => {
      this.scene.start('Level1Scene');
    });

    // 说明文字
    const instructions = this.add.text(width / 2, height - 100, 
      '← → 移动 | SPACE 跳跃 | X 攻击', {
      font: '18px Arial',
      color: '#888888'
    });
    instructions.setOrigin(0.5);

    // 版本信息
    const version = this.add.text(10, height - 30, 'v0.1.0 - Phaser 3.90', {
      font: '14px Arial',
      color: '#666666'
    });
  }
}
