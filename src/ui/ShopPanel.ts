import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../data/constants';
import { RARITY_COLORS, RARITY_ORDER, generateRandomEquipment } from '../data/Equipment';
import type { Equipment, EquipmentRarity } from '../data/Equipment';

/**
 * 商品类型
 */
interface ShopItem {
  equipment: Equipment;
  price: number;
  sold: boolean;
}

/**
 * 商店面板 - 买卖装备
 */
export class ShopPanel {
  private scene: Phaser.Scene;
  private panelContainer?: Phaser.GameObjects.Container;
  private isOpen = false;
  
  // 商店商品（每次进入随机生成）
  private shopItems: ShopItem[] = [];
  
  // 待出售的装备
  private sellItems: Equipment[] = [];
  
  // 回调函数
  private onGoldChange?: (delta: number) => void;
  private getGold?: () => number;
  private getInventory?: () => Equipment[];
  private removeFromInventory?: (equipment: Equipment) => void;
  private addToInventory?: (equipment: Equipment) => boolean;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * 设置回调函数
   */
  setCallbacks(callbacks: {
    onGoldChange: (delta: number) => void;
    getGold: () => number;
    getInventory: () => Equipment[];
    removeFromInventory: (equipment: Equipment) => void;
    addToInventory: (equipment: Equipment) => boolean;
  }): void {
    this.onGoldChange = callbacks.onGoldChange;
    this.getGold = callbacks.getGold;
    this.getInventory = callbacks.getInventory;
    this.removeFromInventory = callbacks.removeFromInventory;
    this.addToInventory = callbacks.addToInventory;
  }

  /**
   * 生成商店商品
   */
  refreshShop(roomNumber: number): void {
    this.shopItems = [];
    
    // 生成4-6个随机商品
    const itemCount = 4 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < itemCount; i++) {
      const equipment = generateRandomEquipment(roomNumber);
      const price = this.calculatePrice(equipment);
      
      this.shopItems.push({
        equipment,
        price,
        sold: false
      });
    }
    
    // 按稀有度排序
    this.shopItems.sort((a, b) => {
      return RARITY_ORDER[b.equipment.rarity] - RARITY_ORDER[a.equipment.rarity];
    });
  }

  /**
   * 计算装备价格
   */
  private calculatePrice(equipment: Equipment): number {
    const rarityMultiplier: Record<EquipmentRarity, number> = {
      common: 1,
      rare: 2.5,
      epic: 5,
      legendary: 12
    };
    
    // 基础价格 + 属性值加成
    let basePrice = 20;
    equipment.baseStats.forEach(stat => {
      basePrice += stat.value * 2;
    });
    
    return Math.floor(basePrice * rarityMultiplier[equipment.rarity]);
  }

  /**
   * 计算卖出价格（买入价的40%）
   */
  getSellPrice(equipment: Equipment): number {
    return Math.floor(this.calculatePrice(equipment) * 0.4);
  }

  /**
   * 打开商店
   */
  openPanel(onClose?: () => void): void {
    if (this.isOpen) return;
    this.isOpen = true;
    
    // 获取背包装备作为可出售物品
    if (this.getInventory) {
      this.sellItems = [...this.getInventory()];
    }
    
    this.panelContainer = this.scene.add.container(0, 0);
    this.panelContainer.setDepth(500);
    
    // 半透明遮罩
    const overlay = this.scene.add.rectangle(
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2,
      CANVAS_WIDTH, CANVAS_HEIGHT,
      0x000000, 0.85
    );
    overlay.setInteractive();
    this.panelContainer.add(overlay);
    
    // 主面板
    const panelWidth = 700;
    const panelHeight = 500;
    const panelX = CANVAS_WIDTH / 2;
    const panelY = CANVAS_HEIGHT / 2;
    
    const panelBg = this.scene.add.graphics();
    panelBg.fillStyle(0x1a2a1a, 0.95);
    panelBg.fillRoundedRect(panelX - panelWidth / 2, panelY - panelHeight / 2, panelWidth, panelHeight, 15);
    panelBg.lineStyle(3, 0xFFD700);
    panelBg.strokeRoundedRect(panelX - panelWidth / 2, panelY - panelHeight / 2, panelWidth, panelHeight, 15);
    this.panelContainer.add(panelBg);
    
    // 标题
    const title = this.scene.add.text(panelX, panelY - panelHeight / 2 + 30, '🏪 海底商店', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#FFD700',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.panelContainer.add(title);
    
    // 金币显示
    const goldAmount = this.getGold ? this.getGold() : 0;
    const goldText = this.scene.add.text(panelX + panelWidth / 2 - 100, panelY - panelHeight / 2 + 30, `💰 ${goldAmount}`, {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#FFD700',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.panelContainer.add(goldText);
    
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
    
    // 左侧：购买区域
    this.drawBuySection(panelX - panelWidth / 2 + 30, panelY - panelHeight / 2 + 70, goldText);
    
    // 右侧：出售区域
    this.drawSellSection(panelX + 50, panelY - panelHeight / 2 + 70, goldText);
    
    // 底部提示
    const hint = this.scene.add.text(panelX, panelY + panelHeight / 2 - 25, '点击商品购买 | 点击背包装备出售', {
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
   * 绘制购买区域
   */
  private drawBuySection(x: number, y: number, goldText: Phaser.GameObjects.Text): void {
    const sectionTitle = this.scene.add.text(x + 130, y, '🛒 购买商品', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#4CAF50',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0);
    this.panelContainer!.add(sectionTitle);
    
    const cols = 3;
    const slotSize = 80;
    const gap = 10;
    
    this.shopItems.forEach((item, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const slotX = x + col * (slotSize + gap);
      const slotY = y + 40 + row * (slotSize + gap + 30);
      
      this.drawShopItem(slotX, slotY, slotSize, item, goldText);
    });
  }

  /**
   * 绘制商品槽
   */
  private drawShopItem(x: number, y: number, size: number, item: ShopItem, goldText: Phaser.GameObjects.Text): void {
    const equipment = item.equipment;
    const colors = RARITY_COLORS[equipment.rarity];
    
    // 背景
    const bg = this.scene.add.graphics();
    bg.fillStyle(item.sold ? 0x333333 : colors.bg, 0.8);
    bg.fillRoundedRect(x, y, size, size, 8);
    bg.lineStyle(2, item.sold ? 0x555555 : colors.border);
    bg.strokeRoundedRect(x, y, size, size, 8);
    this.panelContainer!.add(bg);
    
    // 装备图标
    const icon = this.scene.add.text(x + size / 2, y + size / 2 - 5, equipment.icon, {
      fontSize: '32px'
    }).setOrigin(0.5);
    if (item.sold) icon.setAlpha(0.3);
    this.panelContainer!.add(icon);
    
    // 价格
    const priceColor = item.sold ? '#666666' : '#FFD700';
    const priceText = this.scene.add.text(x + size / 2, y + size + 5, `💰${item.price}`, {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: priceColor,
      fontStyle: 'bold'
    }).setOrigin(0.5, 0);
    this.panelContainer!.add(priceText);
    
    // 装备名称
    const nameText = this.scene.add.text(x + size / 2, y + size + 20, equipment.name, {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: item.sold ? '#666666' : colors.text
    }).setOrigin(0.5, 0);
    this.panelContainer!.add(nameText);
    
    // 已售出标记
    if (item.sold) {
      const soldMark = this.scene.add.text(x + size / 2, y + size / 2, '已售', {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#FF6666',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      this.panelContainer!.add(soldMark);
    } else {
      // 点击购买
      const hitArea = this.scene.add.rectangle(x + size / 2, y + size / 2, size, size, 0x000000, 0);
      hitArea.setInteractive({ useHandCursor: true });
      
      hitArea.on('pointerdown', () => {
        this.buyItem(item, goldText);
      });
      
      this.panelContainer!.add(hitArea);
    }
  }

  /**
   * 购买商品
   */
  private buyItem(item: ShopItem, goldText: Phaser.GameObjects.Text): void {
    if (item.sold) return;
    
    const currentGold = this.getGold ? this.getGold() : 0;
    
    if (currentGold < item.price) {
      // 金币不足
      this.showMessage('金币不足!', '#FF6666');
      return;
    }
    
    // 尝试添加到背包
    if (this.addToInventory && !this.addToInventory(item.equipment)) {
      this.showMessage('背包已满!', '#FF6666');
      return;
    }
    
    // 扣除金币
    if (this.onGoldChange) {
      this.onGoldChange(-item.price);
    }
    
    // 标记为已售
    item.sold = true;
    
    // 更新金币显示
    const newGold = this.getGold ? this.getGold() : 0;
    goldText.setText(`💰 ${newGold}`);
    
    // 刷新面板
    this.refreshPanelUI(goldText);
    
    // 显示成功消息
    this.showMessage(`购买了 ${item.equipment.name}!`, '#4CAF50');
  }

  /**
   * 绘制出售区域
   */
  private drawSellSection(x: number, y: number, goldText: Phaser.GameObjects.Text): void {
    const sectionTitle = this.scene.add.text(x + 130, y, '💰 出售装备', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#FF9800',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0);
    this.panelContainer!.add(sectionTitle);
    
    // 刷新背包数据
    if (this.getInventory) {
      this.sellItems = [...this.getInventory()];
    }
    
    if (this.sellItems.length === 0) {
      const emptyText = this.scene.add.text(x + 130, y + 150, '背包为空', {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#666666'
      }).setOrigin(0.5);
      this.panelContainer!.add(emptyText);
      return;
    }
    
    const cols = 4;
    const slotSize = 60;
    const gap = 8;
    
    // 最多显示12个
    const displayItems = this.sellItems.slice(0, 12);
    
    displayItems.forEach((equipment, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const slotX = x + col * (slotSize + gap);
      const slotY = y + 40 + row * (slotSize + gap + 20);
      
      this.drawSellItem(slotX, slotY, slotSize, equipment, goldText);
    });
  }

  /**
   * 绘制出售物品槽
   */
  private drawSellItem(x: number, y: number, size: number, equipment: Equipment, goldText: Phaser.GameObjects.Text): void {
    const colors = RARITY_COLORS[equipment.rarity];
    const sellPrice = this.getSellPrice(equipment);
    
    // 背景
    const bg = this.scene.add.graphics();
    bg.fillStyle(colors.bg, 0.8);
    bg.fillRoundedRect(x, y, size, size, 6);
    bg.lineStyle(2, colors.border);
    bg.strokeRoundedRect(x, y, size, size, 6);
    this.panelContainer!.add(bg);
    
    // 装备图标
    const icon = this.scene.add.text(x + size / 2, y + size / 2, equipment.icon, {
      fontSize: '24px'
    }).setOrigin(0.5);
    this.panelContainer!.add(icon);
    
    // 卖出价格
    const priceText = this.scene.add.text(x + size / 2, y + size + 3, `+${sellPrice}💰`, {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: '#FFD700'
    }).setOrigin(0.5, 0);
    this.panelContainer!.add(priceText);
    
    // 点击出售
    const hitArea = this.scene.add.rectangle(x + size / 2, y + size / 2, size, size, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    
    hitArea.on('pointerdown', () => {
      this.sellItem(equipment, goldText);
    });
    
    this.panelContainer!.add(hitArea);
  }

  /**
   * 出售物品
   */
  private sellItem(equipment: Equipment, goldText: Phaser.GameObjects.Text): void {
    const sellPrice = this.getSellPrice(equipment);
    
    // 从背包移除
    if (this.removeFromInventory) {
      this.removeFromInventory(equipment);
    }
    
    // 增加金币
    if (this.onGoldChange) {
      this.onGoldChange(sellPrice);
    }
    
    // 从出售列表移除
    const index = this.sellItems.indexOf(equipment);
    if (index > -1) {
      this.sellItems.splice(index, 1);
    }
    
    // 更新金币显示
    const newGold = this.getGold ? this.getGold() : 0;
    goldText.setText(`💰 ${newGold}`);
    
    // 刷新面板
    this.refreshPanelUI(goldText);
    
    // 显示成功消息
    this.showMessage(`卖出了 ${equipment.name} +${sellPrice}💰`, '#FFD700');
  }

  /**
   * 刷新面板UI
   */
  private refreshPanelUI(_goldText: Phaser.GameObjects.Text): void {
    const onCloseCallback = () => {};
    this.closePanel();
    this.openPanel(onCloseCallback);
  }

  /**
   * 显示消息
   */
  private showMessage(message: string, color: string): void {
    const msg = this.scene.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 180, message, {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(600);
    
    this.scene.tweens.add({
      targets: msg,
      y: msg.y - 30,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => msg.destroy()
    });
  }

  /**
   * 关闭商店
   */
  closePanel(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    
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
   * 是否打开
   */
  isPanelOpen(): boolean {
    return this.isOpen;
  }
}
