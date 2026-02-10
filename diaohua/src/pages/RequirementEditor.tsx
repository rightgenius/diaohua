import { useState, useEffect, useRef } from 'react';
import { useRequirementStore } from '@/stores/requirementStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';
import { 
  Camera, 
  Wand2, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw,
  Loader2,
  Check
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { BrowserWorkbench } from '@/components/browser/BrowserWorkbench';
import { AnnotationEditor } from '@/components/editor/AnnotationEditor';
import { AIResultPanel } from '@/components/ai/AIResultPanel';
import { MockupReview } from '@/components/ai/MockupReview';

export function RequirementEditor() {
  const { 
    currentRequirement, 
    createRequirement, 
    updateRequirement,
    setStatus,
  } = useRequirementStore();
  
  const [showAnnotation, setShowAnnotation] = useState(false);
  const [currentScreenshot, setCurrentScreenshot] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'browser' | 'result'>('browser');

  // Create a new requirement if none exists
  useEffect(() => {
    if (!currentRequirement) {
      createRequirement('default-project', '新需求');
    }
  }, []);

  if (!currentRequirement) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  const handleScreenshot = async () => {
    // This will be implemented with Tauri's screenshot API
    // For now, we'll simulate it
    const screenshotId = Date.now().toString();
    setCurrentScreenshot(screenshotId);
    setShowAnnotation(true);
  };

  const handleAnnotationComplete = () => {
    setShowAnnotation(false);
    setCurrentScreenshot(null);
    setStatus('annotating');
  };

  const handleAIGenerate = async () => {
    setIsGenerating(true);
    setStatus('ai_generating');
    
    // Simulate AI generation
    setTimeout(() => {
      setIsGenerating(false);
      setStatus('mockup_review');
      setActiveTab('result');
    }, 3000);
  };

  return (
    <div className="flex h-full">
      {/* Left Panel - Screenshot List */}
      <div className="w-64 border-r bg-muted/30 flex flex-col">
        <div className="p-4 border-b">
          <Input
            value={currentRequirement.title}
            onChange={(e) => updateRequirement({ title: e.target.value })}
            className="font-medium"
            placeholder="需求标题"
          />
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            截图列表 ({currentRequirement.screenshots.length})
          </h3>
          
          <div className="space-y-3">
            {currentRequirement.screenshots.map((screenshot, index) => (
              <div
                key={screenshot.id}
                className="aspect-video bg-muted rounded-lg border overflow-hidden relative group cursor-pointer"
              >
                <img
                  src={screenshot.thumbnailUrl || screenshot.imageUrl}
                  alt={`截图 ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-sm">查看</span>
                </div>
                <div className="absolute top-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                  {index + 1}
                </div>
              </div>
            ))}
            
            {currentRequirement.screenshots.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                暂无截图<br />
                点击右侧「截图」按钮添加
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t space-y-2">
          <div className="text-xs text-muted-foreground">
            状态: <StatusBadge status={currentRequirement.status} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="h-14 border-b flex items-center justify-between px-4 bg-card">
          <div className="flex items-center gap-2">
            {activeTab === 'browser' ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleScreenshot}
                  className="gap-2"
                >
                  <Camera size={16} />
                  截图
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('browser')}
              >
                <ChevronLeft size={16} className="mr-1" />
                返回编辑
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentRequirement.screenshots.length > 0 && activeTab === 'browser' && (
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
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'browser' ? (
            <div className="h-full flex flex-col">
              <BrowserWorkbench />
              
              {/* Description Input */}
              <div className="h-48 border-t p-4 bg-card">
                <Textarea
                  value={currentRequirement.userDescription}
                  onChange={(e) => updateRequirement({ userDescription: e.target.value })}
                  placeholder="描述你的需求变更...（例如：希望把导航栏改成更简洁的胶囊式设计）"
                  className="h-full resize-none"
                />
              </div>
            </div>
          ) : (
            <AIResultPanel 
              onBack={() => setActiveTab('browser')}
            />
          )}
        </div>
      </div>

      {/* Annotation Modal */}
      {showAnnotation && currentScreenshot && (
        <AnnotationEditor
          screenshotId={currentScreenshot}
          onClose={handleAnnotationComplete}
          onCancel={() => {
            setShowAnnotation(false);
            setCurrentScreenshot(null);
          }}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    draft: 'bg-gray-100 text-gray-600',
    annotating: 'bg-blue-100 text-blue-600',
    ai_generating: 'bg-purple-100 text-purple-600',
    mockup_review: 'bg-amber-100 text-amber-600',
    designing: 'bg-green-100 text-green-600',
    completed: 'bg-gray-100 text-gray-600',
    archived: 'bg-gray-100 text-gray-400',
  };

  const labels = {
    draft: '草稿',
    annotating: '标注中',
    ai_generating: 'AI生成中',
    mockup_review: '效果图评审',
    designing: '设计中',
    completed: '已完成',
    archived: '已归档',
  };

  return (
    <span className={cn('px-2 py-0.5 rounded text-xs', styles[status as keyof typeof styles])}>
      {labels[status as keyof typeof labels]}
    </span>
  );
}
