# 🧽 海绵宝宝 Roguelike - 保卫蟹堡王

一款基于 Phaser 3.90 + TypeScript + Vite 的 2D 动作 Roguelike 游戏

## 🎮 游戏特色

- 🎯 **2D 横版动作**：流畅的动作体验
- 🎲 **Roguelike 玩法**：每局随机技能和敌人词条
- 🤖 **AI 增强**：Gemini AI 动态生成内容
- 🏆 **装备成长**：装备爆装、词条、强化系统
- 📱 **多平台支持**：PC 和手机浏览器都能玩

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 浏览器打开 http://localhost:5173
```

## 🏗️ 项目结构

```
spongebob-roguelike/
├── src/
│   ├── main.ts              # 游戏入口
│   ├── config.ts            # Phaser配置
│   ├── scenes/              # 游戏场景
│   │   ├── BootScene.ts     # 加载场景
│   │   ├── MenuScene.ts     # 菜单场景
│   │   └── Level1Scene.ts   # 第一关
│   ├── entities/            # 游戏对象（玩家、敌人、Boss）
│   ├── systems/             # 核心系统（战斗、技能、装备、AI）
│   ├── ui/                  # UI界面
│   ├── data/                # 游戏数据
│   │   └── constants.ts     # 游戏常量
│   ├── services/            # 外部服务（Gemini API等）
│   └── utils/               # 工具函数
├── public/
│   └── assets/              # 游戏资源
│       ├── images/          # 图片资源
│       ├── sounds/          # 音效资源
│       └── fonts/           # 字体资源
└── package.json
```

## 🎯 当前进度

- [x] 项目初始化
- [x] 基础场景系统
- [x] 玩家移动和跳跃
- [x] 简单敌人AI
- [x] 波次战斗系统
- [ ] Boss战实现
- [ ] 技能系统
- [ ] 装备系统
- [ ] Gemini AI集成
- [ ] 音效和粒子特效

## 🎮 操作说明

- **← →** 移动
- **空格** 跳跃
- **X** 攻击

## 📦 技术栈

- **游戏引擎**: Phaser 3.90
- **语言**: TypeScript 5.9
- **构建工具**: Vite 7.2
- **AI**: Google Gemini API（即将集成）

## 🔧 开发命令

```bash
# 开发模式（热更新）
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 📖 下一步计划

1. **完善第一关**
   - 添加Boss战（痞老板机甲）
   - 改进敌人AI
   - 添加粒子特效

2. **核心系统**
   - 技能系统（3选1 Roguelike）
   - 装备系统
   - 伤害计算

3. **AI集成**
   - Gemini API调用
   - 动态技能生成
   - 怪物词条生成

4. **优化体验**
   - 音效和音乐
   - 更好的视觉效果
   - 手机触控支持

## 📝 开发日志

### 2025-12-06
- ✅ 项目初始化（Vite + Phaser + TypeScript）
- ✅ 创建基础场景系统
- ✅ 实现玩家移动、跳跃、攻击
- ✅ 实现波次敌人系统
- ✅ 基础UI（血量、波次显示）

## 📄 许可证

MIT License

---

**开发者**: @xin.y  
**引擎**: Phaser 3.90  
**日期**: 2025年12月
