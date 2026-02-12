import type { Requirement } from '@/types';
import { jsPDF } from 'jspdf';
// import html2pdf from 'html2pdf.js';

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

/**
 * 导出为 PDF 报告
 * 使用 html2pdf.js 来支持中文
 */
export async function exportToPDF(requirement: Requirement): Promise<void> {
  // 使用 html2canvas + jsPDF 手动实现，避免 html2pdf.js 的问题
  const html2canvas = (await import('html2canvas')).default;
  
  // 创建容器 - 移出视口渲染，避免闪烁
  const htmlContent = generatePDFHTML(requirement);
  const container = document.createElement('div');
  container.innerHTML = htmlContent;
  container.style.cssText = `
    position: absolute;
    left: -10000px;
    top: 0;
    width: 794px;
    background: white;
  `;
  document.body.appendChild(container);

  // 等待渲染和图片加载
  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    // 渲染为 canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: container.offsetWidth,
      height: container.offsetHeight,
    });

    // 生成 PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pageWidth - margin * 2;

    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // 计算需要多少页
    const contentHeightPerPage = pageHeight - margin * 2;
    let remainingHeight = imgHeight;
    let currentY = margin;
    let sourceY = 0;
    const scale = canvas.width / imgWidth;

    // 第一页
    let isFirstPage = true;
    
    while (remainingHeight > 0) {
      if (!isFirstPage) {
        pdf.addPage();
        currentY = margin;
      }
      isFirstPage = false;
      
      // 计算这一页能显示多少内容
      const drawHeight = Math.min(remainingHeight, contentHeightPerPage);
      
      // 创建临时 canvas 裁剪当前页内容
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = Math.floor(drawHeight * scale);
      const tempCtx = tempCanvas.getContext('2d');
      
      if (tempCtx) {
        // 从原 canvas 裁剪部分绘制到临时 canvas
        tempCtx.drawImage(
          canvas,
          0, sourceY * scale, canvas.width, tempCanvas.height,
          0, 0, canvas.width, tempCanvas.height
        );
        
        const pageImgData = tempCanvas.toDataURL('image/png');
        pdf.addImage(pageImgData, 'PNG', margin, currentY, imgWidth, drawHeight);
      }
      
      remainingHeight -= drawHeight;
      sourceY += drawHeight;
    }

    pdf.save(`${requirement.title}_report.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * 生成 PDF 的 HTML 内容
 */
function generatePDFHTML(requirement: Requirement): string {
  const selectedMockup = requirement.mockupDesigns?.find(m => m.id === requirement.selectedMockupId);
  
  const screenshotsHTML = requirement.screenshots.map((s, i) => `
    <div class="screenshot-item avoid-break">
      <h4>截图 ${i + 1}: ${escapeHtml(s.title)}</h4>
      <div class="screenshot-meta">
        <span>页面: ${escapeHtml(s.pageTitle || '未知')}</span>
        <span>时间: ${new Date(s.createdAt).toLocaleString('zh-CN')}</span>
      </div>
      ${s.description ? `<p class="screenshot-desc">${escapeHtml(s.description)}</p>` : ''}
      ${s.imageUrl ? `<img src="${s.imageUrl}" alt="截图 ${i + 1}" class="screenshot-img" />` : ''}
      ${s.annotations.length > 0 ? `
        <div class="annotations">
          <p><strong>标注 (${s.annotations.length} 个):</strong></p>
          <ul>
            ${s.annotations.map((a, j) => `
              <li>${j + 1}. ${getAnnotationTypeLabel(a.type)}${a.text ? `: "${escapeHtml(a.text)}"` : ''}</li>
            `).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
  `).join('');

  const aiContentHTML = requirement.aiGeneratedContent ? `
    <div class="ai-content">
      <h2>AI 优化内容</h2>
      <div class="design-suggestions">
        <h3>设计参考</h3>
        <p><strong>布局风格:</strong> ${escapeHtml(requirement.aiGeneratedContent.designSuggestions?.layout?.style || '未指定')}</p>
        <p><strong>布局描述:</strong> ${escapeHtml(requirement.aiGeneratedContent.designSuggestions?.layout?.description || '未提供')}</p>
        
        ${requirement.aiGeneratedContent.designSuggestions?.styleGuide?.colors?.length ? `
          <div class="color-section">
            <p><strong>配色方案:</strong></p>
            <div class="color-list">
              ${requirement.aiGeneratedContent.designSuggestions.styleGuide.colors.map(c => `
                <span class="color-item" style="background-color: ${c};">${c}</span>
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        ${requirement.aiGeneratedContent.designSuggestions?.components?.length ? `
          <div class="components-section">
            <p><strong>组件建议:</strong></p>
            <ul>
              ${requirement.aiGeneratedContent.designSuggestions.components.map(c => `
                <li><strong>${escapeHtml(c.name)}</strong> (${c.type}): ${escapeHtml(c.description)}</li>
              `).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
      
      ${requirement.aiGeneratedContent.generatedPrompt ? `
        <div class="prompt-section">
          <h3>效果图生成 Prompt</h3>
          <pre>${escapeHtml(requirement.aiGeneratedContent.generatedPrompt)}</pre>
        </div>
      ` : ''}
    </div>
  ` : '<div class="ai-content"><h2>AI 优化内容</h2><p>尚未进行 AI 优化</p></div>';

  const mockupHTML = selectedMockup ? `
    <div class="mockup-section avoid-break">
      <h2>已选效果图</h2>
      <p class="mockup-meta">
        <span>方案: ${selectedMockup.variant}</span>
        <span>风格: ${escapeHtml(selectedMockup.style)}</span>
        <span>生成时间: ${new Date(selectedMockup.createdAt).toLocaleString('zh-CN')}</span>
      </p>
      ${selectedMockup.imageUrl ? `<img src="${selectedMockup.imageUrl}" alt="效果图" class="mockup-img" />` : ''}
    </div>
  ` : (requirement.mockupDesigns?.length ? `
    <div class="mockup-section">
      <h2>效果图</h2>
      <p>共 ${requirement.mockupDesigns.length} 张效果图，尚未选择（请在软件中选择）</p>
    </div>
  ` : `
    <div class="mockup-section">
      <h2>效果图</h2>
      <p>尚未生成效果图</p>
    </div>
  `);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif;
          font-size: 12px;
          line-height: 1.6;
          color: #333;
          background: #fff;
        }
        
        .header {
          border-bottom: 2px solid #333;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        
        .header h1 {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
          color: #000;
        }
        
        .header-meta {
          display: flex;
          gap: 20px;
          color: #666;
          font-size: 11px;
        }
        
        .section {
          margin-bottom: 25px;
        }
        
        h2 {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 12px;
          color: #000;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
        }
        
        h3 {
          font-size: 14px;
          font-weight: bold;
          margin: 15px 0 8px 0;
          color: #222;
        }
        
        h4 {
          font-size: 13px;
          font-weight: bold;
          margin: 10px 0 5px 0;
          color: #333;
        }
        
        p {
          margin-bottom: 8px;
        }
        
        .description {
          background: #f9f9f9;
          padding: 12px;
          border-radius: 4px;
          border-left: 3px solid #666;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        
        .screenshot-item {
          margin-bottom: 20px;
          padding: 10px;
          background: #fafafa;
          border-radius: 4px;
        }
        
        .screenshot-meta {
          display: flex;
          gap: 15px;
          color: #666;
          font-size: 10px;
          margin-bottom: 8px;
        }
        
        .screenshot-desc {
          color: #555;
          font-style: italic;
          margin-bottom: 8px;
        }
        
        .screenshot-img {
          max-width: 100%;
          height: auto;
          border: 1px solid #ddd;
          border-radius: 4px;
          margin: 10px 0;
        }
        
        .annotations {
          margin-top: 10px;
          padding: 8px;
          background: #f0f0f0;
          border-radius: 3px;
          font-size: 11px;
        }
        
        .annotations ul {
          margin-left: 20px;
          margin-top: 5px;
        }
        
        .annotations li {
          margin-bottom: 3px;
        }
        
        .design-suggestions {
          background: #f9f9f9;
          padding: 12px;
          border-radius: 4px;
        }
        
        .color-section {
          margin: 10px 0;
        }
        
        .color-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 5px;
        }
        
        .color-item {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 3px;
          font-size: 10px;
          color: #fff;
          text-shadow: 0 0 2px rgba(0,0,0,0.5);
          border: 1px solid rgba(0,0,0,0.1);
        }
        
        .components-section ul {
          margin-left: 20px;
          margin-top: 5px;
        }
        
        .components-section li {
          margin-bottom: 5px;
        }
        
        .prompt-section {
          margin-top: 15px;
        }
        
        .prompt-section pre {
          background: #f4f4f4;
          padding: 10px;
          border-radius: 4px;
          font-size: 10px;
          overflow-x: auto;
          white-space: pre-wrap;
          word-wrap: break-word;
          border: 1px solid #ddd;
        }
        
        .mockup-section {
          margin-top: 20px;
        }
        
        .mockup-meta {
          display: flex;
          gap: 15px;
          color: #666;
          font-size: 11px;
          margin-bottom: 10px;
        }
        
        .mockup-img {
          max-width: 100%;
          height: auto;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid #ddd;
          text-align: center;
          color: #999;
          font-size: 10px;
        }
        
        ul, ol {
          margin-left: 20px;
          margin-bottom: 10px;
        }
        
        li {
          margin-bottom: 4px;
        }
        
        .avoid-break {
          page-break-inside: avoid;
        }
        
        .page-break-before {
          page-break-before: always;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${escapeHtml(requirement.title)}</h1>
        <div class="header-meta">
          <span>状态: ${getStatusLabel(requirement.status)}</span>
          <span>优先级: ${requirement.priority}</span>
          <span>创建: ${new Date(requirement.createdAt).toLocaleString('zh-CN')}</span>
        </div>
      </div>
      
      <div class="section">
        <h2>用户原始描述</h2>
        <div class="description">${escapeHtml(requirement.userDescription || '未提供描述')}</div>
      </div>
      
      ${requirement.screenshots.length > 0 ? `
        <div class="section">
          <h2>截图与标注 (${requirement.screenshots.length} 张)</h2>
          ${screenshotsHTML}
        </div>
      ` : ''}
      
      <div class="section page-break-before">
        ${aiContentHTML}
      </div>
      
      <div class="section">
        ${mockupHTML}
      </div>
      
      <div class="footer">
        由 雕花 (Diaohua) 导出于 ${new Date().toLocaleString('zh-CN')}
      </div>
    </body>
    </html>
  `;
}

/**
 * 转义 HTML 特殊字符
 */
function escapeHtml(text: string): string {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 使用 jsPDF 导出 PDF（备用方案，无中文支持）
 * 仅在 html2pdf 不可用时使用
 */
export async function exportToPDFLegacy(requirement: Requirement): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  let y = margin;

  // 添加中文字体支持（使用内置的 Helvetica 作为回退）
  pdf.setFont('helvetica');

  // 标题
  pdf.setFontSize(24);
  pdf.setTextColor(0, 0, 0);
  pdf.text(requirement.title, margin, y);
  y += 15;

  // 需求信息
  pdf.setFontSize(12);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Status: ${requirement.status} | Priority: ${requirement.priority}`, margin, y);
  y += 10;
  pdf.text(`Created: ${new Date(requirement.createdAt).toLocaleString()}`, margin, y);
  y += 15;

  // 分隔线
  pdf.setDrawColor(200, 200, 200);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 15;

  // 用户描述
  pdf.setFontSize(16);
  pdf.setTextColor(0, 0, 0);
  pdf.text('User Description', margin, y);
  y += 10;
  pdf.setFontSize(11);
  pdf.setTextColor(60, 60, 60);
  const descLines = pdf.splitTextToSize(requirement.userDescription || 'No description provided', pageWidth - margin * 2);
  pdf.text(descLines, margin, y);
  y += descLines.length * 6 + 15;

  // 截图部分
  if (requirement.screenshots.length > 0) {
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Screenshots (${requirement.screenshots.length})`, margin, y);
    y += 10;

    for (const screenshot of requirement.screenshots.slice(0, 3)) { // 最多3张截图
      if (y > pageHeight - 80) {
        pdf.addPage();
        y = margin;
      }

      pdf.setFontSize(11);
      pdf.setTextColor(80, 80, 80);
      pdf.text(screenshot.title || 'Screenshot', margin, y);
      y += 8;

      // 尝试添加图片
      if (screenshot.imageUrl) {
        try {
          const imgData = screenshot.imageUrl;
          const imgWidth = pageWidth - margin * 2;
          const imgHeight = 60; // 固定高度
          pdf.addImage(imgData, 'PNG', margin, y, imgWidth, imgHeight);
          y += imgHeight + 10;
        } catch {
          pdf.setFontSize(10);
          pdf.setTextColor(150, 150, 150);
          pdf.text('[Image not available]', margin, y);
          y += 10;
        }
      }

      // 标注信息
      if (screenshot.annotations.length > 0) {
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Annotations: ${screenshot.annotations.length}`, margin, y);
        y += 8;
      }
    }
  }

  // AI 生成内容
  if (requirement.aiGeneratedContent) {
    if (y > pageHeight - 100) {
      pdf.addPage();
      y = margin;
    }

    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text('AI Generated Content', margin, y);
    y += 10;

    const design = requirement.aiGeneratedContent.designSuggestions;
    if (design) {
      pdf.setFontSize(11);
      pdf.setTextColor(60, 60, 60);
      pdf.text(`Layout Style: ${design.layout?.style || 'N/A'}`, margin, y);
      y += 8;

      const layoutDesc = pdf.splitTextToSize(design.layout?.description || '', pageWidth - margin * 2);
      pdf.text(layoutDesc, margin, y);
      y += layoutDesc.length * 5 + 10;

      // 配色方案
      if (design.styleGuide?.colors?.length) {
        pdf.setFontSize(10);
        pdf.text('Colors:', margin, y);
        y += 6;
        design.styleGuide.colors.forEach((color, idx) => {
          pdf.setFillColor(parseInt(color.slice(1, 3), 16), parseInt(color.slice(3, 5), 16), parseInt(color.slice(5, 7), 16));
          pdf.rect(margin + idx * 25, y - 3, 20, 8, 'F');
        });
        y += 15;
      }
    }
  }

  // 效果图
  const selectedMockup = requirement.mockupDesigns?.find(m => m.id === requirement.selectedMockupId);
  if (selectedMockup) {
    if (y > pageHeight - 80) {
      pdf.addPage();
      y = margin;
    }

    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Selected Mockup', margin, y);
    y += 10;

    pdf.setFontSize(10);
    pdf.setTextColor(80, 80, 80);
    pdf.text(`Variant: ${selectedMockup.variant} | Style: ${selectedMockup.style}`, margin, y);
    y += 8;

    if (selectedMockup.imageUrl) {
      try {
        const imgWidth = pageWidth - margin * 2;
        const imgHeight = 80;
        pdf.addImage(selectedMockup.imageUrl, 'PNG', margin, y, imgWidth, imgHeight);
        y += imgHeight + 10;
      } catch {
        pdf.text('[Mockup image not available]', margin, y);
        y += 10;
      }
    }
  }

  // 页脚
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.text(`Generated by Diaohua on ${new Date().toLocaleString()}`, margin, pageHeight - 10);

  // 下载 PDF
  pdf.save(`${requirement.title}_report.pdf`);
}
