# 雕花项目开发计划

## 当前状态（2026-02-12 20:00）

### ✅ 已完成
- [x] 需求管理（创建、列表、删除、搜索）
- [x] 浏览器工作台（地址栏、导航）
- [x] 截图功能（多种方案：iframe直接/Electron网页/系统截图）
- [x] 标注编辑器（矩形、圆形、箭头、画笔、文字）
- [x] 本地数据持久化（localStorage + Zustand）
- [x] 基础 UI 和布局
- [x] Gemini API 服务封装
- [x] AI PRD 生成功能
- [x] AI 效果图生成功能（A/B 双图）
- [x] 效果图展示和选择界面
- [x] **截图控件统一重构**（2026-02-12）
  - [x] 合并 ScreenshotService 和 WebviewScreenshotService
  - [x] 统一截图列表组件（ScreenshotList / CompactScreenshotList）
  - [x] 统一标注编辑器到 screenshot 目录
  - [x] 删除重复组件（ScreenshotEditor 等）
- [x] **截图稳定性优化**（2026-02-12）
  - [x] 修复 EPIPE 错误导致应用崩溃
  - [x] 添加安全日志函数
  - [x] 增强网页截图错误处理
- [x] **标注流程修复**（2026-02-12）
  - [x] 修复标注完成后重复弹出编辑器
  - [x] 标注后正确导出带标注的图片
- [x] 截图元数据增强（记录截图时 URL）
- [x] 截图拖拽排序
- [x] **截图裁剪功能**（2026-02-12）
  - [x] 裁剪工具（框选裁剪区域）
  - [x] 裁剪预览
  - [x] 裁剪后保存
- [x] **PDF 导出支持中文**（2026-02-12）
  - [x] 使用 html2canvas + jsPDF 实现
  - [x] 逐页裁剪生成多页 PDF
- [x] **AI 配置修复与优化**（2026-02-12）
  - [x] 修复配置文件路径问题
  - [x] 分离 AI 配置和 OSS 配置检查
  - [x] 修复 JSON 注释处理错误
  - [x] 更新 Gemini API 模型（gemini-2.5-pro / gemini-3-pro-image-preview）
- [x] **需求编辑器标签页重构**（2026-02-12）
  - [x] 截图标签页（默认，浏览器工作台）
  - [x] Prompt 生成标签页（AI PRD、设计建议）
  - [x] 效果图标签页（A/B 方案对比）
  - [x] AI 生成后自动跳转
- [x] **AI 生成内容可编辑**（2026-02-12）
  - [x] PRD 文档可编辑（Textarea 输入框）
  - [x] 设计建议可编辑（布局风格、配色方案）
  - [x] 效果图生成 Prompt 可编辑
  - [x] 自动保存，无需手动确认

### 🔄 待开发（按优先级）

#### Phase 1: 编辑器增强
- [x] 1.1 截图裁剪功能 ✅ (2026-02-12)
- [x] 1.2 AI 生成内容可编辑 ✅ (2026-02-12)
- [ ] 1.3 历史版本管理
  - [ ] 效果图历史版本切换
  - [ ] PRD 版本对比

#### Phase 2: 数据导出与同步
- [x] 2.1 导出功能增强 ✅ (2026-02-12)
  - [x] JSON 导出（含完整数据）
  - [x] Markdown PRD 导出
  - [x] PDF 导出（支持中文）
  - [ ] 图片包下载
  
- [x] 2.2 云端存储（基础版）
  - [x] 七牛云 OSS 上传
  - [x] 配置验证
  - [ ] 自动同步机制

#### Phase 3: 体验优化
- [ ] 3.1 键盘快捷键
- [ ] 3.2 加载状态优化
- [ ] 3.3 错误处理和提示
- [ ] 3.4 空状态界面

#### Phase 4: 预留功能（组件已创建但未接入）
- [ ] 4.1 评论系统
  - 组件: `CommentSection.tsx`（已创建）
  - Store: `addComment`, `resolveComment`, `deleteComment` 已实现
  - 需接入界面
- [ ] 4.2 PRD 版本历史
  - 组件: `PRDVersionHistory.tsx`（已创建）
  - 类型: `PRDVersion` 已定义
  - 需接入 Prompt 生成标签页
- [ ] 4.3 分享功能
  - 组件: `ShareButton.tsx`（已创建）
  - 页面: `Share.tsx`（基础版已实现）
  - 需完善分享链接生成逻辑
- [ ] 4.4 加载组件统一
  - 组件: `Loading.tsx`, `LoadingOverlay.tsx`（已创建）
  - 需替换各页面的自定义加载样式

---

## 技术方案调研

### Electron 截图方案（已采用）

使用 Electron `capturePage()` 方案彻底解决跨域截图问题：
- **主进程直接控制**：`BrowserWindow` 是独立的 Chromium 实例
- **原生截图 API**：`webContents.capturePage()` 直接返回像素数据
- **无视同源策略**：主进程层面不存在跨域概念

---

## 本地配置文件使用说明

创建 `diaohua-config.json` 文件到项目根目录或用户数据目录：

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

应用启动时会自动读取该配置文件并填充到设置中。

### 配置优先级
1. 本地配置文件（`diaohua-config.json`）- 最高优先级
2. 浏览器 localStorage（用户通过界面设置）- 次优先级
3. 默认空值 - 最低优先级
