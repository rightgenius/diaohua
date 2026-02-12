import { useState, useEffect } from 'react';
import { useRequirementStore } from '@/stores/requirementStore';
import { useGeminiService } from '@/services/gemini';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { EmptyScreenshot } from '@/components/ui/EmptyState';
import { ExportButton } from '@/components/export/ExportButton';
import { ScreenshotList, AnnotationEditor } from '@/components/screenshot';
import { 
  Wand2, 
  Plus,
  Loader2,
  Image,
  FileText,
  Sparkles,
  Palette,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { BrowserWorkbench } from '@/components/browser/BrowserWorkbench';

import { ScreenshotService } from '@/services/screenshot';
import type { Screenshot } from '@/types';

export function RequirementEditor() {
  console.log('[前端] RequirementEditor 组件渲染');
  const { 
    currentRequirement,
    requirements,
    createRequirement,
    updateRequirement,
    setCurrentRequirement,
    addScreenshot,
    updateScreenshot,
    removeScreenshot,
    reorderScreenshots,
  } = useRequirementStore();
  
  const [showAnnotation, setShowAnnotation] = useState(false);
  const [currentScreenshot, setCurrentScreenshot] = useState<Screenshot | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  // 如果没有当前需求，显示新建对话框
  useEffect(() => {
    if (!currentRequirement && !showNewDialog) {
      if (requirements.length > 0) {
        setCurrentRequirement(requirements[0]);
      } else {
        setShowNewDialog(true);
      }
    }
  }, [currentRequirement, requirements, showNewDialog, setCurrentRequirement]);

  const handleCreateNew = () => {
    if (!newTitle.trim()) return;
    createRequirement(newTitle.trim());
    setNewTitle('');
    setShowNewDialog(false);
  };

  const handleScreenshot = async (imageUrl: string, pageInfo: { url: string; title: string }) => {
    if (!currentRequirement) return;

    try {
      // 生成缩略图
      const thumbnailUrl = await ScreenshotService.generateThumbnail(imageUrl, 300);
      
      const newScreenshot: Screenshot = {
        id: Date.now().toString(),
        url: pageInfo.url,
        pageUrl: pageInfo.url,
        pageTitle: pageInfo.title,
        title: `截图 ${currentRequirement.screenshots.length + 1}`,
        imageUrl,
        thumbnailUrl,
        annotations: [],
        description: '',
        order: currentRequirement.screenshots.length,
        createdAt: new Date().toISOString(),
      };

      addScreenshot(currentRequirement.id, newScreenshot);
      
      // 截图已在 BrowserWorkbench 中完成标注，这里不再打开编辑器
      // 如果需要在 RequirementEditor 中编辑标注，可以点击截图列表中的编辑按钮
    } catch (error) {
      console.error('保存截图失败:', error);
      alert('保存截图失败，请重试');
    }
  };

  const handleAnnotationClose = (annotations: any[], description: string, _annotatedImageUrl?: string) => {
    if (!currentRequirement || !currentScreenshot) return;
    
    // 更新截图的标注和描述
    updateScreenshot(currentRequirement.id, currentScreenshot.id, {
      annotations,
      description,
    });
    
    setShowAnnotation(false);
    setCurrentScreenshot(null);
  };

  const handleAnnotationCancel = () => {
    setShowAnnotation(false);
    setCurrentScreenshot(null);
  };

  const handleDeleteScreenshot = (screenshotId: string) => {
    if (!currentRequirement) return;
    if (confirm('确定要删除这张截图吗？')) {
      removeScreenshot(currentRequirement.id, screenshotId);
    }
  };

  const handleEditScreenshot = (screenshot: Screenshot) => {
    setCurrentScreenshot(screenshot);
    setShowAnnotation(true);
  };

  const handleReorderScreenshots = (newScreenshots: Screenshot[]) => {
    if (!currentRequirement) return;
    const newOrder = newScreenshots.map((s) => s.id);
    reorderScreenshots(currentRequirement.id, newOrder);
  };

  const geminiService = useGeminiService();
  
  // 标签页状态: screenshots | prompt | mockup
  const [activeTab, setActiveTab] = useState<'screenshots' | 'prompt' | 'mockup'>('screenshots');

  const handleAIGenerate = async () => {
    if (!currentRequirement || currentRequirement.screenshots.length === 0) {
      alert('请先添加至少一张截图');
      return;
    }
    
    if (!geminiService) {
      alert('请先配置 Gemini API Key');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const result = await geminiService.generatePRD({
        requirement: currentRequirement,
      });
      
      // 保存 AI 生成结果
      updateRequirement(currentRequirement.id, {
        aiGeneratedContent: {
          prdMarkdown: result.prdMarkdown,
          designSuggestions: result.designSuggestions,
          generatedPrompt: result.generatedPrompt,
          generatedAt: new Date().toISOString(),
        },
        status: 'ai_generating',
      });
      
      // 自动切换到 Prompt 生成标签页
      setActiveTab('prompt');
    } catch (error) {
      console.error('AI 生成失败:', error);
      alert(error instanceof Error ? error.message : 'AI 生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleGenerateMockup = async () => {
    if (!currentRequirement || !geminiService) return;
    
    const prompt = currentRequirement.aiGeneratedContent?.generatedPrompt;
    if (!prompt) {
      alert('请先生成 PRD 以获取效果图 Prompt');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const result = await geminiService.generateMockups({ prompt });
      
      // 保存效果图
      const mockups = result.images.map((img, idx) => ({
        id: Date.now().toString() + idx,
        generationBatch: (currentRequirement.mockupDesigns?.length || 0) + 1,
        variant: img.variant,
        imageUrl: `data:${img.mimeType};base64,${img.base64}`,
        prompt: result.prompt,
        style: currentRequirement.aiGeneratedContent?.designSuggestions?.layout?.style || '默认风格',
        params: { aspectRatio: '16:9' },
        selected: false,
        createdAt: new Date().toISOString(),
      }));

      updateRequirement(currentRequirement.id, {
        mockupDesigns: [...(currentRequirement.mockupDesigns || []), ...mockups],
        status: 'mockup_review',
      });
      
      // 自动切换到效果图标签页
      setActiveTab('mockup');
    } catch (error) {
      console.error('效果图生成失败:', error);
      alert(error instanceof Error ? error.message : '效果图生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  if (showNewDialog) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/30">
        <div className="bg-card p-8 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-2xl font-bold mb-2">新建需求</h2>
          <p className="text-muted-foreground mb-6">
            创建一个新的需求文档，开始截图标注
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">需求标题</label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateNew()}
                placeholder="例如：首页改版需求"
                className="text-lg"
                autoFocus
              />
            </div>
            
            <Button 
              onClick={handleCreateNew} 
              disabled={!newTitle.trim()}
              className="w-full"
              size="lg"
            >
              <Plus size={18} className="mr-2" />
              创建需求
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentRequirement) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Left Panel - Screenshot List + Description */}
      <div className="w-80 border-r bg-muted/30 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b space-y-3">
          <Input
            value={currentRequirement.title}
            onChange={(e) => updateRequirement(currentRequirement.id, { title: e.target.value })}
            className="font-medium"
            placeholder="需求标题"
          />
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <StatusBadge status={currentRequirement.status} />
            <span>{currentRequirement.screenshots.length} 张截图</span>
          </div>
        </div>
        
        {/* Screenshot List */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          <ScreenshotList
            screenshots={currentRequirement.screenshots}
            onReorder={handleReorderScreenshots}
            onEdit={handleEditScreenshot}
            onDelete={handleDeleteScreenshot}
            sortable={true}
            emptyState={
              <EmptyScreenshot 
                onScreenshot={() => {
                  // 聚焦到浏览器区域
                  const browserFrame = document.querySelector('[data-browser-frame]');
                  browserFrame?.scrollIntoView({ behavior: 'smooth' });
                }}
              />
            }
          />
        </div>

        {/* Description Input - 移到左边栏底部 */}
        <div className="p-4 border-t bg-card">
          <label className="text-xs font-medium text-muted-foreground mb-2 block">
            需求描述
          </label>
          <Textarea
            value={currentRequirement.userDescription}
            onChange={(e) => updateRequirement(currentRequirement.id, { userDescription: e.target.value })}
            placeholder="描述你的需求变更...（例如：希望把导航栏改成更简洁的胶囊式设计）"
            className="h-32 resize-none text-sm"
          />
        </div>

        {/* Other Requirements */}
        {requirements.length > 1 && (
          <div className="p-4 border-t">
            <h4 className="text-xs font-medium text-muted-foreground mb-2">其他需求</h4>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {requirements
                .filter((r) => r.id !== currentRequirement.id)
                .map((req) => (
                  <button
                    key={req.id}
                    onClick={() => setCurrentRequirement(req)}
                    className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted truncate"
                  >
                    {req.title}
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content - 标签页切换 */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="h-14 border-b flex items-center justify-between px-4 bg-card">
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <TabButton
              active={activeTab === 'screenshots'}
              onClick={() => setActiveTab('screenshots')}
              icon={<Image size={14} />}
              label="截图"
            />
            <TabButton
              active={activeTab === 'prompt'}
              onClick={() => setActiveTab('prompt')}
              icon={<FileText size={14} />}
              label="Prompt生成"
              disabled={!currentRequirement.aiGeneratedContent}
            />
            <TabButton
              active={activeTab === 'mockup'}
              onClick={() => setActiveTab('mockup')}
              icon={<Sparkles size={14} />}
              label="效果图"
              disabled={!currentRequirement.mockupDesigns?.length}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNewDialog(true)}
            >
              <Plus size={16} className="mr-1" />
              新建
            </Button>
            
            {currentRequirement.screenshots.length > 0 && (
              <>
                <ExportButton requirement={currentRequirement} />
                {activeTab === 'screenshots' && (
                  <Button
                    onClick={handleAIGenerate}
                    disabled={isGenerating}
                    className="gap-2"
                  >
                    {isGenerating ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Wand2 size={16} />
                    )}
                    {isGenerating ? '生成中...' : 'AI生成'}
                  </Button>
                )}
                {activeTab === 'prompt' && currentRequirement.aiGeneratedContent && (
                  <Button
                    onClick={handleGenerateMockup}
                    disabled={isGenerating}
                    className="gap-2"
                  >
                    {isGenerating ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Sparkles size={16} />
                    )}
                    生成效果图
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* 标签页内容 */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'screenshots' && (
            <div className="h-full" data-browser-frame>
              <BrowserWorkbench onScreenshot={handleScreenshot} />
            </div>
          )}
          
          {activeTab === 'prompt' && (
            <div className="h-full overflow-auto p-6">
              {currentRequirement.aiGeneratedContent ? (
                <div className="max-w-3xl mx-auto space-y-6">
                  {/* PRD 内容 */}
                  <div className="bg-card rounded-lg border p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <FileText size={18} />
                      AI 生成的 PRD
                    </h3>
                    <Textarea
                      value={currentRequirement.aiGeneratedContent.prdMarkdown || ''}
                      onChange={(e) => updateRequirement(currentRequirement.id, {
                        aiGeneratedContent: {
                          ...currentRequirement.aiGeneratedContent!,
                          prdMarkdown: e.target.value,
                        },
                      })}
                      className="min-h-[300px] font-mono text-sm resize-y"
                      placeholder="PRD 内容..."
                    />
                  </div>
                  
                  {/* 设计建议 */}
                  {currentRequirement.aiGeneratedContent.designSuggestions && (
                    <div className="bg-card rounded-lg border p-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Palette size={18} />
                        设计建议
                      </h3>
                      <div className="space-y-4">
                        {/* 布局风格 */}
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">布局风格</label>
                          <Input
                            value={currentRequirement.aiGeneratedContent.designSuggestions!.layout?.style || ''}
                            onChange={(e) => {
                              const content = currentRequirement.aiGeneratedContent!;
                              const design = content.designSuggestions!;
                              updateRequirement(currentRequirement.id, {
                                aiGeneratedContent: {
                                  ...content,
                                  designSuggestions: {
                                    ...design,
                                    layout: {
                                      ...design.layout,
                                      style: e.target.value,
                                    },
                                  },
                                },
                              });
                            }}
                            placeholder="风格名称"
                            className="mb-2"
                          />
                          <Textarea
                            value={currentRequirement.aiGeneratedContent.designSuggestions!.layout?.description || ''}
                            onChange={(e) => {
                              const content = currentRequirement.aiGeneratedContent!;
                              const design = content.designSuggestions!;
                              updateRequirement(currentRequirement.id, {
                                aiGeneratedContent: {
                                  ...content,
                                  designSuggestions: {
                                    ...design,
                                    layout: {
                                      ...design.layout,
                                      description: e.target.value,
                                    },
                                  },
                                },
                              });
                            }}
                            placeholder="布局描述..."
                            rows={2}
                          />
                        </div>
                        
                        {/* 配色方案 */}
                        <div>
                          <label className="text-xs text-muted-foreground mb-2 block">配色方案</label>
                          <div className="flex gap-2 flex-wrap">
                            {currentRequirement.aiGeneratedContent.designSuggestions!.styleGuide?.colors?.map((color, i) => (
                              <div key={i} className="flex items-center gap-1">
                                <input
                                  type="color"
                                  value={color}
                                  onChange={(e) => {
                                    const content = currentRequirement.aiGeneratedContent!;
                                    const design = content.designSuggestions!;
                                    const colors = [...(design.styleGuide?.colors || [])];
                                    colors[i] = e.target.value;
                                    updateRequirement(currentRequirement.id, {
                                      aiGeneratedContent: {
                                        ...content,
                                        designSuggestions: {
                                          ...design,
                                          styleGuide: {
                                            ...design.styleGuide,
                                            colors,
                                          },
                                        },
                                      },
                                    });
                                  }}
                                  className="w-8 h-8 rounded cursor-pointer border"
                                />
                                <Input
                                  value={color}
                                  onChange={(e) => {
                                    const content = currentRequirement.aiGeneratedContent!;
                                    const design = content.designSuggestions!;
                                    const colors = [...(design.styleGuide?.colors || [])];
                                    colors[i] = e.target.value;
                                    updateRequirement(currentRequirement.id, {
                                      aiGeneratedContent: {
                                        ...content,
                                        designSuggestions: {
                                          ...design,
                                          styleGuide: {
                                            ...design.styleGuide,
                                            colors,
                                          },
                                        },
                                      },
                                    });
                                  }}
                                  className="w-20 h-8 text-xs px-1"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* 效果图 Prompt */}
                  <div className="bg-card rounded-lg border p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Sparkles size={18} />
                      效果图生成 Prompt
                    </h3>
                    <Textarea
                      value={currentRequirement.aiGeneratedContent.generatedPrompt || ''}
                      onChange={(e) => updateRequirement(currentRequirement.id, {
                        aiGeneratedContent: {
                          ...currentRequirement.aiGeneratedContent!,
                          generatedPrompt: e.target.value,
                        },
                      })}
                      className="min-h-[200px] font-mono text-sm resize-y"
                      placeholder="生图 Prompt..."
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Sparkles size={48} className="mb-4 opacity-50" />
                  <p>请先在「截图」标签页点击「AI生成」按钮</p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'mockup' && (
            <div className="h-full overflow-auto p-6">
              {currentRequirement.mockupDesigns && currentRequirement.mockupDesigns.length > 0 ? (
                <div className="max-w-5xl mx-auto">
                  <h3 className="text-lg font-semibold mb-6">效果图</h3>
                  <div className="grid grid-cols-2 gap-6">
                    {currentRequirement.mockupDesigns.map((mockup) => (
                      <div
                        key={mockup.id}
                        className={cn(
                          'relative rounded-lg border-2 overflow-hidden cursor-pointer transition-all',
                          mockup.selected
                            ? 'border-primary shadow-lg'
                            : 'border-border hover:border-muted-foreground'
                        )}
                        onClick={() => updateRequirement(currentRequirement.id, {
                          selectedMockupId: mockup.id,
                          mockupDesigns: currentRequirement.mockupDesigns?.map(m => ({
                            ...m,
                            selected: m.id === mockup.id
                          }))
                        })}
                      >
                        <img
                          src={mockup.imageUrl}
                          alt={`效果图 ${mockup.variant}`}
                          className="w-full h-auto"
                        />
                        <div className="absolute top-2 left-2 bg-background/90 px-2 py-1 rounded text-xs font-medium">
                          方案 {mockup.variant}
                        </div>
                        {mockup.selected && (
                          <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
                            已选中
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Image size={48} className="mb-4 opacity-50" />
                  <p>请先在「Prompt生成」标签页点击「生成效果图」按钮</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Annotation Modal */}
      {showAnnotation && currentScreenshot && (
        <AnnotationEditor
          imageUrl={currentScreenshot.imageUrl}
          initialAnnotations={currentScreenshot.annotations}
          initialDescription={currentScreenshot.description}
          onClose={handleAnnotationClose}
          onCancel={handleAnnotationCancel}
        />
      )}
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
}

function TabButton({ active, onClick, icon, label, disabled }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
        active
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted',
        disabled && 'opacity-50 cursor-not-allowed hover:bg-transparent'
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    annotating: 'bg-blue-100 text-blue-600',
    ai_generating: 'bg-purple-100 text-purple-600',
    mockup_review: 'bg-amber-100 text-amber-600',
    designing: 'bg-green-100 text-green-600',
    completed: 'bg-gray-100 text-gray-600',
    archived: 'bg-gray-100 text-gray-400',
  };

  const labels: Record<string, string> = {
    draft: '草稿',
    annotating: '标注中',
    ai_generating: 'AI生成中',
    mockup_review: '效果图评审',
    designing: '设计中',
    completed: '已完成',
    archived: '已归档',
  };

  return (
    <span className={cn('px-2 py-0.5 rounded text-xs font-medium', styles[status] || styles.draft)}>
      {labels[status] || status}
    </span>
  );
}
