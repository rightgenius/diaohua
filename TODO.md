# 雕花项目开发计划

## 当前状态（2026-02-12 16:15）

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

### 🔄 待开发（按优先级）

#### Phase 1: 编辑器增强
- [x] 1.1 截图裁剪功能 ✅ (2026-02-12)
- [ ] 1.2 历史版本管理
  - [ ] 效果图历史版本切换
  - [ ] PRD 版本对比

#### Phase 2: 数据导出
- [ ] 2.1 导出功能增强
  - [ ] JSON 导出（含完整数据）
  - [ ] Markdown PRD 导出
  - [ ] 图片包下载
  
- [ ] 2.2 云端存储（可选）
  - [ ] 七牛云 OSS 上传
  - [ ] 配置验证

#### Phase 3: 体验优化
- [ ] 3.1 键盘快捷键
- [ ] 3.2 加载状态优化
- [ ] 3.3 错误处理和提示
- [ ] 3.4 空状态界面

#### Phase 4: 截图功能重构（技术方案调研）✅ 已完成

> 背景：当前使用 xcap 库进行全屏截图存在权限问题（需要屏幕录制权限），且截图后需要裁剪。现调研通过 WebView 注入脚本实现无权限截图的方案。

**方案对比：**

| 方案 | 原理 | 优点 | 缺点 | 可行性 |
|------|------|------|------|--------|
| **xcap 现状** | 调用系统 API 截取屏幕像素 | 截全屏、窗口都可 | 需要屏幕录制权限、可能有黑屏问题 | ⚠️ 有权限门槛 |
| **WebView 注入脚本** | 前端使用 modern-screenshot 截取 iframe DOM | 无需系统权限、只截网页内容 | 受 CSP 限制、跨域无法使用 | ✅ 已实现 |
| **WebView 原生截图** | 使用 WKWebView.takeSnapshot / WebView2.CapturePreview | 无需权限、原生支持 | Tauri 未暴露 API，需写插件 | 🔍 需开发插件 |

**已实现的功能：**

- [x] 安装 modern-screenshot 库
- [x] 创建 WebviewScreenshotService 服务
  - [x] CSP 限制检测
  - [x] 截图超时处理
  - [x] 降级方案提示
- [x] 浏览器工作台集成
  - [x] 截图方法选择器（智能选择 / WebView / 系统截图）
  - [x] 智能推荐提示
  - [x] 错误处理和用户引导
- [x] 跨域检测和降级方案

**技术实现：**

```typescript
// 新的截图服务 API
WebviewScreenshotService.captureIFrame(iframe, options)
WebviewScreenshotService.checkCSPLimitations(iframe)
WebviewScreenshotService.getRecommendedMethod(iframe)
```

**使用说明：**

1. **智能选择模式**（默认）：自动检测当前页面是否支持 WebView 截图，不支持时提示使用系统截图
2. **WebView 截图**：直接截取 iframe 内容，无需系统权限，但受 CSP 和跨域限制
3. **系统截图**：使用 xcap 全屏截图，需要屏幕录制权限

**CSP 限制处理：**
- GitHub、Google 等网站通常禁止 iframe 脚本执行
- 对于受限网站，推荐使用系统截图 (Cmd+Shift+4) 后粘贴 (Cmd+V)
- 浏览器工作台会显示当前推荐的截图方案

**参考链接：**
- modern-screenshot: https://github.com/qq15725/modern-screenshot
- CSP 限制说明: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP

---

## 技术方案调研：Electron 截图方案（2026-02-12）

> 背景：Tauri 的 WebView 注入截图方案因 `eval` 无法获取返回值而受阻，调研 Electron 作为替代方案。

### 核心结论

**Electron `capturePage()` 方案可以彻底解决跨域截图问题**，因为：

1. **主进程直接控制**：`BrowserWindow` 是独立的 Chromium 实例，不是 iframe
2. **原生截图 API**：`webContents.capturePage()` 直接返回像素数据，无需 JavaScript 注入
3. **无视同源策略**：主进程层面不存在跨域概念

### 方案对比

| 维度 | Tauri 当前方案 | Electron 方案 |
|------|---------------|---------------|
| **截图 API** | `xcap` 系统截图 / `modern-screenshot` iframe | `capturePage()` 原生支持 |
| **跨域限制** | iframe 受 CSP/跨域限制 | ✅ 无限制 |
| **权限要求** | 系统截图需屏幕录制权限 | ✅ 无需系统权限 |
| **截图范围** | 全屏（需裁剪）/ iframe 视口 | 完整网页（含滚动区域）|
| **包大小** | ✅ ~3MB | ~150MB |
| **内存占用** | ✅ 低 | 高 |
| **启动速度** | ✅ 快 | 慢 |

### Electron 实现架构

```
主进程 (Main Process)
    │
    ├── 创建 BrowserWindow（截图专用，隐藏）
    │      ├── loadURL('http://10.20.3.2:9780')
    │      ├── 等待 did-finish-load 事件
    │      └── 可选：注入脚本等待特定元素
    │
    ├── webContents.capturePage({ x, y, width, height })
    │      └── 返回 NativeImage
    │
    ├── image.toPNG() / image.toDataURL()
    │
    └── IPC 传回渲染进程
```

### 代码示例

```javascript
// 主进程 main.js
async function captureWebpage(url) {
  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    show: false,
    webPreferences: { offscreen: true }
  });
  
  await win.loadURL(url);
  await new Promise(r => setTimeout(r, 3000)); // 等待渲染
  
  // 直接截图，无跨域限制
  const image = await win.webContents.capturePage();
  const base64 = image.toDataURL();
  
  win.close();
  return base64;
}
```

### 优缺点分析

**优点：**
- ✅ 彻底解决跨域截图问题
- ✅ 无需屏幕录制权限
- ✅ 可截取完整页面（不只是视口）
- ✅ 稳定可靠，大量应用验证

**缺点：**
- ❌ 安装包体积大（+150MB vs +3MB）
- ❌ 内存占用高
- ❌ 启动速度慢
- ❌ 需要重构项目（Tauri → Electron）

### 决策建议

**短期（保持 Tauri）：**
- 使用「系统截图 + 粘贴」作为跨域场景的 workaround
- 优化权限引导体验

**长期（考虑迁移）：**
- 如果截图是核心功能且用户量大
- 如果能接受 150MB 的安装包体积
- Electron 是更成熟的方案

### 参考链接
- Electron capturePage: https://www.electronjs.org/docs/latest/api/web-contents#contentscapturepagerect
- Electron offscreen: https://www.electronjs.org/docs/latest/tutorial/offscreen-rendering

---

## 当前任务：更换 Electron App LOGO
