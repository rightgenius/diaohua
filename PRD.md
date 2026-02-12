# 产品经理需求标注工具 - PRD 文档

> **文档状态**：v0.1.0 已实现  
> **最后更新**：2026-02-12

## 实现状态总览

| 模块 | 状态 | 备注 |
|------|------|------|
| 需求管理 | ✅ 已完成 | 列表、新建、状态流转、版本历史 |
| 浏览器工作台 | ✅ 已完成 | iframe 方案，地址栏导航 |
| 截图功能 | ✅ 已完成 | Electron capturePage() 方案，无需权限 |
| 截图编辑器 | ✅ 已完成 | 矩形、圆形、箭头、文字、裁剪 |
| 标注编辑器 | ✅ 已完成 | Fabric.js 基础标注 |
| AI PRD生成 | ✅ 已完成 | Gemini 2.5 Pro 模型，支持截图分析 |
| AI效果图生成 | ✅ 已完成 | Gemini 3 Pro Image Preview 模型 |
| 协作与分享 | ✅ 已完成 | 分享链接、评论系统、通知中心 |
| 导出功能 | ✅ 已完成 | JSON、Markdown、PDF（支持中文） |
| 七牛云存储 | ✅ 已完成 | 配置管理、上传功能 |

## 1. 产品概述

### 1.1 产品名称
**ReqSketch**（需求速写）/ **PMAI**（产品经理AI助手）/ **MarkFlow**（待定）

### 1.2 产品定位
一款面向产品经理的桌面端需求标注工具，通过内置浏览器访问存量网站，支持截图标注、AI辅助优化需求文档，**调用 Google Gemini API 生成可视化效果图**，所有数据存储于云端OSS，形成完整的需求设计闭环。

### 1.3 核心价值
- **所见即所得**：直接在目标网站上操作、截图、标注，保留完整的交互上下文
- **AI 辅助增强**：不仅优化PRD文字表达，还通过 Gemini 生成高质量效果图
- **设计闭环**：标注 → AI优化 → 效果图生成 → 评审 → 迭代，一站式完成
- **全云端存储**：所有数据保存在OSS，换设备无缝同步，团队协作更顺畅
- **Agent友好**：导出格式专为AI编程优化，可直接作为AI Coding Agent的输入

---

## 2. 目标用户

| 用户角色 | 核心诉求 | 使用场景 |
|---------|---------|---------|
| 产品经理 | 快速记录需求变更，生成规范PRD和效果图 | 对现有网站进行改版需求梳理，产出可落地的设计方案 |
| UI/UX设计师 | 查看标注，理解需求意图，基于AI效果图细化设计 | 作为设计起点，减少从零开始的工作量 |
| 开发工程师 | 获取清晰的、结构化的需求文档 + 效果图 | 直接作为开发参考或输入给AI Coding Agent |
| 团队Leader | 评审需求，把控产品质量 | 查看需求快照，批注意见，确认设计方向 |

---

## 3. 核心功能模块

### 3.1 需求管理模块
- 需求列表（支持搜索、筛选、排序）
- 新建需求（填写标题、关联项目、优先级、标签）
- 需求状态流转：草稿 → 标注中 → AI生成中 → 效果图待评审 → 设计中 → 已完成 → 已归档
- 版本历史（支持回溯到任意版本）

### 3.2 浏览器工作台模块
**布局**：左侧截图/描述栏 + 右侧浏览器区域

**浏览器能力**：
- 地址栏输入URL加载网页（iframe 方案）
- 完整的浏览器导航（前进/后退/刷新）
- 外部浏览器打开（解决 iframe 跨域限制）

**截图能力**：
- 使用 Electron `capturePage()` API 实现无权限截图
- 支持系统截图（desktopCapturer）作为备选方案
- 全屏截图编辑器，支持裁剪和标注
- 截图自动添加到需求截图列表
- 截图拖拽排序

### 3.3 截图编辑器模块

**工作流程**：
1. 点击「截图」按钮 → 后端调用 `xcap` 截取全屏
2. 进入全屏截图编辑器界面
3. 使用工具栏进行标注和裁剪
4. 点击「完成」→ 截图添加到需求

**标注工具栏**：
- 🔲 矩形框选（7种颜色可选）
- 🔵 圆形/椭圆圈选
- ➡️ 箭头标注
- ✏️ 文字标注（点击添加文字）
- 🫥 马赛克（10px 方块像素化处理）
- ✂️ 裁剪（拖拽选择区域）
- 📏 粗细调节（细/中/粗）
- ↩️ 撤销/重做（支持历史记录）

**图片管理**：
- 缩略图列表（支持拖拽排序）
- 单张图片删除
- 图片放大查看（Lightbox）
- 截图粘贴（Cmd+V 粘贴系统截图）

### 3.4 AI 需求优化模块（Gemini 2.5 Pro）
**输入**：截图标注 + 用户文字描述
**模型**：Google Gemini 2.5 Pro
**调用方式**：通过 Gemini API 生成 JSON 格式响应

**输出**：

1. **优化后的PRD**（Markdown格式）
   - 现状分析（基于截图）
   - 问题总结
   - 优化后的需求描述
   - 功能清单
   - 验收标准

2. **设计参考**（结构化数据）
   - 布局建议
   - 组件选择建议
   - 交互流程建议
   - 颜色/字体等样式规范
   - **用于生成效果图的优化Prompt**

### 3.5 AI 效果图生成模块（Gemini 3 Pro Image Preview）
**功能描述**：基于AI生成的设计参考，调用 **Google Gemini 3 Pro Image Preview** 模型生成可视化效果图

**核心设计原则**：
- **两张效果图使用完全相同的Prompt**
- **风格必须与现有截图产品保持一致**（不强行改变风格）
- **唯一的区别是模型的随机性**（不同seed或自然随机）
- **目的**：让用户从两张相似风格中选择更满意的一张，避免不满意再重来的时间浪费

**生图服务**：
- 使用 Google Gemini API（`imagen-3-generate-001` 或类似模型）
- 用户需提供 Google AI Studio API Key
- 支持队列管理和进度回调
- 生成的图片自动上传到OSS

**生成策略**：
- 每次生成 **2张效果图**（A/B方案）
- **使用完全相同的Prompt**（保持风格一致）
- 通过不同 seed 或模型自然随机性产生差异
- 用户可选择任意一张满意的效果图，或都不满意重新生成

**评审流程**：
- 左右对比展示两张效果图
- 产品经理选择满意的一张
- 选择后可以进一步微调（重新生成时保留Prompt，只改变随机因素）
- 支持对效果图进行评论

**迭代机制**：
- 不满意 → 调整截图/标注/需求描述 → 重新生成（生成新的Prompt）
- 或微调Prompt → 重新生成（相同风格方向，不同细节）

### 3.6 协作与分享模块
- 需求分享（生成分享链接）
- 评论系统（支持@人、回复）
- 通知中心（评论回复、需求变更）
- 权限管理（查看/编辑/管理员）

### 3.7 导出模块
**导出格式**：

1. **结构化JSON**（主要，编程Agent友好）
2. **Markdown文档**（便于阅读）
3. **图片包**（所有标注截图 + 选中的效果图）
4. **PDF报告**（完整需求文档）

---

## 4. 详细功能描述

### 4.1 浏览器工作台

```
┌─────────────────────────────────────────────────────────────┐
│  [新建截图]  [地址栏: https://xxx.com]  [刷新]  [设置]       │ ← 顶部工具栏
├───────┬─────────────────────────────────────────────────────┤
│       │                                                     │
│ [↻]   │                                                     │
│ [←]   │              网页浏览区域                           │
│ [→]   │              (完整浏览器内核)                        │
│       │                                                     │
│ 工具栏 │                                                     │
│       │                                                     │
│ [截图] │                                                     │
│       │                                                     │
│ [历史] │                                                     │
│       │                                                     │
└───────┴─────────────────────────────────────────────────────┘
```

**截图流程**：
1. 用户点击「截图」按钮
2. Electron 主进程创建隐藏窗口加载目标网页
3. 使用 `capturePage()` 截取完整网页
4. 截图保存为 base64传回渲染进程
5. 进入标注模式，弹出标注编辑器

### 4.2 标注编辑器

```
┌──────────────────────────────────────────────────────────────┐
│ [矩形] [圆形] [箭头] [画笔] [文字] [撤销] [完成]            │ ← 工具栏
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                     截图区域                                  │
│                   (可自由标注)                                │
│                                                              │
│    ┌──────────────┐                                          │
│    │   框选区域    │  ← 这里要改导航样式                      │
│    └──────────────┘                                          │
│                                                              │
│         ↓                                                    │
│    [文字标注说明]                                             │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ 关联截图描述：                                                │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ 当前导航栏在大屏下显得拥挤，建议采用更简洁的胶囊式设计   │  │
│ └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### 4.3 需求编辑与AI生成

```
┌──────────────────────────────────────────────────────────────┐
│ 需求标题：首页改版需求                                          │
│ 状态：[标注中]  优先级：高  负责人：张三                        │
├──────────────────────────────────────────────────────────────┤
│ 左侧截图列表              │ 右侧编辑区                         │
│ ┌─────┐                   │                                    │
│ │ 图1 │ ← 点击切换         │ ┌──────────────────────────────┐  │
│ └─────┘                   │ │ 用户原始描述                  │  │
│ ┌─────┐                   │ │ ---------------------------  │  │
│ │ 图2 │                   │ │ 觉得现在的首页太乱了，想改得   │  │
│ └─────┘                   │ │ 简洁一些，突出核心功能...      │  │
│ [+ 添加截图]              │ └──────────────────────────────┘  │
│                           │                                    │
│                           │ [🤖 点击生成AI优化版本]          │
│                           │                                    │
│                           │ ┌──────────────────────────────┐  │
│                           │ │ AI优化后的PRD                │  │
│                           │ │ ==========================   │  │
│                           │ │ ## 1. 现状分析                │  │
│                           │ │ ## 2. 优化目标                │  │
│                           │ │ ## 3. 设计参考                │  │
│                           │ │ ...                          │  │
│                           │ └──────────────────────────────┘  │
│                           │                                    │
│                           │ [🎨 生成效果图] ← 基于设计参考生成  │
└──────────────────────────────────────────────────────────────┘
```

### 4.4 AI 效果图生成界面（核心）

```
┌──────────────────────────────────────────────────────────────────────────┐
│ 需求：首页改版需求                     状态：[效果图待评审]                │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────┐  ┌──────────────────────────────────┐
│  │                                  │  │                                  │
│  │      🎨 方案 A                    │  │      🎨 方案 B                    │
│  │                                  │  │                                  │
│  │    [AI生成的第一张效果图]         │  │    [AI生成的第二张效果图]         │
│  │                                  │  │                                  │
│  │    (相同Prompt，不同随机结果)     │  │    (相同Prompt，不同随机结果)     │
│  │                                  │  │                                  │
│  ├──────────────────────────────────┤  ├──────────────────────────────────┤
│  │ ✅ 选择方案A                      │  │ ✅ 选择方案B                      │
│  └──────────────────────────────────┘  └──────────────────────────────────┘
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  [🔄 重新生成两张]  [👍 满意，确认使用]  [✏️ 调整需求后再生成]      │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ⚙️ 生成参数：                                                            │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ 比例：[16:9] [4:3] [1:1] [与截图一致✓]                              │  │
│  │                                                                    │  │
│  │ 📝 当前使用的Prompt（基于你的产品截图风格）：                          │  │
│  │ ┌────────────────────────────────────────────────────────────────┐ │  │
│  │ │ High-fidelity UI mockup of web application, maintain existing  │ │  │
│  │ │ product style, professional blue (#1890ff) theme, clean layout │ │  │
│  │ │ with card-based content, pill-style navigation buttons, ...    │ │  │
│  │ └────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                    │  │
│  │ [编辑Prompt]  ← 微调后重新生成                                      │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  📜 历史版本（3）：                                                        │
│  ┌────┐ ┌────┐ ┌────┐                                                    │
│  │ v3 │ │ v2 │ │ v1 │  ← 点击可对比查看                                   │
│  └────┘ └────┘ └────┘                                                    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**关键说明**：
- 两张图下方**不显示风格标签**（因为风格完全相同）
- 标注为"方案A"和"方案B"而非"风格A""风格B"
- 提示文字说明"相同Prompt，不同随机结果"

### 4.5 Gemini API 调用规范

#### 4.5.1 文本优化（Gemini Pro）

```typescript
interface GeminiTextRequest {
  model: 'gemini-pro' | 'gemini-1.5-pro';
  contents: {
    role: 'user';
    parts: {
      text: string;
    }[];
  }[];
  generationConfig: {
    temperature: 0.7;
    maxOutputTokens: 4096;
  };
}

// 示例请求 - 要求AI分析截图风格
const prompt = `
作为资深产品经理和UX设计师，请基于以下信息生成专业PRD和设计建议：

【截图标注信息】
${screenshotsWithAnnotations}

【用户原始需求描述】
${userDescription}

【重要要求】
分析截图中现有产品的视觉风格（颜色、布局、设计语言），生成效果图时必须保持这种风格一致，不要改变品牌调性。

【输出要求】
1. 优化后的PRD（Markdown格式）
2. 设计参考（JSON格式，包含布局、组件、样式规范）
3. 用于生成效果图的英文Prompt，要求：
   - 保持与现有截图产品一致的风格
   - 包含具体的颜色值（从截图中提取）
   - 描述改进后的布局，但保持品牌调性
`;
```

#### 4.5.2 图片生成（Gemini Imagen）

```typescript
interface GeminiImageRequest {
  model: 'imagen-3-generate-001' | 'imagen-3-fast-generate-001';
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
  numberOfImages: 2;  // 固定生成2张
  seed?: number;      // 可选：控制随机性
  safetyFilterLevel?: 'block_low_and_above' | 'block_medium_and_above';
  personGeneration?: 'allow_adult' | 'dont_allow';
}

// 生成两张图的策略
async function generateTwoMockups(request: GenerationRequest): Promise<string[]> {
  const basePrompt = buildPromptFromScreenshots(request);
  
  // 方案1：使用相同Prompt，让模型自然随机
  const response1 = await callGeminiImagen({
    ...baseRequest,
    prompt: basePrompt,
    numberOfImages: 1
  });
  
  // 方案2：使用相同Prompt，不同seed
  const response2 = await callGeminiImagen({
    ...baseRequest,
    prompt: basePrompt,
    seed: Math.floor(Math.random() * 1000000),
    numberOfImages: 1
  });
  
  // 或者一次请求2张（如果API支持）
  const batchResponse = await callGeminiImagen({
    ...baseRequest,
    prompt: basePrompt,
    numberOfImages: 2  // 让API自己处理随机性
  });
  
  // 上传到OSS，返回URL
  return uploadToOSS(batchResponse.images);
}

// Prompt构建 - 强调保持现有风格
function buildPromptFromScreenshots(request: GenerationRequest): string {
  return `
High-fidelity UI mockup of web application interface,
professional design, maintain EXISTING PRODUCT STYLE from reference screenshot,
${request.colorScheme ? `color scheme: ${request.colorScheme},` : ''}
${request.layoutDescription},
${request.componentDescription},
clean and polished, suitable for web development reference,
highly detailed, 4k resolution
  `.trim();
}
```

#### 4.5.3 响应处理

```typescript
interface GeminiImageResponse {
  images: {
    bytesBase64Encoded: string;
    mimeType: 'image/png' | 'image/jpeg';
    prompt?: string;
  }[];
}

// 处理流程
async function generateMockup(request: GeminiImageRequest): Promise<string[]> {
  // 1. 调用 Gemini API 生成2张图
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/imagen-3-generate-001:predict', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      instances: [{
        prompt: request.prompt,
        negativePrompt: request.negativePrompt,
        aspectRatio: request.aspectRatio,
        numberOfImages: 2  // 一次生成2张
      }]
    })
  });
  
  const result: GeminiImageResponse = await response.json();
  
  // 2. 上传到OSS，返回URL
  const urls = await Promise.all(
    result.images.map(async (img, idx) => {
      const buffer = Buffer.from(img.bytesBase64Encoded, 'base64');
      const key = `mockups/${requirementId}/${Date.now()}_${String.fromCharCode(65 + idx)}.png`;
      return await ossClient.put(key, buffer);
    })
  );
  
  return urls;
}
```

---

## 5. 数据模型与OSS存储

### 5.1 OSS 存储结构

```
bucket/
├── users/
│   └── {userId}/
│       ├── profile.json
│       └── settings.json
├── projects/
│   └── {projectId}/
│       ├── project.json
│       └── members.json
├── requirements/
│   └── {requirementId}/
│       ├── requirement.json      # 主数据文件
│       ├── prd.md                # AI生成的PRD
│       └── comments.json         # 评论数据
├── screenshots/
│   └── {requirementId}/
│       ├── {screenshotId}.png
│       └── {screenshotId}_thumb.png
├── annotations/
│   └── {requirementId}/
│       └── {screenshotId}.json   # 标注数据
└── mockups/
    └── {requirementId}/
        ├── {mockupId}_A.png      # 方案A
        └── {mockupId}_B.png      # 方案B（相同Prompt，不同随机）
```

### 5.2 核心实体

```typescript
// 需求主数据
interface Requirement {
  id: string;
  projectId: string;
  title: string;
  status: 'draft' | 'annotating' | 'ai_generating' | 'mockup_review' | 'designing' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  creatorId: string;
  assigneeId?: string;
  tags: string[];
  screenshots: Screenshot[];
  userDescription: string;
  aiGeneratedContent?: AIGeneratedContent;
  mockupDesigns?: MockupDesign[]; // 效果图历史
  selectedMockupId?: string;
  createdAt: string;
  updatedAt: string;
}

// 截图
interface Screenshot {
  id: string;
  url: string;
  title: string;
  imageUrl: string;
  thumbnailUrl: string;
  annotations: Annotation[];
  description: string;
  order: number;
  createdAt: string;
}

// 标注
interface Annotation {
  id: string;
  type: 'rectangle' | 'circle' | 'arrow' | 'draw' | 'text';
  color?: string;
  strokeWidth?: number;
  coordinates: {
    x: number;
    y: number;
    width?: number;
    height?: number;
    points?: { x: number; y: number }[];
  };
  text?: string;
}

// AI生成内容
interface AIGeneratedContent {
  prdMarkdownUrl: string;
  designSuggestions: DesignSuggestion;
  generatedPrompt: string;  // 用于生图的Prompt（两张图使用相同Prompt）
  generatedAt: string;
}

// 效果图 - 两张图使用相同Prompt
interface MockupDesign {
  id: string;
  generationBatch: number;
  variant: 'A' | 'B';
  imageUrl: string;
  prompt: string;        // 相同的Prompt
  style: string;         // 风格描述（从截图分析得出）
  params: {
    aspectRatio: string;
    seed?: number;       // 如果使用了seed
  };
  selected: boolean;
  createdAt: string;
}
```

---

## 6. 导出格式规范

### 6.1 结构化JSON格式

```json
{
  "version": "1.0",
  "exportType": "requirement_full",
  "metadata": {
    "id": "req_xxx",
    "title": "首页改版需求",
    "exportedAt": "2024-01-20T14:22:00Z"
  },
  "requirement": {
    "overview": { "background": "...", "goals": ["..."] },
    "screenshots": [...],
    "aiOptimizedPRD": { "summary": "...", "requirements": {...} },
    "designReference": { "layout": "...", "components": [...] },
    "selectedMockup": {
      "id": "mockup_002",
      "variant": "B",
      "imageUrl": "https://oss.example.com/mockups/req_xxx/mockup_002_B.png",
      "prompt": "High-fidelity UI mockup... (same prompt for both variants)"
    },
    "generationNote": "两张效果图使用完全相同的Prompt，仅随机因素不同"
  }
}
```

---

## 7. 技术架构

### 7.1 技术栈

| 层级 | 技术 | 说明 |
|-----|------|------|
| 桌面框架 | **Electron** | 成熟稳定、截图功能强大 |
| 前端框架 | React + TypeScript | 生态丰富，类型安全 |
| UI组件库 | Ant Design / shadcn/ui | 企业级组件 |
| 状态管理 | Zustand | 轻量级状态管理 |
| 截图/标注 | Electron capturePage + fabric.js | 截图和Canvas标注 |
| **数据存储** | **阿里云OSS / AWS S3** | **所有数据云端存储** |
| **AI服务** | **Google Gemini API** | 文本优化 + Imagen图片生成 |

### 7.2 架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                         桌面应用 (Electron)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐ │
│  │   浏览器    │  │  标注编辑器  │  │       需求管理界面          │ │
│  │  (WebView)  │  │  (Fabric.js)│  │        (React)              │ │
│  └──────┬──────┘  └──────┬──────┘  └──────────────┬──────────────┘ │
│         └─────────────────┴────────────────────────┘                │
│                              │                                      │
│                      Electron Main (Node.js)                        │
│                              │                                      │
│  ┌───────────────────────────┼───────────────────────────────┐     │
│  │                           │                               │     │
│  ▼                           ▼                               ▼     │
│ 本地缓存(可选)          OSS 数据层                      Gemini API   │
│ (IndexedDB)                │                               │       │
│                              │                               │       │
│                              ▼                               │       │
│                    ┌─────────────────┐                       │       │
│                    │   阿里云OSS      │◀──────────────────────┘       │
│                    │   / AWS S3      │   存储截图、效果图            │
│                    └─────────────────┘                               │
│                              │                                       │
│                              ▼                                       │
│                    ┌─────────────────┐                               │
│                    │  Google Gemini  │                               │
│                    │  ┌───────────┐  │                               │
│                    │  │ Gemini    │  │ ← 文本优化（PRD生成）         │
│                    │  │ Pro       │  │                               │
│                    │  └───────────┘  │                               │
│                    │  ┌───────────┐  │                               │
│                    │  │ Imagen 3  │  │ ← 效果图生成（2张/相同Prompt）│
│                    │  │           │  │                               │
│                    │  └───────────┘  │                               │
│                    └─────────────────┘                               │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.3 配置管理

```typescript
interface AppConfig {
  // Google Gemini API Key
  geminiApiKey: string;
  
  // OSS配置
  oss: {
    provider: 'aliyun' | 'aws';
    region: string;
    bucket: string;
    accessKeyId: string;
    accessKeySecret: string;
  };
}
```

---

## 8. 用户操作流程

### 8.1 首次使用

1. 下载安装桌面应用
2. 配置 API Key：
   - **Google Gemini API Key**（必需）
   - **OSS配置**（必需）
3. 验证配置，测试连接
4. 创建项目，新建需求，开始标注

### 8.2 日常操作流程

```
1. 打开应用 → 选择项目 → 新建需求
      ↓
2. 输入需求标题、优先级等基本信息
      ↓
3. 在右侧浏览器输入目标网站URL，正常浏览操作
      ↓
4. 看到需要标注的地方 → 点击「截图」→ 上传OSS → 标注
      ↓
5. 完成所有截图后，补充文字描述 → 点击「AI生成」
      ↓
6. Gemini Pro 生成优化PRD + 设计参考 + 生图Prompt
      ↓
7. 点击「生成效果图」→ Gemini Imagen 生成2张图（相同Prompt）
      ↓
8. 查看方案A/B，选择满意的一张：
      ├── ✅ 满意 → 确认使用 → 需求定稿
      ├── 🔄 都不满意 → 重新生成（相同Prompt，新随机结果）
      └── ✏️ 调整需求 → 修改后重新生成（新Prompt）
      ↓
9. 导出为JSON/Markdown → 分享给团队或编程Agent
```

---

## 9. MVP 阶段功能优先级

| 优先级 | 功能模块 | 说明 |
|-------|---------|------|
| P0 | 浏览器工作台 | 基础浏览、截图功能 |
| P0 | OSS存储集成 | 截图、数据自动上传OSS |
| P0 | 标注编辑器 | 矩形、箭头、文字标注 |
| P0 | 需求管理 | 新建、编辑、OSS持久化 |
| P0 | Gemini 文本优化 | 生成PRD + 设计参考 |
| **P0** | **Gemini Imagen 效果图** | **相同Prompt生成2张，保持风格一致** |
| P0 | 效果图评审界面 | A/B对比选择 |
| P1 | 生成参数调整 | 比例、Prompt微调 |
| P1 | 效果图历史 | 保存每次生成的效果图 |
| P1 | 导出功能 | JSON + Markdown + 图片包 |
| P2 | 协作功能 | 分享、评论 |

---

## 10. 非功能需求

### 10.1 性能
- 截图响应时间 < 1秒
- 上传到OSS < 3秒
- Gemini 文本生成 < 10秒
- **Gemini Imagen 图片生成 15-45秒（2张同时生成）**

### 10.2 安全
- OSS凭证本地加密存储
- API通信使用HTTPS
- 截图和效果图URL使用临时签名URL

### 10.3 可用性
- 支持 Windows / macOS / Linux
- 界面支持中英文
- 网络异常时提示重试

---

## 11. 待确认事项（最终版）

| 事项 | 状态 | 需要确认 |
|-----|------|---------|
| 产品名称 | 待定 | ReqSketch / PMAI / MarkFlow / 其他？ |
| OSS提供商 | 待定 | 阿里云OSS / AWS S3 / 其他？ |
| Gemini API Key | 后续提供 | 确认使用Google AI Studio的Key |

---

**文档版本**: v1.4  
**最后更新**: 2024-XX-XX  
**状态**: ✅ 需求确认完成，等待开发指令

### 变更记录
- v1.4: 明确AI生图使用相同Prompt，保持与现有产品风格一致，仅随机性不同
- v1.3: 生图服务改为 Google Gemini API (Imagen)，数据存储改为全云端OSS
- v1.2: 增加AI效果图生成功能
- v1.1: 增加AI辅助生成设计参考功能
- v1.0: 初始版本
