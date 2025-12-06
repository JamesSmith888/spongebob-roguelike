import Phaser from 'phaser';
import { SpriteGenerator } from '../utils/SpriteGenerator';

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
    
    // 加载背景
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);
    
    const loadingText = this.add.text(width / 2, height / 2 - 80, '🎮 海绵宝宝 Roguelike', {
      font: 'bold 32px Arial',
      color: '#FFD700'
    });
    loadingText.setOrigin(0.5, 0.5);

    const subText = this.add.text(width / 2, height / 2 - 40, '正在加载游戏资源...', {
      font: '18px Arial',
      color: '#ffffff'
    });
    subText.setOrigin(0.5, 0.5);

    const percentText = this.add.text(width / 2, height / 2 + 20, '生成角色精灵...', {
      font: '16px Arial',
      color: '#888888'
    });
    percentText.setOrigin(0.5, 0.5);

    // 模拟加载进度
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 0.1;
      if (progress > 1) {
        progress = 1;
        clearInterval(progressInterval);
      }
      progressBar.clear();
      progressBar.fillStyle(0xFFD700, 1);
      progressBar.fillRect(250, 280, 300 * progress, 30);
    }, 50);

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
      subText.destroy();
      clearInterval(progressInterval);
    });

    // 加载一个空白图片作为占位
    // 真正的精灵会在 create 中动态生成
    this.load.image('placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
  }

  create() {
    // 使用精灵生成器动态创建所有游戏精灵
    const spriteGenerator = new SpriteGenerator(this);
    
    // 生成玩家精灵
    spriteGenerator.generatePlayerSpriteSheet();
    
    // 生成敌人精灵
    spriteGenerator.generateEnemySpriteSheet();
    
    // 生成Boss精灵
    spriteGenerator.generateBossSpriteSheet();
    
    // 创建动画
    spriteGenerator.createAnimations();
    
    // 生成额外的UI元素纹理
    this.generateUITextures();

    console.log('✅ 所有精灵已动态生成！');

    // 短暂延迟后跳转到菜单
    this.time.delayedCall(500, () => {
      this.scene.start('MenuScene');
    });
  }

  /**
   * 生成UI相关的纹理
   */
  private generateUITextures(): void {
    // 生成粒子纹理
    const particle = this.make.graphics({ x: 0, y: 0 });
    particle.fillStyle(0xFFFFFF);
    particle.fillCircle(8, 8, 8);
    particle.generateTexture('particle', 16, 16);
    particle.destroy();

    // 生成攻击特效纹理
    const slash = this.make.graphics({ x: 0, y: 0 });
    slash.lineStyle(4, 0xFFFFFF, 1);
    slash.beginPath();
    slash.moveTo(0, 32);
    slash.lineTo(64, 0);
    slash.lineTo(64, 64);
    slash.lineTo(0, 32);
    slash.strokePath();
    slash.generateTexture('slash', 64, 64);
    slash.destroy();

    // 生成金币纹理
    const coin = this.make.graphics({ x: 0, y: 0 });
    coin.fillStyle(0xFFD700);
    coin.fillCircle(12, 12, 10);
    coin.lineStyle(2, 0xB8860B);
    coin.strokeCircle(12, 12, 10);
    coin.fillStyle(0xB8860B);
    coin.fillRect(10, 6, 4, 12);
    coin.generateTexture('coin', 24, 24);
    coin.destroy();

    // 生成生命药水纹理
    const potion = this.make.graphics({ x: 0, y: 0 });
    potion.fillStyle(0xFF4444);
    potion.fillRoundedRect(6, 10, 12, 14, 3);
    potion.fillStyle(0xCCCCCC);
    potion.fillRect(8, 6, 8, 6);
    potion.lineStyle(1, 0x000000);
    potion.strokeRoundedRect(6, 10, 12, 14, 3);
    potion.generateTexture('health-potion', 24, 24);
    potion.destroy();

    // 生成装备掉落物纹理（宝箱/礼盒样式）
    const equipLoot = this.make.graphics({ x: 0, y: 0 });
    // 宝箱主体
    equipLoot.fillStyle(0x8B4513);
    equipLoot.fillRoundedRect(4, 10, 20, 14, 3);
    // 宝箱盖
    equipLoot.fillStyle(0xA0522D);
    equipLoot.fillRoundedRect(2, 6, 24, 8, 4);
    // 金属锁
    equipLoot.fillStyle(0xFFD700);
    equipLoot.fillRect(12, 12, 4, 6);
    equipLoot.fillCircle(14, 11, 3);
    // 边框
    equipLoot.lineStyle(1, 0x654321);
    equipLoot.strokeRoundedRect(4, 10, 20, 14, 3);
    equipLoot.strokeRoundedRect(2, 6, 24, 8, 4);
    equipLoot.generateTexture('equipment-loot', 28, 28);
    equipLoot.destroy();
  }
}
