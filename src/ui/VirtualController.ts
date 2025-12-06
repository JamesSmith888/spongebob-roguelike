import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../data/constants';

/**
 * 虚拟控制器 - 用于移动端触控操作
 * 包含左右移动按钮、跳跃按钮和攻击按钮
 */
export class VirtualController {
  private scene: Phaser.Scene;
  private leftBtn!: Phaser.GameObjects.Arc;
  private rightBtn!: Phaser.GameObjects.Arc;
  private jumpBtn!: Phaser.GameObjects.Arc;
  private attackBtn!: Phaser.GameObjects.Arc;
  
  // 控制状态
  public isLeftDown = false;
  public isRightDown = false;
  public isJumpDown = false;
  public isAttackDown = false;
  
  // 是否显示虚拟控制器
  private showControls: boolean;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.showControls = this.shouldShowControls();
    
    if (this.showControls) {
      this.createButtons();
    }
  }

  /**
   * 检查是否应该显示虚拟控制器
   */
  private shouldShowControls(): boolean {
    // 读取用户设置
    const controlMode = localStorage.getItem('spongebob_control_mode') || 'auto';
    
    if (controlMode === 'mobile') {
      return true;
    } else if (controlMode === 'pc') {
      return false;
    } else {
      // 自动检测
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
  }

  private createButtons() {
    const btnAlpha = 0.6;
    const btnRadius = 35;
    const padding = 20;
    
    // 左移按钮
    this.leftBtn = this.scene.add.circle(
      padding + btnRadius,
      CANVAS_HEIGHT - padding - btnRadius,
      btnRadius,
      0x4444FF,
      btnAlpha
    ).setInteractive().setScrollFactor(0).setDepth(1000);
    
    // 添加左箭头
    this.scene.add.text(
      padding + btnRadius,
      CANVAS_HEIGHT - padding - btnRadius,
      '◀',
      { font: '24px Arial', color: '#ffffff' }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(1001);

    // 右移按钮
    this.rightBtn = this.scene.add.circle(
      padding + btnRadius * 3 + 20,
      CANVAS_HEIGHT - padding - btnRadius,
      btnRadius,
      0x4444FF,
      btnAlpha
    ).setInteractive().setScrollFactor(0).setDepth(1000);
    
    // 添加右箭头
    this.scene.add.text(
      padding + btnRadius * 3 + 20,
      CANVAS_HEIGHT - padding - btnRadius,
      '▶',
      { font: '24px Arial', color: '#ffffff' }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(1001);

    // 跳跃按钮
    this.jumpBtn = this.scene.add.circle(
      CANVAS_WIDTH - padding - btnRadius * 3 - 20,
      CANVAS_HEIGHT - padding - btnRadius,
      btnRadius,
      0x44FF44,
      btnAlpha
    ).setInteractive().setScrollFactor(0).setDepth(1000);
    
    this.scene.add.text(
      CANVAS_WIDTH - padding - btnRadius * 3 - 20,
      CANVAS_HEIGHT - padding - btnRadius,
      '跳',
      { font: '20px Arial', color: '#ffffff' }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(1001);

    // 攻击按钮
    this.attackBtn = this.scene.add.circle(
      CANVAS_WIDTH - padding - btnRadius,
      CANVAS_HEIGHT - padding - btnRadius,
      btnRadius,
      0xFF4444,
      btnAlpha
    ).setInteractive().setScrollFactor(0).setDepth(1000);
    
    this.scene.add.text(
      CANVAS_WIDTH - padding - btnRadius,
      CANVAS_HEIGHT - padding - btnRadius,
      '攻',
      { font: '20px Arial', color: '#ffffff' }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(1001);

    // 绑定触控事件
    this.bindButtonEvents(this.leftBtn, 'left');
    this.bindButtonEvents(this.rightBtn, 'right');
    this.bindButtonEvents(this.jumpBtn, 'jump');
    this.bindButtonEvents(this.attackBtn, 'attack');
  }

  private bindButtonEvents(btn: Phaser.GameObjects.Arc, type: string) {
    btn.on('pointerdown', () => {
      btn.setAlpha(1);
      switch (type) {
        case 'left':
          this.isLeftDown = true;
          break;
        case 'right':
          this.isRightDown = true;
          break;
        case 'jump':
          this.isJumpDown = true;
          break;
        case 'attack':
          this.isAttackDown = true;
          break;
      }
    });

    btn.on('pointerup', () => {
      btn.setAlpha(0.6);
      switch (type) {
        case 'left':
          this.isLeftDown = false;
          break;
        case 'right':
          this.isRightDown = false;
          break;
        case 'jump':
          this.isJumpDown = false;
          break;
        case 'attack':
          this.isAttackDown = false;
          break;
      }
    });

    btn.on('pointerout', () => {
      btn.setAlpha(0.6);
      switch (type) {
        case 'left':
          this.isLeftDown = false;
          break;
        case 'right':
          this.isRightDown = false;
          break;
        case 'jump':
          this.isJumpDown = false;
          break;
        case 'attack':
          this.isAttackDown = false;
          break;
      }
    });
  }

  // 检查是否需要显示虚拟控制器
  public isEnabled(): boolean {
    return this.showControls;
  }

  // 消费跳跃输入（跳跃只触发一次）
  public consumeJump(): boolean {
    if (this.isJumpDown) {
      this.isJumpDown = false;
      return true;
    }
    return false;
  }

  // 消费攻击输入（攻击只触发一次）
  public consumeAttack(): boolean {
    if (this.isAttackDown) {
      this.isAttackDown = false;
      return true;
    }
    return false;
  }
}
