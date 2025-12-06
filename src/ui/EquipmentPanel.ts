import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../data/constants';
import { RARITY_COLORS, RARITY_NAMES, RARITY_ORDER } from '../data/Equipment';
import type { Equipment, EquipmentType, EquipmentAffix } from '../data/Equipment';

/**
 * 玩家装备槽 - 5个部位
 */
export interface EquipmentSlots {
  weapon: Equipment | null;
  helmet: Equipment | null;
  armor: Equipment | null;
  boots: Equipment | null;
  accessory: Equipment | null;
}

/**
 * 玩家完整属性
 */
export interface PlayerStats {
  baseAttack: number;
  baseDefense: number;
  baseHealth: number;
  baseSpeed: number;
  baseCrit: number;
  baseCritDamage: number;
  // 装备加成
  equipAttack: number;
  equipDefense: number;
  equipHealth: number;
  equipSpeed: number;
  equipCrit: number;
  equipCritDamage: number;
  equipLifeSteal: number;
  // 强化加成
  upgradeAttack: number;
  upgradeHealth: number;
  upgradeSpeed: number;
  upgradeCrit: number;
  // 子弹相关
  bulletCount: number;      // 子弹数量
  bulletDamage: number;     // 子弹伤害加成
  bulletSpeed: number;      // 子弹速度
  bulletPierce: number;     // 子弹穿透数
}

/**
 * 装备管理器 - 管理玩家装备和背包
 */
export class EquipmentManager {
  private scene: Phaser.Scene;
  
  // 当前装备
  private equippedItems: EquipmentSlots = {
    weapon: null,
    helmet: null,
    armor: null,
    boots: null,
    accessory: null
  };
  
  // 背包（未装备的物品）
  private inventory: Equipment[] = [];
  private maxInventorySize = 30;
  
  // UI元素
  private panelContainer?: Phaser.GameObjects.Container;
  private isOpen = false;
  
  // 玩家完整属性
  private playerStats: PlayerStats = {
    baseAttack: 20,
    baseDefense: 0,
    baseHealth: 100,
    baseSpeed: 200,
    baseCrit: 5,
    baseCritDamage: 150,
    equipAttack: 0,
    equipDefense: 0,
    equipHealth: 0,
    equipSpeed: 0,
    equipCrit: 0,
    equipCritDamage: 0,
    equipLifeSteal: 0,
    upgradeAttack: 0,
    upgradeHealth: 0,
    upgradeSpeed: 0,
    upgradeCrit: 0,
    bulletCount: 1,
    bulletDamage: 0,
    bulletSpeed: 300,
    bulletPierce: 0
  };

  // 统计加成（旧版兼容）
  private cachedStats = {
    attack: 0,
    defense: 0,
    health: 0,
    speed: 0,
    crit: 0,
    critDamage: 0,
    lifeSteal: 0
  };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * 获取完整玩家属性
   */
  getPlayerStats(): PlayerStats {
    return { ...this.playerStats };
  }

  /**
   * 更新强化属性
   */
  setUpgradeStats(stats: { attack?: number; health?: number; speed?: number; crit?: number; bulletCount?: number }): void {
    if (stats.attack !== undefined) this.playerStats.upgradeAttack = stats.attack;
    if (stats.health !== undefined) this.playerStats.upgradeHealth = stats.health;
    if (stats.speed !== undefined) this.playerStats.upgradeSpeed = stats.speed;
    if (stats.crit !== undefined) this.playerStats.upgradeCrit = stats.crit;
    if (stats.bulletCount !== undefined) this.playerStats.bulletCount = stats.bulletCount;
  }

  /**
   * 增加子弹数量
   */
  addBulletCount(count: number = 1): void {
    this.playerStats.bulletCount += count;
  }

  /**
   * 获取最终攻击力
   */
  getFinalAttack(): number {
    return this.playerStats.baseAttack + this.playerStats.equipAttack + this.playerStats.upgradeAttack;
  }

  /**
   * 获取最终生命值
   */
  getFinalHealth(): number {
    return this.playerStats.baseHealth + this.playerStats.equipHealth + this.playerStats.upgradeHealth;
  }

  /**
   * 获取最终速度
   */
  getFinalSpeed(): number {
    return this.playerStats.baseSpeed + this.playerStats.equipSpeed + this.playerStats.upgradeSpeed;
  }

  /**
   * 获取最终暴击率
   */
  getFinalCrit(): number {
    return Math.min(100, this.playerStats.baseCrit + this.playerStats.equipCrit + this.playerStats.upgradeCrit);
  }

  /**
   * 添加装备到背包
   */
  addToInventory(equipment: Equipment): boolean {
    if (this.inventory.length >= this.maxInventorySize) {
      return false;
    }
    this.inventory.push(equipment);
    // 按稀有度排序背包
    this.sortInventory();
    return true;
  }

  /**
   * 背包排序（按稀有度降序）
   */
  private sortInventory(): void {
    this.inventory.sort((a, b) => {
      return RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity];
    });
  }

  /**
   * 装备物品
   */
  equip(equipment: Equipment): Equipment | null {
    const slot = equipment.type;
    const previousEquipment = this.equippedItems[slot];
    
    // 装备新物品
    this.equippedItems[slot] = equipment;
    
    // 从背包移除
    const index = this.inventory.indexOf(equipment);
    if (index > -1) {
      this.inventory.splice(index, 1);
    }
    
    // 如果有旧装备，放入背包
    if (previousEquipment) {
      this.inventory.push(previousEquipment);
      this.sortInventory();
    }
    
    // 重新计算属性
    this.recalculateStats();
    
    return previousEquipment;
  }

  /**
   * 卸下装备
   */
  unequip(slot: EquipmentType): Equipment | null {
    const equipment = this.equippedItems[slot];
    if (equipment) {
      this.equippedItems[slot] = null;
      this.inventory.push(equipment);
      this.sortInventory();
      this.recalculateStats();
    }
    return equipment;
  }

  /**
   * 重新计算装备属性加成
   */
  private recalculateStats(): void {
    // 重置装备属性
    this.playerStats.equipAttack = 0;
    this.playerStats.equipDefense = 0;
    this.playerStats.equipHealth = 0;
    this.playerStats.equipSpeed = 0;
    this.playerStats.equipCrit = 0;
    this.playerStats.equipCritDamage = 0;
    this.playerStats.equipLifeSteal = 0;
    
    // 累加所有装备的属性
    Object.values(this.equippedItems).forEach(equipment => {
      if (equipment) {
        equipment.baseStats.forEach((stat: EquipmentAffix) => {
          switch (stat.type) {
            case 'attack': this.playerStats.equipAttack += stat.value; break;
            case 'defense': this.playerStats.equipDefense += stat.value; break;
            case 'health': this.playerStats.equipHealth += stat.value; break;
            case 'speed': this.playerStats.equipSpeed += stat.value; break;
            case 'crit': this.playerStats.equipCrit += stat.value; break;
            case 'critDamage': this.playerStats.equipCritDamage += stat.value; break;
            case 'lifeSteal': this.playerStats.equipLifeSteal += stat.value; break;
          }
        });
      }
    });

    // 更新旧版缓存（向后兼容）
    this.cachedStats = {
      attack: this.playerStats.equipAttack,
      defense: this.playerStats.equipDefense,
      health: this.playerStats.equipHealth,
      speed: this.playerStats.equipSpeed,
      crit: this.playerStats.equipCrit,
      critDamage: this.playerStats.equipCritDamage,
      lifeSteal: this.playerStats.equipLifeSteal
    };
  }

  /**
   * 获取装备属性加成
   */
  getStats() {
    return { ...this.cachedStats };
  }

  /**
   * 获取已装备的物品
   */
  getEquipped(): EquipmentSlots {
    return { ...this.equippedItems };
  }

  /**
   * 获取背包物品
   */
  getInventory(): Equipment[] {
    return [...this.inventory];
  }

  /**
   * 尝试自动装备（如果槽位空时直接装备，否则放入背包）
   */
  tryAutoEquip(equipment: Equipment): boolean {
    const slot = equipment.type;
    
    // 如果槽位空或新装备更好，直接装备
    const currentEquip = this.equippedItems[slot];
    if (!currentEquip) {
      // 槽位空，直接装备
      this.equippedItems[slot] = equipment;
      this.recalculateStats();
      return true;
    }
    
    // 比较稀有度和属性
    const rarityOrder = { common: 1, rare: 2, epic: 3, legendary: 4 };
    const newRarity = rarityOrder[equipment.rarity] || 1;
    const currentRarity = rarityOrder[currentEquip.rarity] || 1;
    
    // 新装备稀有度更高时自动替换
    if (newRarity > currentRarity) {
      this.inventory.push(currentEquip);
      this.equippedItems[slot] = equipment;
      this.recalculateStats();
      return true;
    }
    
    // 否则放入背包
    return this.addToInventory(equipment);
  }

  /**
   * 获取总属性加成（转换为游戏用格式）
   */
  getTotalStats(): { attackBonus: number; healthBonus: number; speedBonus: number; critBonus: number } {
    return {
      attackBonus: this.cachedStats.attack,
      healthBonus: this.cachedStats.health,
      speedBonus: this.cachedStats.speed,
      critBonus: this.cachedStats.crit
    };
  }

  /**
   * 打开装备界面
   */
  openPanel(onClose?: () => void): void {
    if (this.isOpen) return;
    this.isOpen = true;
    
    this.panelContainer = this.scene.add.container(0, 0);
    this.panelContainer.setDepth(500);
    
    // 半透明遮罩
    const overlay = this.scene.add.rectangle(
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2,
      CANVAS_WIDTH, CANVAS_HEIGHT,
      0x000000, 0.8
    );
    overlay.setInteractive();
    this.panelContainer.add(overlay);
    
    // 主面板 - 增大尺寸以容纳5个装备槽
    const panelWidth = 800;
    const panelHeight = 560;
    const panelX = CANVAS_WIDTH / 2;
    const panelY = CANVAS_HEIGHT / 2;
    
    const panelBg = this.scene.add.graphics();
    panelBg.fillStyle(0x1a1a2e, 0.95);
    panelBg.fillRoundedRect(panelX - panelWidth / 2, panelY - panelHeight / 2, panelWidth, panelHeight, 15);
    panelBg.lineStyle(3, 0xFFD700);
    panelBg.strokeRoundedRect(panelX - panelWidth / 2, panelY - panelHeight / 2, panelWidth, panelHeight, 15);
    this.panelContainer.add(panelBg);
    
    // 标题
    const title = this.scene.add.text(panelX, panelY - panelHeight / 2 + 30, '⚔️ 装备与背包', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#FFD700',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.panelContainer.add(title);
    
    // 关闭按钮
    const closeBtn = this.scene.add.text(panelX + panelWidth / 2 - 30, panelY - panelHeight / 2 + 15, '✕', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#FF6666'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    closeBtn.on('pointerover', () => closeBtn.setColor('#FF0000'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#FF6666'));
    closeBtn.on('pointerdown', () => {
      this.closePanel();
      if (onClose) onClose();
    });
    this.panelContainer.add(closeBtn);
    
    // 左侧：角色属性
    this.drawPlayerStatsSection(panelX - panelWidth / 2 + 20, panelY - panelHeight / 2 + 70);
    
    // 中间：已装备
    this.drawEquippedSection(panelX - panelWidth / 2 + 200, panelY - panelHeight / 2 + 70);
    
    // 右侧：背包
    this.drawInventorySection(panelX + 80, panelY - panelHeight / 2 + 70);
    
    // 底部提示
    const hint = this.scene.add.text(panelX, panelY + panelHeight / 2 - 25, '点击背包装备穿戴 | 点击已装备卸下 | 按 E 关闭', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#888888'
    }).setOrigin(0.5);
    this.panelContainer.add(hint);
    
    // 入场动画
    this.panelContainer.setAlpha(0);
    this.panelContainer.setScale(0.9);
    this.scene.tweens.add({
      targets: this.panelContainer,
      alpha: 1,
      scale: 1,
      duration: 200,
      ease: 'Power2'
    });
  }

  /**
   * 绘制角色属性区域
   */
  private drawPlayerStatsSection(x: number, y: number): void {
    const sectionTitle = this.scene.add.text(x + 75, y, '📊 角色属性', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#FFD700',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0);
    this.panelContainer!.add(sectionTitle);

    const stats = this.getPlayerStats();
    const statsList = [
      { icon: '⚔️', name: '攻击力', base: stats.baseAttack, equip: stats.equipAttack, upgrade: stats.upgradeAttack },
      { icon: '🛡️', name: '防御力', base: stats.baseDefense, equip: stats.equipDefense, upgrade: 0 },
      { icon: '❤️', name: '生命值', base: stats.baseHealth, equip: stats.equipHealth, upgrade: stats.upgradeHealth },
      { icon: '👟', name: '移动速度', base: stats.baseSpeed, equip: stats.equipSpeed, upgrade: stats.upgradeSpeed },
      { icon: '🎯', name: '暴击率', base: stats.baseCrit, equip: stats.equipCrit, upgrade: stats.upgradeCrit, suffix: '%' },
      { icon: '💥', name: '暴击伤害', base: stats.baseCritDamage, equip: stats.equipCritDamage, upgrade: 0, suffix: '%' },
      { icon: '💚', name: '生命偷取', base: 0, equip: stats.equipLifeSteal, upgrade: 0, suffix: '%' },
      { icon: '🔫', name: '子弹数量', base: 1, equip: 0, upgrade: stats.bulletCount - 1, special: true }
    ];

    statsList.forEach((stat, index) => {
      const statY = y + 30 + index * 32;
      const total = stat.base + stat.equip + stat.upgrade;
      const suffix = stat.suffix || '';

      // 属性图标和名称
      const nameText = this.scene.add.text(x, statY, `${stat.icon} ${stat.name}`, {
        fontFamily: 'Arial',
        fontSize: '13px',
        color: '#CCCCCC'
      });
      this.panelContainer!.add(nameText);

      // 总数值
      const valueColor = (stat.equip > 0 || stat.upgrade > 0) ? '#4CAF50' : '#FFFFFF';
      const valueText = this.scene.add.text(x + 150, statY, `${total}${suffix}`, {
        fontFamily: 'Arial',
        fontSize: '13px',
        color: valueColor,
        fontStyle: 'bold'
      }).setOrigin(1, 0);
      this.panelContainer!.add(valueText);

      // 显示加成明细
      if (stat.equip > 0 || stat.upgrade > 0) {
        let bonusStr = '';
        if (stat.equip > 0) bonusStr += `+${stat.equip}装`;
        if (stat.upgrade > 0) bonusStr += `+${stat.upgrade}强`;
        const bonusText = this.scene.add.text(x + 155, statY + 2, bonusStr, {
          fontFamily: 'Arial',
          fontSize: '10px',
          color: '#888888'
        });
        this.panelContainer!.add(bonusText);
      }
    });
  }

  /**
   * 绘制已装备区域
   */
  private drawEquippedSection(x: number, y: number): void {
    const sectionTitle = this.scene.add.text(x + 100, y, '已装备', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#FFFFFF'
    }).setOrigin(0.5, 0);
    this.panelContainer!.add(sectionTitle);
    
    const slots: { type: EquipmentType; label: string; icon: string }[] = [
      { type: 'weapon', label: '武器', icon: '⚔️' },
      { type: 'helmet', label: '头盔', icon: '🪖' },
      { type: 'armor', label: '护甲', icon: '🛡️' },
      { type: 'boots', label: '鞋子', icon: '👟' },
      { type: 'accessory', label: '饰品', icon: '💎' }
    ];
    
    slots.forEach((slot, index) => {
      const slotY = y + 35 + index * 75;  // 调整间距适应5个槽位
      const equipped = this.equippedItems[slot.type];
      
      this.drawEquipmentSlot(x, slotY, slot.icon, slot.label, equipped, () => {
        if (equipped) {
          this.unequip(slot.type);
          this.refreshPanel();
        }
      });
    });
  }

  /**
   * 绘制背包区域
   */
  private drawInventorySection(x: number, y: number): void {
    const sectionTitle = this.scene.add.text(x + 150, y, `背包 (${this.inventory.length}/${this.maxInventorySize})`, {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#FFFFFF'
    }).setOrigin(0.5, 0);
    this.panelContainer!.add(sectionTitle);
    
    const cols = 5;
    const slotSize = 55;
    const gap = 8;
    
    for (let i = 0; i < Math.min(15, this.maxInventorySize); i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const slotX = x + col * (slotSize + gap);
      const slotY = y + 35 + row * (slotSize + gap);
      
      const equipment = this.inventory[i];
      this.drawInventorySlot(slotX, slotY, slotSize, equipment, () => {
        if (equipment) {
          this.equip(equipment);
          this.refreshPanel();
        }
      });
    }
  }

  /**
   * 绘制装备槽
   */
  private drawEquipmentSlot(
    x: number, y: number,
    slotIcon: string, slotLabel: string,
    equipment: Equipment | null,
    onClick: () => void
  ): void {
    const slotWidth = 200;
    const slotHeight = 65;  // 调整高度适应5个槽位
    
    const colors = equipment ? RARITY_COLORS[equipment.rarity] : { bg: 0x333333, border: 0x555555 };
    
    const bg = this.scene.add.graphics();
    bg.fillStyle(colors.bg, 0.8);
    bg.fillRoundedRect(x, y, slotWidth, slotHeight, 8);
    bg.lineStyle(2, colors.border);
    bg.strokeRoundedRect(x, y, slotWidth, slotHeight, 8);
    this.panelContainer!.add(bg);
    
    // 槽位图标
    const icon = this.scene.add.text(x + 8, y + slotHeight / 2, slotIcon, {
      fontSize: '22px'
    }).setOrigin(0, 0.5);
    this.panelContainer!.add(icon);
    
    if (equipment) {
      // 装备图标
      const equipIcon = this.scene.add.text(x + 42, y + 10, equipment.icon, {
        fontSize: '20px'
      });
      this.panelContainer!.add(equipIcon);
      
      // 装备名称
      const nameText = this.scene.add.text(x + 70, y + 10, equipment.name, {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: RARITY_COLORS[equipment.rarity].text,
        fontStyle: 'bold'
      });
      this.panelContainer!.add(nameText);
      
      // 属性预览
      const statsPreview = equipment.baseStats.map(s => `${s.displayName}+${s.value}`).join(' ');
      const statsText = this.scene.add.text(x + 42, y + 35, statsPreview, {
        fontFamily: 'Arial',
        fontSize: '11px',
        color: '#AAAAAA'
      });
      this.panelContainer!.add(statsText);
      
      // 点击卸下
      const hitArea = this.scene.add.rectangle(x + slotWidth / 2, y + slotHeight / 2, slotWidth, slotHeight, 0x000000, 0);
      hitArea.setInteractive({ useHandCursor: true });
      hitArea.on('pointerdown', onClick);
      this.panelContainer!.add(hitArea);
    } else {
      // 空槽位
      const emptyText = this.scene.add.text(x + slotWidth / 2, y + slotHeight / 2, `空 ${slotLabel}`, {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#666666'
      }).setOrigin(0.5);
      this.panelContainer!.add(emptyText);
    }
  }

  /**
   * 绘制背包槽
   */
  private drawInventorySlot(x: number, y: number, size: number, equipment: Equipment | null, onClick: () => void): void {
    const colors = equipment ? RARITY_COLORS[equipment.rarity] : { bg: 0x2a2a2a, border: 0x444444 };
    
    const bg = this.scene.add.graphics();
    bg.fillStyle(colors.bg, 0.8);
    bg.fillRoundedRect(x, y, size, size, 6);
    bg.lineStyle(2, colors.border);
    bg.strokeRoundedRect(x, y, size, size, 6);
    this.panelContainer!.add(bg);
    
    if (equipment) {
      const icon = this.scene.add.text(x + size / 2, y + size / 2, equipment.icon, {
        fontSize: '28px'
      }).setOrigin(0.5);
      this.panelContainer!.add(icon);
      
      // 点击装备
      const hitArea = this.scene.add.rectangle(x + size / 2, y + size / 2, size, size, 0x000000, 0);
      hitArea.setInteractive({ useHandCursor: true });
      hitArea.on('pointerdown', onClick);
      hitArea.on('pointerover', () => {
        this.showTooltip(x + size, y, equipment);
      });
      hitArea.on('pointerout', () => {
        this.hideTooltip();
      });
      this.panelContainer!.add(hitArea);
    }
  }

  private tooltipContainer?: Phaser.GameObjects.Container;

  /**
   * 显示装备悬浮提示（带属性比较）
   */
  private showTooltip(x: number, y: number, equipment: Equipment): void {
    this.hideTooltip();
    
    this.tooltipContainer = this.scene.add.container(x + 10, y);
    this.tooltipContainer.setDepth(600);
    
    const padding = 10;
    const width = 200;
    
    // 获取当前装备的同类型装备进行比较
    const currentEquip = this.equippedItems[equipment.type];
    const hasComparison = currentEquip !== null;
    const tooltipHeight = hasComparison ? 180 : 120;
    
    // 背景
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x1a1a1a, 0.95);
    bg.fillRoundedRect(0, 0, width, tooltipHeight, 8);
    bg.lineStyle(2, RARITY_COLORS[equipment.rarity].border);
    bg.strokeRoundedRect(0, 0, width, tooltipHeight, 8);
    this.tooltipContainer.add(bg);
    
    // 名称
    const name = this.scene.add.text(padding, padding, `${equipment.icon} ${equipment.name}`, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: RARITY_COLORS[equipment.rarity].text,
      fontStyle: 'bold'
    });
    this.tooltipContainer.add(name);
    
    // 稀有度
    const rarity = this.scene.add.text(padding, padding + 22, RARITY_NAMES[equipment.rarity], {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: RARITY_COLORS[equipment.rarity].text
    });
    this.tooltipContainer.add(rarity);
    
    // 属性
    let yOffset = padding + 45;
    equipment.baseStats.forEach(stat => {
      // 计算属性差异
      let diffText = '';
      let diffColor = '#4CAF50';
      
      if (currentEquip) {
        const currentStat = currentEquip.baseStats.find(s => s.type === stat.type);
        const currentValue = currentStat ? currentStat.value : 0;
        const diff = stat.value - currentValue;
        
        if (diff > 0) {
          diffText = ` (+${diff})`;
          diffColor = '#4CAF50';  // 绿色表示提升
        } else if (diff < 0) {
          diffText = ` (${diff})`;
          diffColor = '#F44336';  // 红色表示下降
        }
      }
      
      const statText = this.scene.add.text(padding, yOffset, `${stat.displayName} +${stat.value}`, {
        fontFamily: 'Arial',
        fontSize: '12px',
        color: '#4CAF50'
      });
      this.tooltipContainer!.add(statText);
      
      if (diffText) {
        const diffLabel = this.scene.add.text(padding + 100, yOffset, diffText, {
          fontFamily: 'Arial',
          fontSize: '12px',
          color: diffColor,
          fontStyle: 'bold'
        });
        this.tooltipContainer!.add(diffLabel);
      }
      
      yOffset += 18;
    });
    
    // 如果有当前装备，显示对比信息
    if (hasComparison) {
      yOffset += 5;
      const divider = this.scene.add.graphics();
      divider.lineStyle(1, 0x555555);
      divider.lineBetween(padding, yOffset, width - padding, yOffset);
      this.tooltipContainer.add(divider);
      yOffset += 8;
      
      const compareLabel = this.scene.add.text(padding, yOffset, `对比: ${currentEquip!.name}`, {
        fontFamily: 'Arial',
        fontSize: '11px',
        color: RARITY_COLORS[currentEquip!.rarity].text
      });
      this.tooltipContainer.add(compareLabel);
      yOffset += 16;
      
      // 显示当前装备的属性
      currentEquip!.baseStats.forEach(stat => {
        const currentStatText = this.scene.add.text(padding, yOffset, `${stat.displayName} +${stat.value}`, {
          fontFamily: 'Arial',
          fontSize: '11px',
          color: '#888888'
        });
        this.tooltipContainer!.add(currentStatText);
        yOffset += 15;
      });
    }
    
    this.panelContainer!.add(this.tooltipContainer);
  }

  /**
   * 隐藏悬浮提示
   */
  private hideTooltip(): void {
    if (this.tooltipContainer) {
      this.tooltipContainer.destroy();
      this.tooltipContainer = undefined;
    }
  }

  /**
   * 刷新面板
   */
  private refreshPanel(): void {
    if (this.isOpen) {
      const wasOpen = this.isOpen;
      this.closePanel();
      if (wasOpen) {
        this.openPanel();
      }
    }
  }

  /**
   * 关闭装备界面
   */
  closePanel(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.hideTooltip();
    
    if (this.panelContainer) {
      this.scene.tweens.add({
        targets: this.panelContainer,
        alpha: 0,
        scale: 0.9,
        duration: 150,
        onComplete: () => {
          this.panelContainer?.destroy();
          this.panelContainer = undefined;
        }
      });
    }
  }

  /**
   * 切换装备界面
   */
  togglePanel(): void {
    if (this.isOpen) {
      this.closePanel();
    } else {
      this.openPanel();
    }
  }

  /**
   * 是否打开
   */
  isPanelOpen(): boolean {
    return this.isOpen;
  }
}
