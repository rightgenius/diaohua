import { useState, useEffect } from 'react';
import { useRequirementStore } from '@/stores/requirementStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { 
  Wand2, 
  Plus,
  Loader2,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { BrowserWorkbench } from '@/components/browser/BrowserWorkbench';
import { AnnotationEditor } from '@/components/editor/AnnotationEditor';
import { ScreenshotService } from '@/services/screenshot';
import type { Screenshot } from '@/types';

export function RequirementEditor() {
  const { 
    currentRequirement,
    requirements,
    createRequirement,
    updateRequirement,
    setCurrentRequirement,
    addScreenshot,
    updateScreenshot,
    removeScreenshot,
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
      
      // 打开标注编辑器
      setCurrentScreenshot(newScreenshot);
      setShowAnnotation(true);
    } catch (error) {
      console.error('保存截图失败:', error);
      alert('保存截图失败，请重试');
    }
  };

  const handleAnnotationClose = (annotations: any[], description: string) => {
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

  const handleAIGenerate = async () => {
    if (!currentRequirement || currentRequirement.screenshots.length === 0) {
      alert('请先添加至少一张截图');
      return;
    }
    
    setIsGenerating(true);
    
    // 模拟 AI 生成
    setTimeout(() => {
      setIsGenerating(false);
      alert('AI 生成功能需要配置 Gemini API，请先前往设置页面配置');
    }, 1500);
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
      {/* Left Panel - Screenshot List */}
      <div className="w-72 border-r bg-muted/30 flex flex-col">
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
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {currentRequirement.screenshots.map((screenshot, index) => (
              <div
                key={screenshot.id}
                className="group relative bg-muted rounded-lg border overflow-hidden cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleEditScreenshot(screenshot)}
              >
                {/* Image */}
                <div className="aspect-video relative">
                  <img
                    src={screenshot.thumbnailUrl || screenshot.imageUrl}
                    alt={`截图 ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-sm">编辑标注</span>
                  </div>
                  
                  {/* Number Badge */}
                  <div className="absolute top-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                    {index + 1}
                  </div>
                  
                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteScreenshot(screenshot.id);
                    }}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <Trash2 size={12} />
                  </button>
                  
                  {/* Annotation Count */}
                  {screenshot.annotations.length > 0 && (
                    <div className="absolute bottom-1 right-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
                      {screenshot.annotations.length} 标注
                    </div>
                  )}
                </div>
                
                {/* URL Info */}
                <div className="px-2 py-1.5 bg-card border-t">
                  <p className="text-xs text-muted-foreground truncate" title={screenshot.pageUrl}>
                    {screenshot.pageUrl || '未知页面'}
                  </p>
                </div>
              </div>
            ))}
            
            {currentRequirement.screenshots.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <ImageIcon size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">暂无截图</p>
                <p className="text-xs mt-1">在右侧浏览器中访问网页并截图</p>
              </div>
            )}
          </div>
        </div>

        {/* Requirement List */}
        {requirements.length > 1 && (
          <div className="p-4 border-t">
            <h4 className="text-xs font-medium text-muted-foreground mb-2">其他需求</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="h-14 border-b flex items-center justify-between px-4 bg-card">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNewDialog(true)}
          >
            <Plus size={16} className="mr-1" />
            新建
          </Button>

          <div className="flex items-center gap-2">
            {currentRequirement.screenshots.length > 0 && (
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
        <div className="flex-1 overflow-hidden flex flex-col">
          <BrowserWorkbench onScreenshot={handleScreenshot} />
          
          {/* Description Input */}
          <div className="h-40 border-t p-4 bg-card">
            <Textarea
              value={currentRequirement.userDescription}
              onChange={(e) => updateRequirement(currentRequirement.id, { userDescription: e.target.value })}
              placeholder="描述你的需求变更...（例如：希望把导航栏改成更简洁的胶囊式设计）"
              className="h-full resize-none"
            />
          </div>
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
