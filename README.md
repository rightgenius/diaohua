# 雕花 (DiaoHua) - AI 辅助需求标注工具

[![Electron](https://img.shields.io/badge/Electron-34.x-47848F?logo=electron)](https://electronjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)

> 面向产品经理的桌面端需求标注工具，支持截图标注、AI 生成 PRD 和效果图。

![雕花界面预览](./screenshots/preview.png)

## 功能特性

### 核心功能
- **浏览器工作台** - 内置浏览器访问任意网站，支持地址栏导航
- **截图标注** - 支持网页截图、系统截图，提供 Fabric.js 标注编辑器
- **AI PRD 生成** - 基于 Google Gemini API 生成优化后的需求文档，支持手动编辑
- **AI 效果图生成** - 调用 Gemini Imagen 生成 A/B 双方案效果图，Prompt 可编辑
- **数据管理** - 本地 Zustand 存储 + 七牛云 OSS 云端同步
- **导出功能** - 支持 JSON、Markdown、PDF 格式导出

### 截图标注功能
- ✅ 多种标注工具：矩形、圆形、箭头、画笔、文字
- ✅ 截图裁剪（框选裁剪区域）
- ✅ 截图拖拽排序
- ✅ 截图元数据（记录截图时 URL）

### AI 生成功能
- ✅ 基于截图和需求描述自动生成 PRD 文档
- ✅ 自动生成设计建议（布局风格、配色方案、组件建议）
- ✅ 生成效果图生成 Prompt
- ✅ **所有 AI 生成内容均可手动编辑**
- ✅ A/B 双方案效果图对比

## 技术栈

| 层级 | 技术 | 说明 |
|-----|------|------|
| 桌面框架 | Electron 34.x | 跨平台桌面应用 |
| 前端框架 | React 18 + TypeScript | UI 开发 |
| 构建工具 | Vite 5.x | 开发服务器和打包 |
| 状态管理 | Zustand + persist | 本地数据持久化 |
| UI 样式 | Tailwind CSS 3.x | 原子化 CSS |
| 标注引擎 | Fabric.js 5.x | Canvas 标注编辑器 |
| AI 服务 | Google Gemini API | 文本生成 + 图片生成 |
| 云存储 | 七牛云 OSS | 图片和文件存储 |

## 快速开始

### 安装依赖

```bash
cd diaohua
npm install
```

### 配置 AI 服务（可选）

创建 `diaohua-config.json` 到项目根目录：

```json
{
  "geminiApiKey": "your-gemini-api-key"
}
```

或者启动后在设置界面手动配置。

### 开发环境

需要同时运行两个命令：

```bash
# 终端 1: 启动 Vite 开发服务器
npm run dev

# 终端 2: 启动 Electron
npm run electron:dev
```

### 构建生产版本

```bash
# 构建前端代码
npm run build

# 打包 Electron 应用
npm run electron:build
```

## 使用指南

### 1. 创建需求
- 点击「新建」按钮创建需求
- 输入需求标题

### 2. 截图标注
- 在「截图」标签页使用浏览器工作台
- 点击「截图」按钮截取网页
- 使用标注工具进行标注（矩形、箭头、文字等）
- 支持裁剪和排序

### 3. AI 生成
- 填写需求描述
- 点击「AI生成」按钮
- 自动生成 PRD、设计建议和效果图 Prompt

### 4. 编辑 AI 生成内容
- 切换到「Prompt生成」标签页
- PRD 文档、设计建议、效果图 Prompt 均可直接编辑
- 修改自动保存

### 5. 生成效果图
- 点击「生成效果图」按钮
- 查看 A/B 双方案对比
- 选择满意的方案

### 6. 导出
- 支持导出 JSON、Markdown、PDF 格式

## 项目结构

```
diaohua/
├── electron/              # Electron 主进程代码
│   ├── main.cjs          # 主进程入口
│   └── preload.cjs       # 预加载脚本
├── src/
│   ├── components/       # React 组件
│   ├── pages/            # 页面组件
│   ├── services/         # API 服务封装
│   ├── stores/           # Zustand 状态管理
│   ├── types/            # TypeScript 类型定义
│   └── utils/            # 工具函数
├── public/               # 静态资源
└── package.json
```

## 注意事项

1. **截图权限**: macOS 用户可能需要在「系统设置 > 隐私与安全性 > 屏幕录制」中启用权限
2. **API Key**: Gemini API Key 存储在本地 localStorage，不会上传到服务器
3. **网络代理**: 国内用户可能需要配置代理才能正常使用 Gemini API

## 贡献

欢迎提交 Issue 和 Pull Request！

## License

MIT License
