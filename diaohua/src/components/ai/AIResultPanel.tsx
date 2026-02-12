import { useState, useEffect } from 'react';
import { useRequirementStore } from '@/stores/requirementStore';
import { useConfigStore } from '@/stores/configStore';
import { useGeminiService, type PRDGenerationResult } from '@/services/gemini';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { 
  ChevronLeft, 
  Wand2, 
  FileJson, 
  FileText,
  Loader2,
  RefreshCw,
  AlertCircle,
  Edit3,
  Save,
  X,
  Plus,
  Trash2,
  Palette,
  Layout,
  Box,
  Wand2 as WandIcon,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { MockupReview } from './MockupReview';
import { exportToJSON, exportToMarkdown, downloadFile } from '@/utils/export';
import type { DesignSuggestion, ComponentSuggestion } from '@/types';

interface AIResultPanelProps {
  onBack: () => void;
}

export function AIResultPanel({ onBack }: AIResultPanelProps) {
  const { 
    currentRequirement,
    updateRequirement,
  } = useRequirementStore();
  
  // 监控 store 中的 API Key
  const { geminiApiKey, isAIConfigured } = useConfigStore();
  const geminiService = useGeminiService();
  
  useEffect(() => {
    console.log('[AIResultPanel] 状态更新 - geminiApiKey:', geminiApiKey ? '存在(长度' + geminiApiKey.length + ')' : '空', '| isAIConfigured:', isAIConfigured);
    console.log('[AIResultPanel] 状态更新 - geminiService:', geminiService ? '存在' : 'null');
  }, [geminiApiKey, isAIConfigured, geminiService]);
  
  const [activeTab, setActiveTab] = useState<'prd' | 'design' | 'mockup'>('prd');
  const [isGeneratingPRD, setIsGeneratingPRD] = useState(false);
  const [isGeneratingMockup, setIsGeneratingMockup] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<PRDGenerationResult | null>(
    currentRequirement?.aiGeneratedContent && {
      prdMarkdown: currentRequirement.aiGeneratedContent.prdMarkdown || '',
      designSuggestions: currentRequirement.aiGeneratedContent.designSuggestions,
      generatedPrompt: currentRequirement.aiGeneratedContent.generatedPrompt,
    } || null
  );

  // 编辑状态
  const [isEditingPRD, setIsEditingPRD] = useState(false);
  const [editedPRD, setEditedPRD] = useState('');
  const [isEditingDesign, setIsEditingDesign] = useState(false);
  const [editedDesign, setEditedDesign] = useState<DesignSuggestion | null>(null);
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState('');

  if (!currentRequirement) return null;

  const handleGeneratePRD = async () => {
    console.log('[handleGeneratePRD] 开始执行...');
    console.log('[handleGeneratePRD] geminiService:', geminiService ? '存在' : 'null');
    
    if (!geminiService) {
      console.log('[handleGeneratePRD] 错误: geminiService 为 null');
      setError('请先配置 Gemini API Key');
      return;
    }

    console.log('[handleGeneratePRD] 截图数量:', currentRequirement.screenshots.length);
    if (currentRequirement.screenshots.length === 0) {
      setError('请至少添加一张截图');
      return;
    }

    setIsGeneratingPRD(true);
    setError(null);

    try {
      console.log('[handleGeneratePRD] 调用 geminiService.generatePRD...');
      const result = await geminiService.generatePRD({
        requirement: currentRequirement,
      });
      console.log('[handleGeneratePRD] 生成成功:', result);
      
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
      
      // 更新编辑状态
      setEditedPRD(result.prdMarkdown);
      setEditedDesign(result.designSuggestions);
      setEditedPrompt(result.generatedPrompt);
    } catch (err) {
      console.error('[handleGeneratePRD] 生成失败:', err);
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

  // 初始化编辑状态
  useEffect(() => {
    if (currentRequirement?.aiGeneratedContent) {
      setEditedPRD(currentRequirement.aiGeneratedContent.prdMarkdown || '');
      setEditedDesign(currentRequirement.aiGeneratedContent.designSuggestions);
      setEditedPrompt(currentRequirement.aiGeneratedContent.generatedPrompt || '');
    }
  }, [currentRequirement?.aiGeneratedContent?.generatedAt]);

  // 保存 PRD 编辑
  const handleSavePRD = () => {
    if (!currentRequirement) return;
    
    const updatedContent = {
      ...currentRequirement.aiGeneratedContent!,
      prdMarkdown: editedPRD,
      generatedAt: new Date().toISOString(),
    };
    
    updateRequirement(currentRequirement.id, {
      aiGeneratedContent: updatedContent,
    });
    
    setAiResult(prev => prev ? { ...prev, prdMarkdown: editedPRD } : null);
    setIsEditingPRD(false);
  };

  // 保存设计风格编辑
  const handleSaveDesign = () => {
    if (!currentRequirement || !editedDesign) return;
    
    const updatedContent = {
      ...currentRequirement.aiGeneratedContent!,
      designSuggestions: editedDesign,
      generatedAt: new Date().toISOString(),
    };
    
    updateRequirement(currentRequirement.id, {
      aiGeneratedContent: updatedContent,
    });
    
    setAiResult(prev => prev ? { ...prev, designSuggestions: editedDesign } : null);
    setIsEditingDesign(false);
  };

  // 保存 Prompt 编辑
  const handleSavePrompt = () => {
    if (!currentRequirement) return;
    
    const updatedContent = {
      ...currentRequirement.aiGeneratedContent!,
      generatedPrompt: editedPrompt,
      generatedAt: new Date().toISOString(),
    };
    
    updateRequirement(currentRequirement.id, {
      aiGeneratedContent: updatedContent,
    });
    
    setAiResult(prev => prev ? { ...prev, generatedPrompt: editedPrompt } : null);
    setIsEditingPrompt(false);
  };

  // 添加颜色
  const handleAddColor = () => {
    if (!editedDesign) return;
    const newColor = '#000000';
    setEditedDesign({
      ...editedDesign,
      styleGuide: {
        ...editedDesign.styleGuide,
        colors: [...(editedDesign.styleGuide.colors || []), newColor],
      },
    });
  };

  // 更新颜色
  const handleUpdateColor = (index: number, color: string) => {
    if (!editedDesign) return;
    const newColors = [...(editedDesign.styleGuide.colors || [])];
    newColors[index] = color;
    setEditedDesign({
      ...editedDesign,
      styleGuide: {
        ...editedDesign.styleGuide,
        colors: newColors,
      },
    });
  };

  // 删除颜色
  const handleRemoveColor = (index: number) => {
    if (!editedDesign) return;
    const newColors = [...(editedDesign.styleGuide.colors || [])];
    newColors.splice(index, 1);
    setEditedDesign({
      ...editedDesign,
      styleGuide: {
        ...editedDesign.styleGuide,
        colors: newColors,
      },
    });
  };

  // 添加组件
  const handleAddComponent = () => {
    if (!editedDesign) return;
    const newComponent: ComponentSuggestion = {
      name: '新组件',
      type: 'custom',
      description: '组件描述',
    };
    setEditedDesign({
      ...editedDesign,
      components: [...(editedDesign.components || []), newComponent],
    });
  };

  // 更新组件
  const handleUpdateComponent = (index: number, field: keyof ComponentSuggestion, value: string) => {
    if (!editedDesign) return;
    const newComponents = [...(editedDesign.components || [])];
    newComponents[index] = { ...newComponents[index], [field]: value };
    setEditedDesign({
      ...editedDesign,
      components: newComponents,
    });
  };

  // 删除组件
  const handleRemoveComponent = (index: number) => {
    if (!editedDesign) return;
    const newComponents = [...(editedDesign.components || [])];
    newComponents.splice(index, 1);
    setEditedDesign({
      ...editedDesign,
      components: newComponents,
    });
  };

  // 使用编辑后的 Prompt 生成效果图
  const handleGenerateWithEditedPrompt = async () => {
    if (!geminiService || !editedPrompt) {
      setError('请先编辑 Prompt');
      return;
    }

    setIsGeneratingMockup(true);
    setError(null);

    try {
      const result = await geminiService.generateMockups({
        prompt: editedPrompt,
        aspectRatio: '16:9',
      });

      // 保存效果图
      const mockups = result.images.map((img) => ({
        id: Date.now().toString() + img.variant,
        generationBatch: (currentRequirement.mockupDesigns?.length || 0) + 1,
        variant: img.variant,
        imageUrl: `data:${img.mimeType};base64,${img.base64}`,
        prompt: result.prompt,
        style: editedDesign?.layout?.style || aiResult?.designSuggestions?.layout?.style || '默认风格',
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

  const hasAIResult = aiResult !== null || currentRequirement.aiGeneratedContent !== undefined;
  const currentDesign = editedDesign || aiResult?.designSuggestions || currentRequirement.aiGeneratedContent?.designSuggestions;

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
                  <div className="flex items-center gap-2">
                    {isEditingPRD ? (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setIsEditingPRD(false);
                            setEditedPRD(currentRequirement.aiGeneratedContent?.prdMarkdown || '');
                          }}
                          className="gap-2"
                        >
                          <X size={14} />
                          取消
                        </Button>
                        <Button 
                          size="sm"
                          onClick={handleSavePRD}
                          className="gap-2"
                        >
                          <Save size={14} />
                          保存
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            // 确保 editedPRD 从当前内容初始化
                            const currentPRD = currentRequirement.aiGeneratedContent?.prdMarkdown || aiResult?.prdMarkdown || '';
                            setEditedPRD(currentPRD);
                            setIsEditingPRD(true);
                          }}
                          className="gap-2"
                        >
                          <Edit3 size={14} />
                          编辑
                        </Button>
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
                      </>
                    )}
                  </div>
                </div>
                
                <Card className="p-6">
                  {isEditingPRD ? (
                    <Textarea
                      value={editedPRD}
                      onChange={(e) => setEditedPRD(e.target.value)}
                      className="min-h-[500px] font-mono text-sm"
                      placeholder="在此编辑 PRD 内容..."
                    />
                  ) : (
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed bg-muted p-4 rounded-lg">
                        {currentRequirement.aiGeneratedContent?.prdMarkdown || aiResult?.prdMarkdown || '暂无内容'}
                      </pre>
                    </div>
                  )}
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
                {/* 整体编辑控制栏 */}
                <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-10 py-2">
                  <h3 className="text-lg font-semibold text-muted-foreground">AI 生成的设计参考</h3>
                  {!isEditingDesign ? (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setEditedDesign(currentDesign || null);
                        setIsEditingDesign(true);
                      }}
                      className="gap-2"
                    >
                      <Edit3 size={16} />
                      编辑全部
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setIsEditingDesign(false);
                          setEditedDesign(null);
                        }}
                      >
                        取消
                      </Button>
                      <Button 
                        size="sm"
                        onClick={handleSaveDesign}
                        className="gap-2"
                      >
                        <Save size={16} />
                        保存修改
                      </Button>
                    </div>
                  )}
                </div>

                {/* 布局建议卡片 */}
                <Card className={cn("p-6", isEditingDesign && "border-primary/50 ring-1 ring-primary/20")}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Layout size={20} className="text-primary" />
                      <h3 className="text-lg font-semibold">布局建议</h3>
                    </div>
                    {!isEditingDesign && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setEditedDesign(currentDesign || null);
                          setIsEditingDesign(true);
                        }}
                        className="gap-2 text-muted-foreground hover:text-foreground"
                      >
                        <Edit3 size={14} />
                        编辑
                      </Button>
                    )}
                  </div>
                  
                  {isEditingDesign && editedDesign ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">风格</label>
                        <Input
                          value={editedDesign.layout?.style || ''}
                          onChange={(e) => setEditedDesign({
                            ...editedDesign,
                            layout: { ...editedDesign.layout, style: e.target.value },
                          })}
                          placeholder="例如：现代简约、商务专业..."
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">描述</label>
                        <Textarea
                          value={editedDesign.layout?.description || ''}
                          onChange={(e) => setEditedDesign({
                            ...editedDesign,
                            layout: { ...editedDesign.layout, description: e.target.value },
                          })}
                          placeholder="描述布局特点..."
                          rows={3}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-muted-foreground">
                        {currentDesign?.layout?.description || '暂无'}
                      </p>
                      <div className="mt-2 text-sm">
                        <span className="font-medium">风格：</span> 
                        {currentDesign?.layout?.style || '未指定'}
                      </div>
                    </>
                  )}
                </Card>

                {/* 配色方案卡片 */}
                <Card className={cn("p-6", isEditingDesign && "border-primary/50 ring-1 ring-primary/20")}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Palette size={20} className="text-primary" />
                      <h3 className="text-lg font-semibold">配色方案</h3>
                    </div>
                    {isEditingDesign && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleAddColor}
                        className="gap-2"
                      >
                        <Plus size={14} />
                        添加颜色
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex gap-3 flex-wrap">
                    {(isEditingDesign ? editedDesign?.styleGuide?.colors : currentDesign?.styleGuide?.colors)?.map((color, i) => (
                      <div key={i} className="flex flex-col items-center gap-2">
                        {isEditingDesign ? (
                          <div className="flex flex-col items-center gap-1">
                            <input
                              type="color"
                              value={color}
                              onChange={(e) => handleUpdateColor(i, e.target.value)}
                              className="w-16 h-16 rounded-lg border cursor-pointer"
                            />
                            <div className="flex items-center gap-1">
                              <Input
                                value={color}
                                onChange={(e) => handleUpdateColor(i, e.target.value)}
                                className="w-20 h-7 text-xs px-2"
                              />
                              <button
                                onClick={() => handleRemoveColor(i)}
                                className="p-1 hover:bg-red-100 text-red-500 rounded"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div
                              className="w-16 h-16 rounded-lg border shadow-sm"
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-xs text-muted-foreground font-mono">{color}</span>
                          </>
                        )}
                      </div>
                    ))}
                    {(isEditingDesign ? editedDesign?.styleGuide?.colors?.length : currentDesign?.styleGuide?.colors?.length) === 0 && (
                      <p className="text-muted-foreground text-sm">未提供配色方案</p>
                    )}
                  </div>
                </Card>

                {/* 组件建议卡片 */}
                <Card className={cn("p-6", isEditingDesign && "border-primary/50 ring-1 ring-primary/20")}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Box size={20} className="text-primary" />
                      <h3 className="text-lg font-semibold">组件建议</h3>
                    </div>
                    {isEditingDesign && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleAddComponent}
                        className="gap-2"
                      >
                        <Plus size={14} />
                        添加组件
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {(isEditingDesign ? editedDesign?.components : currentDesign?.components)?.map((comp, i) => (
                      <div key={i} className={cn(
                        "py-3 border-b last:border-0",
                        isEditingDesign && "space-y-3"
                      )}>
                        {isEditingDesign ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs text-muted-foreground mb-1 block">组件名称</label>
                                <Input
                                  value={comp.name}
                                  onChange={(e) => handleUpdateComponent(i, 'name', e.target.value)}
                                  placeholder="组件名称"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground mb-1 block">类型</label>
                                <Input
                                  value={comp.type}
                                  onChange={(e) => handleUpdateComponent(i, 'type', e.target.value)}
                                  placeholder="类型"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">描述</label>
                              <div className="flex gap-2">
                                <Textarea
                                  value={comp.description}
                                  onChange={(e) => handleUpdateComponent(i, 'description', e.target.value)}
                                  placeholder="组件描述..."
                                  rows={2}
                                  className="flex-1"
                                />
                                <button
                                  onClick={() => handleRemoveComponent(i)}
                                  className="p-2 hover:bg-red-100 text-red-500 rounded self-start"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium">{comp.name}</span>
                              <p className="text-xs text-muted-foreground">{comp.description}</p>
                            </div>
                            <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                              {comp.type}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                    {(isEditingDesign ? editedDesign?.components?.length : currentDesign?.components?.length) === 0 && (
                      <p className="text-muted-foreground text-sm">未提供组件建议</p>
                    )}
                  </div>
                </Card>

                {/* Prompt 编辑卡片 */}
                <Card className={cn("p-6", isEditingPrompt && "border-primary/50 ring-1 ring-primary/20")}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <WandIcon size={20} className="text-primary" />
                      <h3 className="text-lg font-semibold">生图 Prompt</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {isEditingPrompt ? (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setIsEditingPrompt(false);
                              setEditedPrompt(currentRequirement.aiGeneratedContent?.generatedPrompt || '');
                            }}
                            className="gap-2"
                          >
                            <X size={14} />
                            取消
                          </Button>
                          <Button 
                            size="sm"
                            onClick={handleSavePrompt}
                            className="gap-2"
                          >
                            <Save size={14} />
                            保存
                          </Button>
                        </>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setEditedPrompt(currentRequirement.aiGeneratedContent?.generatedPrompt || '');
                            setIsEditingPrompt(true);
                          }}
                          className="gap-2"
                        >
                          <Edit3 size={14} />
                          编辑
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {isEditingPrompt ? (
                    <Textarea
                      value={editedPrompt}
                      onChange={(e) => setEditedPrompt(e.target.value)}
                      className="min-h-[200px] text-sm"
                      placeholder="在此编辑生图 Prompt..."
                    />
                  ) : (
                    <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto max-h-48 whitespace-pre-wrap">
                      {currentRequirement.aiGeneratedContent?.generatedPrompt || aiResult?.generatedPrompt || '暂无 Prompt'}
                    </pre>
                  )}
                  
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      修改 Prompt 后，可以使用新的 Prompt 生成效果图
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateWithEditedPrompt}
                      disabled={isGeneratingMockup || !currentRequirement.aiGeneratedContent?.generatedPrompt}
                      className="gap-2"
                    >
                      {isGeneratingMockup && <Loader2 size={14} className="animate-spin" />}
                      <WandIcon size={14} />
                      用此 Prompt 生成
                    </Button>
                  </div>
                </Card>

                {/* 生成效果图按钮 */}
                {!isEditingDesign && (
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
                )}
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
