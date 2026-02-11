# 开发任务清单

## 已完成 ✅

### Phase 1: 七牛云 SDK 集成
- [x] 安装 qiniu npm 依赖
- [x] 创建 `src/services/qiniu.ts` - 封装七牛云上传逻辑
- [x] 重写 `src/services/oss.ts` - 接入真实七牛云上传

### Phase 2: 配置管理增强
- [x] 修改 `src/stores/configStore.ts` - 添加配置验证方法
- [x] 创建 `src/utils/crypto.ts` - 简单加密工具

### Phase 3: 截图上传改造
- [x] 创建 `src/services/sync.ts` - 数据同步服务
- [x] 创建 `src/utils/oss.ts` - OSS 工具函数

### Phase 4: 设置页面
- [x] 创建 `src/components/settings/OSSConfigForm.tsx` - OSS 配置表单
- [x] 修改 `src/pages/Settings.tsx` - 整合 OSS 配置界面

### 文档更新
- [x] 创建 CHANGELOG.md
- [x] 创建 TODO.md

### TypeScript 类型修复
- [x] 安装 @types/node
- [x] 修复所有类型错误
- [x] tsconfig.json 添加 node 类型支持

## 待办 📋

### 后续优化（需根据业务需求集成）
- [ ] 截图保存流程改造 - 截图后自动上传到 OSS（需集成到截图组件中）
- [ ] 添加存储空间使用情况展示组件
- [ ] 实现离线支持和网络恢复自动同步
- [ ] 添加手动同步按钮
- [ ] 添加数据导入/导出功能
- [ ] 优化缩略图生成逻辑
- [ ] 添加上传进度展示
- [ ] 实现云端数据拉取功能
- [ ] 添加数据冲突解决策略
- [ ] 使用 Tauri 安全存储 API 替代简单加密

