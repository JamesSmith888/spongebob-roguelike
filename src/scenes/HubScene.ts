import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../data/constants';
import { EquipmentManager } from '../ui/EquipmentPanel';
import { RARITY_COLORS } from '../data/Equipment';

/**
 * 副本配置
 */
interface DungeonConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  difficulty: 'easy' | 'normal' | 'hard' | 'nightmare';
  waves: number;
  recommendedLevel: number;
  rewards: string[];
  unlocked: boolean;
}

/**
 * 主界面场景 - 角色可在这里调整装备、选择副本
 */
export class HubScene extends Phaser.Scene {
  private equipmentManager!: EquipmentManager;
  
  // 副本列表
  private dungeons: DungeonConfig[] = [
    {
      id: 'bikini_bottom',
      name: '比奇堡冒险',
      description: '在熟悉的比奇堡中进行战斗训练',
      icon: '🏠',
      difficulty: 'easy',
      waves: 3,
      recommendedLevel: 1,
      rewards: ['普通装备', '金币'],
      unlocked: true
    },
    {
      id: 'krusty_krab',
      name: '蟹堡王危机',
      description: '痞老板入侵蟹堡王，阻止他！',
      icon: '🍔',
      difficulty: 'normal',
      waves: 5,
      recommendedLevel: 3,
      rewards: ['稀有装备', '蟹堡秘方'],
      unlocked: true
    },
    {
      id: 'jellyfish_fields',
      name: '水母田狩猎',
      description: '在水母田中捕捉稀有水母',
      icon: '🎐',
      difficulty: 'normal',
      waves: 4,
      recommendedLevel: 5,
      rewards: ['史诗装备', '水母果冻'],
      unlocked: true
    },
    {
      id: 'rock_bottom',
      name: '岩石深渊',
      description: '探索神秘的岩石深渊',
      icon: '🪨',
      difficulty: 'hard',
      waves: 6,
      recommendedLevel: 10,
      rewards: ['传说装备', '深海宝藏'],
      unlocked: false
    },
    {
      id: 'flying_dutchman',
      name: '幽灵船挑战',
      description: '击败飞翔的荷兰人！',
      icon: '👻',
      difficulty: 'nightmare',
      waves: 8,
      recommendedLevel: 15,
      rewards: ['传说装备', '幽灵船宝藏'],
      unlocked: false
    }
  ];

  constructor() {
    super({ key: 'HubScene' });
  }

  init(data: { equipmentManager?: EquipmentManager }) {
    // 从上一个场景继承装备管理器
    if (data.equipmentManager) {
      this.equipmentManager = data.equipmentManager;
    }
  }

  create() {
    // 初始化装备管理器（如果没有从其他场景传入）
    if (!this.equipmentManager) {
      this.equipmentManager = new EquipmentManager(this);
    }

    // 创建背景
    this.createBackground();

    // 创建标题
    this.createTitle();

    // 创建角色预览
    this.createCharacterPreview();

    // 创建装备栏预览
    this.createEquipmentPreview();

    // 创建副本选择
    this.createDungeonSelection();

    // 创建底部按钮
    this.createBottomButtons();

    // 入场动画
    this.cameras.main.fadeIn(500);
  }

  private createBackground(): void {
    // 海底主题背景
    const graphics = this.add.graphics();
    
    for (let y = 0; y < CANVAS_HEIGHT; y++) {
      const ratio = y / CANVAS_HEIGHT;
      const r = Math.floor(15 + ratio * 20);
      const g = Math.floor(40 + ratio * 50);
      const b = Math.floor(80 + ratio * 80);
      graphics.fillStyle(Phaser.Display.Color.GetColor(r, g, b));
      graphics.fillRect(0, y, CANVAS_WIDTH, 1);
    }

    // 装饰性气泡
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * CANVAS_WIDTH;
      const y = Math.random() * CANVAS_HEIGHT;
      const size = 3 + Math.random() * 8;
      graphics.fillStyle(0xFFFFFF, 0.1 + Math.random() * 0.2);
      graphics.fillCircle(x, y, size);
    }

    // 底部沙地
    graphics.fillStyle(0x8B7355, 0.3);
    graphics.fillRect(0, CANVAS_HEIGHT - 80, CANVAS_WIDTH, 80);
  }

  private createTitle(): void {
    const title = this.add.text(CANVAS_WIDTH / 2, 40, '🏠 菠萝屋基地', {
      fontFamily: 'Arial',
      fontSize: '36px',
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: '#8B6914',
      strokeThickness: 4
    }).setOrigin(0.5);

    // 标题动画
    this.tweens.add({
      targets: title,
      y: 45,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private createCharacterPreview(): void {
    const container = this.add.container(120, CANVAS_HEIGHT / 2 - 30);

    // 角色预览背景
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.8);
    bg.fillRoundedRect(-80, -120, 160, 200, 12);
    bg.lineStyle(2, 0xFFD700);
    bg.strokeRoundedRect(-80, -120, 160, 200, 12);
    container.add(bg);

    // 标题
    const title = this.add.text(0, -100, '👤 角色', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#FFD700',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    container.add(title);

    // 角色精灵
    try {
      const character = this.add.sprite(0, -20, 'player-idle-0');
      character.setScale(1.2);
      character.play('player-idle');
      container.add(character);

      // 浮动动画
      this.tweens.add({
        targets: character,
        y: -25,
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    } catch (e) {
      // 占位符
      const placeholder = this.add.graphics();
      placeholder.fillStyle(0xFFEB3B);
      placeholder.fillRoundedRect(-30, -60, 60, 80, 8);
      container.add(placeholder);
    }

    // 属性简览
    const stats = this.equipmentManager.getPlayerStats();
    const statTexts = [
      `⚔️ ${stats.baseAttack + stats.equipAttack + stats.upgradeAttack}`,
      `❤️ ${stats.baseHealth + stats.equipHealth + stats.upgradeHealth}`,
      `🎯 ${stats.baseCrit + stats.equipCrit + stats.upgradeCrit}%`
    ];
    
    const statsText = this.add.text(0, 55, statTexts.join('  '), {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#AAAAAA'
    }).setOrigin(0.5);
    container.add(statsText);
  }

  private createEquipmentPreview(): void {
    const container = this.add.container(120, CANVAS_HEIGHT / 2 + 130);

    // 装备预览背景
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.8);
    bg.fillRoundedRect(-80, -50, 160, 100, 12);
    bg.lineStyle(2, 0x4CAF50);
    bg.strokeRoundedRect(-80, -50, 160, 100, 12);
    container.add(bg);

    // 标题
    const title = this.add.text(0, -35, '⚔️ 装备', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#4CAF50',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    container.add(title);

    // 装备槽
    const equipped = this.equipmentManager.getEquipped();
    const slots = [
      { type: 'weapon', icon: '⚔️', equip: equipped.weapon, x: -45 },
      { type: 'armor', icon: '🛡️', equip: equipped.armor, x: 0 },
      { type: 'accessory', icon: '💎', equip: equipped.accessory, x: 45 }
    ];

    slots.forEach(slot => {
      const slotBg = this.add.graphics();
      const colors = slot.equip ? RARITY_COLORS[slot.equip.rarity] : { bg: 0x333333, border: 0x555555 };
      slotBg.fillStyle(colors.bg, 0.8);
      slotBg.fillRoundedRect(slot.x - 20, -10, 40, 40, 6);
      slotBg.lineStyle(2, colors.border);
      slotBg.strokeRoundedRect(slot.x - 20, -10, 40, 40, 6);
      container.add(slotBg);

      const icon = this.add.text(slot.x, 10, slot.equip ? slot.equip.icon : slot.icon, {
        fontSize: slot.equip ? '22px' : '18px'
      }).setOrigin(0.5);
      if (!slot.equip) icon.setAlpha(0.5);
      container.add(icon);
    });

    // 点击打开装备面板
    const hitArea = this.add.rectangle(0, 0, 160, 100, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    hitArea.on('pointerdown', () => this.openEquipmentPanel());
    container.add(hitArea);

    // 提示文字
    const hint = this.add.text(0, 40, '点击管理装备', {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: '#888888'
    }).setOrigin(0.5);
    container.add(hint);
  }

  private createDungeonSelection(): void {
    const startX = 280;
    const startY = 100;
    const cardWidth = 150;
    const cardHeight = 180;
    const gap = 15;

    // 副本选择标题
    this.add.text(startX + 200, 70, '📜 选择副本', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#FFFFFF',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 创建副本卡片
    this.dungeons.forEach((dungeon, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const x = startX + col * (cardWidth + gap);
      const y = startY + row * (cardHeight + gap) + 30;

      this.createDungeonCard(x, y, cardWidth, cardHeight, dungeon);
    });
  }

  private createDungeonCard(x: number, y: number, width: number, height: number, dungeon: DungeonConfig): void {
    const container = this.add.container(x + width / 2, y + height / 2);

    // 难度颜色
    const difficultyColors = {
      easy: { bg: 0x2E7D32, border: 0x4CAF50, text: '#4CAF50' },
      normal: { bg: 0x1565C0, border: 0x2196F3, text: '#2196F3' },
      hard: { bg: 0x6A1B9A, border: 0x9C27B0, text: '#9C27B0' },
      nightmare: { bg: 0xB71C1C, border: 0xF44336, text: '#F44336' }
    };
    const colors = difficultyColors[dungeon.difficulty];

    // 卡片背景
    const bg = this.add.graphics();
    if (dungeon.unlocked) {
      bg.fillStyle(colors.bg, 0.8);
    } else {
      bg.fillStyle(0x333333, 0.8);
    }
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 10);
    bg.lineStyle(2, dungeon.unlocked ? colors.border : 0x555555);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);
    container.add(bg);

    // 图标
    const icon = this.add.text(0, -height / 2 + 35, dungeon.icon, {
      fontSize: '40px'
    }).setOrigin(0.5);
    if (!dungeon.unlocked) icon.setAlpha(0.5);
    container.add(icon);

    // 名称
    const name = this.add.text(0, -height / 2 + 75, dungeon.name, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: dungeon.unlocked ? '#FFFFFF' : '#888888',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    container.add(name);

    // 难度标签
    const difficultyLabels = { easy: '简单', normal: '普通', hard: '困难', nightmare: '噩梦' };
    const diffLabel = this.add.text(0, -height / 2 + 95, difficultyLabels[dungeon.difficulty], {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: dungeon.unlocked ? colors.text : '#666666'
    }).setOrigin(0.5);
    container.add(diffLabel);

    // 描述
    const desc = this.add.text(0, -height / 2 + 120, dungeon.description, {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: '#AAAAAA',
      align: 'center',
      wordWrap: { width: width - 20 }
    }).setOrigin(0.5, 0);
    container.add(desc);

    // 锁定图标
    if (!dungeon.unlocked) {
      const lock = this.add.text(0, 0, '🔒', {
        fontSize: '32px'
      }).setOrigin(0.5).setAlpha(0.8);
      container.add(lock);
    }

    // 交互
    if (dungeon.unlocked) {
      const hitArea = this.add.rectangle(0, 0, width, height, 0x000000, 0);
      hitArea.setInteractive({ useHandCursor: true });
      
      hitArea.on('pointerover', () => {
        this.tweens.add({
          targets: container,
          scale: 1.05,
          duration: 150
        });
        bg.clear();
        bg.fillStyle(colors.bg, 1);
        bg.fillRoundedRect(-width / 2, -height / 2, width, height, 10);
        bg.lineStyle(3, colors.border);
        bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);
      });

      hitArea.on('pointerout', () => {
        this.tweens.add({
          targets: container,
          scale: 1,
          duration: 150
        });
        bg.clear();
        bg.fillStyle(colors.bg, 0.8);
        bg.fillRoundedRect(-width / 2, -height / 2, width, height, 10);
        bg.lineStyle(2, colors.border);
        bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);
      });

      hitArea.on('pointerdown', () => {
        this.selectDungeon(dungeon);
      });

      container.add(hitArea);
    }
  }

  private selectDungeon(dungeon: DungeonConfig): void {
    this.showDungeonConfirm(dungeon);
  }

  private showDungeonConfirm(dungeon: DungeonConfig): void {
    const container = this.add.container(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    container.setDepth(100);

    // 遮罩
    const overlay = this.add.rectangle(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, 0x000000, 0.7);
    overlay.setInteractive();
    container.add(overlay);

    // 确认框
    const dialogBg = this.add.graphics();
    dialogBg.fillStyle(0x1a1a2e, 0.95);
    dialogBg.fillRoundedRect(-200, -150, 400, 300, 15);
    dialogBg.lineStyle(3, 0xFFD700);
    dialogBg.strokeRoundedRect(-200, -150, 400, 300, 15);
    container.add(dialogBg);

    // 标题
    const title = this.add.text(0, -120, `${dungeon.icon} ${dungeon.name}`, {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#FFD700',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    container.add(title);

    // 描述
    const desc = this.add.text(0, -80, dungeon.description, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#CCCCCC',
      align: 'center',
      wordWrap: { width: 350 }
    }).setOrigin(0.5);
    container.add(desc);

    // 信息
    const info = this.add.text(0, -30, [
      `波次: ${dungeon.waves}`,
      `推荐等级: ${dungeon.recommendedLevel}`,
      `奖励: ${dungeon.rewards.join(', ')}`
    ].join('\n'), {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: '#AAAAAA',
      align: 'center'
    }).setOrigin(0.5);
    container.add(info);

    // 开始按钮
    const startBtn = this.createButton(0, 60, '🎮 开始挑战', 0x4CAF50, () => {
      container.destroy();
      this.startDungeon(dungeon);
    });
    container.add(startBtn);

    // 取消按钮
    const cancelBtn = this.createButton(0, 115, '❌ 取消', 0x666666, () => {
      container.destroy();
    });
    container.add(cancelBtn);

    // 入场动画
    container.setScale(0.8);
    container.setAlpha(0);
    this.tweens.add({
      targets: container,
      scale: 1,
      alpha: 1,
      duration: 200,
      ease: 'Power2'
    });
  }

  private createButton(x: number, y: number, text: string, color: number, callback: () => void): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(color, 0.9);
    bg.fillRoundedRect(-100, -20, 200, 40, 8);
    container.add(bg);

    const btnText = this.add.text(0, 0, text, {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#FFFFFF',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    container.add(btnText);

    const hitArea = this.add.rectangle(0, 0, 200, 40, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    
    hitArea.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(color, 1);
      bg.fillRoundedRect(-100, -20, 200, 40, 8);
      bg.lineStyle(2, 0xFFFFFF);
      bg.strokeRoundedRect(-100, -20, 200, 40, 8);
    });

    hitArea.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(color, 0.9);
      bg.fillRoundedRect(-100, -20, 200, 40, 8);
    });

    hitArea.on('pointerdown', callback);
    container.add(hitArea);

    return container;
  }

  private startDungeon(dungeon: DungeonConfig): void {
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.time.delayedCall(500, () => {
      // 传递装备管理器和副本配置到关卡场景
      this.scene.start('Level1Scene', {
        equipmentManager: this.equipmentManager,
        dungeonConfig: dungeon
      });
    });
  }

  private openEquipmentPanel(): void {
    this.equipmentManager.openPanel(() => {
      // 刷新界面显示
      this.scene.restart();
    });
  }

  private createBottomButtons(): void {
    // 返回菜单按钮
    const menuBtn = this.add.container(80, CANVAS_HEIGHT - 40);
    
    const menuBg = this.add.graphics();
    menuBg.fillStyle(0x37474F, 0.9);
    menuBg.fillRoundedRect(-60, -18, 120, 36, 8);
    menuBtn.add(menuBg);

    const menuText = this.add.text(0, 0, '🏠 返回菜单', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#FFFFFF'
    }).setOrigin(0.5);
    menuBtn.add(menuText);

    const menuHit = this.add.rectangle(0, 0, 120, 36, 0x000000, 0);
    menuHit.setInteractive({ useHandCursor: true });
    menuHit.on('pointerdown', () => {
      this.cameras.main.fadeOut(500);
      this.time.delayedCall(500, () => {
        this.scene.start('MenuScene');
      });
    });
    menuBtn.add(menuHit);

    // 装备按钮
    const equipBtn = this.add.container(CANVAS_WIDTH - 80, CANVAS_HEIGHT - 40);
    
    const equipBg = this.add.graphics();
    equipBg.fillStyle(0x6A1B9A, 0.9);
    equipBg.fillRoundedRect(-60, -18, 120, 36, 8);
    equipBtn.add(equipBg);

    const equipText = this.add.text(0, 0, '⚔️ 装备背包', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#FFFFFF'
    }).setOrigin(0.5);
    equipBtn.add(equipText);

    const equipHit = this.add.rectangle(0, 0, 120, 36, 0x000000, 0);
    equipHit.setInteractive({ useHandCursor: true });
    equipHit.on('pointerdown', () => this.openEquipmentPanel());
    equipBtn.add(equipHit);
  }
}
