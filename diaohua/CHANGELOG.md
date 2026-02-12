# Changelog

## [Unreleased]

### Changed
- **框架迁移**: 从 Tauri 迁移到 Electron
  - 全新的 Electron 主进程架构 (`electron/main.cjs`)
  - Electron Preload 脚本 (`electron/preload.cjs`)
  - 完全替代 Tauri 的 Rust 后端
  - 前端 API 从 `invoke` 迁移到 `window.electronAPI`
  - 移除 Tauri 依赖和相关配置文件

### Added
- Electron 截图功能
  - `captureScreen()` - 使用 `desktopCapturer` 截取屏幕
  - `captureWebpage(url, options)` - 使用 `webContents.capturePage()` 截图任意网页（支持跨域）
  - 智能截图方案选择（iframe 同域 / Electron 跨域 / 系统截图）
- Electron 文件对话框 API
  - `showSaveDialog(options)` - 保存文件对话框
  - `showOpenDialog(options)` - 打开文件对话框
- Electron 七牛云 OSS 集成
  - 在主进程中实现七牛云上传
  - 支持生成上传 Token
  - 支持测试连接

### Removed
- Tauri 相关代码和配置
  - 删除 `src-tauri/` 目录
  - 移除 `@tauri-apps/api` 和 `@tauri-apps/cli` 依赖
  - 删除 `src/services/qiniu.ts`（七牛云 SDK 不再需要，功能已集成到 Electron 主进程）

## [0.1.0] - 2024-XX-XX

### Added
- OSS 云端存储功能 - 支持七牛云 OSS 存储
  - 七牛云 SDK 集成（qiniu npm 包）
  - `src/services/qiniu.ts` - 七牛云 SDK 封装
  - `src/services/oss.ts` - 接入真实七牛云上传，支持本地降级
  - `src/services/sync.ts` - 数据同步服务
  - `src/utils/crypto.ts` - 配置加密工具
  - `src/utils/oss.ts` - OSS 工具函数
  - `src/components/settings/OSSConfigForm.tsx` - OSS 配置表单组件
  - 设置页面整合 OSS 配置界面
  - 截图自动上传到 OSS 功能
  - 配置验证和连接测试功能
  - 敏感配置加密存储（XOR 混淆）
- 初始版本
  - 截图和标注功能
  - AI PRD 生成
  - 效果图生成
  - 本地存储

### Changed
- `src/stores/configStore.ts` - 添加配置验证方法、加密存储支持
- `src/pages/Settings.tsx` - 整合 OSS 配置界面
- `src/components/ui/Badge.tsx` - 添加 success 变体
