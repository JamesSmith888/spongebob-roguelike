import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // 显示加载进度
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(240, 270, 320, 50);

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const loadingText = this.add.text(width / 2, height / 2 - 50, '加载中...', {
      font: '20px Arial',
      color: '#ffffff'
    });
    loadingText.setOrigin(0.5, 0.5);

    const percentText = this.add.text(width / 2, height / 2 - 5, '0%', {
      font: '18px Arial',
      color: '#ffffff'
    });
    percentText.setOrigin(0.5, 0.5);

    // 加载事件
    this.load.on('progress', (value: number) => {
      percentText.setText(Math.floor(value * 100) + '%');
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(250, 280, 300 * value, 30);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });

    // TODO: 这里加载游戏资源
    // this.load.image('player', 'assets/images/player.png');
    // this.load.image('enemy', 'assets/images/enemy.png');
    // this.load.audio('bgm', 'assets/sounds/bgm.mp3');
  }

  create() {
    // 加载完成后跳转到菜单场景
    this.scene.start('MenuScene');
  }
}
