/**
 * 装备稀有度
 */
export type EquipmentRarity = 'common' | 'rare' | 'epic' | 'legendary';

/**
 * 装备类型 - 扩展为5种
 */
export type EquipmentType = 'weapon' | 'helmet' | 'armor' | 'boots' | 'accessory';

/**
 * 装备词条
 */
export interface EquipmentAffix {
  type: 'attack' | 'defense' | 'health' | 'speed' | 'crit' | 'critDamage' | 'lifeSteal';
  value: number;
  displayName: string;
}

/**
 * 装备定义
 */
export interface Equipment {
  id: string;
  name: string;
  type: EquipmentType;
  rarity: EquipmentRarity;
  icon: string;
  baseStats: EquipmentAffix[];
  description: string;
}

/**
 * 稀有度颜色配置 - 行业标准颜色方案
 * 白色(普通) -> 绿色(优秀) -> 蓝色(稀有) -> 紫色(史诗) -> 橙色(传说)
 */
export const RARITY_COLORS: Record<EquipmentRarity, { bg: number; border: number; text: string; glow: number }> = {
  common: { bg: 0x3a3a3a, border: 0xAAAAAA, text: '#AAAAAA', glow: 0x888888 },      // 灰白色
  rare: { bg: 0x1a3a1a, border: 0x4CAF50, text: '#4CAF50', glow: 0x2E7D32 },        // 绿色
  epic: { bg: 0x1a1a4a, border: 0x2196F3, text: '#2196F3', glow: 0x1565C0 },        // 蓝色 -> 紫色移到史诗
  legendary: { bg: 0x4a2a1a, border: 0xFF9800, text: '#FF9800', glow: 0xE65100 }    // 橙色
};

// 新增：更完整的稀有度分级（5级）
export type ExtendedRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export const EXTENDED_RARITY_COLORS: Record<ExtendedRarity, { bg: number; border: number; text: string; glow: number }> = {
  common: { bg: 0x3a3a3a, border: 0xAAAAAA, text: '#AAAAAA', glow: 0x888888 },      // 灰白色 - 普通
  uncommon: { bg: 0x1a3a1a, border: 0x4CAF50, text: '#4CAF50', glow: 0x2E7D32 },    // 绿色 - 优秀
  rare: { bg: 0x1a1a4a, border: 0x2196F3, text: '#2196F3', glow: 0x1565C0 },        // 蓝色 - 稀有
  epic: { bg: 0x3a1a4a, border: 0x9C27B0, text: '#9C27B0', glow: 0x7B1FA2 },        // 紫色 - 史诗
  legendary: { bg: 0x4a2a1a, border: 0xFF9800, text: '#FF9800', glow: 0xE65100 }    // 橙色 - 传说
};

/**
 * 稀有度中文名
 */
export const RARITY_NAMES: Record<EquipmentRarity, string> = {
  common: '普通',
  rare: '优秀',
  epic: '稀有',
  legendary: '传说'
};

export const EXTENDED_RARITY_NAMES: Record<ExtendedRarity, string> = {
  common: '普通',
  uncommon: '优秀',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说'
};

/**
 * 稀有度排序权重
 */
export const RARITY_ORDER: Record<EquipmentRarity, number> = {
  common: 1,
  rare: 2,
  epic: 3,
  legendary: 4
};

/**
 * 装备池 - 所有可掉落的装备
 */
export const EQUIPMENT_POOL: Equipment[] = [
  // ========== 武器 ==========
  {
    id: 'spatula_basic',
    name: '普通锅铲',
    type: 'weapon',
    rarity: 'common',
    icon: '🍳',
    baseStats: [{ type: 'attack', value: 5, displayName: '攻击力' }],
    description: '蟹堡王的标准厨具'
  },
  {
    id: 'spatula_sharp',
    name: '锋利锅铲',
    type: 'weapon',
    rarity: 'rare',
    icon: '🔪',
    baseStats: [
      { type: 'attack', value: 12, displayName: '攻击力' },
      { type: 'crit', value: 5, displayName: '暴击率' }
    ],
    description: '经过打磨的锅铲，更加锋利'
  },
  {
    id: 'spatula_flame',
    name: '烈焰锅铲',
    type: 'weapon',
    rarity: 'epic',
    icon: '🔥',
    baseStats: [
      { type: 'attack', value: 20, displayName: '攻击力' },
      { type: 'critDamage', value: 25, displayName: '暴击伤害' }
    ],
    description: '燃烧着熊熊烈火的神器'
  },
  {
    id: 'spatula_golden',
    name: '黄金锅铲',
    type: 'weapon',
    rarity: 'legendary',
    icon: '✨',
    baseStats: [
      { type: 'attack', value: 35, displayName: '攻击力' },
      { type: 'crit', value: 15, displayName: '暴击率' },
      { type: 'critDamage', value: 50, displayName: '暴击伤害' }
    ],
    description: '传说中的黄金锅铲，蟹堡王的至宝'
  },
  {
    id: 'net_basic',
    name: '捕虫网',
    type: 'weapon',
    rarity: 'common',
    icon: '🪤',
    baseStats: [
      { type: 'attack', value: 3, displayName: '攻击力' },
      { type: 'speed', value: 10, displayName: '移动速度' }
    ],
    description: '派大星最爱的捕虫网'
  },
  {
    id: 'bubble_wand',
    name: '泡泡魔杖',
    type: 'weapon',
    rarity: 'rare',
    icon: '🫧',
    baseStats: [
      { type: 'attack', value: 8, displayName: '攻击力' },
      { type: 'lifeSteal', value: 3, displayName: '生命偷取' }
    ],
    description: '吹出的泡泡可以治愈伤口'
  },

  // ========== 护甲 ==========
  {
    id: 'apron_basic',
    name: '厨师围裙',
    type: 'armor',
    rarity: 'common',
    icon: '👕',
    baseStats: [{ type: 'defense', value: 5, displayName: '防御力' }],
    description: '标准的蟹堡王工作服'
  },
  {
    id: 'shell_armor',
    name: '贝壳护甲',
    type: 'armor',
    rarity: 'rare',
    icon: '🐚',
    baseStats: [
      { type: 'defense', value: 12, displayName: '防御力' },
      { type: 'health', value: 20, displayName: '生命值' }
    ],
    description: '用坚硬的贝壳制成的护甲'
  },
  {
    id: 'coral_armor',
    name: '珊瑚战甲',
    type: 'armor',
    rarity: 'epic',
    icon: '🪸',
    baseStats: [
      { type: 'defense', value: 20, displayName: '防御力' },
      { type: 'health', value: 40, displayName: '生命值' }
    ],
    description: '深海珊瑚打造的华丽战甲'
  },
  {
    id: 'neptune_armor',
    name: '海神战甲',
    type: 'armor',
    rarity: 'legendary',
    icon: '🔱',
    baseStats: [
      { type: 'defense', value: 35, displayName: '防御力' },
      { type: 'health', value: 80, displayName: '生命值' },
      { type: 'lifeSteal', value: 5, displayName: '生命偷取' }
    ],
    description: '海神波塞冬的战甲，拥有不灭之力'
  },

  // ========== 头盔 ==========
  {
    id: 'helmet_basic',
    name: '水手帽',
    type: 'helmet',
    rarity: 'common',
    icon: '🧢',
    baseStats: [{ type: 'defense', value: 3, displayName: '防御力' }],
    description: '普通的水手帽'
  },
  {
    id: 'helmet_bubble',
    name: '泡泡头盔',
    type: 'helmet',
    rarity: 'rare',
    icon: '🫧',
    baseStats: [
      { type: 'defense', value: 8, displayName: '防御力' },
      { type: 'health', value: 15, displayName: '生命值' }
    ],
    description: '泡泡制成的轻盈头盔'
  },
  {
    id: 'helmet_diving',
    name: '深海潜水盔',
    type: 'helmet',
    rarity: 'epic',
    icon: '🤿',
    baseStats: [
      { type: 'defense', value: 15, displayName: '防御力' },
      { type: 'health', value: 30, displayName: '生命值' },
      { type: 'crit', value: 5, displayName: '暴击率' }
    ],
    description: '专业深海探险装备'
  },
  {
    id: 'helmet_crown',
    name: '海洋皇冠',
    type: 'helmet',
    rarity: 'legendary',
    icon: '👑',
    baseStats: [
      { type: 'defense', value: 25, displayName: '防御力' },
      { type: 'health', value: 50, displayName: '生命值' },
      { type: 'crit', value: 10, displayName: '暴击率' },
      { type: 'critDamage', value: 20, displayName: '暴击伤害' }
    ],
    description: '海洋之王的皇冠，王者风范'
  },

  // ========== 鞋子 ==========
  {
    id: 'boots_basic',
    name: '布鞋',
    type: 'boots',
    rarity: 'common',
    icon: '👟',
    baseStats: [{ type: 'speed', value: 10, displayName: '移动速度' }],
    description: '普通的布鞋'
  },
  {
    id: 'boots_flipper',
    name: '脚蹼',
    type: 'boots',
    rarity: 'rare',
    icon: '🦶',
    baseStats: [
      { type: 'speed', value: 25, displayName: '移动速度' },
      { type: 'defense', value: 3, displayName: '防御力' }
    ],
    description: '游泳专用脚蹼，移动更快'
  },
  {
    id: 'boots_rocket',
    name: '喷气靴',
    type: 'boots',
    rarity: 'epic',
    icon: '🚀',
    baseStats: [
      { type: 'speed', value: 40, displayName: '移动速度' },
      { type: 'crit', value: 5, displayName: '暴击率' }
    ],
    description: '装有喷气装置的神奇靴子'
  },
  {
    id: 'boots_poseidon',
    name: '海神之履',
    type: 'boots',
    rarity: 'legendary',
    icon: '⚡',
    baseStats: [
      { type: 'speed', value: 60, displayName: '移动速度' },
      { type: 'crit', value: 10, displayName: '暴击率' },
      { type: 'attack', value: 10, displayName: '攻击力' }
    ],
    description: '海神波塞冬的神鞋，迅如闪电'
  },

  // ========== 饰品 ==========
  {
    id: 'ring_speed',
    name: '迅捷戒指',
    type: 'accessory',
    rarity: 'common',
    icon: '💍',
    baseStats: [{ type: 'speed', value: 15, displayName: '移动速度' }],
    description: '轻盈的戒指，让你跑得更快'
  },
  {
    id: 'necklace_power',
    name: '力量项链',
    type: 'accessory',
    rarity: 'rare',
    icon: '📿',
    baseStats: [
      { type: 'attack', value: 8, displayName: '攻击力' },
      { type: 'crit', value: 5, displayName: '暴击率' }
    ],
    description: '蕴含力量的神秘项链'
  },
  {
    id: 'pearl_necklace',
    name: '珍珠项链',
    type: 'accessory',
    rarity: 'epic',
    icon: '🦪',
    baseStats: [
      { type: 'health', value: 30, displayName: '生命值' },
      { type: 'defense', value: 10, displayName: '防御力' },
      { type: 'lifeSteal', value: 3, displayName: '生命偷取' }
    ],
    description: '珍珠蚌的馈赠，生命之源'
  },
  {
    id: 'crown_ocean',
    name: '海洋王冠',
    type: 'accessory',
    rarity: 'legendary',
    icon: '👑',
    baseStats: [
      { type: 'attack', value: 20, displayName: '攻击力' },
      { type: 'defense', value: 15, displayName: '防御力' },
      { type: 'crit', value: 10, displayName: '暴击率' },
      { type: 'speed', value: 20, displayName: '移动速度' }
    ],
    description: '海洋之王的王冠，全属性提升'
  }
];

/**
 * 根据房间数获取掉落权重
 */
export function getDropWeights(roomNumber: number): Record<EquipmentRarity, number> {
  // 房间越高，稀有装备概率越大
  const legendaryChance = Math.min(5 + roomNumber * 0.5, 15);
  const epicChance = Math.min(10 + roomNumber, 25);
  const rareChance = Math.min(25 + roomNumber * 0.5, 35);
  const commonChance = 100 - legendaryChance - epicChance - rareChance;

  return {
    common: commonChance,
    rare: rareChance,
    epic: epicChance,
    legendary: legendaryChance
  };
}

/**
 * 随机生成一件装备
 */
export function generateRandomEquipment(roomNumber: number): Equipment {
  const weights = getDropWeights(roomNumber);
  
  // 根据权重随机选择稀有度
  const roll = Math.random() * 100;
  let rarity: EquipmentRarity;
  
  if (roll < weights.legendary) {
    rarity = 'legendary';
  } else if (roll < weights.legendary + weights.epic) {
    rarity = 'epic';
  } else if (roll < weights.legendary + weights.epic + weights.rare) {
    rarity = 'rare';
  } else {
    rarity = 'common';
  }
  
  // 筛选该稀有度的装备
  const candidates = EQUIPMENT_POOL.filter(e => e.rarity === rarity);
  
  // 随机选择一件
  const equipment = candidates[Math.floor(Math.random() * candidates.length)];
  
  // 创建装备副本（可以在这里添加随机词条变化）
  return { ...equipment };
}
