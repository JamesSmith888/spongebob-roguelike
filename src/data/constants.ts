// 游戏常量配置

// 画布尺寸
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const GROUND_Y = 550;

// 物理常量
export const GRAVITY = 800;
export const PLAYER_SPEED = 200;
export const PLAYER_JUMP_FORCE = -480;
export const ENEMY_SPEED = 100;

// 游戏平衡
export const PLAYER_MAX_HEALTH = 100;
export const PLAYER_START_AMMO = 30;
export const ENEMY_BASE_HEALTH = 20;
export const BOSS_BASE_HEALTH = 150;

// 颜色
export const COLORS = {
  SPONGEBOB_YELLOW: 0xFFFF00,
  PLANKTON_GREEN: 0x00FF00,
  ROBOT_GRAY: 0x808080,
  DAMAGE_RED: 0xFF0000,
  HEALTH_GREEN: 0x00FF00
};

// 关卡配置
export const LEVEL_1_CONFIG = {
  waves: 3,
  enemiesPerWave: [3, 7, 10],
  hasBoss: true,
  bossName: 'Plankton Mecha'
};
