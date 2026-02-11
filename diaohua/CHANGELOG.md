# Changelog

## [Unreleased]

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

### Changed
- `src/stores/configStore.ts` - 添加配置验证方法、加密存储支持
- `src/pages/Settings.tsx` - 整合 OSS 配置界面
- `src/components/ui/Badge.tsx` - 添加 success 变体

## [0.1.0] - 2024-XX-XX

### Added
- 初始版本
- 截图和标注功能
- AI PRD 生成
- 效果图生成
- 本地存储
