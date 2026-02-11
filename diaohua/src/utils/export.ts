import type { Requirement } from '@/types';

export interface ExportPackage {
  json: string;
  markdown: string;
  images: Array<{
    name: string;
    dataUrl: string;
  }>;
}

export function exportToJSON(requirement: Requirement): string {
  const exportData = {
    version: '1.0',
    exportType: 'requirement_full',
    exportedAt: new Date().toISOString(),
    requirement: {
      id: requirement.id,
      title: requirement.title,
      status: requirement.status,
      priority: requirement.priority,
      createdAt: requirement.createdAt,
      updatedAt: requirement.updatedAt,
      userDescription: requirement.userDescription,
      screenshots: requirement.screenshots.map(s => ({
        id: s.id,
        url: s.url,
        pageUrl: s.pageUrl,
        pageTitle: s.pageTitle,
        title: s.title,
        imageUrl: s.imageUrl,
        annotations: s.annotations,
        description: s.description,
        order: s.order,
        createdAt: s.createdAt,
      })),
      aiGeneratedContent: requirement.aiGeneratedContent && {
        ...requirement.aiGeneratedContent,
        // 不包含生成的图片URL，需要单独下载
      },
      mockupDesigns: requirement.mockupDesigns?.map(m => ({
        id: m.id,
        generationBatch: m.generationBatch,
        variant: m.variant,
        style: m.style,
        prompt: m.prompt,
        params: m.params,
        selected: m.selected,
        createdAt: m.createdAt,
        // imageUrl 是 dataURL 或 OSS URL
        imageUrl: m.imageUrl.startsWith('data:') ? `[图片数据在图片包中]` : m.imageUrl,
      })),
      selectedMockupId: requirement.selectedMockupId,
    },
  };

  return JSON.stringify(exportData, null, 2);
}

export function exportToMarkdown(requirement: Requirement): string {
  const selectedMockup = requirement.mockupDesigns?.find(m => m.id === requirement.selectedMockupId);
  
  return `# ${requirement.title}

## 需求信息

| 属性 | 值 |
|------|-----|
| 状态 | ${getStatusLabel(requirement.status)} |
| 优先级 | ${requirement.priority} |
| 创建时间 | ${new Date(requirement.createdAt).toLocaleString('zh-CN')} |
| 更新时间 | ${new Date(requirement.updatedAt).toLocaleString('zh-CN')} |

## 用户原始描述

${requirement.userDescription || '未提供'}

## 截图与标注

共 ${requirement.screenshots.length} 张截图

${requirement.screenshots.map((s, i) => `
### 截图 ${i + 1}: ${s.title}

- **页面**: ${s.pageTitle || '未知'}  
- **URL**: ${s.pageUrl || s.url || '未知'}
- **时间**: ${new Date(s.createdAt).toLocaleString('zh-CN')}
- **描述**: ${s.description || '无'}

${s.annotations.length > 0 
  ? `**标注** (${s.annotations.length} 个):  
${s.annotations.map((a, j) => {
  let desc = `${j + 1}. ${getAnnotationTypeLabel(a.type)}`;
  if (a.text) desc += `: "${a.text}"`;
  if (a.color) desc += ` (颜色: ${a.color})`;
  return desc;
}).join('  \n')}`
  : '**标注**: 无'}

![截图 ${i + 1}](./images/${s.id}.png)
`).join('\n---\n')}

## AI 优化内容

${requirement.aiGeneratedContent 
  ? `### 设计参考

**布局风格**: ${requirement.aiGeneratedContent.designSuggestions?.layout?.style || '未指定'}  
**布局描述**: ${requirement.aiGeneratedContent.designSuggestions?.layout?.description || '未提供'}

**配色方案**:  
${(requirement.aiGeneratedContent.designSuggestions?.styleGuide?.colors || []).map(c => `- ${c}`).join('  \n') || '未提供'}

**组件建议**:  
${(requirement.aiGeneratedContent.designSuggestions?.components || []).map(c => `- **${c.name}** (${c.type}): ${c.description}`).join('  \n') || '未提供'}

### 效果图生成 Prompt

\`\`\`
${requirement.aiGeneratedContent.generatedPrompt || '未生成'}
\`\`\`
`
  : '尚未进行 AI 优化'}

## 效果图

${requirement.mockupDesigns?.length 
  ? `共 ${requirement.mockupDesigns.length} 张效果图，分布在 ${Math.max(...requirement.mockupDesigns.map(m => m.generationBatch))} 个批次

${selectedMockup 
  ? `### 已选中的效果图 (${selectedMockup.variant}方案)

批次: ${selectedMockup.generationBatch}  
风格: ${selectedMockup.style}  
生成时间: ${new Date(selectedMockup.createdAt).toLocaleString('zh-CN')}

![效果图](./mockups/${selectedMockup.id}.png)
`
  : '尚未选择效果图（请在软件中选择）'}
`
  : '尚未生成效果图'}

---

*由 [雕花](https://github.com/rightgenius/diaohua) 导出于 ${new Date().toLocaleString('zh-CN')}*
`;
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: '草稿',
    annotating: '标注中',
    ai_generating: 'AI生成中',
    mockup_review: '效果图评审',
    designing: '设计中',
    completed: '已完成',
    archived: '已归档',
  };
  return labels[status] || status;
}

function getAnnotationTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    rectangle: '矩形框选',
    circle: '圆形圈选',
    arrow: '箭头指向',
    draw: '手绘标记',
    text: '文字标注',
  };
  return labels[type] || type;
}

/**
 * 准备完整导出包（包含所有图片）
 */
export function prepareExportPackage(requirement: Requirement): ExportPackage {
  const images: ExportPackage['images'] = [];
  
  // 收集截图
  requirement.screenshots.forEach(s => {
    if (s.imageUrl) {
      images.push({
        name: `images/${s.id}.png`,
        dataUrl: s.imageUrl,
      });
    }
  });
  
  // 收集效果图
  requirement.mockupDesigns?.forEach(m => {
    if (m.imageUrl && m.imageUrl.startsWith('data:')) {
      images.push({
        name: `mockups/${m.id}.png`,
        dataUrl: m.imageUrl,
      });
    }
  });
  
  return {
    json: exportToJSON(requirement),
    markdown: exportToMarkdown(requirement),
    images,
  };
}

/**
 * 下载单个文件
 */
export function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 下载 DataURL 图片
 */
export function downloadImage(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * 创建 ZIP 文件（使用 JSZip，如果可用）
 */
export async function createExportZip(
  requirement: Requirement
): Promise<Blob | null> {
  try {
    // 动态导入 JSZip
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    
    const pkg = prepareExportPackage(requirement);
    
    // 添加 JSON
    zip.file(`${requirement.title}_requirement.json`, pkg.json);
    
    // 添加 Markdown
    zip.file(`${requirement.title}_README.md`, pkg.markdown);
    
    // 添加图片
    const imagesFolder = zip.folder('images');
    const mockupsFolder = zip.folder('mockups');
    
    for (const img of pkg.images) {
      // 从 dataURL 提取 base64
      const base64Data = img.dataUrl.split(',')[1];
      const binaryData = atob(base64Data);
      const array = new Uint8Array(binaryData.length);
      for (let i = 0; i < binaryData.length; i++) {
        array[i] = binaryData.charCodeAt(i);
      }
      
      if (img.name.startsWith('images/')) {
        imagesFolder?.file(img.name.replace('images/', ''), array);
      } else if (img.name.startsWith('mockups/')) {
        mockupsFolder?.file(img.name.replace('mockups/', ''), array);
      }
    }
    
    return await zip.generateAsync({ type: 'blob' });
  } catch {
    // JSZip 未安装或出错，返回 null
    return null;
  }
}
