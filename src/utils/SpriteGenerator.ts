import Phaser from 'phaser';

/**
 * 动态生成海绵宝宝风格的角色精灵
 * 使用 Phaser Graphics 在运行时绘制角色帧
 */
export class SpriteGenerator {
  private scene: Phaser.Scene;
  private frameWidth = 128;
  private frameHeight = 128;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * 生成完整的角色精灵表纹理
   */
  generatePlayerSpriteSheet(): void {
    // 生成各种动画帧
    this.generateIdleFrames();
    this.generateWalkFrames();
    this.generateJumpFrames();
    this.generateAttackFrames();
  }

  /**
   * 生成待机动画帧 (2帧)
   */
  private generateIdleFrames(): void {
    for (let i = 0; i < 2; i++) {
      const key = `player-idle-${i}`;
      const graphics = this.scene.make.graphics({ x: 0, y: 0 });
      this.drawCharacter(graphics, i % 2 === 0 ? 0 : 2, false);
      graphics.generateTexture(key, this.frameWidth, this.frameHeight);
      graphics.destroy();
    }
  }

  /**
   * 生成行走动画帧 (6帧)
   */
  private generateWalkFrames(): void {
    for (let i = 0; i < 6; i++) {
      const key = `player-walk-${i}`;
      const graphics = this.scene.make.graphics({ x: 0, y: 0 });
      // 行走时身体有轻微摆动
      const bobOffset = Math.sin((i / 6) * Math.PI * 2) * 4;
      this.drawCharacter(graphics, bobOffset, false, i);
      graphics.generateTexture(key, this.frameWidth, this.frameHeight);
      graphics.destroy();
    }
  }

  /**
   * 生成跳跃动画帧 (3帧)
   */
  private generateJumpFrames(): void {
    const poses = ['up', 'peak', 'down'];
    for (let i = 0; i < 3; i++) {
      const key = `player-jump-${i}`;
      const graphics = this.scene.make.graphics({ x: 0, y: 0 });
      this.drawCharacter(graphics, 0, false, 0, poses[i]);
      graphics.generateTexture(key, this.frameWidth, this.frameHeight);
      graphics.destroy();
    }
  }

  /**
   * 生成攻击动画帧 (4帧)
   */
  private generateAttackFrames(): void {
    for (let i = 0; i < 4; i++) {
      const key = `player-attack-${i}`;
      const graphics = this.scene.make.graphics({ x: 0, y: 0 });
      this.drawCharacter(graphics, 0, true, 0, 'normal', i);
      graphics.generateTexture(key, this.frameWidth, this.frameHeight);
      graphics.destroy();
    }
  }

  /**
   * 绘制海绵宝宝风格的卡通角色
   */
  private drawCharacter(
    graphics: Phaser.GameObjects.Graphics,
    yOffset: number = 0,
    isAttacking: boolean = false,
    walkFrame: number = 0,
    jumpPose: string = 'normal',
    attackFrame: number = 0
  ): void {
    const cx = this.frameWidth / 2;
    const cy = this.frameHeight / 2 + yOffset;

    // ===== 身体 (黄色方形海绵) =====
    graphics.fillStyle(0xFFEB3B); // 鲜黄色
    graphics.fillRoundedRect(cx - 25, cy - 20, 50, 50, 8);
    
    // 身体边框
    graphics.lineStyle(3, 0xE6A800);
    graphics.strokeRoundedRect(cx - 25, cy - 20, 50, 50, 8);

    // 身体上的海绵孔洞
    graphics.fillStyle(0xC9A800, 0.6);
    const holes = [
      { x: cx - 15, y: cy - 8 },
      { x: cx + 8, y: cy - 5 },
      { x: cx - 8, y: cy + 10 },
      { x: cx + 12, y: cy + 15 },
      { x: cx - 18, y: cy + 18 }
    ];
    holes.forEach(h => {
      graphics.fillCircle(h.x, h.y, 4);
    });

    // ===== 眼睛 =====
    // 白色眼球
    graphics.fillStyle(0xFFFFFF);
    graphics.fillCircle(cx - 10, cy - 28, 12);
    graphics.fillCircle(cx + 10, cy - 28, 12);
    
    // 眼睛边框
    graphics.lineStyle(2, 0x000000);
    graphics.strokeCircle(cx - 10, cy - 28, 12);
    graphics.strokeCircle(cx + 10, cy - 28, 12);

    // 蓝色瞳孔
    graphics.fillStyle(0x42A5F5);
    graphics.fillCircle(cx - 8, cy - 28, 6);
    graphics.fillCircle(cx + 8, cy - 28, 6);

    // 黑色眼珠
    graphics.fillStyle(0x000000);
    graphics.fillCircle(cx - 7, cy - 28, 3);
    graphics.fillCircle(cx + 9, cy - 28, 3);

    // 眼睛高光
    graphics.fillStyle(0xFFFFFF);
    graphics.fillCircle(cx - 5, cy - 30, 2);
    graphics.fillCircle(cx + 11, cy - 30, 2);

    // ===== 鼻子 =====
    graphics.fillStyle(0xFFEB3B);
    graphics.fillCircle(cx, cy - 18, 5);

    // ===== 嘴巴 =====
    graphics.lineStyle(2, 0x000000);
    if (isAttacking) {
      // 攻击时张嘴
      graphics.fillStyle(0x8B0000);
      graphics.fillEllipse(cx, cy - 8, 20, 12);
      // 牙齿
      graphics.fillStyle(0xFFFFFF);
      graphics.fillRect(cx - 6, cy - 14, 4, 6);
      graphics.fillRect(cx + 2, cy - 14, 4, 6);
    } else {
      // 正常微笑
      graphics.beginPath();
      graphics.arc(cx, cy - 12, 12, 0.2, Math.PI - 0.2, false);
      graphics.strokePath();
      // 牙齿
      graphics.fillStyle(0xFFFFFF);
      graphics.fillRect(cx - 4, cy - 12, 3, 5);
      graphics.fillRect(cx + 1, cy - 12, 3, 5);
    }

    // ===== 裤子 =====
    graphics.fillStyle(0x8B4513); // 棕色裤子
    graphics.fillRect(cx - 25, cy + 28, 50, 20);
    
    // 裤子边框
    graphics.lineStyle(2, 0x5D3A1A);
    graphics.strokeRect(cx - 25, cy + 28, 50, 20);

    // 腰带
    graphics.fillStyle(0x1A1A1A);
    graphics.fillRect(cx - 25, cy + 28, 50, 6);

    // ===== 腿 =====
    const legSwing = walkFrame > 0 ? Math.sin((walkFrame / 6) * Math.PI * 2) * 8 : 0;
    
    // 左腿
    graphics.fillStyle(0xFFEB3B);
    graphics.fillRect(cx - 18 + legSwing, cy + 46, 10, 20 + (jumpPose === 'up' ? -5 : 0));
    
    // 右腿
    graphics.fillRect(cx + 8 - legSwing, cy + 46, 10, 20 + (jumpPose === 'up' ? -5 : 0));

    // 鞋子
    graphics.fillStyle(0x1A1A1A);
    graphics.fillRoundedRect(cx - 22, cy + 62 + (jumpPose === 'up' ? -5 : 0), 18, 8, 3);
    graphics.fillRoundedRect(cx + 4, cy + 62 + (jumpPose === 'up' ? -5 : 0), 18, 8, 3);

    // ===== 手臂 =====
    graphics.fillStyle(0xFFEB3B);
    
    if (isAttacking) {
      // 攻击动作 - 手臂向前挥舞
      const armExtend = [10, 25, 35, 20][attackFrame];
      // 左手收回
      graphics.fillRect(cx - 35, cy - 5, 12, 25);
      // 右手前伸攻击
      graphics.fillRect(cx + 20, cy - 10, armExtend, 15);
      
      // 拳头/锅铲
      graphics.fillStyle(0xC0C0C0); // 银色锅铲
      graphics.fillRoundedRect(cx + 20 + armExtend - 5, cy - 15, 15, 25, 4);
    } else {
      // 正常手臂
      const armSwing = walkFrame > 0 ? Math.sin((walkFrame / 6) * Math.PI * 2) * 10 : 0;
      
      // 左手臂
      graphics.fillRect(cx - 37, cy - 5 - armSwing, 14, 25);
      // 右手臂  
      graphics.fillRect(cx + 23, cy - 5 + armSwing, 14, 25);
    }
  }

  /**
   * 生成敌人精灵 (痞老板风格)
   */
  generateEnemySpriteSheet(): void {
    for (let i = 0; i < 4; i++) {
      const key = `enemy-${i}`;
      const graphics = this.scene.make.graphics({ x: 0, y: 0 });
      this.drawEnemy(graphics, i);
      graphics.generateTexture(key, 64, 64);
      graphics.destroy();
    }
  }

  /**
   * 绘制痞老板风格的敌人
   */
  private drawEnemy(graphics: Phaser.GameObjects.Graphics, frame: number): void {
    const cx = 32;
    const cy = 32;
    const bounce = Math.sin((frame / 4) * Math.PI * 2) * 3;

    // 身体 (绿色单眼生物)
    graphics.fillStyle(0x2E7D32);
    graphics.fillEllipse(cx, cy + bounce, 30, 40);

    // 边框
    graphics.lineStyle(2, 0x1B5E20);
    graphics.strokeEllipse(cx, cy + bounce, 30, 40);

    // 眼睛
    graphics.fillStyle(0xFFFFFF);
    graphics.fillCircle(cx, cy - 8 + bounce, 10);
    
    graphics.lineStyle(2, 0x000000);
    graphics.strokeCircle(cx, cy - 8 + bounce, 10);

    // 红色瞳孔
    graphics.fillStyle(0xB71C1C);
    graphics.fillCircle(cx, cy - 8 + bounce, 5);

    // 眼珠
    graphics.fillStyle(0x000000);
    graphics.fillCircle(cx, cy - 8 + bounce, 2);

    // 触角
    graphics.lineStyle(3, 0x2E7D32);
    graphics.beginPath();
    graphics.moveTo(cx, cy - 20 + bounce);
    graphics.lineTo(cx, cy - 35 + bounce);
    graphics.strokePath();

    // 触角顶端
    graphics.fillStyle(0x2E7D32);
    graphics.fillCircle(cx, cy - 35 + bounce, 4);

    // 小腿
    graphics.lineStyle(3, 0x2E7D32);
    graphics.beginPath();
    graphics.moveTo(cx - 8, cy + 18 + bounce);
    graphics.lineTo(cx - 12, cy + 28 + bounce);
    graphics.moveTo(cx + 8, cy + 18 + bounce);
    graphics.lineTo(cx + 12, cy + 28 + bounce);
    graphics.strokePath();
  }

  /**
   * 生成Boss精灵 (大型痞老板机甲)
   */
  generateBossSpriteSheet(): void {
    for (let i = 0; i < 4; i++) {
      const key = `boss-${i}`;
      const graphics = this.scene.make.graphics({ x: 0, y: 0 });
      this.drawBoss(graphics, i);
      graphics.generateTexture(key, 128, 128);
      graphics.destroy();
    }
  }

  /**
   * 绘制Boss机甲
   */
  private drawBoss(graphics: Phaser.GameObjects.Graphics, frame: number): void {
    const cx = 64;
    const cy = 64;
    const shake = Math.sin((frame / 4) * Math.PI * 2) * 2;

    // 机甲身体
    graphics.fillStyle(0x424242);
    graphics.fillRoundedRect(cx - 35 + shake, cy - 20, 70, 60, 10);

    // 机甲边框
    graphics.lineStyle(3, 0x212121);
    graphics.strokeRoundedRect(cx - 35 + shake, cy - 20, 70, 60, 10);

    // 驾驶舱 (痞老板在里面)
    graphics.fillStyle(0x1B5E20);
    graphics.fillCircle(cx + shake, cy - 5, 20);
    
    graphics.lineStyle(2, 0x0D4412);
    graphics.strokeCircle(cx + shake, cy - 5, 20);

    // 痞老板的眼睛
    graphics.fillStyle(0xFFFFFF);
    graphics.fillCircle(cx + shake, cy - 8, 8);
    graphics.fillStyle(0xB71C1C);
    graphics.fillCircle(cx + shake, cy - 8, 4);
    graphics.fillStyle(0x000000);
    graphics.fillCircle(cx + shake, cy - 8, 2);

    // 机械臂
    graphics.fillStyle(0x616161);
    graphics.fillRect(cx - 55 + shake, cy, 25, 15);
    graphics.fillRect(cx + 30 + shake, cy, 25, 15);

    // 机械钳子
    graphics.fillStyle(0x9E9E9E);
    graphics.fillTriangle(
      cx - 60 + shake, cy + 5,
      cx - 55 + shake, cy - 5,
      cx - 55 + shake, cy + 15
    );
    graphics.fillTriangle(
      cx + 60 + shake, cy + 5,
      cx + 55 + shake, cy - 5,
      cx + 55 + shake, cy + 15
    );

    // 机械腿
    graphics.fillStyle(0x424242);
    graphics.fillRect(cx - 25 + shake, cy + 38, 15, 25);
    graphics.fillRect(cx + 10 + shake, cy + 38, 15, 25);

    // 脚
    graphics.fillStyle(0x616161);
    graphics.fillRoundedRect(cx - 30 + shake, cy + 58, 25, 10, 3);
    graphics.fillRoundedRect(cx + 5 + shake, cy + 58, 25, 10, 3);

    // 警告灯
    const lightColor = frame % 2 === 0 ? 0xFF0000 : 0x880000;
    graphics.fillStyle(lightColor);
    graphics.fillCircle(cx - 20 + shake, cy - 25, 5);
    graphics.fillCircle(cx + 20 + shake, cy - 25, 5);
  }

  /**
   * 创建所有动画
   */
  createAnimations(): void {
    // 玩家待机动画
    this.scene.anims.create({
      key: 'player-idle',
      frames: [
        { key: 'player-idle-0' },
        { key: 'player-idle-1' }
      ],
      frameRate: 4,
      repeat: -1
    });

    // 玩家行走动画
    this.scene.anims.create({
      key: 'player-walk',
      frames: [
        { key: 'player-walk-0' },
        { key: 'player-walk-1' },
        { key: 'player-walk-2' },
        { key: 'player-walk-3' },
        { key: 'player-walk-4' },
        { key: 'player-walk-5' }
      ],
      frameRate: 12,
      repeat: -1
    });

    // 玩家跳跃动画
    this.scene.anims.create({
      key: 'player-jump',
      frames: [
        { key: 'player-jump-0' },
        { key: 'player-jump-1' },
        { key: 'player-jump-2' }
      ],
      frameRate: 8,
      repeat: 0
    });

    // 玩家攻击动画
    this.scene.anims.create({
      key: 'player-attack',
      frames: [
        { key: 'player-attack-0' },
        { key: 'player-attack-1' },
        { key: 'player-attack-2' },
        { key: 'player-attack-3' }
      ],
      frameRate: 16,
      repeat: 0
    });

    // 敌人动画
    this.scene.anims.create({
      key: 'enemy-idle',
      frames: [
        { key: 'enemy-0' },
        { key: 'enemy-1' },
        { key: 'enemy-2' },
        { key: 'enemy-3' }
      ],
      frameRate: 6,
      repeat: -1
    });

    // Boss动画
    this.scene.anims.create({
      key: 'boss-idle',
      frames: [
        { key: 'boss-0' },
        { key: 'boss-1' },
        { key: 'boss-2' },
        { key: 'boss-3' }
      ],
      frameRate: 4,
      repeat: -1
    });
  }
}
