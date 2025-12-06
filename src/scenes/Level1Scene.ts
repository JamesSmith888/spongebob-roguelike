import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y, PLAYER_SPEED, PLAYER_JUMP_FORCE } from '../data/constants';

export class Level1Scene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private enemies!: Phaser.Physics.Arcade.Group;
  private healthText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private playerHealth = 100;
  private currentWave = 1;

  constructor() {
    super({ key: 'Level1Scene' });
  }

  create() {
    // 背景
    this.add.rectangle(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH, CANVAS_HEIGHT, 0x87CEEB);
    
    // 地面
    const ground = this.add.rectangle(CANVAS_WIDTH / 2, GROUND_Y, CANVAS_WIDTH, 50, 0x8B4513);
    this.physics.add.existing(ground, true);

    // 创建玩家（暂时用矩形代替）
    this.player = this.physics.add.sprite(100, GROUND_Y - 50, '');
    this.player.setDisplaySize(30, 40);
    const playerGraphics = this.add.graphics();
    playerGraphics.fillStyle(0xFFFF00, 1);
    playerGraphics.fillRect(this.player.x - 15, this.player.y - 20, 30, 40);
    
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, ground);

    // 输入控制
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.input.keyboard!.on('keydown-X', () => this.attack());

    // 创建敌人组
    this.enemies = this.physics.add.group();
    
    // 碰撞检测
    this.physics.add.overlap(this.player, this.enemies, this.hitEnemy as any, undefined, this);

    // UI
    this.healthText = this.add.text(10, 10, 'HP: 100', {
      font: '20px Arial',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    });

    this.waveText = this.add.text(CANVAS_WIDTH - 10, 10, '波次: 1/3', {
      font: '20px Arial',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    }).setOrigin(1, 0);

    // 生成第一波敌人
    this.spawnWave();

    // 提示文字
    const hint = this.add.text(CANVAS_WIDTH / 2, 50, '痞老板入侵蟹堡王！', {
      font: 'bold 32px Arial',
      color: '#FF0000',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.time.delayedCall(3000, () => hint.destroy());
  }

  update() {
    // 玩家移动
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-PLAYER_SPEED);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(PLAYER_SPEED);
    } else {
      this.player.setVelocityX(0);
    }

    // 跳跃
    if (Phaser.Input.Keyboard.JustDown(this.cursors.space!) && this.player.body!.touching.down) {
      this.player.setVelocityY(PLAYER_JUMP_FORCE);
    }

    // 更新UI
    this.healthText.setText(`HP: ${this.playerHealth}`);

    // 检查是否清空敌人
    if (this.enemies.countActive(true) === 0 && this.currentWave < 3) {
      this.nextWave();
    } else if (this.enemies.countActive(true) === 0 && this.currentWave >= 3) {
      this.victory();
    }
  }

  private spawnWave() {
    const enemyCount = [3, 5, 7][this.currentWave - 1];
    
    for (let i = 0; i < enemyCount; i++) {
      this.time.delayedCall(i * 1000, () => {
        const enemy = this.enemies.create(
          Phaser.Math.Between(500, CANVAS_WIDTH - 50),
          GROUND_Y - 50,
          ''
        );
        enemy.setDisplaySize(25, 35);
        enemy.setTint(0x00FF00);
        enemy.setVelocityX(-50);
        enemy.setBounce(0.5);
        enemy.setCollideWorldBounds(true);
        
        // 简单AI：左右移动
        this.time.addEvent({
          delay: 2000,
          callback: () => {
            if (enemy.active) {
              enemy.setVelocityX(-enemy.body!.velocity.x);
            }
          },
          loop: true
        });
      });
    }
  }

  private nextWave() {
    this.currentWave++;
    this.waveText.setText(`波次: ${this.currentWave}/3`);
    
    const waveText = this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 
      `第 ${this.currentWave} 波！`, {
      font: 'bold 48px Arial',
      color: '#FFFF00',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.time.delayedCall(2000, () => {
      waveText.destroy();
      this.spawnWave();
    });
  }

  private attack() {
    // 简单的攻击效果
    const attackRange = this.add.circle(
      this.player.x + (this.player.flipX ? -30 : 30),
      this.player.y,
      20,
      0xFF0000,
      0.5
    );

    // 检测攻击范围内的敌人
    this.enemies.children.each((enemy: any) => {
      const distance = Phaser.Math.Distance.Between(
        attackRange.x, attackRange.y,
        enemy.x, enemy.y
      );

      if (distance < 30) {
        enemy.destroy();
      }
    });

    this.time.delayedCall(100, () => attackRange.destroy());
  }

  private hitEnemy(player: any, enemy: any) {
    // 玩家受伤
    this.playerHealth -= 10;
    
    if (this.playerHealth <= 0) {
      this.gameOver();
    }
  }

  private victory() {
    const victoryText = this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 
      '胜利！', {
      font: 'bold 64px Arial',
      color: '#00FF00',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5);

    this.time.delayedCall(3000, () => {
      this.scene.start('MenuScene');
    });
  }

  private gameOver() {
    const gameOverText = this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 
      'Game Over', {
      font: 'bold 64px Arial',
      color: '#FF0000',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5);

    this.time.delayedCall(3000, () => {
      this.scene.start('MenuScene');
    });
  }
}
