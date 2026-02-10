# 雕花 - 本地可用版本更新日志

## 已完成的功能

### 1. 需求管理 ✅
- **新建需求**：点击「新建需求」创建需求文档
- **需求列表**：Dashboard 页面显示所有需求列表
- **需求搜索**：支持按标题和描述搜索需求
- **需求删除**：支持删除需求（带确认对话框）
- **需求状态追踪**：草稿 → 标注中 → 效果图评审 → 设计中 → 已完成

### 2. 浏览器工作台 ✅
- **网页浏览**：内置 iframe 浏览器访问任意网站
- **地址栏导航**：支持输入网址、前进、后退、刷新
- **截图功能**：点击截图按钮截取当前页面（使用 html2canvas）
- **缩略图生成**：自动生成截图缩略图用于列表展示

### 3. 标注编辑器 ✅
- **多种标注工具**：
  - 矩形框选
  - 圆形圈选
  - 箭头指示
  - 自由画笔
  - 文字标注
- **颜色选择器**：8 种预设颜色
- **撤销/重做**：支持操作历史回溯
- **删除标注**：删除单个标注
- **标注描述**：为截图添加文字描述

### 4. 数据存储 ✅
- **本地持久化**：使用 localStorage 存储所有数据
- **截图保存**：截图以 DataURL 形式存储在本地
- **需求状态**：自动保存需求状态和修改时间

### 5. 用户界面 ✅
- **响应式布局**：适配不同屏幕尺寸
- **侧边栏导航**：快速切换页面
- **状态指示器**：显示当前配置状态
- **快捷操作**：Dashboard 提供快速入口

## 文件结构

```
src/
├── components/
│   ├── browser/
│   │   └── BrowserWorkbench.tsx    # 浏览器工作台
│   ├── editor/
│   │   └── AnnotationEditor.tsx    # 标注编辑器
│   ├── ai/
│   │   ├── AIResultPanel.tsx       # AI 结果面板（mock）
│   │   └── MockupReview.tsx        # 效果图评审（mock）
│   ├── layout/
│   │   └── MainLayout.tsx          # 主布局
│   └── ui/                         # UI 组件
├── pages/
│   ├── Dashboard.tsx               # 首页/需求列表
│   ├── RequirementEditor.tsx       # 需求编辑器
│   └── Settings.tsx                # 设置页面
├── services/
│   ├── screenshot.ts               # 截图服务
│   └── oss.ts                      # 云存储服务（mock）
├── stores/
│   ├── requirementStore.ts         # 需求状态管理
│   └── configStore.ts              # 配置状态管理
└── types/
    └── index.ts                    # TypeScript 类型定义
```

## 运行方式

```bash
# 进入项目目录
cd ~/dev/diaohua/diaohua

# 安装依赖（如尚未安装）
npm install

# 启动开发服务器
npm run dev

# 浏览器访问 http://localhost:1420
```

## 使用流程

1. **创建需求**：在 Dashboard 点击「新建需求」，输入需求标题
2. **访问网站**：在右侧浏览器输入要改版的网站地址
3. **截图标注**：点击「截图」按钮，在标注编辑器中添加标注和描述
4. **保存截图**：完成标注后点击「完成」，截图会出现在左侧列表
5. **管理需求**：返回 Dashboard 可以查看所有需求和进度

## 待完善功能（需要 API 配置）

- [ ] AI PRD 生成（需要 Gemini API Key）
- [ ] AI 效果图生成（需要 Gemini Imagen）
- [ ] 云端存储（需要七牛云 OSS 配置）
- [ ] 团队协作功能
- [ ] 导出 PDF/Word

## 技术栈

- **前端框架**：React 18 + TypeScript
- **构建工具**：Vite 5
- **状态管理**：Zustand + persist 中间件
- **样式**：Tailwind CSS
- **截图**：html2canvas
- **桌面端**：Tauri（配置完成，尚未打包）

## 注意事项

1. 截图功能使用 html2canvas，某些网站可能因 CORS 限制无法截图
2. 数据存储在浏览器 localStorage 中，清除浏览器数据会丢失
3. AI 功能需要配置 Google Gemini API Key 才能使用
4. 云端存储功能需要配置七牛云 OSS 才能使用
