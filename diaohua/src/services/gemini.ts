import { useConfigStore } from '@/stores/configStore';
import type { Requirement, PRDVersion } from '@/types';

export interface PRDGenerationResult {
  prdMarkdown: string;
  designSuggestions: DesignSuggestion;
  generatedPrompt: string;
}

export interface DesignSuggestion {
  layout: {
    style: string;
    description: string;
  };
  components: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  styleGuide: {
    colors: string[];
    typography: string;
  };
  interactions: string[];
}

export interface MockupGenerationResult {
  images: Array<{
    base64: string;
    mimeType: string;
    variant: 'A' | 'B';
  }>;
  prompt: string;
}

export class GeminiService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * 生成 PRD 和设计参考
   */
  async generatePRD(params: {
    requirement: Requirement;
  }): Promise<PRDGenerationResult> {
    const { requirement } = params;
    
    console.log('[GeminiService.generatePRD] 开始生成 PRD...');
    console.log('[GeminiService.generatePRD] API Key 前5位:', this.apiKey.substring(0, 5) + '...');
    
    const prompt = this.buildPRDPrompt(requirement);
    console.log('[GeminiService.generatePRD] Prompt 长度:', prompt.length);
    
    const url = `${this.baseUrl}/models/gemini-1.5-flash-latest:generateContent?key=${this.apiKey}`;
    console.log('[GeminiService.generatePRD] 请求 URL:', url.substring(0, 60) + '...');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { 
          temperature: 0.7, 
          maxOutputTokens: 4096,
        },
      }),
    });

    console.log('[GeminiService.generatePRD] 响应状态:', response.status);
    
    if (!response.ok) {
      const error = await response.text();
      console.error('[GeminiService.generatePRD] API 错误:', error);
      throw new Error(`Gemini API 错误: ${response.status} - ${error}`);
    }

    const data = await response.json();
    console.log('[GeminiService.generatePRD] 响应数据:', data);
    
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log('[GeminiService.generatePRD] 解析后的文本长度:', text.length);
    
    return this.parsePRDResponse(text);
  }

  /**
   * 生成效果图（A/B 两张）
   */
  async generateMockups(params: {
    prompt: string;
    aspectRatio?: string;
  }): Promise<MockupGenerationResult> {
    const { prompt, aspectRatio = '16:9' } = params;

    // 调用 Imagen API 生成图片
    const response = await fetch(
      `${this.baseUrl}/models/imagen-3.0-generate-001:predict?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{
            prompt,
            aspectRatio: this.convertAspectRatio(aspectRatio),
          }],
          parameters: {
            sampleCount: 2, // 生成 2 张图
          }
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Imagen API 错误: ${response.status} - ${error}`);
    }
    
    const data = await response.json();
    const predictions = data.predictions || [];
    
    return {
      images: predictions.map((pred: any, idx: number) => ({
        base64: pred.bytesBase64Encoded,
        mimeType: pred.mimeType || 'image/png',
        variant: idx === 0 ? 'A' : 'B' as 'A' | 'B',
      })),
      prompt,
    };
  }

  /**
   * 构建 PRD 生成 Prompt
   */
  private buildPRDPrompt(requirement: Requirement): string {
    const screenshotsInfo = requirement.screenshots.map((s, i) => {
      const annotationsInfo = s.annotations.map((a, j) => {
        let details = '';
        switch (a.type) {
          case 'rectangle':
            details = `矩形框标注 (${Math.round(a.coordinates.x)}, ${Math.round(a.coordinates.y)})`;
            break;
          case 'circle':
            details = `圆形标注`;
            break;
          case 'arrow':
            details = `箭头指向`;
            break;
          case 'text':
            details = `文字: "${a.text}"`;
            break;
          default:
            details = `${a.type} 标注`;
        }
        return `    标注 ${j + 1}: ${details}`;
      }).join('\n');

      return `
截图 ${i + 1}:
  URL: ${s.url}
  描述: ${s.description || '无'}
  标注:\n${annotationsInfo || '    无'}
`;
    }).join('\n');

    return `作为资深产品经理和UX设计师，请基于以下信息生成专业PRD和设计建议。

【需求标题】
${requirement.title}

【截图标注信息】
${screenshotsInfo}

【用户原始需求描述】
${requirement.userDescription || '未提供'}

【重要要求】
1. 分析截图中现有产品的视觉风格（颜色、布局、设计语言）
2. 生成优化方案时必须保持这种风格一致，不要改变品牌调性
3. 输出用于生成效果图的英文Prompt，要求保持与现有产品一致的风格

【输出格式】
请严格按照以下 JSON 格式输出，不要包含其他内容：

{
  "prdMarkdown": "# 需求标题\\n\\n## 1. 现状分析\\n...\\n\\n## 2. 优化目标\\n...\\n\\n## 3. 功能需求\\n...\\n\\n## 4. 验收标准\\n...",
  "designSuggestions": {
    "layout": {
      "style": "布局风格名称",
      "description": "布局描述"
    },
    "components": [
      { "name": "组件名", "type": "组件类型", "description": "组件描述" }
    ],
    "styleGuide": {
      "colors": ["#1890ff", "#ffffff"],
      "typography": "字体描述"
    },
    "interactions": ["交互1", "交互2"]
  },
  "generatedPrompt": "用于生成效果图的英文Prompt，保持现有产品风格，包含具体颜色值"
}

注意：
- prdMarkdown 使用 Markdown 格式，使用 \\n 表示换行
- generatedPrompt 必须是英文，详细描述 UI mockup 的视觉风格
- 分析现有产品的颜色方案并在 generatedPrompt 中体现`;
  }

  /**
   * 解析 PRD 生成响应
   */
  private parsePRDResponse(text: string): PRDGenerationResult {
    try {
      // 尝试直接解析 JSON
      const result = JSON.parse(text);
      return {
        prdMarkdown: result.prdMarkdown || '',
        designSuggestions: result.designSuggestions || {},
        generatedPrompt: result.generatedPrompt || '',
      };
    } catch {
      // 如果不是纯 JSON，尝试提取 JSON 部分
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const result = JSON.parse(jsonMatch[0]);
          return {
            prdMarkdown: result.prdMarkdown || '',
            designSuggestions: result.designSuggestions || {},
            generatedPrompt: result.generatedPrompt || '',
          };
        } catch {
          // 解析失败，返回原始文本作为 PRD
        }
      }
      
      // 兜底：将原始文本作为 PRD
      return {
        prdMarkdown: text,
        designSuggestions: {
          layout: { style: '未知', description: '' },
          components: [],
          styleGuide: { colors: [], typography: '' },
          interactions: [],
        },
        generatedPrompt: '',
      };
    }
  }

  /**
   * 转换宽高比格式
   */
  private convertAspectRatio(ratio: string): string {
    const map: Record<string, string> = {
      '1:1': '1:1',
      '4:3': '4:3',
      '16:9': '16:9',
      '9:16': '9:16',
      '3:4': '3:4',
    };
    return map[ratio] || '16:9';
  }

  /**
   * 验证 API Key 是否有效
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/models?key=${this.apiKey}`,
        { method: 'GET' }
      );
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Hook for easy access
export function useGeminiService(): GeminiService | null {
  const { geminiApiKey, isAIConfigured } = useConfigStore();
  
  console.log('[useGeminiService] geminiApiKey:', geminiApiKey ? '已设置 (长度:' + geminiApiKey.length + ')' : '未设置');
  console.log('[useGeminiService] isAIConfigured:', isAIConfigured);
  
  if (!geminiApiKey) {
    console.log('[useGeminiService] 返回 null - 没有 API Key');
    return null;
  }
  
  console.log('[useGeminiService] 返回 GeminiService 实例');
  return new GeminiService(geminiApiKey);
}

/**
 * 创建 PRD 版本记录
 */
export function createPRDVersion(result: PRDGenerationResult): PRDVersion {
  const now = new Date().toISOString();
  return {
    id: `prd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    content: {
      prdMarkdown: result.prdMarkdown,
      designSuggestions: result.designSuggestions,
      generatedPrompt: result.generatedPrompt,
      generatedAt: now,
    },
    prdMarkdown: result.prdMarkdown,
    generatedAt: now,
    generatedPrompt: result.generatedPrompt,
    designSuggestions: result.designSuggestions,
    createdBy: 'AI',
    createdAt: now,
    changeSummary: 'AI 生成的 PRD',
  };
}

/**
 * 将当前 PRD 保存到历史版本
 */
export function saveCurrentPRDToHistory(
  _requirement: Requirement,
  aiGeneratedContent: NonNullable<Requirement['aiGeneratedContent']>
): PRDVersion {
  const version: PRDVersion = {
    id: `prd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    content: aiGeneratedContent,
    createdAt: aiGeneratedContent.generatedAt,
    createdBy: 'AI',
    changeSummary: 'AI 生成的 PRD',
  };

  return version;
}
