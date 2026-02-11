import { useState } from 'react';
import { useRequirementStore } from '@/stores/requirementStore';
import { useGeminiService, type PRDGenerationResult } from '@/services/gemini';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { 
  ChevronLeft, 
  Wand2, 
  FileJson, 
  FileText,
  Loader2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { MockupReview } from './MockupReview';
import { exportToJSON, exportToMarkdown, downloadFile } from '@/utils/export';

interface AIResultPanelProps {
  onBack: () => void;
}

export function AIResultPanel({ onBack }: AIResultPanelProps) {
  const { 
    currentRequirement,
    updateRequirement,
  } = useRequirementStore();
  
  const geminiService = useGeminiService();
  
  const [activeTab, setActiveTab] = useState<'prd' | 'design' | 'mockup'>('prd');
  const [isGeneratingPRD, setIsGeneratingPRD] = useState(false);
  const [isGeneratingMockup, setIsGeneratingMockup] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<PRDGenerationResult | null>(
    currentRequirement?.aiGeneratedContent && {
      prdMarkdown: '', // 需要从存储中恢复
      designSuggestions: currentRequirement.aiGeneratedContent.designSuggestions,
      generatedPrompt: currentRequirement.aiGeneratedContent.generatedPrompt,
    } || null
  );

  if (!currentRequirement) return null;

  const handleGeneratePRD = async () => {
    if (!geminiService) {
      setError('请先配置 Gemini API Key');
      return;
    }

    if (currentRequirement.screenshots.length === 0) {
      setError('请至少添加一张截图');
      return;
    }

    setIsGeneratingPRD(true);
    setError(null);

    try {
      const result = await geminiService.generatePRD({
        requirement: currentRequirement,
      });
      
      setAiResult(result);
      
      // 保存到需求中
      updateRequirement(currentRequirement.id, {
        aiGeneratedContent: {
          prdMarkdown: result.prdMarkdown,
          designSuggestions: result.designSuggestions,
          generatedPrompt: result.generatedPrompt,
          generatedAt: new Date().toISOString(),
        },
        status: 'ai_generating',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败，请重试');
    } finally {
      setIsGeneratingPRD(false);
    }
  };

  const handleGenerateMockup = async () => {
    if (!geminiService) {
      setError('请先配置 Gemini API Key');
      return;
    }

    const prompt = aiResult?.generatedPrompt || currentRequirement.aiGeneratedContent?.generatedPrompt;
    if (!prompt) {
      setError('请先生成 PRD 以获取效果图 Prompt');
      return;
    }

    setIsGeneratingMockup(true);
    setError(null);

    try {
      const result = await geminiService.generateMockups({
        prompt,
        aspectRatio: '16:9',
      });

      // 保存效果图
      const mockups = result.images.map((img) => ({
        id: Date.now().toString() + img.variant,
        generationBatch: (currentRequirement.mockupDesigns?.length || 0) + 1,
        variant: img.variant,
        imageUrl: `data:${img.mimeType};base64,${img.base64}`,
        prompt: result.prompt,
        style: aiResult?.designSuggestions?.layout?.style || '默认风格',
        params: { aspectRatio: '16:9' },
        selected: false,
        createdAt: new Date().toISOString(),
      }));

      updateRequirement(currentRequirement.id, {
        mockupDesigns: [...(currentRequirement.mockupDesigns || []), ...mockups],
        status: 'mockup_review',
      });

      setActiveTab('mockup');
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成效果图失败，请重试');
    } finally {
      setIsGeneratingMockup(false);
    }
  };

  const handleExportJSON = () => {
    if (!currentRequirement) return;
    setIsExporting(true);
    const content = exportToJSON(currentRequirement);
    downloadFile(content, `${currentRequirement.title}_requirement.json`, 'application/json');
    setTimeout(() => setIsExporting(false), 500);
  };

  const handleExportMarkdown = () => {
    if (!currentRequirement) return;
    setIsExporting(true);
    const content = exportToMarkdown(currentRequirement);
    downloadFile(content, `${currentRequirement.title}_prd.md`, 'text/markdown');
    setTimeout(() => setIsExporting(false), 500);
  };

  const hasAIResult = aiResult !== null || currentRequirement.aiGeneratedContent !== undefined;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="h-14 border-b flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ChevronLeft size={16} className="mr-1" />
            返回
          </Button>
          
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {[
              { id: 'prd', label: 'PRD文档' },
              { id: 'design', label: '设计参考' },
              { id: 'mockup', label: '效果图' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={handleExportJSON}
            disabled={isExporting}
          >
            <FileJson size={16} />
            导出JSON
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={handleExportMarkdown}
            disabled={isExporting}
          >
            <FileText size={16} />
            导出Markdown
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-200 flex items-center gap-2 text-red-700">
          <AlertCircle size={16} />
          <span className="text-sm">{error}</span>
          <button 
            onClick={() => setError(null)}
            className="ml-auto text-xs hover:underline"
          >
            关闭
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {!geminiService && (
          <div className="max-w-2xl mx-auto text-center py-12">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} className="text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">需要配置 API Key</h3>
            <p className="text-muted-foreground mb-4">
              请前往设置页面配置 Google Gemini API Key 以使用 AI 功能
            </p>
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline text-sm"
            >
              获取 API Key →
            </a>
          </div>
        )}

        {geminiService && activeTab === 'prd' && (
          <div className="max-w-3xl mx-auto">
            {!hasAIResult ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wand2 size={32} className="text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">生成 AI 优化 PRD</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  基于您的截图标注和需求描述，AI 将生成专业的 PRD 文档和设计建议
                </p>
                <Button 
                  size="lg" 
                  onClick={handleGeneratePRD}
                  disabled={isGeneratingPRD}
                  className="gap-2"
                >
                  {isGeneratingPRD && <Loader2 size={18} className="animate-spin" />}
                  {isGeneratingPRD ? '生成中...' : '生成 PRD'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">AI 生成的 PRD</h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleGeneratePRD}
                    disabled={isGeneratingPRD}
                    className="gap-2"
                  >
                    <RefreshCw size={14} />
                    重新生成
                  </Button>
                </div>
                
                <Card className="p-6">
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed bg-muted p-4 rounded-lg">
                      {aiResult?.prdMarkdown || currentRequirement.aiGeneratedContent?.generatedPrompt || '暂无内容'}
                    </pre>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}

        {geminiService && activeTab === 'design' && (
          <div className="max-w-3xl mx-auto space-y-6">
            {!hasAIResult ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">请先生成 PRD 以查看设计参考</p>
                <Button 
                  className="mt-4"
                  onClick={() => setActiveTab('prd')}
                >
                  前往生成
                </Button>
              </div>
            ) : (
              <>
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">布局建议</h3>
                  <p className="text-muted-foreground">
                    {aiResult?.designSuggestions?.layout?.description || '暂无'}
                  </p>
                  <div className="mt-2 text-sm">
                    <span className="font-medium">风格：</span> 
                    {aiResult?.designSuggestions?.layout?.style || '未指定'}
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">配色方案</h3>
                  <div className="flex gap-3 flex-wrap">
                    {(aiResult?.designSuggestions?.styleGuide?.colors || []).map((color, i) => (
                      <div key={i} className="flex flex-col items-center gap-2">
                        <div
                          className="w-16 h-16 rounded-lg border shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs text-muted-foreground font-mono">{color}</span>
                      </div>
                    ))}
                    {(aiResult?.designSuggestions?.styleGuide?.colors || []).length === 0 && (
                      <p className="text-muted-foreground text-sm">未提供配色方案</p>
                    )}
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">组件建议</h3>
                  <div className="space-y-3">
                    {(aiResult?.designSuggestions?.components || []).map((comp, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div>
                          <span className="font-medium">{comp.name}</span>
                          <p className="text-xs text-muted-foreground">{comp.description}</p>
                        </div>
                        <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                          {comp.type}
                        </span>
                      </div>
                    ))}
                    {(aiResult?.designSuggestions?.components || []).length === 0 && (
                      <p className="text-muted-foreground text-sm">未提供组件建议</p>
                    )}
                  </div>
                </Card>

                <div className="flex justify-center">
                  <Button 
                    size="lg" 
                    className="gap-2"
                    onClick={handleGenerateMockup}
                    disabled={isGeneratingMockup}
                  >
                    {isGeneratingMockup ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Wand2 size={18} />
                    )}
                    {isGeneratingMockup ? '生成中...' : '生成效果图'}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {geminiService && activeTab === 'mockup' && (
          <MockupReview 
            onGenerate={handleGenerateMockup} 
            isGenerating={isGeneratingMockup}
          />
        )}
      </div>
    </div>
  );
}
