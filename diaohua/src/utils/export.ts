import type { Requirement } from '@/types';

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
      screenshots: requirement.screenshots.map(s => ({
        id: s.id,
        url: s.url,
        title: s.title,
        imageUrl: s.imageUrl,
        annotations: s.annotations,
        description: s.description,
      })),
      userDescription: requirement.userDescription,
      aiGeneratedContent: requirement.aiGeneratedContent,
      selectedMockup: requirement.mockupDesigns?.find(m => m.id === requirement.selectedMockupId),
    },
  };

  return JSON.stringify(exportData, null, 2);
}

export function exportToMarkdown(requirement: Requirement): string {
  const selectedMockup = requirement.mockupDesigns?.find(m => m.id === requirement.selectedMockupId);
  
  return `# ${requirement.title}

## 需求信息

- **状态**: ${requirement.status}
- **优先级**: ${requirement.priority}
- **创建时间**: ${new Date(requirement.createdAt).toLocaleString()}
- **更新时间**: ${new Date(requirement.updatedAt).toLocaleString()}

## 用户原始描述

${requirement.userDescription || '无'}

## 截图与标注

${requirement.screenshots.map((s, i) => `
### 截图 ${i + 1}: ${s.title}

![截图 ${i + 1}](${s.imageUrl})

**描述**: ${s.description || '无'}

**标注**:
${s.annotations.length > 0 
  ? s.annotations.map(a => `- ${a.type}: ${a.text || '无描述'}`).join('\n')
  : '无标注'}
`).join('\n---\n')}

## AI优化后的PRD

${requirement.aiGeneratedContent?.prdMarkdownUrl || '尚未生成'}

## 选中的效果图

${selectedMockup 
  ? `![效果图](${selectedMockup.imageUrl})\n\n**生成Prompt**: ${selectedMockup.prompt}`
  : '尚未选择'}

---

*由 雕花 导出*
`;
}

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
