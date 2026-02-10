# 雕花 (DiaoHua)

> 产品经理需求标注工具 —— 截图标注需求，AI生成效果图，让产品设计更高效

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)

## 📖 项目简介

**雕花**是一款面向产品经理的桌面端需求标注工具。通过内置浏览器访问存量网站，支持截图标注、AI辅助优化需求文档，并调用 Google Gemini API 生成可视化效果图，形成完整的需求设计闭环。

### 核心价值

- 🎯 **所见即所得** —— 直接在目标网站上操作、截图、标注，保留完整的交互上下文
- 🤖 **AI 辅助增强** —— 不仅优化PRD文字表达，还生成可视化的设计参考和效果图
- 🔄 **设计闭环** —— 标注 → AI优化 → 效果图生成 → 评审 → 迭代，一站式完成
- ☁️ **全云端存储** —— 所有数据保存在七牛云OSS，换设备无缝同步
- 📤 **Agent友好** —— 导出格式专为AI编程优化，可直接作为AI Coding Agent的输入

## 🖼️ 界面预览

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [雕] 首页  新建  项目              设置                                 │
├─────────┬───────────────────────────────────────────────────────────────┤
│         │  [截图]  [地址栏: https://xxx.com]  [刷新]                    │
│ 截图列表 │                                                               │
│ ┌─────┐ │              网页浏览区域                                     │
│ │ 图1 │ │              (完整浏览器内核)                                  │
│ └─────┘ │                                                               │
│ ┌─────┐ │                                                               │
│ │ 图2 │ │                                                               │
│ └─────┘ │                                                               │
│ [+添加] │                                                               │
├─────────┴───────────────────────────────────────────────────────────────┤
│ 描述：觉得现在的首页太乱了，想改得简洁一些...                            │
└─────────────────────────────────────────────────────────────────────────┘
```

## ✨ 功能特性

### 1. 浏览器工作台
- 地址栏输入任意URL，正常浏览网站
- 完整的浏览器导航（前进/后退/刷新）
- 支持登录态保持（Cookie/Session）

### 2. 截图标注
- 截取当前网页可视区域
- 矩形、圆形、箭头、画笔、文字标注工具
- 每张截图可添加文字说明

### 3. AI 需求优化
- 基于截图标注和描述，自动生成优化后的PRD
- 提取设计参考（布局、配色、组件建议）
- 生成用于效果图的优化Prompt

### 4. AI 效果图生成
- 调用 Google Gemini Imagen 生成效果图
- **相同Prompt生成2张**（仅随机性不同，风格保持一致）
- A/B对比评审，选择满意方案

### 5. 数据管理
- 所有数据存储在七牛云OSS
- 跨设备同步
- 支持多人协作（后续版本）

### 6. 导出功能
- **JSON格式**：结构化数据，编程Agent友好
- **Markdown格式**：便于阅读和分享
- 包含截图、标注、PRD、效果图完整信息

## 🚀 快速开始

### 环境要求

- Node.js 18+
- Rust 1.70+（Tauri需要）
- npm 或 yarn

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/yourusername/diaohua.git
   cd diaohua
   ```

2. **安装前端依赖**
   ```bash
   npm install
   ```

3. **配置API密钥**
   
   首次运行时会自动跳转到设置页面，需要配置：
   
   - **Google Gemini API Key**：[获取地址](https://aistudio.google.com/app/apikey)
   - **七牛云OSS**：
     - Access Key / Secret Key：[七牛云控制台](https://portal.qiniu.com/)
     - Bucket 名称
     - 域名（可选，默认使用七牛测试域名）

4. **运行开发环境**
   ```bash
   npm run tauri:dev
   ```

5. **构建生产版本**
   ```bash
   npm run tauri:build
   ```

## 📋 使用流程

```
1. 打开雕花 → 新建需求
      ↓
2. 在右侧浏览器输入目标网站URL
      ↓
3. 操作到目标页面 → 点击「截图」
      ↓
4. 在标注编辑器中圈选、勾画、添加说明
      ↓
5. 完成所有截图后，补充文字描述
      ↓
6. 点击「AI生成」→ 系统生成优化PRD和设计参考
      ↓
7. 点击「生成效果图」→ AI生成2张效果图（相同Prompt）
      ↓
8. 查看方案A/B，选择满意的一张
      ↓
9. 导出为JSON/Markdown，分享给团队或编程Agent
```

## 🏗️ 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                    桌面应用 (Tauri)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   浏览器    │  │  标注编辑器  │  │   需求管理界面      │ │
│  │  (WebView)  │  │  (Fabric.js)│  │    (React)          │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────┬───────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
            ┌──────────────┐    ┌──────────────┐
            │  七牛云OSS    │    │ Google Gemini│
            │  (数据存储)   │    │ (AI生成)     │
            └──────────────┘    └──────────────┘
```

### 技术栈

| 层级 | 技术 |
|------|------|
| 桌面框架 | Tauri 2.0 |
| 前端框架 | React 18 + TypeScript |
| 状态管理 | Zustand |
| UI组件 | Tailwind CSS + shadcn/ui |
| 截图/标注 | html2canvas + Fabric.js |
| AI服务 | Google Gemini API |
| 存储 | 七牛云OSS |

## 📁 项目结构

```
diaohua/
├── src/
│   ├── components/          # React组件
│   │   ├── browser/         # 浏览器工作台
│   │   ├── editor/          # 标注编辑器
│   │   ├── ai/              # AI生成相关
│   │   └── ui/              # 基础UI组件
│   ├── pages/               # 页面组件
│   ├── stores/              # Zustand状态管理
│   ├── services/            # API服务封装
│   ├── utils/               # 工具函数
│   └── types/               # TypeScript类型
├── src-tauri/               # Tauri Rust后端
├── package.json
└── README.md
```

## ⚙️ 配置说明

### Google Gemini API

1. 访问 [Google AI Studio](https://aistudio.google.com/app/apikey)
2. 创建新的API Key
3. 在雕花设置页面中填入

> **注意**：Gemini API有免费额度限制，请查看官方文档了解详情。

### 七牛云OSS

1. 注册 [七牛云](https://www.qiniu.com/) 账号
2. 创建对象存储Bucket
3. 在密钥管理中获取Access Key和Secret Key
4. 在雕花设置页面中填入

## 🛣️ 路线图

### v0.1.0 (MVP)
- [x] 浏览器工作台
- [x] 截图标注功能
- [x] AI PRD生成
- [x] AI效果图生成（相同Prompt生成2张）
- [x] 七牛云OSS存储
- [x] JSON/Markdown导出

### v0.2.0
- [ ] 多人协作
- [ ] 评论系统
- [ ] 项目模板
- [ ] 快捷键支持

### v0.3.0
- [ ] 与Figma/Sketch集成
- [ ] 直接生成前端代码预览
- [ ] 与项目管理工具集成（Jira、飞书等）

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的修改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

## 📄 许可证

[MIT](LICENSE) © 2024 雕花团队

## 🙏 致谢

- [Tauri](https://tauri.app/) - 跨平台桌面应用框架
- [Google Gemini](https://deepmind.google/technologies/gemini/) - AI大模型
- [七牛云](https://www.qiniu.com/) - 对象存储服务
- [shadcn/ui](https://ui.shadcn.com/) - UI组件库

---

<p align="center">
  <b>让产品设计像雕花一样精益求精</b>
</p>
