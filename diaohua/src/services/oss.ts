import { useConfigStore } from '@/stores/configStore';

export class OSSService {
  private config: ReturnType<typeof useConfigStore.getState>['oss'];

  constructor() {
    const state = useConfigStore.getState();
    this.config = state.oss;
  }

  async uploadFile(
    file: File | Blob,
    key: string,
    onProgress?: (percent: number) => void
  ): Promise<string> {
    const mockUrl = `https://${this.config.domain || 'mock.qiniudn.com'}/${key}`;
    
    if (onProgress) {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        onProgress(progress);
        if (progress >= 100) clearInterval(interval);
      }, 100);
    }

    return new Promise((resolve) => {
      setTimeout(() => resolve(mockUrl), 1000);
    });
  }

  generateKey(prefix: string, ext: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}/${timestamp}_${random}.${ext}`;
  }
}

export class GeminiService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generatePRD(params: {
    screenshots: any[];
    userDescription: string;
  }): Promise<{ prdMarkdown: string; designSuggestions: any; generatedPrompt: string }> {
    const prompt = this.buildPRDPrompt(params);
    
    const response = await fetch(
      `${this.baseUrl}/models/gemini-1.5-pro:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
        }),
      }
    );

    if (!response.ok) throw new Error(`Gemini API error: ${response.statusText}`);

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    return this.parsePRDResponse(text);
  }

  async generateMockups(params: {
    prompt: string;
    negativePrompt?: string;
    aspectRatio?: string;
    numberOfImages?: number;
  }): Promise<Array<{ bytesBase64Encoded: string; mimeType: string }>> {
    const { prompt, negativePrompt, aspectRatio = '16:9', numberOfImages = 2 } = params;

    const response = await fetch(
      `${this.baseUrl}/models/imagen-3-generate-001:predict?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt, negativePrompt, aspectRatio, numberOfImages }],
        }),
      }
    );

    if (!response.ok) throw new Error(`Imagen API error: ${response.statusText}`);

    const data = await response.json();
    return data.predictions || [];
  }

  private buildPRDPrompt(params: { screenshots: any[]; userDescription: string }): string {
    return `
作为资深产品经理和UX设计师，请基于以下信息生成专业PRD和设计建议：

【截图信息】
${params.screenshots.map((s, i) => `
截图 ${i + 1}:
- URL: ${s.imageUrl}
- 标注: ${JSON.stringify(s.annotations)}
- 描述: ${s.description}
`).join('\n')}

【用户需求描述】
${params.userDescription}

【重要要求】
1. 分析截图中现有产品的视觉风格（颜色、布局、设计语言）
2. 生成优化方案时必须保持这种风格一致，不要改变品牌调性
3. 输出用于生成效果图的英文Prompt，要求保持与现有产品一致的风格

【输出格式】
请按以下格式输出：

## PRD
[Markdown格式的PRD文档]

## DESIGN_REFERENCE
[JSON格式的设计参考]

## IMAGE_PROMPT
[用于生成效果图的英文Prompt，保持现有产品风格]
`;
  }

  private parsePRDResponse(text: string) {
    const prdMatch = text.match(/## PRD\n([\s\S]*?)(?=## DESIGN_REFERENCE|$)/);
    const designMatch = text.match(/## DESIGN_REFERENCE\n([\s\S]*?)(?=## IMAGE_PROMPT|$)/);
    const promptMatch = text.match(/## IMAGE_PROMPT\n([\s\S]*?)$/);

    return {
      prdMarkdown: prdMatch?.[1]?.trim() || '',
      designSuggestions: JSON.parse(designMatch?.[1]?.trim() || '{}'),
      generatedPrompt: promptMatch?.[1]?.trim() || '',
    };
  }
}
