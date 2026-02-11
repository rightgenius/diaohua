import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Calendar } from 'lucide-react';
import { useRequirementStore } from '@/stores/requirementStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ImageLightbox } from '@/components/ui/ImageLightbox';
import type { Requirement } from '@/types';
import { cn } from '@/utils/cn';

/**
 * 分享页面
 * 
 * 通过需求 ID 查看需求详情
 */
export function Share() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { requirements } = useRequirementStore();
  
  const [requirement, setRequirement] = useState<Requirement | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    if (id) {
      const found = requirements.find((r) => r.id === id);
      if (found) {
        setRequirement(found);
      }
      setLoading(false);
    }
  }, [id, requirements]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (!requirement) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">需求不存在</h1>
          <p className="text-muted-foreground mb-6">
            抱歉，找不到该需求。可能已被删除或链接已失效。
          </p>
          <Button onClick={() => navigate('/')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Button>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      annotating: 'bg-blue-100 text-blue-800',
      ai_generating: 'bg-purple-100 text-purple-800',
      mockup_review: 'bg-yellow-100 text-yellow-800',
      designing: 'bg-pink-100 text-pink-800',
      completed: 'bg-green-100 text-green-800',
      archived: 'bg-gray-100 text-gray-600',
    };
    return colors[status] || colors.draft;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: '草稿',
      annotating: '标注中',
      ai_generating: 'AI生成中',
      mockup_review: '效果图评审',
      designing: '设计中',
      completed: '已完成',
      archived: '已归档',
    };
    return labels[status] || status;
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const screenshotImages = requirement.screenshots.map((s, i) => ({
    src: s.imageUrl,
    alt: s.title || `截图 ${i + 1}`,
  }));

  const mockupImages = requirement.mockupDesigns?.map((m) => ({
    src: m.imageUrl,
    alt: `效果图 ${m.variant}方案`,
  })) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-lg">
                雕
              </div>
              <div>
                <h1 className="font-semibold">{requirement.title}</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className={cn('px-2 py-0.5 rounded-full text-xs', getStatusColor(requirement.status))}>
                    {getStatusLabel(requirement.status)}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(requirement.createdAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate('/')} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              返回应用
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* 需求描述 */}
          <section>
            <h2 className="text-lg font-semibold mb-4">需求描述</h2>
            <Card className="p-4">
              <p className="whitespace-pre-wrap text-muted-foreground">
                {requirement.userDescription || '暂无描述'}
              </p>
            </Card>
          </section>

          {/* 截图 */}
          {requirement.screenshots.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4">
                截图 ({requirement.screenshots.length})
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {requirement.screenshots.map((screenshot, index) => (
                  <div
                    key={screenshot.id}
                    className="group relative aspect-video bg-muted rounded-lg overflow-hidden cursor-pointer"
                    onClick={() => openLightbox(index)}
                  >
                    <img
                      src={screenshot.thumbnailUrl || screenshot.imageUrl}
                      alt={screenshot.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <ExternalLink className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {screenshot.annotations.length > 0 && (
                      <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                        {screenshot.annotations.length} 标注
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* AI 生成内容 */}
          {requirement.aiGeneratedContent && (
            <section>
              <h2 className="text-lg font-semibold mb-4">AI 生成内容</h2>
              <Card className="p-4 space-y-4">
                {requirement.aiGeneratedContent.designSuggestions?.layout && (
                  <div>
                    <h3 className="font-medium mb-2">布局风格</h3>
                    <p className="text-sm text-muted-foreground">
                      {requirement.aiGeneratedContent.designSuggestions.layout.style}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {requirement.aiGeneratedContent.designSuggestions.layout.description}
                    </p>
                  </div>
                )}

                {requirement.aiGeneratedContent.designSuggestions?.styleGuide?.colors?.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">配色方案</h3>
                    <div className="flex flex-wrap gap-2">
                      {requirement.aiGeneratedContent.designSuggestions.styleGuide.colors.map((color, i) => (
                        <Badge key={i} variant="secondary">{color}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {requirement.aiGeneratedContent.designSuggestions?.components?.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">组件建议</h3>
                    <ul className="space-y-1">
                      {requirement.aiGeneratedContent.designSuggestions.components.map((comp, i) => (
                        <li key={i} className="text-sm text-muted-foreground">
                          <span className="font-medium">{comp.name}</span>
                          {' '}<span className="text-xs">({comp.type})</span>
                          {comp.description && (
                            <span>: {comp.description}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            </section>
          )}

          {/* 效果图 */}
          {requirement.mockupDesigns && requirement.mockupDesigns.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4">
                效果图 ({requirement.mockupDesigns.length})
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {requirement.mockupDesigns.map((mockup, index) => (
                  <div
                    key={mockup.id}
                    className={cn(
                      'relative aspect-[16/9] bg-muted rounded-lg overflow-hidden cursor-pointer',
                      mockup.selected && 'ring-2 ring-primary'
                    )}
                    onClick={() => openLightbox(requirement.screenshots.length + index)}
                  >
                    <img
                      src={mockup.imageUrl}
                      alt={`方案 ${mockup.variant}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                    <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                      方案 {mockup.variant}
                    </div>
                    {mockup.selected && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                        已选中
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 元信息 */}
          <section>
            <h2 className="text-lg font-semibold mb-4">详细信息</h2>
            <Card className="p-4">
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-muted-foreground mb-1">创建时间</dt>
                  <dd>{new Date(requirement.createdAt).toLocaleString('zh-CN')}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground mb-1">更新时间</dt>
                  <dd>{new Date(requirement.updatedAt).toLocaleString('zh-CN')}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground mb-1">优先级</dt>
                  <dd className="capitalize">{requirement.priority}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground mb-1">状态</dt>
                  <dd>{getStatusLabel(requirement.status)}</dd>
                </div>
              </dl>
            </Card>
          </section>
        </div>
      </main>

      {/* Lightbox */}
      <ImageLightbox
        images={[...screenshotImages, ...mockupImages]}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t mt-12 py-6">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>由 <a href="https://github.com/rightgenius/diaohua" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">雕花</a> 生成</p>
        </div>
      </footer>
    </div>
  );
}

export default Share;
