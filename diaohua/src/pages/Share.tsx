import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Eye, Calendar, User, Tag, FileText, Image as ImageIcon, Palette } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { useRequirementStore } from '@/stores/requirementStore';
import { cn } from '@/utils/cn';
import type { Requirement } from '@/types';

export function Share() {
  const { id } = useParams<{ id: string }>();
  const { requirements } = useRequirementStore();
  const [requirement, setRequirement] = useState<Requirement | null>(null);
  const [loading, setLoading] = useState(true);

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
        <Loading message="加载需求中..." />
      </div>
    );
  }

  if (!requirement) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <EmptyState
          title="需求未找到"
          description="该分享链接无效或需求已被删除"
          icon={<Eye className="w-12 h-12 text-muted-foreground" />}
          action={
            <Link to="/">
              <Button>返回首页</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const selectedMockup = requirement.mockupDesigns?.find(
    (m) => m.id === requirement.selectedMockupId
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                返回
              </Button>
            </Link>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">
                雕
              </div>
              <span className="font-semibold">雕花 - 需求分享</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Eye className="w-4 h-4" />
            只读视图
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Title Section */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">{requirement.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(requirement.createdAt).toLocaleDateString('zh-CN')}
            </div>
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {requirement.creatorId === 'user' ? '我' : requirement.creatorId}
            </div>
            <Badge variant={getStatusVariant(requirement.status)}>
              {getStatusLabel(requirement.status)}
            </Badge>
            <Badge variant="outline">{requirement.priority} 优先级</Badge>
          </div>

          {requirement.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {requirement.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Description */}
        {requirement.userDescription && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">需求描述</h2>
            </div>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {requirement.userDescription}
            </p>
          </Card>
        )}

        {/* Screenshots */}
        {requirement.screenshots.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">
                截图 ({requirement.screenshots.length})
              </h2>
            </div>

            <div className="space-y-4">
              {requirement.screenshots.map((screenshot, index) => (
                <div key={screenshot.id} className="border rounded-lg overflow-hidden">
                  <div className="bg-muted px-4 py-2 text-sm font-medium">
                    截图 {index + 1}: {screenshot.title}
                  </div>
                  <div className="p-4">
                    <img
                      src={screenshot.imageUrl}
                      alt={screenshot.title}
                      className="max-h-96 mx-auto rounded border"
                    />
                    {screenshot.description && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {screenshot.description}
                      </p>
                    )}
                    {screenshot.annotations.length > 0 && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        标注数: {screenshot.annotations.length}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* AI Generated Content */}
        {requirement.aiGeneratedContent && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">AI 设计建议</h2>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">布局风格</h3>
                <p className="text-muted-foreground">
                  {requirement.aiGeneratedContent.designSuggestions?.layout?.style || 'N/A'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {requirement.aiGeneratedContent.designSuggestions?.layout?.description}
                </p>
              </div>

              {requirement.aiGeneratedContent.designSuggestions?.styleGuide?.colors && (
                <div>
                  <h3 className="font-medium mb-2">配色方案</h3>
                  <div className="flex flex-wrap gap-2">
                    {requirement.aiGeneratedContent.designSuggestions.styleGuide.colors.map(
                      (color, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                        >
                          <div
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-sm font-mono">{color}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">PRD 文档</h3>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto max-h-96">
                  {requirement.aiGeneratedContent.prdMarkdown}
                </pre>
              </div>
            </div>
          </Card>
        )}

        {/* Mockup */}
        {selectedMockup && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">效果图</h2>
            </div>

            <div className="text-sm text-muted-foreground mb-4">
              方案 {selectedMockup.variant} | 风格: {selectedMockup.style}
            </div>

            <img
              src={selectedMockup.imageUrl}
              alt="效果图"
              className="max-w-full mx-auto rounded-lg border"
            />
          </Card>
        )}

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground py-8">
          <p>由 雕花 生成于 {new Date(requirement.createdAt).toLocaleString('zh-CN')}</p>
          <p className="mt-1">这是一个只读分享页面</p>
        </footer>
      </main>
    </div>
  );
}

function getStatusLabel(status: string): string {
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
}

function getStatusVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  const variants: Record<
    string,
    'default' | 'secondary' | 'destructive' | 'outline'
  > = {
    draft: 'secondary',
    annotating: 'default',
    ai_generating: 'default',
    mockup_review: 'secondary',
    designing: 'secondary',
    completed: 'default',
    archived: 'outline',
  };
  return variants[status] || 'secondary';
}

export default Share;
