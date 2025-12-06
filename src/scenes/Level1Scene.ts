import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y, PLAYER_SPEED, PLAYER_JUMP_FORCE } from '../data/constants';
import { VirtualController } from '../ui/VirtualController';
import { GameHUD } from '../ui/GameHUD';
import { UpgradePanel, UpgradePool } from '../ui/UpgradePanel';
import type { UpgradeOption } from '../ui/UpgradePanel';
import { EquipmentManager } from '../ui/EquipmentPanel';
import { generateRandomEquipment } from '../data/Equipment';
import type { Equipment } from '../data/Equipment';

/**
 * 敌人类型定义
 */
interface Enemy extends Phaser.Physics.Arcade.Sprite {
  health: number;
  maxHealth: number;
  damage: number;
  speed: number;
  isBoss: boolean;
}

/**
 * 掉落物类型
 */
interface Loot extends Phaser.Physics.Arcade.Sprite {
  lootType: 'coin' | 'health' | 'equipment';
  value: number;
  equipment?: Equipment;
  nameLabel?: Phaser.GameObjects.Text;
  glowEffect?: Phaser.GameObjects.Graphics;
}

/**
 * 门/传送点类型
 */
interface ExitDoor extends Phaser.GameObjects.Container {
  isActive: boolean;
}

export class Level1Scene extends Phaser.Scene {
  // 游戏对象
  private player!: Phaser.Physics.Arcade.Sprite;
  private ground!: Phaser.GameObjects.Rectangle;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private enemies!: Phaser.Physics.Arcade.Group;
  private loots!: Phaser.Physics.Arcade.Group;
  private bullets!: Phaser.Physics.Arcade.Group;
  
  // 输入控制
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private virtualController!: VirtualController;
  private attackKey!: Phaser.Input.Keyboard.Key;
  
  // UI
  private hud!: GameHUD;
  private upgradePanel!: UpgradePanel;
  private upgradePool!: UpgradePool;
  private equipmentManager!: EquipmentManager;
  private equipmentKey!: Phaser.Input.Keyboard.Key;
  
  // 玩家状态
  private playerHealth = 100;
  private playerMaxHealth = 100;
  private isAttacking = false;
  private attackCooldown = false;
  private invincible = false;
  private combo = 0;
  private comboTimer?: Phaser.Time.TimerEvent;
  private gold = 0;
  private autoAttackTimer?: Phaser.Time.TimerEvent;
  private autoAttackInterval = 800; // 毫秒
  
  // 房间/波次状态
  private currentRoom = 1;
  private currentWave = 1;
  private totalWaves = 3;
  private enemiesRemaining = 0;
  private isRoomCleared = false;
  private isPaused = false;
  
  // 强化加成
  private speedBonus = 0;
  private attackBonus = 0;
  private attackRangeBonus = 0;
  private critChance = 0;
  private autoAimRange = 200;
  
  // 门/传送点
  private exitDoor?: ExitDoor;
  
  // 角色等级系统
  private playerLevel = 1;
  private playerExp = 0;
  private expToNextLevel = 100;
  private totalKills = 0;

  constructor() {
    super({ key: 'Level1Scene' });
  }

  create() {
    // 加载持久化数据
    this.loadPlayerData();
    
    // 创建背景
    this.createBackground();
    
    // 创建地面
    this.createGround();
    
    // 创建平台
    this.createPlatforms();
    
    // 创建玩家
    this.createPlayer();
    
    // 创建敌人组
    this.enemies = this.physics.add.group();
    this.loots = this.physics.add.group();
    this.bullets = this.physics.add.group();
    
    // 设置碰撞
    this.setupCollisions();
    
    // 输入控制
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.attackKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    
    // 虚拟控制器
    this.virtualController = new VirtualController(this);
    
    // 初始化UI
    this.hud = new GameHUD(this);
    this.upgradePanel = new UpgradePanel(this);
    this.upgradePool = new UpgradePool();
    this.equipmentManager = new EquipmentManager(this);
    
    // 更新HUD显示（应用已加载的数据）
    this.hud.setLevel(this.playerLevel, this.playerExp, this.expToNextLevel);
    this.hud.setGold(this.gold);
    this.hud.setHealth(this.playerHealth, this.playerMaxHealth);
    
    // 监听装备界面打开事件
    this.events.on('openEquipment', () => {
      this.toggleEquipmentPanel();
    });
    
    // 装备界面快捷键 (E键)
    this.equipmentKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    
    // 开始第一个房间
    this.startRoom();
    
    // 房间入场动画
    this.showRoomIntro();
    
    // 摄像机效果
    this.cameras.main.fadeIn(500);
  }

  update() {
    // 检查装备界面快捷键（E键）- 即使暂停也可以打开
    if (Phaser.Input.Keyboard.JustDown(this.equipmentKey)) {
      this.toggleEquipmentPanel();
    }
    
    if (this.isPaused) return;
    
    // 检查是否接近门
    if (this.exitDoor && this.exitDoor.isActive) {
      this.checkDoorInteraction();
    }
    
    // 更新掉落物的名称标签位置
    this.updateLootLabels();
    
    // 检查虚拟控制器攻击
    if (this.virtualController.consumeAttack()) {
      this.attack();
      // 重置自动攻击计时器
      if (this.autoAttackTimer) {
        this.autoAttackTimer.destroy();
      }
      this.startAutoAttack();
    }
    
    // 键盘攻击
    if (Phaser.Input.Keyboard.JustDown(this.attackKey)) {
      this.attack();
      // 重置自动攻击计时器
      if (this.autoAttackTimer) {
        this.autoAttackTimer.destroy();
      }
      this.startAutoAttack();
    }
    
    // 玩家移动
    this.handlePlayerMovement();
    
    // 更新敌人AI
    this.updateEnemies();
    
    // 检查房间状态
    this.checkRoomStatus();
  }

  // ========== 创建方法 ==========

  private createBackground(): void {
    // 深海渐变背景
    const bg = this.add.graphics();
    
    for (let y = 0; y < CANVAS_HEIGHT; y++) {
      const ratio = y / CANVAS_HEIGHT;
      const r = Math.floor(15 + ratio * 15);
      const g = Math.floor(30 + ratio * 30);
      const b = Math.floor(50 + ratio * 60);
      bg.fillStyle(Phaser.Display.Color.GetColor(r, g, b));
      bg.fillRect(0, y, CANVAS_WIDTH, 1);
    }

    // 背景装饰 - 比奇堡建筑剪影
    this.drawBuildingSilhouette(100, GROUND_Y, 60, 80);
    this.drawBuildingSilhouette(300, GROUND_Y, 40, 60);
    this.drawBuildingSilhouette(600, GROUND_Y, 70, 100);
    this.drawBuildingSilhouette(750, GROUND_Y, 50, 70);

    // 水下光效
    const lightRays = this.add.graphics();
    lightRays.fillStyle(0xFFFFFF, 0.03);
    for (let i = 0; i < 5; i++) {
      const x = 100 + i * 180;
      lightRays.fillTriangle(x, 0, x - 60, CANVAS_HEIGHT, x + 60, CANVAS_HEIGHT);
    }
  }

  private drawBuildingSilhouette(x: number, baseY: number, width: number, height: number): void {
    const silhouette = this.add.graphics();
    silhouette.fillStyle(0x0a1525, 0.6);
    silhouette.fillRect(x - width / 2, baseY - height, width, height);
    
    // 窗户
    silhouette.fillStyle(0x2a4a6a, 0.5);
    const windowSize = 8;
    const windowGap = 15;
    for (let wy = baseY - height + 15; wy < baseY - 10; wy += windowGap) {
      for (let wx = x - width / 2 + 10; wx < x + width / 2 - 10; wx += windowGap) {
        silhouette.fillRect(wx, wy, windowSize, windowSize);
      }
    }
  }

  private createGround(): void {
    // 主地面
    const groundGraphics = this.add.graphics();
    
    // 地面主体
    groundGraphics.fillStyle(0x8B7355);
    groundGraphics.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
    
    // 地面顶部边缘
    groundGraphics.fillStyle(0x9C8565);
    groundGraphics.fillRect(0, GROUND_Y, CANVAS_WIDTH, 8);
    
    // 地面纹理
    groundGraphics.fillStyle(0x7A6245);
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * CANVAS_WIDTH;
      const y = GROUND_Y + 10 + Math.random() * 30;
      groundGraphics.fillEllipse(x, y, 15 + Math.random() * 20, 5);
    }

    // 物理地面
    this.ground = this.add.rectangle(CANVAS_WIDTH / 2, GROUND_Y + 25, CANVAS_WIDTH, 50, 0x000000, 0);
    this.physics.add.existing(this.ground, true);
  }

  /**
   * 创建平台供角色跳跃
   */
  private createPlatforms(): void {
    this.platforms = this.physics.add.staticGroup();
    
    // 平台配置 - 位置和尺寸
    const platformConfigs = [
      { x: 150, y: GROUND_Y - 100, width: 120, height: 20 },
      { x: 400, y: GROUND_Y - 150, width: 150, height: 20 },
      { x: 650, y: GROUND_Y - 100, width: 120, height: 20 },
      { x: 280, y: GROUND_Y - 250, width: 100, height: 20 },
      { x: 550, y: GROUND_Y - 280, width: 130, height: 20 }
    ];
    
    platformConfigs.forEach(config => {
      this.createPlatformVisual(config.x, config.y, config.width, config.height);
    });
  }

  /**
   * 创建单个平台的视觉和物理
   */
  private createPlatformVisual(x: number, y: number, width: number, height: number): void {
    // 平台视觉
    const platformGfx = this.add.graphics();
    
    // 平台主体 - 珊瑚/岩石风格
    platformGfx.fillStyle(0x7A5C3E);
    platformGfx.fillRoundedRect(x - width / 2, y - height / 2, width, height, 8);
    
    // 平台顶部高光
    platformGfx.fillStyle(0x9C7A5C);
    platformGfx.fillRoundedRect(x - width / 2 + 4, y - height / 2, width - 8, height / 3, 4);
    
    // 平台边缘
    platformGfx.lineStyle(2, 0x5A4A32);
    platformGfx.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 8);
    
    // 装饰 - 小海草/珊瑚
    if (Math.random() > 0.5) {
      platformGfx.fillStyle(0x2E7D32);
      platformGfx.fillTriangle(
        x - width / 4, y - height / 2,
        x - width / 4 - 8, y - height / 2 - 20,
        x - width / 4 + 8, y - height / 2 - 15
      );
    }
    if (Math.random() > 0.5) {
      platformGfx.fillStyle(0xFF7043);
      platformGfx.fillCircle(x + width / 3, y - height / 2 - 5, 6);
    }
    
    // 物理碰撞体
    const platform = this.add.rectangle(x, y, width, height, 0x000000, 0);
    this.physics.add.existing(platform, true);
    this.platforms.add(platform);
  }

  private createPlayer(): void {
    // 创建玩家精灵
    this.player = this.physics.add.sprite(100, GROUND_Y - 80, 'player-idle-0');
    this.player.setDisplaySize(100, 100);
    this.player.setBodySize(60, 80);
    this.player.setOffset(34, 24);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);
    
    // 播放待机动画
    this.player.play('player-idle');
    
    // 添加阴影
    const shadow = this.add.ellipse(this.player.x, GROUND_Y - 5, 50, 15, 0x000000, 0.3);
    shadow.setDepth(5);
    
    // 每帧更新阴影位置
    this.events.on('update', () => {
      shadow.setPosition(this.player.x, GROUND_Y - 5);
      shadow.setAlpha(this.player.body!.touching.down ? 0.3 : 0.1);
    });
  }

  private setupCollisions(): void {
    // 玩家与地面碰撞
    this.physics.add.collider(this.player, this.ground);
    
    // 玩家与平台碰撞
    this.physics.add.collider(this.player, this.platforms);
    
    // 敌人与地面碰撞
    this.physics.add.collider(this.enemies, this.ground);
    
    // 敌人与平台碰撞
    this.physics.add.collider(this.enemies, this.platforms);
    
    // 掉落物与地面碰撞
    this.physics.add.collider(this.loots, this.ground);
    
    // 掉落物与平台碰撞
    this.physics.add.collider(this.loots, this.platforms);
    
    // 玩家与敌人碰撞（受伤）
    this.physics.add.overlap(
      this.player,
      this.enemies,
      (player, enemy) => this.onPlayerHitEnemy(player as Phaser.Physics.Arcade.Sprite, enemy as Enemy),
      undefined,
      this
    );
    
    // 玩家与掉落物碰撞
    this.physics.add.overlap(
      this.player,
      this.loots,
      (_player, loot) => this.collectLoot(loot as Loot),
      undefined,
      this
    );
    
    // 子弹与敌人碰撞
    this.physics.add.overlap(
      this.bullets,
      this.enemies,
      (bullet, enemy) => this.onBulletHitEnemy(bullet as Phaser.Physics.Arcade.Sprite, enemy as Enemy),
      undefined,
      this
    );
  }

  // ========== 玩家控制 ==========

  private handlePlayerMovement(): void {
    const leftPressed = this.cursors.left.isDown || this.virtualController.isLeftDown;
    const rightPressed = this.cursors.right.isDown || this.virtualController.isRightDown;
    
    const moveSpeed = PLAYER_SPEED + this.speedBonus;
    
    if (leftPressed) {
      this.player.setVelocityX(-moveSpeed);
      this.player.setFlipX(true);
      if (!this.isAttacking && this.player.body!.touching.down) {
        this.player.play('player-walk', true);
      }
    } else if (rightPressed) {
      this.player.setVelocityX(moveSpeed);
      this.player.setFlipX(false);
      if (!this.isAttacking && this.player.body!.touching.down) {
        this.player.play('player-walk', true);
      }
    } else {
      this.player.setVelocityX(0);
      if (!this.isAttacking && this.player.body!.touching.down) {
        this.player.play('player-idle', true);
      }
    }

    // 跳跃
    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.space!) || this.virtualController.consumeJump();
    if (jumpPressed && this.player.body!.touching.down) {
      this.player.setVelocityY(PLAYER_JUMP_FORCE);
      if (!this.isAttacking) {
        this.player.play('player-jump', true);
      }
      
      // 跳跃特效
      this.createJumpEffect();
    }

    // 空中动画
    if (!this.player.body!.touching.down && !this.isAttacking) {
      this.player.play('player-jump', true);
    }
  }

  private createJumpEffect(): void {
    const dust = this.add.graphics();
    dust.fillStyle(0xCCBBAA, 0.6);
    
    for (let i = 0; i < 5; i++) {
      const x = this.player.x + (Math.random() - 0.5) * 40;
      const y = GROUND_Y - 5;
      dust.fillCircle(x, y, 3 + Math.random() * 5);
    }

    this.tweens.add({
      targets: dust,
      alpha: 0,
      duration: 300,
      onComplete: () => dust.destroy()
    });
  }

  private startAutoAttack(): void {
    // 每隔一定时间自动攻击最近的敌人
    this.autoAttackTimer = this.time.addEvent({
      delay: this.autoAttackInterval,
      callback: () => {
        if (!this.isPaused && !this.isAttacking && this.enemies.countActive(true) > 0) {
          this.autoAimAttack();
        }
      },
      loop: true
    });
  }

  /**
   * 自动瞄准攻击 - 自动锁定最近的敌人
   */
  private autoAimAttack(): void {
    if (this.isAttacking || this.attackCooldown) return;
    
    // 找到最近的敌人
    const target = this.findNearestEnemy();
    if (!target) return;
    
    this.isAttacking = true;
    this.attackCooldown = true;
    
    // 播放攻击动画
    this.player.play('player-attack', true);
    
    // 自动朝向敌人
    this.player.setFlipX(target.x < this.player.x);
    
    // 发射子弹/泡泡弹
    this.fireBulletsAtTarget(target);
    
    // 同时进行近战攻击（范围内的敌人）
    this.meleeAttack();
    
    // 攻击结束
    this.time.delayedCall(200, () => {
      this.isAttacking = false;
    });
    
    // 攻击冷却（根据强化降低）
    const stats = this.upgradePool.getStats();
    const cooldown = Math.max(150, 300 - stats.attackSpeed * 2);
    this.time.delayedCall(cooldown, () => {
      this.attackCooldown = false;
    });
  }

  /**
   * 找到最近的敌人
   */
  private findNearestEnemy(): Enemy | null {
    let nearest: Enemy | null = null;
    let nearestDist = Infinity;
    
    this.enemies.children.each((enemyObj: Phaser.GameObjects.GameObject) => {
      const enemy = enemyObj as Enemy;
      if (!enemy.active) return true;
      
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      if (dist < nearestDist && dist < this.autoAimRange + this.attackRangeBonus) {
        nearest = enemy;
        nearestDist = dist;
      }
      return true;
    }, this);
    
    return nearest;
  }

  /**
   * 发射子弹到目标
   */
  private fireBulletsAtTarget(target: Enemy): void {
    const stats = this.upgradePool.getStats();
    const bulletCount = stats.bulletCount || 1;
    
    // 计算角度
    const baseAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, target.x, target.y);
    
    // 多发子弹时扇形分布
    const spreadAngle = bulletCount > 1 ? Math.PI / 8 : 0;
    const startAngle = baseAngle - spreadAngle * (bulletCount - 1) / 2;
    
    for (let i = 0; i < bulletCount; i++) {
      const angle = startAngle + i * spreadAngle;
      this.fireSingleBullet(angle, stats);
    }
    
    // 攻击音效震动
    this.cameras.main.shake(30, 0.003);
  }

  /**
   * 发射单发子弹
   */
  private fireSingleBullet(angle: number, stats: any): void {
    const bullet = this.bullets.create(this.player.x, this.player.y, 'bullet') as Phaser.Physics.Arcade.Sprite & { pierceCount: number; damage: number };
    
    if (!bullet) return;
    
    bullet.setDisplaySize(16, 16);
    bullet.setTint(0x4FC3F7);
    
    // 子弹属性
    bullet.pierceCount = stats.bulletPierce || 0;
    bullet.damage = 20 + this.attackBonus + (stats.bulletDamage || 0);
    
    // 子弹速度
    const speed = 400;
    bullet.setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );
    
    // 子弹拖尾特效
    this.createBulletTrail(bullet);
    
    // 2秒后销毁
    this.time.delayedCall(2000, () => {
      if (bullet.active) {
        bullet.destroy();
      }
    });
  }

  /**
   * 子弹拖尾特效
   */
  private createBulletTrail(bullet: Phaser.Physics.Arcade.Sprite): void {
    const trail = this.add.graphics();
    
    const updateTrail = () => {
      if (!bullet.active) {
        trail.destroy();
        return;
      }
      
      trail.clear();
      trail.fillStyle(0x4FC3F7, 0.3);
      trail.fillCircle(bullet.x, bullet.y, 10);
    };
    
    this.time.addEvent({
      delay: 50,
      callback: updateTrail,
      repeat: 20
    });
  }

  /**
   * 子弹命中敌人
   */
  private onBulletHitEnemy(bullet: Phaser.Physics.Arcade.Sprite & { pierceCount?: number; damage?: number }, enemy: Enemy): void {
    const damage = bullet.damage || 20;
    
    // 暴击判定
    const isCrit = Math.random() * 100 < this.critChance;
    const finalDamage = isCrit ? damage * 2 : damage;
    
    enemy.health -= finalDamage;
    
    // 受击特效
    this.createHitEffect(enemy.x, enemy.y, isCrit);
    this.showDamageNumber(enemy.x, enemy.y - 30, finalDamage, isCrit);
    
    // 击退
    const knockback = bullet.body!.velocity.x > 0 ? 80 : -80;
    enemy.setVelocityX(knockback);
    
    // 敌人闪白
    enemy.setTint(0xFFFFFF);
    this.time.delayedCall(100, () => {
      if (enemy.active) {
        enemy.clearTint();
      }
    });
    
    // 检查穿透
    if (bullet.pierceCount && bullet.pierceCount > 0) {
      bullet.pierceCount--;
    } else {
      // 子弹销毁特效
      this.createBulletHitEffect(bullet.x, bullet.y);
      bullet.destroy();
    }
    
    // 检查死亡
    if (enemy.health <= 0) {
      this.killEnemy(enemy);
    }
    
    // 更新连击
    this.updateCombo(1);
  }

  /**
   * 子弹命中特效
   */
  private createBulletHitEffect(x: number, y: number): void {
    const effect = this.add.graphics();
    effect.fillStyle(0x4FC3F7, 0.8);
    effect.fillCircle(x, y, 15);
    
    this.tweens.add({
      targets: effect,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 150,
      onComplete: () => effect.destroy()
    });
  }

  /**
   * 近战攻击（保留原有逻辑）
   */
  private meleeAttack(): void {
    const attackRange = 50 + this.attackRangeBonus;
    const attackX = this.player.x + (this.player.flipX ? -40 : 40);
    const attackY = this.player.y;
    
    // 攻击特效
    this.createAttackEffect(attackX, attackY, this.player.flipX);
    
    // 检测命中敌人
    let hitCount = 0;
    this.enemies.children.each((enemyObj: Phaser.GameObjects.GameObject) => {
      const enemy = enemyObj as Enemy;
      if (!enemy.active) return true;
      
      const distance = Phaser.Math.Distance.Between(attackX, attackY, enemy.x, enemy.y);
      
      if (distance < attackRange) {
        this.hitEnemy(enemy);
        hitCount++;
      }
      return true;
    }, this);
    
    if (hitCount > 0) {
      this.updateCombo(hitCount);
    }
  }

  private attack(): void {
    if (this.isAttacking || this.attackCooldown) return;
    
    // 尝试自动瞄准攻击
    const target = this.findNearestEnemy();
    if (target) {
      this.autoAimAttack();
    } else {
      // 没有敌人时进行普通近战
      this.isAttacking = true;
      this.attackCooldown = true;
      
      this.player.play('player-attack', true);
      this.meleeAttack();
      
      this.time.delayedCall(200, () => {
        this.isAttacking = false;
      });
      
      this.time.delayedCall(300, () => {
        this.attackCooldown = false;
      });
    }
  }

  private createAttackEffect(x: number, y: number, flipX: boolean): void {
    // 计算攻击方向偏移
    const offsetX = flipX ? -30 : 30;
    const effectX = x + offsetX;
    
    // 创建挥砍容器
    const slashContainer = this.add.container(effectX, y);
    slashContainer.setDepth(15);
    
    // 主挥砍弧线 - 锅铲风格
    const slash = this.add.graphics();
    const slashColor = 0xFFEB3B;  // 海绵宝宝黄色
    
    // 绘制多层挥砍效果
    for (let i = 0; i < 3; i++) {
      const alpha = 1 - i * 0.3;
      const width = 6 - i * 1.5;
      slash.lineStyle(width, slashColor, alpha);
      
      const radius = 35 + i * 8;
      const startAngle = flipX ? Math.PI * 0.6 : -Math.PI * 0.1;
      const endAngle = flipX ? Math.PI * 1.4 : Math.PI * 0.6;
      
      slash.beginPath();
      slash.arc(0, 0, radius, startAngle, endAngle, false);
      slash.strokePath();
    }
    slashContainer.add(slash);
    
    // 锅铲图标
    const spatulaIcon = this.add.text(flipX ? -20 : 20, -10, '🍳', {
      fontSize: '20px'
    }).setOrigin(0.5).setRotation(flipX ? -0.5 : 0.5);
    slashContainer.add(spatulaIcon);
    
    // 冲击波效果
    const wave = this.add.graphics();
    wave.fillStyle(0xFFFFFF, 0.4);
    wave.fillEllipse(flipX ? -25 : 25, 0, 30, 50);
    slashContainer.add(wave);
    
    // 星星粒子
    for (let i = 0; i < 4; i++) {
      const angle = (flipX ? Math.PI : 0) + (Math.random() - 0.5) * 0.8;
      const dist = 20 + Math.random() * 30;
      const star = this.add.text(
        Math.cos(angle) * dist,
        Math.sin(angle) * dist,
        '✨',
        { fontSize: '12px' }
      ).setOrigin(0.5).setAlpha(0.8);
      slashContainer.add(star);
      
      // 星星飞散动画
      this.tweens.add({
        targets: star,
        x: Math.cos(angle) * (dist + 20),
        y: Math.sin(angle) * (dist + 10),
        alpha: 0,
        duration: 200
      });
    }
    
    // 整体动画
    slashContainer.setScale(0.5);
    slashContainer.setAlpha(1);
    
    this.tweens.add({
      targets: slashContainer,
      scaleX: 1.2,
      scaleY: 1.2,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => slashContainer.destroy()
    });
    
    // 轻微震动
    this.cameras.main.shake(40, 0.003);
  }

  private hitEnemy(enemy: Enemy): void {
    // 计算伤害
    let damage = 20 + this.attackBonus;
    
    // 暴击判定
    const isCrit = Math.random() * 100 < this.critChance;
    if (isCrit) {
      damage *= 2;
    }
    
    enemy.health -= damage;
    
    // 受击特效
    this.createHitEffect(enemy.x, enemy.y, isCrit);
    
    // 显示伤害数字
    this.showDamageNumber(enemy.x, enemy.y - 30, damage, isCrit);
    
    // 击退
    const knockback = this.player.flipX ? -150 : 150;
    enemy.setVelocityX(knockback);
    
    // 敌人闪白
    enemy.setTint(0xFFFFFF);
    this.time.delayedCall(100, () => {
      if (enemy.active) {
        enemy.clearTint();
      }
    });
    
    // 检查死亡
    if (enemy.health <= 0) {
      this.killEnemy(enemy);
    }
  }

  private createHitEffect(x: number, y: number, isCrit: boolean): void {
    const particles = this.add.graphics();
    const color = isCrit ? 0xFFD700 : 0xFFFFFF;
    
    for (let i = 0; i < (isCrit ? 10 : 5); i++) {
      const px = x + (Math.random() - 0.5) * 40;
      const py = y + (Math.random() - 0.5) * 40;
      particles.fillStyle(color, 1);
      particles.fillCircle(px, py, 3 + Math.random() * 5);
    }
    
    this.tweens.add({
      targets: particles,
      alpha: 0,
      duration: 300,
      onComplete: () => particles.destroy()
    });
  }

  private showDamageNumber(x: number, y: number, damage: number, isCrit: boolean): void {
    const text = this.add.text(x, y, `${isCrit ? '暴击! ' : ''}${damage}`, {
      fontFamily: 'Arial',
      fontSize: isCrit ? '28px' : '22px',
      color: isCrit ? '#FFD700' : '#FF6600',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(100);
    
    this.tweens.add({
      targets: text,
      y: y - 60,
      alpha: 0,
      scale: isCrit ? 1.5 : 1,
      duration: 800,
      ease: 'Power2',
      onComplete: () => text.destroy()
    });
  }

  private killEnemy(enemy: Enemy): void {
    this.enemiesRemaining--;
    this.totalKills++;
    
    // 死亡特效
    this.createDeathEffect(enemy.x, enemy.y, enemy.isBoss);
    
    // 掉落物
    this.spawnLoot(enemy.x, enemy.y, enemy.isBoss);
    
    // 销毁敌人
    enemy.destroy();
    
    // 击杀奖励
    this.gold += enemy.isBoss ? 50 : 10;
    this.hud.setGold(this.gold);
    
    // 获取经验
    const expGain = enemy.isBoss ? 50 : 10 + this.currentRoom * 2;
    this.gainExp(expGain);
  }

  private createDeathEffect(x: number, y: number, isBoss: boolean): void {
    const particles = this.add.graphics();
    const particleCount = isBoss ? 30 : 15;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const distance = 20 + Math.random() * 30;
      const px = x + Math.cos(angle) * distance;
      const py = y + Math.sin(angle) * distance;
      
      particles.fillStyle(isBoss ? 0x8B0000 : 0x2E7D32, 1);
      particles.fillCircle(px, py, 5 + Math.random() * 10);
    }
    
    this.tweens.add({
      targets: particles,
      alpha: 0,
      scale: 1.5,
      duration: 500,
      onComplete: () => particles.destroy()
    });
    
    // 震屏
    this.cameras.main.shake(isBoss ? 300 : 100, isBoss ? 0.02 : 0.01);
  }

  private spawnLoot(x: number, y: number, isBoss: boolean): void {
    const lootCount = isBoss ? 5 : (Math.random() < 0.5 ? 1 : 0);
    
    for (let i = 0; i < lootCount; i++) {
      const lootType = Math.random() < 0.3 ? 'health' : 'coin';
      const loot = this.loots.create(x + (Math.random() - 0.5) * 30, y - 20, lootType === 'coin' ? 'coin' : 'health-potion') as Loot;
      
      loot.lootType = lootType;
      loot.value = lootType === 'coin' ? (isBoss ? 20 : 5) : 20;
      loot.setDisplaySize(24, 24);
      loot.setBounce(0.5);
      loot.setVelocity((Math.random() - 0.5) * 100, -200);
      
      // 5秒后消失
      this.time.delayedCall(5000, () => {
        if (loot.active) {
          this.tweens.add({
            targets: loot,
            alpha: 0,
            duration: 500,
            onComplete: () => loot.destroy()
          });
        }
      });
    }
    
    // 装备掉落（Boss 100%掉落，普通敌人8%概率）
    const equipDropChance = isBoss ? 1.0 : 0.08;
    if (Math.random() < equipDropChance) {
      this.spawnEquipmentLoot(x, y, isBoss);
    }
  }

  private spawnEquipmentLoot(x: number, y: number, isBoss: boolean): void {
    // Boss 掉落更高稀有度装备
    const equipment = generateRandomEquipment(isBoss ? this.currentRoom + 2 : this.currentRoom);
    
    // 创建装备掉落物（使用方形占位图，后面会被替换为彩色方块）
    const loot = this.loots.create(x + (Math.random() - 0.5) * 40, y - 30, 'equipment-loot') as Loot;
    loot.lootType = 'equipment';
    loot.value = 0;
    loot.equipment = equipment;
    loot.setDisplaySize(28, 28);
    loot.setBounce(0.6);
    loot.setVelocity((Math.random() - 0.5) * 80, -250);
    loot.setDepth(8);
    
    // 根据稀有度设置颜色
    const rarityColors: Record<string, number> = {
      common: 0xAAAAAA,
      rare: 0x4CAF50,
      epic: 0x2196F3,
      legendary: 0xFF9800
    };
    const rarityTextColors: Record<string, string> = {
      common: '#AAAAAA',
      rare: '#4CAF50',
      epic: '#2196F3',
      legendary: '#FF9800'
    };
    
    loot.setTint(rarityColors[equipment.rarity] || 0xAAAAAA);
    
    // 创建名称标签
    const nameLabel = this.add.text(loot.x, loot.y - 25, equipment.name, {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: rarityTextColors[equipment.rarity] || '#FFFFFF',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(9);
    loot.nameLabel = nameLabel;
    
    // 稀有度高的装备特效
    if (equipment.rarity === 'epic' || equipment.rarity === 'legendary') {
      // 创建发光光环
      const glowEffect = this.add.graphics();
      glowEffect.setDepth(7);
      const glowColor = rarityColors[equipment.rarity];
      
      // 绘制光环
      glowEffect.fillStyle(glowColor, 0.3);
      glowEffect.fillCircle(0, 0, 25);
      glowEffect.setPosition(loot.x, loot.y);
      loot.glowEffect = glowEffect;
      
      // 光环呼吸动画
      this.tweens.add({
        targets: glowEffect,
        alpha: { from: 0.3, to: 0.7 },
        scaleX: { from: 1, to: 1.3 },
        scaleY: { from: 1, to: 1.3 },
        yoyo: true,
        repeat: -1,
        duration: 600
      });
      
      // 掉落时的爆发特效
      this.createLootDropEffect(x, y, equipment.rarity);
    }
    
    // 传说装备额外闪烁效果
    if (equipment.rarity === 'legendary') {
      this.tweens.add({
        targets: loot,
        alpha: { from: 1, to: 0.7 },
        yoyo: true,
        repeat: -1,
        duration: 400
      });
      
      // 名称闪烁
      this.tweens.add({
        targets: nameLabel,
        alpha: { from: 1, to: 0.6 },
        yoyo: true,
        repeat: -1,
        duration: 300
      });
    }
    
    // 10秒后消失
    this.time.delayedCall(10000, () => {
      if (loot.active) {
        // 先销毁标签和光效
        if (loot.nameLabel) loot.nameLabel.destroy();
        if (loot.glowEffect) loot.glowEffect.destroy();
        
        this.tweens.add({
          targets: loot,
          alpha: 0,
          duration: 500,
          onComplete: () => loot.destroy()
        });
      }
    });
  }

  /**
   * 装备掉落爆发特效
   */
  private createLootDropEffect(x: number, y: number, rarity: string): void {
    const colors: Record<string, number> = {
      epic: 0x2196F3,
      legendary: 0xFF9800
    };
    const particleCount = rarity === 'legendary' ? 15 : 8;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const distance = 30 + Math.random() * 20;
      
      const particle = this.add.graphics();
      particle.fillStyle(colors[rarity] || 0xFFFFFF, 1);
      particle.fillCircle(0, 0, 4 + Math.random() * 4);
      particle.setPosition(x, y);
      particle.setDepth(10);
      
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scaleX: 0.5,
        scaleY: 0.5,
        duration: 500 + Math.random() * 300,
        ease: 'Power2',
        onComplete: () => particle.destroy()
      });
    }
    
    // 中心光爆
    const burst = this.add.graphics();
    burst.fillStyle(colors[rarity] || 0xFFFFFF, 0.8);
    burst.fillCircle(0, 0, 20);
    burst.setPosition(x, y);
    burst.setDepth(10);
    
    this.tweens.add({
      targets: burst,
      scaleX: 3,
      scaleY: 3,
      alpha: 0,
      duration: 400,
      ease: 'Power2',
      onComplete: () => burst.destroy()
    });
  }

  private collectLoot(loot: Loot): void {
    // 先销毁标签和光效
    if (loot.nameLabel) loot.nameLabel.destroy();
    if (loot.glowEffect) loot.glowEffect.destroy();
    
    if (loot.lootType === 'coin') {
      this.gold += loot.value;
      this.hud.setGold(this.gold);
    } else if (loot.lootType === 'health') {
      this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + loot.value);
      this.hud.setHealth(this.playerHealth, this.playerMaxHealth);
      this.hud.showHeal(this.player.x, this.player.y - 50, loot.value);
    } else if (loot.lootType === 'equipment' && loot.equipment) {
      // 拾取装备 - 添加到背包或自动装备
      this.collectEquipment(loot.equipment);
    }
    
    // 收集特效
    const collect = this.add.graphics();
    const collectColors: Record<string, number> = {
      coin: 0xFFD700,
      health: 0x4CAF50,
      equipment: 0x9932CC
    };
    collect.fillStyle(collectColors[loot.lootType] || 0xFFFFFF, 1);
    collect.fillCircle(loot.x, loot.y, 15);
    
    this.tweens.add({
      targets: collect,
      alpha: 0,
      scale: 2,
      duration: 200,
      onComplete: () => collect.destroy()
    });
    
    loot.destroy();
  }

  private collectEquipment(equipment: Equipment): void {
    // 尝试装备
    const equipped = this.equipmentManager.tryAutoEquip(equipment);
    
    // 显示获取提示
    const rarityColors: Record<string, string> = {
      common: '#AAAAAA',
      rare: '#4169E1',
      epic: '#9932CC',
      legendary: '#FFD700'
    };
    const rarityNames: Record<string, string> = {
      common: '普通',
      rare: '稀有',
      epic: '史诗',
      legendary: '传说'
    };
    
    const message = equipped 
      ? `装备了 [${rarityNames[equipment.rarity]}] ${equipment.name}!`
      : `获得 [${rarityNames[equipment.rarity]}] ${equipment.name}!`;
    
    this.showEquipmentPickup(equipment, message, rarityColors[equipment.rarity]);
    
    // 如果已装备，应用属性
    if (equipped) {
      this.applyEquipmentStats();
    }
  }

  private showEquipmentPickup(_equipment: Equipment, message: string, color: string): void {
    const container = this.add.container(CANVAS_WIDTH / 2, 150);
    container.setDepth(200);
    
    // 背景
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.8);
    bg.fillRoundedRect(-180, -30, 360, 60, 10);
    bg.lineStyle(2, parseInt(color.replace('#', ''), 16), 1);
    bg.strokeRoundedRect(-180, -30, 360, 60, 10);
    container.add(bg);
    
    // 文字
    const text = this.add.text(0, 0, message, {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: color,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    container.add(text);
    
    // 动画
    container.setAlpha(0);
    container.setY(180);
    
    this.tweens.add({
      targets: container,
      alpha: 1,
      y: 150,
      duration: 300,
      ease: 'Power2'
    });
    
    this.time.delayedCall(2000, () => {
      this.tweens.add({
        targets: container,
        alpha: 0,
        y: 120,
        duration: 300,
        onComplete: () => container.destroy()
      });
    });
  }

  private updateCombo(hits: number): void {
    this.combo += hits;
    
    // 重置连击计时器
    if (this.comboTimer) {
      this.comboTimer.destroy();
    }
    
    this.comboTimer = this.time.delayedCall(2000, () => {
      this.combo = 0;
    });
    
    // 显示连击
    this.hud.showCombo(this.combo);
  }

  // ========== 敌人系统 ==========

  private updateEnemies(): void {
    this.enemies.children.each((enemyObj: Phaser.GameObjects.GameObject) => {
      const enemy = enemyObj as Enemy;
      if (!enemy.active) return true;
      
      // 简单AI：朝玩家移动
      const dx = this.player.x - enemy.x;
      
      if (Math.abs(dx) > 50) {
        enemy.setVelocityX(dx > 0 ? enemy.speed : -enemy.speed);
        enemy.setFlipX(dx < 0);
      } else {
        enemy.setVelocityX(0);
      }
      
      return true;
    }, this);
  }

  private spawnEnemy(x: number, isBoss: boolean = false): void {
    const textureKey = isBoss ? 'boss-0' : 'enemy-0';
    const enemy = this.enemies.create(x, GROUND_Y - 100, textureKey) as Enemy;
    
    // 设置属性
    enemy.isBoss = isBoss;
    enemy.health = isBoss ? 150 : 30 + (this.currentRoom - 1) * 10;
    enemy.maxHealth = enemy.health;
    enemy.damage = isBoss ? 30 : 10 + (this.currentRoom - 1) * 5;
    enemy.speed = isBoss ? 40 : 60 + (this.currentRoom - 1) * 10;
    
    // 设置显示
    const size = isBoss ? 120 : 50;
    enemy.setDisplaySize(size, size);
    enemy.setBodySize(size * 0.8, size * 0.9);
    enemy.setBounce(0.2);
    enemy.setCollideWorldBounds(true);
    
    // 播放动画
    enemy.play(isBoss ? 'boss-idle' : 'enemy-idle');
    
    // 生成特效
    this.createSpawnEffect(x, GROUND_Y - 50);
    
    // 注意：enemiesRemaining 已在 spawnWave 中预先设置
  }

  private createSpawnEffect(x: number, y: number): void {
    const effect = this.add.graphics();
    effect.fillStyle(0x2E7D32, 0.8);
    effect.fillCircle(x, y, 30);
    
    this.tweens.add({
      targets: effect,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 300,
      onComplete: () => effect.destroy()
    });
  }

  private onPlayerHitEnemy(_player: Phaser.Physics.Arcade.Sprite, enemy: Enemy): void {
    if (this.invincible) return;
    
    // 玩家受伤
    this.playerHealth -= enemy.damage;
    this.hud.setHealth(this.playerHealth, this.playerMaxHealth);
    this.hud.showDamage(this.player.x, this.player.y - 50, enemy.damage);
    
    // 无敌帧
    this.invincible = true;
    this.player.setAlpha(0.5);
    
    // 击退玩家
    const knockback = enemy.x < this.player.x ? 200 : -200;
    this.player.setVelocityX(knockback);
    
    // 闪烁效果
    this.tweens.add({
      targets: this.player,
      alpha: { from: 0.3, to: 1 },
      duration: 100,
      repeat: 5,
      onComplete: () => {
        this.invincible = false;
        this.player.setAlpha(1);
      }
    });
    
    // 震屏
    this.cameras.main.shake(100, 0.015);
    
    // 检查死亡
    if (this.playerHealth <= 0) {
      this.gameOver();
    }
  }

  // ========== 房间系统 ==========

  private startRoom(): void {
    this.isRoomCleared = false;
    this.currentWave = 1;
    this.hud.setRoom(this.currentRoom);
    this.hud.setWave(this.currentWave, this.totalWaves);
    
    // 启动自动攻击
    this.startAutoAttack();
    
    // 生成第一波敌人
    this.time.delayedCall(1500, () => {
      this.spawnWave();
    });
  }

  private spawnWave(): void {
    const baseEnemyCount = [3, 5, 7][this.currentWave - 1];
    const enemyCount = baseEnemyCount + (this.currentRoom - 1) * 2;
    
    // 只有在第6个房间之后的最后一波才有Boss
    const hasBoss = this.currentWave === this.totalWaves && this.currentRoom >= 6;
    
    // 预先设置敌人数量，防止checkRoomStatus过早触发
    this.enemiesRemaining = enemyCount + (hasBoss ? 1 : 0);
    
    // 生成普通敌人
    for (let i = 0; i < enemyCount; i++) {
      this.time.delayedCall(i * 500, () => {
        const x = Phaser.Math.Between(CANVAS_WIDTH / 2, CANVAS_WIDTH - 100);
        this.spawnEnemy(x, false);
      });
    }
    
    // 生成Boss
    if (hasBoss) {
      this.time.delayedCall(enemyCount * 500 + 1000, () => {
        this.showBossWarning();
        this.time.delayedCall(2000, () => {
          this.spawnEnemy(CANVAS_WIDTH - 150, true);
        });
      });
    }
    
    // 波次提示
    this.showWaveText();
  }

  private showWaveText(): void {
    const text = this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 100, 
      `第 ${this.currentWave} 波`, {
      fontFamily: 'Arial',
      fontSize: '48px',
      color: '#FFFFFF',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5).setAlpha(0).setDepth(200);
    
    this.tweens.add({
      targets: text,
      alpha: 1,
      scale: { from: 0.5, to: 1 },
      duration: 300,
      ease: 'Back.out',
      onComplete: () => {
        this.time.delayedCall(1000, () => {
          this.tweens.add({
            targets: text,
            alpha: 0,
            y: text.y - 50,
            duration: 300,
            onComplete: () => text.destroy()
          });
        });
      }
    });
  }

  private showBossWarning(): void {
    // 警告背景
    const warning = this.add.container(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    warning.setDepth(200);
    
    const bg = this.add.rectangle(0, 0, CANVAS_WIDTH, 80, 0x8B0000, 0.8);
    warning.add(bg);
    
    const text = this.add.text(0, 0, '⚠️ BOSS来袭 - 痞老板机甲 ⚠️', {
      fontFamily: 'Arial',
      fontSize: '32px',
      color: '#FFFFFF',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    warning.add(text);
    
    warning.setAlpha(0);
    
    // 闪烁动画
    this.tweens.add({
      targets: warning,
      alpha: { from: 0, to: 1 },
      duration: 200,
      repeat: 3,
      yoyo: true,
      onComplete: () => {
        this.tweens.add({
          targets: warning,
          alpha: 0,
          duration: 500,
          onComplete: () => warning.destroy()
        });
      }
    });
    
    // 震屏
    this.cameras.main.shake(500, 0.02);
  }

  private checkRoomStatus(): void {
    if (this.isRoomCleared) return;
    
    // 确保所有敌人都已死亡
    if (this.enemiesRemaining <= 0 && this.enemies.countActive(true) === 0) {
      if (this.currentWave < this.totalWaves) {
        // 下一波
        this.currentWave++;
        this.hud.setWave(this.currentWave, this.totalWaves);
        this.time.delayedCall(1500, () => {
          this.spawnWave();
        });
      } else {
        // 所有波次完成，房间清空，激活门
        this.isRoomCleared = true;
        this.roomCleared();
      }
    }
  }

  private roomCleared(): void {
    // 显示过关文字
    const clearText = this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, '🎉 房间清空！', {
      fontFamily: 'Arial',
      fontSize: '48px',
      color: '#4CAF50',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(200);
    
    this.tweens.add({
      targets: clearText,
      scale: { from: 0.5, to: 1.2 },
      duration: 500,
      ease: 'Back.out'
    });
    
    // 激活出口门
    this.activateExitDoor();
    
    // 1.5秒后消失文字，等待玩家进入门
    this.time.delayedCall(1500, () => {
      clearText.destroy();
    });
    
    // 显示提示文字
    this.hud.showMessage('进入右侧的门前往下一关!', '#4FC3F7');
  }

  private showUpgradeSelection(): void {
    this.isPaused = true;
    this.player.setVelocity(0, 0);
    
    // 暂停物理世界，敌人不再移动/攻击
    this.physics.world.pause();
    
    // 停止自动攻击
    if (this.autoAttackTimer) {
      this.autoAttackTimer.destroy();
      this.autoAttackTimer = undefined;
    }
    
    // 获取随机强化选项
    const options = this.upgradePool.getRandomUpgrades(3);
    
    // 显示选择面板
    this.upgradePanel.show(options, (selected: UpgradeOption) => {
      this.applyUpgrade(selected);
      this.isPaused = false;
      // 恢复物理世界
      this.physics.world.resume();
      // 重启自动攻击
      this.startAutoAttack();
      // 开始新房间
      this.showRoomIntro();
      this.startRoom();
    });
  }

  private applyUpgrade(option: UpgradeOption): void {
    // 应用强化效果（效果已在UpgradePool中定义）
    const stats = this.upgradePool.getStats();
    
    this.attackBonus = stats.attackBonus;
    this.speedBonus = stats.speedBonus;
    this.playerMaxHealth = stats.maxHealth;
    this.critChance = stats.critChance;
    this.attackRangeBonus = stats.attackRange;
    this.autoAimRange = stats.autoAimRange;
    
    // 同步到装备管理器
    this.equipmentManager.setUpgradeStats({
      attack: stats.attackBonus,
      health: stats.maxHealth - 100,
      speed: stats.speedBonus,
      crit: stats.critChance,
      bulletCount: stats.bulletCount
    });
    
    // 更新UI
    this.playerHealth = Math.min(this.playerHealth, this.playerMaxHealth);
    this.hud.setHealth(this.playerHealth, this.playerMaxHealth);
    
    // 显示获得强化提示
    this.showUpgradeToast(option);
  }

  private showUpgradeToast(option: UpgradeOption): void {
    const toast = this.add.container(CANVAS_WIDTH / 2, 100);
    toast.setDepth(300);
    
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.8);
    bg.fillRoundedRect(-150, -30, 300, 60, 10);
    toast.add(bg);
    
    const text = this.add.text(0, 0, `${option.icon} 获得 ${option.name}!`, {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#FFD700',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    toast.add(text);
    
    toast.setAlpha(0);
    
    this.tweens.add({
      targets: toast,
      alpha: 1,
      y: 80,
      duration: 300,
      ease: 'Power2'
    });
    
    this.time.delayedCall(2000, () => {
      this.tweens.add({
        targets: toast,
        alpha: 0,
        y: 60,
        duration: 300,
        onComplete: () => toast.destroy()
      });
    });
  }

  private goToNextRoom(): void {
    // 重置门
    this.deactivateExitDoor();
    
    // 过渡动画
    this.cameras.main.fadeOut(500);
    
    this.time.delayedCall(500, () => {
      // 清理当前房间
      this.enemies.clear(true, true);
      // 清理掉落物时也清理名称标签
      this.loots.children.each((lootObj: Phaser.GameObjects.GameObject) => {
        const loot = lootObj as Loot;
        if (loot.nameLabel) loot.nameLabel.destroy();
        if (loot.glowEffect) loot.glowEffect.destroy();
        return true;
      }, this);
      this.loots.clear(true, true);
      
      // 重置玩家位置和状态
      this.player.setPosition(100, GROUND_Y - 80);
      this.player.setVelocity(0, 0);
      this.player.setScale(1);
      this.player.setAlpha(1);
      this.isPaused = false;
      
      // 下一个房间
      this.currentRoom++;
      
      // 保存数据
      this.savePlayerData();
      
      // 每3个房间后恢复一些生命
      if (this.currentRoom % 3 === 1) {
        const healAmount = 30;
        this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + healAmount);
        this.hud.setHealth(this.playerHealth, this.playerMaxHealth);
      }
      
      this.cameras.main.fadeIn(500);
      
      // 显示强化选择（第一关以后）
      if (this.currentRoom > 1) {
        this.showUpgradeSelection();
      } else {
        // 开始新房间
        this.showRoomIntro();
        this.startRoom();
      }
    });
  }

  private showRoomIntro(): void {
    const intro = this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 
      `🏠 房间 ${this.currentRoom}`, {
      fontFamily: 'Arial',
      fontSize: '56px',
      color: '#FFFFFF',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5).setDepth(200);
    
    this.tweens.add({
      targets: intro,
      scale: { from: 0.5, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 500,
      ease: 'Back.out',
      onComplete: () => {
        this.time.delayedCall(1000, () => {
          this.tweens.add({
            targets: intro,
            alpha: 0,
            scale: 1.2,
            duration: 300,
            onComplete: () => intro.destroy()
          });
        });
      }
    });
  }

  private gameOver(): void {
    this.isPaused = true;
    this.player.setVelocity(0, 0);
    
    // 游戏结束界面
    this.add.rectangle(
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2,
      CANVAS_WIDTH, CANVAS_HEIGHT,
      0x000000, 0.8
    ).setDepth(300);
    
    const container = this.add.container(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    container.setDepth(301);
    
    const title = this.add.text(0, -80, '💀 游戏结束', {
      fontFamily: 'Arial',
      fontSize: '56px',
      color: '#FF4444',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);
    container.add(title);
    
    const stats = this.add.text(0, 0, 
      `到达房间: ${this.currentRoom}\n击杀敌人: ${this.combo}+\n获得金币: ${this.gold}`, {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#FFFFFF',
      align: 'center'
    }).setOrigin(0.5);
    container.add(stats);
    
    // 重试按钮
    const retryBtn = this.add.container(0, 100);
    
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x4CAF50, 1);
    btnBg.fillRoundedRect(-80, -25, 160, 50, 10);
    retryBtn.add(btnBg);
    
    const btnText = this.add.text(0, 0, '🔄 重新开始', {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: '#FFFFFF',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    retryBtn.add(btnText);
    
    const hitArea = this.add.rectangle(0, 0, 160, 50, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    retryBtn.add(hitArea);
    
    hitArea.on('pointerdown', () => {
      this.cameras.main.fadeOut(500);
      this.time.delayedCall(500, () => {
        this.scene.restart();
      });
    });
    
    container.add(retryBtn);
    
    // 入场动画
    container.setScale(0.5);
    container.setAlpha(0);
    
    this.tweens.add({
      targets: container,
      scale: 1,
      alpha: 1,
      duration: 500,
      ease: 'Back.out'
    });
  }

  // ========== 装备系统 ==========

  private applyEquipmentStats(): void {
    const stats = this.equipmentManager.getTotalStats();
    
    // 应用装备属性加成
    // 攻击力加成
    this.attackBonus = stats.attackBonus || 0;
    
    // 生命值加成
    if (stats.healthBonus) {
      const newMaxHealth = 100 + stats.healthBonus;
      const healthRatio = this.playerHealth / this.playerMaxHealth;
      this.playerMaxHealth = newMaxHealth;
      this.playerHealth = Math.floor(newMaxHealth * healthRatio);
      this.hud.setHealth(this.playerHealth, this.playerMaxHealth);
    }
    
    // 速度加成
    this.speedBonus = stats.speedBonus || 0;
    
    // 暴击率加成
    this.critChance += stats.critBonus || 0;
    
    // 显示装备效果提示
    if (stats.attackBonus || stats.healthBonus || stats.speedBonus || stats.critBonus) {
      this.hud.showMessage('装备属性已更新!');
    }
  }

  // ========== 装备界面切换 ==========

  private toggleEquipmentPanel(): void {
    if (this.equipmentManager.isPanelOpen()) {
      this.equipmentManager.closePanel();
      this.isPaused = false;
      this.physics.world.resume();
      // 重启自动攻击
      if (!this.autoAttackTimer) {
        this.startAutoAttack();
      }
    } else {
      this.isPaused = true;
      this.physics.world.pause();
      // 停止自动攻击
      if (this.autoAttackTimer) {
        this.autoAttackTimer.destroy();
        this.autoAttackTimer = undefined;
      }
      this.equipmentManager.openPanel(() => {
        this.isPaused = false;
        this.physics.world.resume();
        // 更新装备属性
        this.applyEquipmentStats();
        // 重启自动攻击
        this.startAutoAttack();
      });
    }
  }

  // ========== 门/传送点系统 ==========

  private createExitDoor(): void {
    // 在右侧创建传送门
    const doorX = CANVAS_WIDTH - 80;
    const doorY = GROUND_Y - 60;
    
    this.exitDoor = this.add.container(doorX, doorY) as ExitDoor;
    this.exitDoor.setDepth(5);
    this.exitDoor.isActive = false;
    
    // 门框
    const doorFrame = this.add.graphics();
    doorFrame.fillStyle(0x4a3728, 1);
    doorFrame.fillRoundedRect(-35, -70, 70, 100, 5);
    doorFrame.lineStyle(3, 0x2d1f14);
    doorFrame.strokeRoundedRect(-35, -70, 70, 100, 5);
    this.exitDoor.add(doorFrame);
    
    // 门内部（深色）
    const doorInner = this.add.graphics();
    doorInner.fillStyle(0x1a1a2e, 1);
    doorInner.fillRoundedRect(-28, -65, 56, 90, 3);
    this.exitDoor.add(doorInner);
    
    // 发光效果（初始不可见）
    const glow = this.add.graphics();
    glow.fillStyle(0x4FC3F7, 0.3);
    glow.fillCircle(0, -20, 50);
    glow.setAlpha(0);
    glow.setName('glow');
    this.exitDoor.add(glow);
    
    // 箭头提示
    const arrow = this.add.text(0, -90, '⬆️', {
      fontSize: '24px'
    }).setOrigin(0.5);
    arrow.setAlpha(0);
    arrow.setName('arrow');
    this.exitDoor.add(arrow);
    
    // 文字提示
    const hint = this.add.text(0, -115, '进入下一关', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#4FC3F7',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    hint.setAlpha(0);
    hint.setName('hint');
    this.exitDoor.add(hint);
  }

  private activateExitDoor(): void {
    if (!this.exitDoor) {
      this.createExitDoor();
    }
    
    this.exitDoor!.isActive = true;
    
    // 门发光动画
    const glow = this.exitDoor!.getByName('glow') as Phaser.GameObjects.Graphics;
    const arrow = this.exitDoor!.getByName('arrow') as Phaser.GameObjects.Text;
    const hint = this.exitDoor!.getByName('hint') as Phaser.GameObjects.Text;
    
    // 显示发光和提示
    this.tweens.add({
      targets: [glow, arrow, hint],
      alpha: 1,
      duration: 500
    });
    
    // 发光呼吸效果
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.3, to: 0.7 },
      scaleX: { from: 1, to: 1.2 },
      scaleY: { from: 1, to: 1.2 },
      yoyo: true,
      repeat: -1,
      duration: 800
    });
    
    // 箭头上下浮动
    this.tweens.add({
      targets: arrow,
      y: { from: -90, to: -100 },
      yoyo: true,
      repeat: -1,
      duration: 500
    });
  }

  private deactivateExitDoor(): void {
    if (!this.exitDoor) return;
    
    this.exitDoor.isActive = false;
    
    const glow = this.exitDoor.getByName('glow') as Phaser.GameObjects.Graphics;
    const arrow = this.exitDoor.getByName('arrow') as Phaser.GameObjects.Text;
    const hint = this.exitDoor.getByName('hint') as Phaser.GameObjects.Text;
    
    // 隐藏发光和提示
    this.tweens.killTweensOf([glow, arrow]);
    glow?.setAlpha(0);
    arrow?.setAlpha(0);
    hint?.setAlpha(0);
  }

  private checkDoorInteraction(): void {
    if (!this.exitDoor || !this.exitDoor.isActive) return;
    
    const distance = Phaser.Math.Distance.Between(
      this.player.x, this.player.y,
      this.exitDoor.x, this.exitDoor.y
    );
    
    // 玩家进入门的范围
    if (distance < 50) {
      this.enterNextRoom();
    }
  }

  private enterNextRoom(): void {
    if (!this.exitDoor?.isActive) return;
    
    // 禁用门防止重复触发
    this.exitDoor.isActive = false;
    
    // 保存玩家数据
    this.savePlayerData();
    
    // 进入传送动画
    this.player.setVelocity(0, 0);
    this.isPaused = true;
    
    // 玩家缩小进入门
    this.tweens.add({
      targets: this.player,
      x: this.exitDoor.x,
      y: this.exitDoor.y - 30,
      scaleX: 0.3,
      scaleY: 0.3,
      alpha: 0,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        this.goToNextRoom();
      }
    });
    
    // 门发光变强
    const glow = this.exitDoor.getByName('glow') as Phaser.GameObjects.Graphics;
    this.tweens.add({
      targets: glow,
      alpha: 1,
      scaleX: 2,
      scaleY: 2,
      duration: 500
    });
  }

  // ========== 掉落物名称标签 ==========

  private updateLootLabels(): void {
    this.loots.children.each((lootObj: Phaser.GameObjects.GameObject) => {
      const loot = lootObj as Loot;
      if (!loot.active) return true;
      
      // 更新名称标签位置
      if (loot.nameLabel) {
        loot.nameLabel.setPosition(loot.x, loot.y - 25);
      }
      
      // 更新发光效果位置
      if (loot.glowEffect) {
        loot.glowEffect.setPosition(loot.x, loot.y);
      }
      
      return true;
    }, this);
  }

  // ========== 角色数据持久化 ==========

  private loadPlayerData(): void {
    try {
      const savedData = localStorage.getItem('spongebob_player_data');
      if (savedData) {
        const data = JSON.parse(savedData);
        this.playerLevel = data.level || 1;
        this.playerExp = data.exp || 0;
        this.expToNextLevel = this.calculateExpToNextLevel(this.playerLevel);
        this.totalKills = data.totalKills || 0;
        this.gold = data.gold || 0;
        
        // 应用等级加成
        this.applyLevelBonus();
      }
    } catch (e) {
      console.log('No saved data found, starting fresh');
    }
  }

  private savePlayerData(): void {
    try {
      const data = {
        level: this.playerLevel,
        exp: this.playerExp,
        totalKills: this.totalKills,
        gold: this.gold,
        timestamp: Date.now()
      };
      localStorage.setItem('spongebob_player_data', JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save player data:', e);
    }
  }

  private calculateExpToNextLevel(level: number): number {
    return Math.floor(100 * Math.pow(1.5, level - 1));
  }

  private gainExp(amount: number): void {
    this.playerExp += amount;
    
    // 更新HUD
    this.hud.setLevel(this.playerLevel, this.playerExp, this.expToNextLevel);
    
    // 检查升级
    while (this.playerExp >= this.expToNextLevel) {
      this.playerExp -= this.expToNextLevel;
      this.levelUp();
    }
  }

  private levelUp(): void {
    this.playerLevel++;
    this.expToNextLevel = this.calculateExpToNextLevel(this.playerLevel);
    
    // 应用等级加成
    this.applyLevelBonus();
    
    // 更新HUD
    this.hud.setLevel(this.playerLevel, this.playerExp, this.expToNextLevel);
    
    // 升级特效
    this.showLevelUpEffect();
    
    // 保存数据
    this.savePlayerData();
  }

  private applyLevelBonus(): void {
    // 每级增加一些基础属性
    const levelBonus = this.playerLevel - 1;
    this.attackBonus += levelBonus * 2;  // 每级+2攻击
    this.playerMaxHealth = 100 + levelBonus * 10;  // 每级+10生命
    this.critChance = Math.min(50, 5 + levelBonus);  // 每级+1%暴击
  }

  private showLevelUpEffect(): void {
    // 升级光环
    const levelUpContainer = this.add.container(this.player.x, this.player.y);
    levelUpContainer.setDepth(200);
    
    // 光环
    const ring = this.add.graphics();
    ring.lineStyle(4, 0xFFD700, 1);
    ring.strokeCircle(0, 0, 30);
    levelUpContainer.add(ring);
    
    // 文字
    const text = this.add.text(0, -60, `等级提升! Lv.${this.playerLevel}`, {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    levelUpContainer.add(text);
    
    // 动画
    this.tweens.add({
      targets: ring,
      scaleX: 3,
      scaleY: 3,
      alpha: 0,
      duration: 800,
      ease: 'Power2'
    });
    
    this.tweens.add({
      targets: text,
      y: -100,
      alpha: 0,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => levelUpContainer.destroy()
    });
    
    // 恢复满血
    this.playerHealth = this.playerMaxHealth;
    this.hud.setHealth(this.playerHealth, this.playerMaxHealth);
    
    // 震屏
    this.cameras.main.shake(200, 0.01);
  }
}
