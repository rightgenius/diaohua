import { useState } from 'react';
import { useRequirementStore } from '@/stores/requirementStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { 
  Check, 
  RefreshCw, 
  ArrowLeft,
  Loader2,
  Info
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface MockupReviewProps {
  onGenerate: () => void;
  isGenerating: boolean;
}

// Demo mockup images
const demoMockupA = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHJlY3QgeD0iMjAiIHk9IjIwIiB3aWR0aD0iMzYwIiBoZWlnaHQ9IjQwIiByeD0iMjAiIGZpbGw9IiMxODkwZmYiLz48dGV4dCB4PSIyMDAiIHk9IjQ3IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7nlLXlrZDlt6XkuJbnlYznhKbnvb48L3RleHQ+PHJlY3QgeD0iMjAiIHk9IjgwIiB3aWR0aD0iMzYwIiBoZWlnaHQ9IjIwMCIgcng9IjgiIGZpbGw9IndoaXRlIiBzdHJva2U9IiNlNWU3ZWIiLz48dGV4dCB4PSIyMDAiIHk9IjE4MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2IiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7lhYXkuobnlLXlrZDlt6XkuJYgQSDnva48L3RleHQ+PC9zdmc+';
const demoMockupB = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHJlY3QgeD0iMjAiIHk9IjIwIiB3aWR0aD0iMzYwIiBoZWlnaHQ9IjQwIiByeD0iMjAiIGZpbGw9IiMxODkwZmYiLz48dGV4dCB4PSIyMDAiIHk9IjQ3IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7nlLXlrZDlt6XkuJbnlYznhKbnvb48L3RleHQ+PHJlY3QgeD0iMjAiIHk9IjgwIiB3aWR0aD0iMzYwIiBoZWlnaHQ9IjIwMCIgcng9IjgiIGZpbGw9IndoaXRlIiBzdHJva2U9IiNlNWU3ZWIiLz48dGV4dCB4PSIyMDAiIHk9IjE4MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2IiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7lhYXkuobnlLXlrZDlt6XkuJYgQuaXpeacnzwvdGV4dD48L3N2Zz4=';

export function MockupReview({ onGenerate, isGenerating }: MockupReviewProps) {
  const { 
    currentRequirement, 
    selectMockup,
    setStatus 
  } = useRequirementStore();
  
  const [selectedVariant, setSelectedVariant] = useState<'A' | 'B' | null>(null);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);

  // Check if we have mockups to show
  const hasMockups = currentRequirement?.status === 'mockup_review' || 
                     currentRequirement?.status === 'designing';

  const handleSelect = (variant: 'A' | 'B') => {
    setSelectedVariant(variant);
  };

  const handleConfirm = () => {
    if (selectedVariant) {
      // In real app, we'd use the actual mockup ID
      selectMockup(`mockup_${selectedVariant}`);
      setStatus('designing');
    }
  };

  const handleRegenerate = () => {
    setShowRegenerateConfirm(false);
    onGenerate();
  };

  if (!hasMockups) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
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
            'overflow-hidden cursor-pointer transition-all',
            selectedVariant === 'A' 
              ? 'ring-2 ring-primary ring-offset-2' 
              : 'hover:shadow-lg'
          )}
          onClick={() => handleSelect('A')}
        >
          <div className="aspect-[4/3] bg-muted relative">
            <img 
              src={demoMockupA} 
              alt="方案 A" 
              className="w-full h-full object-cover"
            />
            {selectedVariant === 'A' && (
              <div className="absolute top-3 right-3 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                <Check size={18} />
              </div>
            )}
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">方案 A</h3>
              <span className="text-xs text-muted-foreground">相同Prompt，不同随机结果</span>
            </div>
          </div>
        </Card>

        {/* Variant B */}
        <Card 
          className={cn(
            'overflow-hidden cursor-pointer transition-all',
            selectedVariant === 'B' 
              ? 'ring-2 ring-primary ring-offset-2' 
              : 'hover:shadow-lg'
          )}
          onClick={() => handleSelect('B')}
        >
          <div className="aspect-[4/3] bg-muted relative">
            <img 
              src={demoMockupB} 
              alt="方案 B" 
              className="w-full h-full object-cover"
            />
            {selectedVariant === 'B' && (
              <div className="absolute top-3 right-3 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                <Check size={18} />
              </div>
            )}
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">方案 B</h3>
              <span className="text-xs text-muted-foreground">相同Prompt，不同随机结果</span>
            </div>
          </div>
        </Card>
      </div>

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
      <div className="mt-8 border-t pt-6">
        <h4 className="text-sm font-medium text-muted-foreground mb-3">历史版本</h4>
        <div className="flex gap-3">
          <div className="w-24 h-16 rounded border overflow-hidden opacity-50">
            <img src={demoMockupA} alt="版本 1" className="w-full h-full object-cover" />
          </div>
          <div className="w-24 h-16 rounded border overflow-hidden ring-2 ring-primary">
            <img src={demoMockupB} alt="版本 2" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

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
    </div>
  );
}
