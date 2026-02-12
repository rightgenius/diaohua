import { useState, useEffect } from 'react';
import { useRequirementStore } from '@/stores/requirementStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import { ImageLightbox } from '@/components/ui/ImageLightbox';
import { 
  Check, 
  RefreshCw, 
  Loader2,
  Info,
  Download,
  Edit3,
  Save,
  X,
  Wand2,
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface MockupReviewProps {
  onGenerate: () => void;
  isGenerating: boolean;
}

export function MockupReview({ onGenerate, isGenerating }: MockupReviewProps) {
  const {
    currentRequirement,
    selectMockup,
    updateRequirement
  } = useRequirementStore();

  const [selectedVariant, setSelectedVariant] = useState<'A' | 'B' | null>(null);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  
  // Prompt 编辑状态
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState('');
  const [isGeneratingWithNewPrompt, setIsGeneratingWithNewPrompt] = useState(false);

  // 获取当前批次的效果图
  const currentBatch = currentRequirement?.mockupDesigns && currentRequirement.mockupDesigns.length > 0
    ? Math.max(...currentRequirement.mockupDesigns.map(m => m.generationBatch))
    : 0;
  
  const currentMockups = currentRequirement?.mockupDesigns?.filter(
    m => m.generationBatch === currentBatch
  ) || [];

  const mockupA = currentMockups.find(m => m.variant === 'A');
  const mockupB = currentMockups.find(m => m.variant === 'B');
  
  // 检查是否有效果图
  const hasMockups = currentMockups.length > 0;

  const handleSelect = (variant: 'A' | 'B') => {
    setSelectedVariant(variant);
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const lightboxImages = currentMockups.map((m) => ({
    src: m.imageUrl,
    alt: `方案 ${m.variant}`,
  }));

  const handleConfirm = () => {
    if (selectedVariant && currentRequirement) {
      const mockup = currentMockups.find(m => m.variant === selectedVariant);
      if (mockup) {
        selectMockup(currentRequirement.id, mockup.id);
        updateRequirement(currentRequirement.id, { status: 'designing' });
      }
    }
  };

  const handleRegenerate = () => {
    setShowRegenerateConfirm(false);
    onGenerate();
  };

  const handleDownload = (imageUrl: string, variant: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${currentRequirement?.title || 'mockup'}_${variant}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 历史版本
  const historyBatches = [...new Set(
    currentRequirement?.mockupDesigns?.map(m => m.generationBatch) || []
  )].sort((a, b) => b - a);

  // 初始化 Prompt 编辑状态
  useEffect(() => {
    if (currentRequirement?.aiGeneratedContent?.generatedPrompt) {
      setEditedPrompt(currentRequirement.aiGeneratedContent.generatedPrompt);
    }
  }, [currentRequirement?.aiGeneratedContent?.generatedPrompt]);

  // 保存 Prompt 修改
  const handleSavePrompt = () => {
    if (!currentRequirement) return;
    
    updateRequirement(currentRequirement.id, {
      aiGeneratedContent: {
        ...currentRequirement.aiGeneratedContent!,
        generatedPrompt: editedPrompt,
        generatedAt: new Date().toISOString(),
      },
    });
    setIsEditingPrompt(false);
  };

  // 使用编辑后的 Prompt 生成
  const handleGenerateWithEditedPrompt = async () => {
    if (!currentRequirement) return;
    
    setIsGeneratingWithNewPrompt(true);
    try {
      // 临时更新 Prompt
      updateRequirement(currentRequirement.id, {
        aiGeneratedContent: {
          ...currentRequirement.aiGeneratedContent!,
          generatedPrompt: editedPrompt,
        },
      });
      
      // 调用父组件的生成方法
      await onGenerate();
      setIsEditingPrompt(false);
    } finally {
      setIsGeneratingWithNewPrompt(false);
    }
  };

  if (!hasMockups) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-12">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <RefreshCw size={24} className="text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">暂无效果图</h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          点击下方的按钮生成效果图，AI将根据你的截图和需求描述生成两张风格一致的设计方案
        </p>
        <Button size="lg" onClick={onGenerate} disabled={isGenerating} className="gap-2">
          {isGenerating && <Loader2 size={18} className="animate-spin" />}
          {isGenerating ? '生成中...' : '生成效果图'}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Info Banner */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
        <Info size={20} className="text-blue-500 mt-0.5" />
        <div>
          <h4 className="font-medium text-blue-900">方案对比</h4>
          <p className="text-sm text-blue-700">
            两张效果图使用完全相同的Prompt生成，仅因AI模型的随机性产生细微差异。
            选择你更满意的一张，或重新生成。
          </p>
        </div>
      </div>

      {/* Mockup Comparison */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Variant A */}
        <Card 
          className={cn(
            'overflow-hidden transition-all',
            selectedVariant === 'A' 
              ? 'ring-2 ring-primary ring-offset-2' 
              : 'hover:shadow-lg'
          )}
        >
          <div 
            className="aspect-[16/9] bg-muted relative cursor-pointer"
            onClick={() => handleSelect('A')}
          >
            {mockupA ? (
              <img 
                src={mockupA.imageUrl} 
                alt="方案 A" 
                className="w-full h-full object-cover"
                onClick={(e) => {
                  e.stopPropagation();
                  openLightbox(0);
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                未生成
              </div>
            )}
            {selectedVariant === 'A' && (
              <div className="absolute top-3 right-3 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                <Check size={18} />
              </div>
            )}
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">方案 A</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">相同Prompt，不同随机结果</span>
                {mockupA && (
                  <button
                    onClick={() => handleDownload(mockupA.imageUrl, 'A')}
                    className="p-1.5 hover:bg-muted rounded"
                    title="下载"
                  >
                    <Download size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Variant B */}
        <Card 
          className={cn(
            'overflow-hidden transition-all',
            selectedVariant === 'B' 
              ? 'ring-2 ring-primary ring-offset-2' 
              : 'hover:shadow-lg'
          )}
        >
          <div 
            className="aspect-[16/9] bg-muted relative cursor-pointer"
            onClick={() => handleSelect('B')}
          >
            {mockupB ? (
              <img 
                src={mockupB.imageUrl} 
                alt="方案 B" 
                className="w-full h-full object-cover"
                onClick={(e) => {
                  e.stopPropagation();
                  openLightbox(1);
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                未生成
              </div>
            )}
            {selectedVariant === 'B' && (
              <div className="absolute top-3 right-3 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                <Check size={18} />
              </div>
            )}
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">方案 B</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">相同Prompt，不同随机结果</span>
                {mockupB && (
                  <button
                    onClick={() => handleDownload(mockupB.imageUrl, 'B')}
                    className="p-1.5 hover:bg-muted rounded"
                    title="下载"
                  >
                    <Download size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Prompt Display & Edit */}
      {currentRequirement?.aiGeneratedContent?.generatedPrompt && (
        <Card className="p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-muted-foreground">生成使用的 Prompt</h4>
            <div className="flex items-center gap-2">
              {isEditingPrompt ? (
                <>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setIsEditingPrompt(false);
                      setEditedPrompt(currentRequirement.aiGeneratedContent?.generatedPrompt || '');
                    }}
                    className="gap-1 h-7"
                  >
                    <X size={14} />
                    取消
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleSavePrompt}
                    className="gap-1 h-7"
                  >
                    <Save size={14} />
                    保存
                  </Button>
                </>
              ) : (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setEditedPrompt(currentRequirement.aiGeneratedContent?.generatedPrompt || '');
                    setIsEditingPrompt(true);
                  }}
                  className="gap-1 h-7"
                >
                  <Edit3 size={14} />
                  编辑
                </Button>
              )}
            </div>
          </div>
          
          {isEditingPrompt ? (
            <div className="space-y-3">
              <Textarea
                value={editedPrompt}
                onChange={(e) => setEditedPrompt(e.target.value)}
                className="min-h-[150px] text-sm"
                placeholder="在此编辑生图 Prompt..."
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  修改后可以使用新 Prompt 重新生成效果图
                </p>
                <Button
                  size="sm"
                  onClick={handleGenerateWithEditedPrompt}
                  disabled={isGeneratingWithNewPrompt || !editedPrompt.trim()}
                  className="gap-2"
                >
                  {isGeneratingWithNewPrompt && <Loader2 size={14} className="animate-spin" />}
                  <Wand2 size={14} />
                  用此 Prompt 重新生成
                </Button>
              </div>
            </div>
          ) : (
            <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-32 whitespace-pre-wrap">
              {currentRequirement.aiGeneratedContent.generatedPrompt}
            </pre>
          )}
        </Card>
      )}

      {/* Action Bar */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          onClick={() => setShowRegenerateConfirm(true)}
          className="gap-2"
        >
          <RefreshCw size={18} />
          重新生成
        </Button>
        
        <Button
          onClick={handleConfirm}
          disabled={!selectedVariant}
          className="gap-2"
          size="lg"
        >
          <Check size={18} />
          {selectedVariant ? `确认使用方案 ${selectedVariant}` : '选择方案'}
        </Button>
      </div>

      {/* Generation History */}
      {historyBatches.length > 1 && (
        <div className="mt-8 border-t pt-6">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">历史版本</h4>
          <div className="flex gap-3">
            {historyBatches.slice(1).map((batch) => {
              const batchMockups = currentRequirement?.mockupDesigns?.filter(
                m => m.generationBatch === batch
              ) || [];
              const firstMockup = batchMockups[0];
              
              return (
                <div 
                  key={batch} 
                  className="w-24 h-16 rounded border overflow-hidden cursor-pointer hover:opacity-80"
                  onClick={() => {
                    // 切换到该批次
                    const newMockups = currentRequirement?.mockupDesigns?.map(m => ({
                      ...m,
                      generationBatch: m.generationBatch === batch ? currentBatch + 1 : m.generationBatch,
                    })) || [];
                    updateRequirement(currentRequirement!.id, {
                      mockupDesigns: newMockups,
                    });
                  }}
                >
                  {firstMockup ? (
                    <img 
                      src={firstMockup.imageUrl} 
                      alt={`版本 ${batch}`} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-xs">
                      v{batch}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Regenerate Confirmation Modal */}
      {showRegenerateConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <Card className="p-6 max-w-md">
            <h3 className="text-lg font-semibold mb-2">重新生成效果图？</h3>
            <p className="text-muted-foreground mb-6">
              将使用相同的Prompt再次生成两张效果图，之前的效果图会保存在历史版本中。
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowRegenerateConfirm(false)}>
                取消
              </Button>
              <Button onClick={handleRegenerate}>
                确认重新生成
              </Button>
            </div>
          </Card>
        </div>
      )}
      {/* Image Lightbox */}
      <ImageLightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}
