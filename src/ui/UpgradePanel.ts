import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../data/constants';

/**
 * 强化升级选项
 */
export interface UpgradeOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  effect: () => void;
}

/**
 * 强化选择面板 - Roguelike 核心UI
 */
export class UpgradePanel {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private onSelectCallback?: (option: UpgradeOption) => void;

  // 稀有度颜色
  private rarityColors = {
    common: { bg: 0x4a4a4a, border: 0x888888, text: '#CCCCCC' },
    rare: { bg: 0x1a3a5c, border: 0x4FC3F7, text: '#4FC3F7' },
    epic: { bg: 0x4a1a5c, border: 0xAB47BC, text: '#AB47BC' },
    legendary: { bg: 0x5c4a1a, border: 0xFFD700, text: '#FFD700' }
  };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * 显示强化选择面板
   */
  show(options: UpgradeOption[], onSelect: (option: UpgradeOption) => void): void {
    this.onSelectCallback = onSelect;
    this.container = this.scene.add.container(0, 0);
    this.container.setDepth(200);

    // 全屏半透明遮罩
    const overlay = this.scene.add.rectangle(
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2,
      CANVAS_WIDTH,
      CANVAS_HEIGHT,
      0x000000,
      0.8
    );
    this.container.add(overlay);

    // 标题背景
    const titleBg = this.scene.add.graphics();
    titleBg.fillStyle(0x1a1a1a, 0.95);
    titleBg.fillRoundedRect(CANVAS_WIDTH / 2 - 200, 60, 400, 60, 15);
    titleBg.lineStyle(3, 0xFFD700);
    titleBg.strokeRoundedRect(CANVAS_WIDTH / 2 - 200, 60, 400, 60, 15);
    this.container.add(titleBg);

    // 标题
    const title = this.scene.add.text(CANVAS_WIDTH / 2, 90, '🎁 选择一个强化', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#FFD700',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.container.add(title);

    // 副标题
    const subtitle = this.scene.add.text(CANVAS_WIDTH / 2, 140, '战胜了这一波敌人！获得强化奖励', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#888888'
    }).setOrigin(0.5);
    this.container.add(subtitle);

    // 创建选项卡片
    this.createOptionCards(options);
  }

  private createOptionCards(options: UpgradeOption[]): void {
    const cardWidth = 200;
    const cardHeight = 280;
    const gap = 30;
    const totalWidth = options.length * cardWidth + (options.length - 1) * gap;
    const startX = (CANVAS_WIDTH - totalWidth) / 2 + cardWidth / 2;
    const y = CANVAS_HEIGHT / 2 + 40;

    options.forEach((option, index) => {
      const x = startX + index * (cardWidth + gap);
      this.createCard(x, y, cardWidth, cardHeight, option, index);
    });
  }

  private createCard(
    x: number,
    y: number,
    width: number,
    height: number,
    option: UpgradeOption,
    index: number
  ): void {
    const colors = this.rarityColors[option.rarity];
    
    // 卡片容器
    const cardContainer = this.scene.add.container(x, y);
    cardContainer.setAlpha(0);
    cardContainer.setScale(0.8);
    this.container.add(cardContainer);

    // 卡片背景
    const cardBg = this.scene.add.graphics();
    cardBg.fillStyle(colors.bg, 0.95);
    cardBg.fillRoundedRect(-width / 2, -height / 2, width, height, 15);
    cardBg.lineStyle(3, colors.border);
    cardBg.strokeRoundedRect(-width / 2, -height / 2, width, height, 15);
    cardContainer.add(cardBg);

    // 稀有度标签
    const rarityLabel = this.scene.add.text(0, -height / 2 + 20, this.getRarityLabel(option.rarity), {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: colors.text,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    cardContainer.add(rarityLabel);

    // 图标
    const icon = this.scene.add.text(0, -height / 2 + 80, option.icon, {
      fontSize: '64px'
    }).setOrigin(0.5);
    cardContainer.add(icon);

    // 名称
    const name = this.scene.add.text(0, -height / 2 + 140, option.name, {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#FFFFFF',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    cardContainer.add(name);

    // 描述
    const desc = this.scene.add.text(0, -height / 2 + 180, option.description, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#CCCCCC',
      align: 'center',
      wordWrap: { width: width - 30 }
    }).setOrigin(0.5, 0);
    cardContainer.add(desc);

    // 选择按钮
    const btnY = height / 2 - 35;
    const btnBg = this.scene.add.graphics();
    btnBg.fillStyle(0x4CAF50, 1);
    btnBg.fillRoundedRect(-70, btnY - 15, 140, 30, 8);
    cardContainer.add(btnBg);

    const btnText = this.scene.add.text(0, btnY, '选 择', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#FFFFFF',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    cardContainer.add(btnText);

    // 交互区域
    const hitArea = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    cardContainer.add(hitArea);

    // 悬停效果
    hitArea.on('pointerover', () => {
      this.scene.tweens.add({
        targets: cardContainer,
        scale: 1.05,
        duration: 150,
        ease: 'Power2'
      });
      cardBg.clear();
      cardBg.fillStyle(colors.bg, 1);
      cardBg.fillRoundedRect(-width / 2, -height / 2, width, height, 15);
      cardBg.lineStyle(4, colors.border);
      cardBg.strokeRoundedRect(-width / 2, -height / 2, width, height, 15);
    });

    hitArea.on('pointerout', () => {
      this.scene.tweens.add({
        targets: cardContainer,
        scale: 1,
        duration: 150,
        ease: 'Power2'
      });
      cardBg.clear();
      cardBg.fillStyle(colors.bg, 0.95);
      cardBg.fillRoundedRect(-width / 2, -height / 2, width, height, 15);
      cardBg.lineStyle(3, colors.border);
      cardBg.strokeRoundedRect(-width / 2, -height / 2, width, height, 15);
    });

    // 点击选择
    hitArea.on('pointerdown', () => {
      this.selectOption(option);
    });

    // 入场动画
    this.scene.tweens.add({
      targets: cardContainer,
      alpha: 1,
      scale: 1,
      duration: 400,
      delay: index * 100,
      ease: 'Back.out'
    });
  }

  private getRarityLabel(rarity: string): string {
    const labels: Record<string, string> = {
      common: '★ 普通',
      rare: '★★ 稀有',
      epic: '★★★ 史诗',
      legendary: '★★★★ 传说'
    };
    return labels[rarity] || '普通';
  }

  private selectOption(option: UpgradeOption): void {
    // 执行效果
    option.effect();

    // 关闭动画
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      scale: 0.9,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        this.container.destroy();
        if (this.onSelectCallback) {
          this.onSelectCallback(option);
        }
      }
    });
  }

  /**
   * 销毁面板
   */
  destroy(): void {
    if (this.container) {
      this.container.destroy();
    }
  }
}

/**
 * 强化池 - 生成随机强化选项
 */
export class UpgradePool {
  private playerStats: {
    attackBonus: number;
    speedBonus: number;
    maxHealth: number;
    critChance: number;
    attackRange: number;
    bulletCount: number;      // 子弹数量
    bulletDamage: number;     // 子弹伤害加成
    bulletPierce: number;     // 子弹穿透
    autoAimRange: number;     // 自动瞄准范围
    attackSpeed: number;      // 攻击速度加成（百分比）
  };

  // 强化叠加次数追踪（用于联动效果）
  private upgradeStacks: Record<string, number> = {};

  constructor() {
    this.playerStats = {
      attackBonus: 0,
      speedBonus: 0,
      maxHealth: 100,
      critChance: 0,
      attackRange: 0,
      bulletCount: 1,
      bulletDamage: 0,
      bulletPierce: 0,
      autoAimRange: 150,
      attackSpeed: 0
    };
  }

  getStats() {
    return { ...this.playerStats };
  }

  /**
   * 获取强化叠加次数
   */
  getUpgradeStack(upgradeId: string): number {
    return this.upgradeStacks[upgradeId] || 0;
  }

  /**
   * 增加强化叠加次数
   */
  private addUpgradeStack(upgradeId: string): void {
    this.upgradeStacks[upgradeId] = (this.upgradeStacks[upgradeId] || 0) + 1;
  }

  /**
   * 获取随机强化选项
   */
  getRandomUpgrades(count: number = 3): UpgradeOption[] {
    const bulletStackCount = this.getUpgradeStack('bullet_plus');
    
    const allUpgrades: UpgradeOption[] = [
      // ========== 普通强化 ==========
      {
        id: 'attack_up_1',
        name: '力量提升',
        description: '攻击力提升 15%',
        icon: '⚔️',
        rarity: 'common',
        effect: () => { this.playerStats.attackBonus += 15; }
      },
      {
        id: 'speed_up_1',
        name: '迅捷步伐',
        description: '移动速度提升 20%',
        icon: '👟',
        rarity: 'common',
        effect: () => { this.playerStats.speedBonus += 40; }
      },
      {
        id: 'health_up_1',
        name: '强健体魄',
        description: '最大生命值 +30',
        icon: '❤️',
        rarity: 'common',
        effect: () => { this.playerStats.maxHealth += 30; }
      },
      {
        id: 'range_up_1',
        name: '锅铲延伸',
        description: '攻击范围 +25%',
        icon: '🍳',
        rarity: 'common',
        effect: () => { this.playerStats.attackRange += 10; }
      },

      // ========== 稀有强化 ==========
      {
        id: 'attack_up_2',
        name: '蟹堡秘方',
        description: '攻击力大幅提升 30%',
        icon: '🍔',
        rarity: 'rare',
        effect: () => { this.playerStats.attackBonus += 30; }
      },
      {
        id: 'crit_up_1',
        name: '精准打击',
        description: '暴击率 +15%',
        icon: '🎯',
        rarity: 'rare',
        effect: () => { this.playerStats.critChance += 15; }
      },
      {
        id: 'combo_speed',
        name: '疾风连击',
        description: '攻击速度提升，连击更快',
        icon: '💨',
        rarity: 'rare',
        effect: () => { this.playerStats.speedBonus += 30; this.playerStats.attackBonus += 10; }
      },
      // ★★★ 子弹系统强化 - 可叠加 ★★★
      {
        id: 'bullet_plus',
        name: bulletStackCount > 0 ? `泡泡弹幕 Lv.${bulletStackCount + 1}` : '泡泡弹幕',
        description: bulletStackCount > 0 
          ? `子弹再 +1 (当前: ${this.playerStats.bulletCount}发 → ${this.playerStats.bulletCount + 1}发)`
          : '发射时额外多1发子弹！可叠加',
        icon: '🫧',
        rarity: 'rare',
        effect: () => { 
          this.playerStats.bulletCount += 1;
          this.addUpgradeStack('bullet_plus');
        }
      },
      {
        id: 'bullet_damage',
        name: '强力弹头',
        description: '子弹伤害 +20%',
        icon: '💥',
        rarity: 'rare',
        effect: () => { this.playerStats.bulletDamage += 20; }
      },
      {
        id: 'auto_aim_range',
        name: '鹰眼系统',
        description: '自动瞄准范围 +50%',
        icon: '👁️',
        rarity: 'rare',
        effect: () => { this.playerStats.autoAimRange += 75; }
      },

      // ========== 史诗强化 ==========
      {
        id: 'berserk',
        name: '狂暴模式',
        description: '攻击力 +50%，但最大生命值 -20',
        icon: '😡',
        rarity: 'epic',
        effect: () => { 
          this.playerStats.attackBonus += 50; 
          this.playerStats.maxHealth = Math.max(50, this.playerStats.maxHealth - 20);
        }
      },
      {
        id: 'tank',
        name: '蟹老板护盾',
        description: '最大生命值 +80，但移动速度 -10%',
        icon: '🛡️',
        rarity: 'epic',
        effect: () => { 
          this.playerStats.maxHealth += 80; 
          this.playerStats.speedBonus -= 20;
        }
      },
      {
        id: 'assassin',
        name: '刺客本能',
        description: '暴击率 +30%，暴击伤害翻倍',
        icon: '🗡️',
        rarity: 'epic',
        effect: () => { this.playerStats.critChance += 30; }
      },
      {
        id: 'bullet_pierce',
        name: '穿透弹',
        description: '子弹可穿透2个敌人',
        icon: '🔱',
        rarity: 'epic',
        effect: () => { this.playerStats.bulletPierce += 2; }
      },
      {
        id: 'attack_speed_up',
        name: '机关枪模式',
        description: '攻击速度 +40%',
        icon: '⚡',
        rarity: 'epic',
        effect: () => { this.playerStats.attackSpeed += 40; }
      },

      // ========== 传说强化 ==========
      {
        id: 'legendary_spatula',
        name: '黄金锅铲',
        description: '攻击力 +100%，攻击范围 +50%',
        icon: '✨',
        rarity: 'legendary',
        effect: () => { 
          this.playerStats.attackBonus += 100; 
          this.playerStats.attackRange += 25;
        }
      },
      {
        id: 'immortal',
        name: '不灭海绵',
        description: '最大生命值 +150，每次击杀回复5HP',
        icon: '💫',
        rarity: 'legendary',
        effect: () => { this.playerStats.maxHealth += 150; }
      },
      {
        id: 'bullet_storm',
        name: '泡泡风暴',
        description: '子弹 +3，但伤害 -20%',
        icon: '🌀',
        rarity: 'legendary',
        effect: () => { 
          this.playerStats.bulletCount += 3;
          this.playerStats.bulletDamage -= 20;
          this.addUpgradeStack('bullet_plus');
          this.addUpgradeStack('bullet_plus');
          this.addUpgradeStack('bullet_plus');
        }
      },
      {
        id: 'perfect_aim',
        name: '完美瞄准',
        description: '自动瞄准范围 +100%，攻击速度 +25%',
        icon: '🔭',
        rarity: 'legendary',
        effect: () => { 
          this.playerStats.autoAimRange += 150;
          this.playerStats.attackSpeed += 25;
        }
      }
    ];

    // 根据权重随机选择
    const weights = {
      common: 50,
      rare: 30,
      epic: 15,
      legendary: 5
    };

    // 随机打乱并选择
    const shuffled = allUpgrades.sort(() => {
      const rand = Math.random() * 100;
      const rarity = allUpgrades[0]?.rarity || 'common';
      return rand < weights[rarity] ? -1 : 1;
    });

    // 确保至少有一个稀有或以上
    const result: UpgradeOption[] = [];
    const byRarity = {
      common: shuffled.filter(u => u.rarity === 'common'),
      rare: shuffled.filter(u => u.rarity === 'rare'),
      epic: shuffled.filter(u => u.rarity === 'epic'),
      legendary: shuffled.filter(u => u.rarity === 'legendary')
    };

    // 加入一个有保底的稀有度
    const guaranteeRoll = Math.random() * 100;
    if (guaranteeRoll < 5 && byRarity.legendary.length > 0) {
      result.push(byRarity.legendary[0]);
    } else if (guaranteeRoll < 20 && byRarity.epic.length > 0) {
      result.push(byRarity.epic[0]);
    } else if (byRarity.rare.length > 0) {
      result.push(byRarity.rare[Math.floor(Math.random() * byRarity.rare.length)]);
    }

    // 填充剩余位置
    const remaining = shuffled.filter(u => !result.includes(u));
    while (result.length < count && remaining.length > 0) {
      const idx = Math.floor(Math.random() * remaining.length);
      result.push(remaining.splice(idx, 1)[0]);
    }

    return result.slice(0, count);
  }
}
