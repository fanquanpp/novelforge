# NovelForge

一款为长篇创作者打造的离线小说创作工作站，让创作者专注于文字本身。

## 项目简介

NovelForge 取自 Novel（小说）与 Forge（锻造），寓意「锻造你的故事」。它将项目管理、章节编辑、角色设定、伏笔追踪、版本快照等创作所需的全部能力，整合到一个离线可用的桌面应用中。

不依赖云端，不需注册，打开即写。

## 核心特性

### 创作工作台
- 三栏布局：左侧分类导航 + 中间编辑区 + 右侧文件列表
- 专注模式（F11）：隐藏侧边栏与文件列表，沉浸式写作
- 专注计时器（Ctrl+Shift+T）：番茄钟式写作节奏管理
- 命令面板（Ctrl+K）：快速执行任意操作

### 编辑器体验
- 首行缩进：中文段落自动两字符缩进
- 角色名补全：输入对话时自动轮换填充角色名（Ctrl+Shift+N）
- 智能配对：括号与引号自动配对，支持全角/半角
- 当前段落高亮：光标所在段落左侧色条标注
- 批量缩进：Tab / Shift+Tab 多行批量缩进
- 打字机模式：光标始终居中
- 焦点暗化：非当前段落自动降低亮度
- VSCode 风格快捷键：熟悉的高效操作体验

### 角色系统
- 角色卡片管理：结构化字段，可视化浏览
- 角色出场统计：扫描全文统计每个角色的出现次数与分布
- 全局改名：一键替换项目内所有角色名
- 角色悬停卡片：正文中的角色名悬停显示角色摘要

### 伏笔追踪（v2.8.0 新增）
- 自动扫描项目伏笔目录
- 按状态分组展示：未回收 / 已回收 / 已废弃
- 统计概览卡片一目了然
- 展开详情查看埋设位置、回收位置、备注
- 点击跳转到伏笔文件编辑

### 版本快照
- 自动创建文件快照
- 一键恢复历史版本
- 快照统计与清理

### 项目管理
- 10 种文体模板：标准长篇、短篇小说、日记体、对话体、长篇分卷、同世界观系列、剧本式、诗歌体
- 项目导入导出：.novelforge 归档格式
- 自定义模板：保存常用目录结构
- 分卷章节批量生成：自动编号、卷首语、卷尾语

### 模块联动
- 大纲生成章节：从大纲文件批量生成章节
- 全局搜索替换：跨文件查找与批量替换
- 写作统计：字数分布、章节统计、创作天数

## 下载安装

前往 [Releases 页面](https://github.com/fanquanpp/novelforge/releases) 下载最新版本：

- **MSI 安装包**：Windows 标准安装程序
- **NSIS 安装程序**：轻量级安装程序

支持 Windows 10/11 x64。

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| Ctrl+K | 命令面板 |
| Ctrl+S | 保存文件 |
| F11 | 专注模式 |
| Ctrl+Shift+T | 专注计时器 |
| Alt+1~8 | 切换侧边栏分类 |
| Ctrl+Shift+N | 角色名补全 |
| Tab / Shift+Tab | 批量缩进 / 取消缩进 |
| Esc | 关闭对话框 / 退出专注模式 |

## 技术栈

- **桌面框架**：Tauri 2.0（Rust 后端）
- **前端框架**：React 18 + TypeScript
- **编辑器**：TipTap（ProseMirror）
- **样式方案**：Tailwind CSS
- **状态管理**：Zustand
- **动画引擎**：Framer Motion
- **国际化**：中英文双语

## 项目结构

```
novelforge/
├── src/                          # 前端源码
│   ├── components/               # UI 组件
│   │   ├── Launcher.tsx          # 启动器（项目管理）
│   │   ├── Workspace.tsx         # 工作台（三栏布局）
│   │   ├── NovelEditor.tsx       # 小说编辑器
│   │   ├── ForeshadowingPanel.tsx# 伏笔追踪面板
│   │   ├── CharacterHoverCard.tsx# 角色悬停卡片
│   │   ├── CardManager.tsx       # 卡片管理器
│   │   ├── GlobalSearch.tsx      # 全局搜索
│   │   ├── WritingStats.tsx      # 写作统计
│   │   └── ...
│   ├── lib/                      # 核心库
│   │   ├── api.ts                # Tauri 命令封装
│   │   ├── store.ts              # 全局状态
│   │   ├── i18n.tsx              # 国际化
│   │   ├── templateRegistry.ts   # 模板注册表
│   │   └── ...
│   └── ...
├── src-tauri/                    # Rust 后端
│   └── src/
│       ├── fs_commands.rs       # 文件系统命令
│       ├── project_template.rs   # 项目模板
│       ├── snapshot_commands.rs # 版本快照
│       ├── character_commands.rs # 角色联动
│       ├── foreshadowing_commands.rs # 伏笔追踪
│       └── lib.rs                # 应用入口
└── ...
```

## 开发

### 环境要求

- Node.js 18+
- Rust（stable 工具链）
- Windows 10/11（主开发平台）

### 本地运行

```bash
npm install
npm run tauri dev
```

### 构建发布

```bash
npm run tauri build
```

构建产物位于 `src-tauri/target/release/bundle/`。

## 许可证

本项目仅供个人使用。
