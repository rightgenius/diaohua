# 雕花 (DiaoHua)

> 产品经理需求标注工具 —— 截图标注需求，AI生成效果图，让产品设计更高效

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)
![Electron](https://img.shields.io/badge/Electron-34.0.0-47848F.svg)

## 📖 项目简介

**雕花**是一款面向产品经理的桌面端需求标注工具。通过内置浏览器访问存量网站，支持截图标注、AI辅助优化需求文档，并调用 Google Gemini API 生成可视化效果图，形成完整的需求设计闭环。

### 核心价值

- 🎯 **所见即所得** —— 直接在目标网站上操作、截图、标注，保留完整的交互上下文
- 🤖 **AI 辅助增强** —— 不仅优化PRD文字表达，还生成可视化的设计参考和效果图
- 🔄 **设计闭环** —— 标注 → AI优化 → 效果图生成 → 评审 → 迭代，一站式完成
- ☁️ **全云端存储** —— 支持多种 S3 兼容对象存储（七牛云、阿里云、MinIO 等），换设备无缝同步
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
- **全屏截图**：一键截取整个屏幕
- **截图编辑器**：全屏编辑界面，支持：
  - 🔲 矩形标注
  - 🔵 圆形标注  
  - ➡️ 箭头标注
  - ✏️ 文字标注
  - 🫥 马赛克处理
  - ✂️ 裁剪功能
  - 🎨 7种颜色可选
  - 📏 3种粗细调节
  - ↩️ 撤销/重做
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
- 支持多种 S3 兼容对象存储服务（七牛云、阿里云 OSS、AWS S3、MinIO 等）
- 本地优先 + 云端同步
- 支持本地配置文件，方便开发调试

### 6. 导出功能
- **JSON格式**：结构化数据，编程Agent友好
- **Markdown格式**：便于阅读和分享
- 包含截图、标注、PRD、效果图完整信息

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/yourusername/diaohua.git
   cd diaohua
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置 API 密钥（两种方式）**

   **方式一：本地配置文件（推荐开发使用）**
   
   创建 `diaohua-config.json` 文件到项目根目录：
   ```json
   {
     "geminiApiKey": "your-gemini-api-key",
     "storage": {
       "provider": "qiniu",
       "region": "cn-east-1",
       "bucket": "your-bucket",
       "accessKey": "your-access-key",
       "secretKey": "your-secret-key"
     }
   }
   ```
   
   **方式二：通过界面配置**
   
   首次运行时会自动跳转到设置页面，手动填写：
   - **Google Gemini API Key**：[获取地址](https://aistudio.google.com/app/apikey)
   - **对象存储配置**：支持七牛云、阿里云 OSS、AWS S3、MinIO 等

4. **运行开发环境**
   ```bash
   # 终端 1：启动 Vite 开发服务器
   npm run dev
   
   # 终端 2：启动 Electron
   npm run electron:dev
   ```

5. **构建生产版本**
   ```bash
   npm run electron:build
   ```

## 📋 使用流程

```
1. 打开雕花 → 新建需求
      ↓
2. 在右侧浏览器输入目标网站URL（可选）
      ↓
3. 点击「截图」按钮 → 截取全屏
      ↓
4. 在截图编辑器中：
   - 裁剪需要的区域
   - 添加矩形、圆形、箭头、文字标注
   - 使用马赛克处理敏感信息
      ↓
5. 完成标注后点击「完成」→ 截图添加到需求
      ↓
6. 完成所有截图后，补充文字描述
      ↓
7. 点击「AI生成」→ 系统生成优化PRD和设计参考
      ↓
8. 点击「生成效果图」→ AI生成2张效果图（相同Prompt）
      ↓
9. 查看方案A/B，选择满意的一张
      ↓
10. 导出为JSON/Markdown，分享给团队或编程Agent
```

## 🏗️ 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                   桌面应用 (Electron)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   浏览器    │  │  标注编辑器  │  │   需求管理界面      │ │
│  │ (Chromium)  │  │  (Fabric.js)│  │    (React)          │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────┬───────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
            ┌──────────────┐    ┌──────────────┐
            │  对象存储     │    │ Google Gemini│
            │ (S3 兼容)    │    │ (AI生成)     │
            └──────────────┘    └──────────────┘
```

### 技术栈

| 层级 | 技术 |
|------|------|
| 桌面框架 | Electron 34.x |
| 前端框架 | React 18 + TypeScript |
| 构建工具 | Vite 5.x |
| 状态管理 | Zustand + persist |
| UI组件 | Tailwind CSS + shadcn/ui |
| 截图/标注 | desktopCapturer + Fabric.js |
| AI服务 | Google Gemini API |
| 存储 | S3 兼容对象存储 |

## 📁 项目结构

```
diaohua/
├── electron/                # Electron 主进程
│   ├── main.cjs             # 主进程入口
│   └── preload.cjs          # 预加载脚本
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
├── public/                  # 静态资源（应用图标）
├── package.json
└── README.md
```

## ⚙️ 配置说明

### 本地配置文件

为了方便开发和调试，你可以创建本地配置文件 `diaohua-config.json`：

```json
{
  "geminiApiKey": "your-gemini-api-key",
  "storage": {
    "provider": "qiniu",
    "endpoint": "https://s3.cn-east-1.qiniucs.com",
    "region": "cn-east-1",
    "bucket": "your-bucket",
    "accessKey": "your-access-key",
    "secretKey": "your-secret-key",
    "domain": "https://your-cdn-domain.com"
  }
}
```

**支持的存储服务商：**
- `qiniu` - 七牛云 Kodo
- `aliyun` - 阿里云 OSS
- `aws` - AWS S3
- `minio` - MinIO
- `s3` - 通用 S3 兼容服务

配置文件位置（按查找优先级）：
1. `diaohua/diaohua-config.json`（开发时使用）
2. `~/Library/Application Support/diaohua/diaohua-config.json`（macOS 用户目录）
3. 应用资源目录（生产环境）

> ⚠️ **注意**：配置文件包含敏感信息，已添加到 `.gitignore`，请勿提交到 Git。

### Google Gemini API

1. 访问 [Google AI Studio](https://aistudio.google.com/app/apikey)
2. 创建新的 API Key
3. 在配置文件或雕花设置页面中填入

> **注意**：Gemini API 有免费额度限制，请查看官方文档了解详情。

### 对象存储

支持任何 S3 兼容的对象存储服务：

**七牛云**
1. 注册 [七牛云](https://www.qiniu.com/) 账号
2. 创建对象存储 Bucket
3. 在密钥管理中获取 Access Key 和 Secret Key

**阿里云 OSS**
1. 注册 [阿里云](https://www.aliyun.com/) 账号
2. 创建 OSS Bucket
3. 在 RAM 访问控制中获取 AccessKey

**MinIO（私有部署）**
1. 部署 MinIO 服务
2. 创建 Bucket
3. 配置 Endpoint 为 MinIO 地址（如 `http://localhost:9000`）

## 🛣️ 路线图

### v0.1.0 (MVP)
- [x] 浏览器工作台（Electron WebView）
- [x] 截图标注功能（desktopCapturer + Fabric.js）
- [x] AI PRD 生成
- [x] AI 效果图生成（相同 Prompt 生成 2 张）
- [x] 支持多种 S3 兼容对象存储
- [x] 本地配置文件支持
- [x] JSON/Markdown/PDF 导出
- [x] 截图编辑器（矩形、圆形、箭头、文字、马赛克、裁剪）

### v0.2.0
- [ ] 修复截图黑屏问题
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

- [Electron](https://www.electronjs.org/) - 跨平台桌面应用框架
- [Google Gemini](https://deepmind.google/technologies/gemini/) - AI 大模型
- [shadcn/ui](https://ui.shadcn.com/) - UI 组件库
- [Fabric.js](http://fabricjs.com/) - Canvas 图形库

---

<p align="center">
  <b>让产品设计像雕花一样精益求精</b>
</p>
