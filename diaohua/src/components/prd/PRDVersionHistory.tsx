import { useState } from 'react';
import { Clock, RotateCcw, ChevronDown, ChevronUp, FileText, User } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { Requirement, PRDVersion } from '@/types';
import { cn } from '@/utils/cn';

interface PRDVersionHistoryProps {
  requirement: Requirement;
  onRestoreVersion?: (version: PRDVersion) => void;
  className?: string;
}

/**
 * PRD 版本历史组件
 * 
 * 显示 PRD 的历史版本列表，支持查看和恢复
 */
export function PRDVersionHistory({
  requirement,
  onRestoreVersion,
  className,
}: PRDVersionHistoryProps) {
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);

  // 获取所有版本（当前 + 历史）
  const allVersions: (PRDVersion & { isCurrent?: boolean; createdBy?: string; changeSummary?: string })[] = [
    ...(requirement.prdVersions || []),
  ];

  // 添加当前版本到列表顶部
  if (requirement.aiGeneratedContent) {
    allVersions.unshift({
      id: 'current',
      prdMarkdown: requirement.aiGeneratedContent.prdMarkdown,
      generatedAt: requirement.aiGeneratedContent.generatedAt,
      generatedPrompt: requirement.aiGeneratedContent.generatedPrompt,
      designSuggestions: requirement.aiGeneratedContent.designSuggestions,
      isCurrent: true,
      createdBy: 'AI',
      changeSummary: '当前版本',
    });
  }

  if (allVersions.length === 0) {
    return (
      <Card className={cn('p-6 text-center', className)}>
        <Clock className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
        <p className="text-muted-foreground">暂无 PRD 版本历史</p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          生成 PRD 后将自动保存版本历史
        </p>
      </Card>
    );
  }

  const toggleExpand = (versionId: string) => {
    setExpandedVersion(expandedVersion === versionId ? null : versionId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-medium">版本历史</h3>
        <span className="text-sm text-muted-foreground">
          共 {allVersions.length} 个版本
        </span>
      </div>

      {allVersions.map((version, index) => (
        <Card
          key={version.id}
          className={cn(
            'overflow-hidden transition-all',
            version.isCurrent && 'border-primary/50 ring-1 ring-primary/20'
          )}
        >
          <div
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => toggleExpand(version.id)}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  version.isCurrent
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                <FileText size={20} />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {version.isCurrent ? '当前版本' : `版本 ${allVersions.length - index}`}
                  </span>
                  {version.isCurrent && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      当前
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {formatDate(version.generatedAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <User size={12} />
                    {version.createdBy || 'AI'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!version.isCurrent && onRestoreVersion && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRestoreVersion(version);
                  }}
                >
                  <RotateCcw size={14} />
                  恢复
                </Button>
              )}
              {expandedVersion === version.id ? (
                <ChevronUp size={18} className="text-muted-foreground" />
              ) : (
                <ChevronDown size={18} className="text-muted-foreground" />
              )}
            </div>
          </div>

          {/* 展开的详情 */}
          {expandedVersion === version.id && (
            <div className="border-t px-4 py-4 bg-muted/30">
              {version.changeSummary && (
                <p className="text-sm text-muted-foreground mb-3">
                  <span className="font-medium">变更说明: </span>
                  {version.changeSummary}
                </p>
              )}

              {/* PRD 内容预览 */}
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium mb-2">布局风格</h4>
                  <p className="text-sm text-muted-foreground">
                    {version.designSuggestions?.layout?.style || '未指定'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {version.designSuggestions?.layout?.description}
                  </p>
                </div>

                {version.designSuggestions?.styleGuide?.colors?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">配色方案</h4>
                    <div className="flex flex-wrap gap-2">
                      {version.designSuggestions.styleGuide.colors.map(
                        (color, i) => (
                          <span
                            key={i}
                            className="text-xs bg-muted px-2 py-1 rounded flex items-center gap-1"
                          >
                            <span
                              className="w-3 h-3 rounded-full border"
                              style={{ backgroundColor: color }}
                            />
                            {color}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}

                {version.designSuggestions?.components?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">组件建议</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {version.designSuggestions.components.map(
                        (comp, i) => (
                          <li key={i}>
                            <span className="font-medium">{comp.name}</span>
                            {' '}<span className="text-xs">({comp.type})</span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium mb-2">生成 Prompt</h4>
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                    {version.generatedPrompt || '未生成'}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

export default PRDVersionHistory;
