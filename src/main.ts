import Phaser from 'phaser';
import { GameConfig } from './config';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { Level1Scene } from './scenes/Level1Scene';

// 注册所有场景
GameConfig.scene = [
  BootScene,
  MenuScene,
  Level1Scene
];

// 创建游戏实例
const game = new Phaser.Game(GameConfig);

// 全局游戏实例（用于调试）
(window as any).game = game;

console.log('🎮 海绵宝宝 Roguelike 已启动！');
console.log('📦 Phaser版本:', Phaser.VERSION);
