# 开发任务清单

## 已知问题 🐛

- [ ] **截图功能黑屏问题** - 点击截图按钮后，截图内容显示为全黑，需要修复截图捕获逻辑

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

### Phase 5: 数据导出与UI优化
- [x] 创建 `src/hooks/useKeyboard.ts` - 键盘快捷键 Hook (Ctrl+S, Ctrl+Z, Delete, ESC)
- [x] 创建 `src/components/ui/Loading.tsx` - 加载状态组件
- [x] 创建 `src/components/ui/EmptyState.tsx` - 空状态组件
- [x] 创建 `src/components/export/ExportButton.tsx` - 导出按钮组件 (JSON/Markdown/ZIP)
- [x] 创建 `src/components/editor/ScreenshotList.tsx` - 可拖拽截图列表
- [x] 更新 `src/pages/RequirementEditor.tsx` - 集成拖拽排序和导出功能
- [x] 更新 `src/pages/Dashboard.tsx` - 集成空状态组件
- [x] 更新 `src/components/editor/AnnotationEditor.tsx` - 添加键盘快捷键支持

### Phase 6: 最终功能补全
- [x] 创建 `src/components/ui/ImageLightbox.tsx` - 图片放大查看组件
- [x] 集成 Lightbox 到 ScreenshotList 和 MockupReview
- [x] 安装 jspdf html2canvas 依赖
- [x] 添加 `exportToPDF(requirement)` 函数
- [x] ExportButton 添加 PDF 导出选项
- [x] 修改 `src/types/index.ts` - 添加 PRDVersion 类型
- [x] 给 Requirement 添加 `prdVersions` 字段
- [x] 创建 `src/components/prd/PRDVersionHistory.tsx`
- [x] requirementStore 添加 savePRDContent 和 restorePRDVersion
- [x] 创建 `src/components/share/ShareButton.tsx` - 分享按钮
- [x] 安装 qrcode.react 依赖
- [x] 创建 `src/pages/Share.tsx` - 分享页面
- [x] 修改 `src/types/index.ts` - 添加 Comment 类型
- [x] 创建 `src/components/comments/CommentSection.tsx` - 评论系统
- [x] requirementStore 添加评论相关 actions
- [x] 创建 `src/components/notification/NotificationCenter.tsx` - 通知中心
- [x] MainLayout 集成 NotificationCenter

### Phase 7: UI 优化与截图编辑器
- [x] 移除编辑页面的通知铃铛（仅在首页显示）
- [x] 浏览器区域填满剩余垂直空间
- [x] 需求描述输入框移至左侧边栏
- [x] 浏览器改用 iframe 方案（简化实现）
- [x] 使用 `xcap` crate 实现跨平台全屏截图（macOS/Windows/Linux）
- [x] 创建 `ScreenshotEditor` 组件 - 全屏截图编辑器
- [x] 支持矩形、圆形、箭头、文字、马赛克标注
- [x] 支持7种颜色选择和3种粗细调节
- [x] 支持撤销/重做和裁剪功能

### 文档更新
- [x] 创建 CHANGELOG.md
- [x] 创建 TODO.md
- [x] 更新 TODO.md 标记所有功能完成

### TypeScript 类型修复
- [x] 安装 @types/node
- [x] 修复所有类型错误
- [x] tsconfig.json 添加 node 类型支持

## 待办 📋

### 高优先级
- [ ] 修复截图黑屏问题 - 截图后内容显示为全黑

### 后续优化（需根据业务需求集成）
- [ ] 截图保存流程改造 - 截图后自动上传到 OSS（需集成到截图组件中）
- [ ] 添加存储空间使用情况展示组件
- [ ] 实现离线支持和网络恢复自动同步
- [ ] 添加手动同步按钮
- [ ] 优化缩略图生成逻辑
- [ ] 添加上传进度展示
- [ ] 实现云端数据拉取功能
- [ ] 添加数据冲突解决策略
- [ ] 使用 Tauri 安全存储 API 替代简单加密
- [ ] 添加 PRD 文档预览功能
- [ ] 实现 AI 生成功能集成
- [ ] 完善通知系统 - 评论时自动生成通知
