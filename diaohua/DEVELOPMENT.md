# 雕花 - 开发指南

## 快速开始

### 1. 安装依赖
```bash
cd diaohua
npm install
```

### 2. 启动开发环境
需要**两个终端窗口**：

**终端 1** - 启动前端开发服务器：
```bash
npm run dev
```

**终端 2** - 启动 Electron：
```bash
npm run electron:dev
```

---

## 代码更新后的处理

Electron 应用由两部分组成，更新方式不同：

### 主进程代码（`electron/` 目录）
包含：
- `electron/main.cjs` - 主进程入口
- `electron/preload.cjs` - 预加载脚本

**修改后必须重启 Electron**：
```bash
# 在 Electron 终端按 Ctrl+C 停止
# 然后重新运行
npm run electron:dev
```

或使用快捷命令（macOS）：
```bash
npm run electron:restart
```

### 渲染进程代码（`src/` 目录）
包含所有 React 组件、页面、服务等。

**修改后自动热更新**，不需要重启 Electron：
- Vite 会自动检测文件变化
- 页面会自动刷新
- 状态会保留（React Fast Refresh）

---

## 常见开发场景

### 场景 1：修改了截图服务（主进程）
```bash
# 修改 electron/main.cjs 后

# 终端 2（Electron）
Ctrl+C  # 停止
npm run electron:dev  # 重启
```

### 场景 2：修改了 React 组件
```bash
# 修改 src/components/**/*.tsx 后

# 什么都不用做，页面自动刷新
```

### 场景 3：同时修改了主进程和渲染进程
```bash
# 先确保前端构建成功
npm run build

# 然后重启 Electron
npm run electron:dev
```

---

## 调试技巧

### 打开开发者工具
Electron 窗口内按：
- `Cmd+Option+I` (macOS)
- `Ctrl+Shift+I` (Windows/Linux)

### 查看主进程日志
主进程的 `console.log` 输出在**启动 Electron 的终端**。

### 查看网络请求
在开发者工具的 Network 面板查看前端请求。

---

## 生产环境测试

```bash
# 构建生产版本并运行
npm run electron:preview
```

这会：
1. 构建前端代码（`npm run build`）
2. 以生产模式启动 Electron

---

## 目录结构

```
diaohua/
├── electron/           # Electron 主进程代码（需重启）
│   ├── main.cjs       # 主进程入口
│   └── preload.cjs    # 预加载脚本
├── src/               # React 前端代码（热更新）
│   ├── components/    # 组件
│   ├── pages/         # 页面
│   ├── services/      # 服务
│   └── ...
└── dist/              # 构建输出（自动生成）
```

---

## 常见问题

### Q: 修改了 main.cjs 但行为没变？
A: 必须重启 Electron 进程，主进程代码不会热更新。

### Q: 前端代码没有自动刷新？
A: 检查 `npm run dev` 是否还在运行，Vite 开发服务器必须保持开启。

### Q: 如何同时调试主进程和渲染进程？
A: 使用两个终端分别运行 `npm run dev` 和 `npm run electron:dev`。

### Q: 报错 "Cannot find module"？
A: 运行 `npm install` 安装依赖。
