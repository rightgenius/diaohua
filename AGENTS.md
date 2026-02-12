# 雕花 (DiaoHua) - AI 辅助需求标注工具

> 面向产品经理的桌面端需求标注工具，支持截图标注、AI 生成 PRD 和效果图。

## 项目概述

**雕花**是一款基于 Electron + React + TypeScript 开发的桌面应用，主要功能包括：

- **浏览器工作台**：内置浏览器访问网站，支持地址栏导航
- **截图标注**：支持系统截图、网页截图，提供 Fabric.js 标注编辑器
- **AI PRD 生成**：基于 Google Gemini API 生成优化后的需求文档
- **AI 效果图生成**：调用 Gemini Imagen 生成 A/B 双方案效果图
- **数据管理**：本地 Zustand 存储 + 七牛云 OSS 云端同步
- **导出功能**：支持 JSON、Markdown、PDF 格式导出

## 技术栈

| 层级 | 技术 | 说明 |
|-----|------|------|
| 桌面框架 | Electron 34.x | 跨平台桌面应用 |
| 前端框架 | React 18 + TypeScript | UI 开发 |
| 构建工具 | Vite 5.x | 开发服务器和打包 |
| 状态管理 | Zustand + persist | 本地数据持久化 |
| UI 样式 | Tailwind CSS 3.x + CSS Variables | 原子化 CSS |
| 组件库 | shadcn/ui 风格 | 自定义组件 |
| 标注引擎 | Fabric.js 5.x | Canvas 标注编辑器 |
| AI 服务 | Google Gemini API | 文本生成 + 图片生成 |
| 云存储 | 七牛云 OSS | 图片和文件存储 |
| 截图方案 | Electron desktopCapturer + capturePage | 系统/网页截图 |

## 项目结构

```
diaohua/
├── electron/                 # Electron 主进程代码
│   ├── main.cjs             # 主进程入口（窗口管理、IPC 处理、OSS 上传）
│   └── preload.cjs          # 预加载脚本（API 暴露、TAURI 兼容层）
├── src/
│   ├── components/          # React 组件
│   │   ├── ai/              # AI 相关组件
│   │   │   ├── AIResultPanel.tsx    # AI 生成结果面板
│   │   │   └── MockupReview.tsx     # 效果图评审界面
│   │   ├── browser/         # 浏览器工作台
│   │   │   └── BrowserWorkbench.tsx # 内置浏览器 + 截图按钮
│   │   ├── comments/        # 评论系统
│   │   ├── editor/          # 标注编辑器
│   │   ├── export/          # 导出功能
│   │   ├── layout/          # 布局组件
│   │   ├── notification/    # 通知中心
│   │   ├── prd/             # PRD 版本历史
│   │   ├── screenshot/      # 截图相关组件
│   │   │   ├── AnnotationEditor.tsx # 标注编辑器（Fabric.js）
│   │   │   └── ScreenshotList.tsx   # 截图列表
│   │   ├── settings/        # 设置表单
│   │   ├── share/           # 分享功能
│   │   └── ui/              # 基础 UI 组件
│   ├── pages/               # 页面组件
│   │   ├── Dashboard.tsx           # 需求列表页
│   │   ├── RequirementEditor.tsx   # 需求编辑页
│   │   ├── Settings.tsx            # 设置页
│   │   └── Share.tsx               # 分享页面
│   ├── services/            # API 服务封装
│   │   ├── gemini.ts        # Gemini API 服务
│   │   ├── oss.ts           # 七牛云 OSS 服务
│   │   ├── screenshot.ts    # 截图服务封装
│   │   └── sync.ts          # 数据同步服务
│   ├── stores/              # Zustand 状态管理
│   │   ├── configStore.ts   # 应用配置（API Key、OSS 配置）
│   │   ├── requirementStore.ts # 需求数据管理
│   │   └── index.ts         # Store 导出
│   ├── types/               # TypeScript 类型定义
│   │   └── index.ts         # 所有类型定义
│   ├── utils/               # 工具函数
│   │   ├── cn.ts            # className 合并
│   │   ├── export.ts        # 导出功能
│   │   ├── localConfig.ts   # 本地配置加密存储
│   │   ├── oss.ts           # OSS 工具函数
│   │   └── ossDefaults.ts   # OSS 默认配置
│   ├── App.tsx              # 路由配置
│   └── main.tsx             # 应用入口
├── public/                  # 静态资源（应用图标、Logo）
│   ├── icon.png             # 应用图标（512x512，多平台通用）
│   ├── icon.icns            # macOS 图标
│   └── icon.ico             # Windows 图标
├── dist/                    # 构建输出（Vite 生成）
├── package.json             # 项目配置和依赖
├── vite.config.ts           # Vite 配置
├── tailwind.config.js       # Tailwind CSS 配置
└── tsconfig.json            # TypeScript 配置
```

## 开发命令

```bash
cd diaohua

# 安装依赖
npm install

# 开发环境（需要两个终端）
npm run dev          # 终端 1: 启动 Vite 开发服务器
npm run electron:dev # 终端 2: 启动 Electron

# 快捷命令（macOS）
npm run electron:restart  # 重启 Electron

# 构建生产版本
npm run build              # 构建前端代码
npm run electron:build     # 构建完整应用（含打包）
npm run electron:preview   # 预览生产版本
```

## 关键开发注意事项

### 1. 主进程 vs 渲染进程

| 代码位置 | 热更新 | 说明 |
|---------|-------|------|
| `electron/*.cjs` | ❌ 需重启 | 主进程代码（窗口、IPC、文件操作）|
| `src/**/*` | ✅ 自动 | 渲染进程代码（React 组件） |

**修改 `electron/main.cjs` 或 `electron/preload.cjs` 后必须重启 Electron**。

### 2. IPC 通信

主进程通过 `ipcMain.handle` 注册处理器，预加载脚本通过 `contextBridge.exposeInMainWorld` 暴露 API：

```typescript
// 渲染进程中调用
const base64 = await window.electronAPI.captureScreen();
```

可用的 API：
- `captureScreen()` - 系统截图
- `captureWebpage(url, options)` - 网页截图
- `qiniuUpload(config, base64Data, key)` - 七牛云上传
- `showSaveDialog(options)` - 保存文件对话框
- `saveFile(filePath, data)` - 保存文件

### 3. 状态管理

使用 Zustand + persist 中间件实现本地数据持久化：

```typescript
// requirementStore.ts - 需求数据自动保存到 localStorage
export const useRequirementStore = create<RequirementState>()(
  persist(
    (set, get) => ({ ... }),
    { name: 'diaohua-requirements' }
  )
);
```

### 4. AI 服务集成

Gemini API 配置存储在 `configStore` 中，需要用户首次使用时在设置页面配置：

- **Gemini API Key**: 用于文本生成（PRD）和图片生成（Imagen）
- **七牛云 OSS**: 用于图片存储和同步

### 5. 截图功能实现

项目实现了多种截图方案：

1. **系统截图** (`desktopCapturer`): 截取整个屏幕，需要屏幕录制权限
2. **网页截图** (`capturePage`): 截取指定 URL，创建隐藏窗口加载后截图
3. **WebView 截图** (废弃): 使用 `modern-screenshot` 库，受 CSP 限制

## 代码风格规范

- **语言**: TypeScript，严格模式开启
- **组件**: 函数组件 + Hooks
- **样式**: Tailwind CSS，使用 `cn()` 工具函数合并类名
- **类型**: 所有类型定义在 `src/types/index.ts`
- **导入**: 使用 `@/` 路径别名指向 `src/`

## 测试策略

当前项目**无自动化测试**，测试通过以下方式进行：

1. **手动测试**: 开发时使用 `npm run electron:dev` 进行功能验证
2. **生产预览**: 使用 `npm run electron:preview` 测试生产构建

## 构建与打包

```bash
# 构建前端代码到 dist/
npm run build

# 打包 Electron 应用
npm run electron:build
```

打包配置在 `package.json` 的 `build` 字段：
- macOS: `.dmg` (x64 + arm64)
- Windows: `.exe` (x64)
- Linux: `.AppImage` (x64)

输出目录: `diaohua/release/`

## 安全注意事项

1. **API Key 存储**: 本地加密存储在 `localStorage`，不提交到版本控制
2. **预加载脚本**: 使用 `contextIsolation: true` 和 `contextBridge` 隔离主进程 API
3. **OSS 凭证**: 不上传到公开仓库，用户本地配置
4. **CSP 策略**: 开发时 `webSecurity: false`，生产环境需注意

## 应用图标

应用图标设计为黑底圆角方块 + 白色「雕」字，与界面 Logo 保持一致。

图标文件位置：`public/`
- `icon.png` - 512x512 PNG（通用格式、Linux 使用）
- `icon.icns` - macOS 图标集（包含 16x16 到 1024x1024 多种尺寸）
- `icon.ico` - Windows 图标（包含 16x16 到 256x256 多种尺寸）

图标生成脚本位于 `build_assets/` 目录，使用 Python Pillow 生成。
如需修改图标，编辑生成脚本后重新运行即可。

## 已知问题

1. **截图黑屏**: 部分 macOS 系统需要屏幕录制权限，在「系统设置 > 隐私与安全性 > 屏幕录制」中启用
2. **EPIPE 错误**: 已添加安全日志函数 `safeLog()` 防止控制台写入错误导致崩溃
3. **跨域限制**: 部分网站（GitHub、Google）在 iframe 中受 CSP 限制，使用系统截图替代

## 文件命名约定

- 组件文件: PascalCase (如 `AnnotationEditor.tsx`)
- 工具文件: camelCase (如 `localConfig.ts`)
- 类型文件: 与相关功能同名，类型定义使用 PascalCase
- 样式: 使用 Tailwind，无单独 CSS 文件（除全局样式）

## 版本信息

- 当前版本: `0.1.0`
- 应用 ID: `com.diaohua.app`
- 产品名称: 雕花
