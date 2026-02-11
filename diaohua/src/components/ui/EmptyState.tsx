import { LucideIcon } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/utils/cn';

interface EmptyStateProps {
  /**
   * 图标
   */
  icon?: LucideIcon;
  /**
   * 标题
   */
  title: string;
  /**
   * 描述文本
   */
  description?: string;
  /**
   * 操作按钮文本
   */
  actionText?: string;
  /**
   * 操作按钮点击事件
   */
  onAction?: () => void;
  /**
   * 自定义类名
   */
  className?: string;
  /**
   * 子元素（用于自定义操作区域）
   */
  children?: React.ReactNode;
  /**
   * 紧凑模式
   */
  compact?: boolean;
}

/**
 * 空状态组件
 * 
 * 用于在没有数据时显示引导界面
 * 
 * @example
 * ```tsx
 * // 基础用法
 * <EmptyState
 *   icon={FileText}
 *   title="暂无文档"
 *   description="点击按钮创建新文档"
 *   actionText="创建文档"
 *   onAction={handleCreate}
 * />
 * 
 * // 自定义操作区域
 * <EmptyState
 *   icon={Image}
 *   title="暂无截图"
 * >
 *   <div className="flex gap-2">
 *     <Button>上传截图</Button>
 *     <Button variant="outline">从剪贴板</Button>
 *   </div>
 * </EmptyState>
 * ```
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  className,
  children,
  compact = false,
}: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center text-center',
      compact ? 'py-8 px-4' : 'py-16 px-4',
      className
    )}>
      {Icon && (
        <div className={cn(
          'rounded-full bg-muted flex items-center justify-center mb-4',
          compact ? 'w-12 h-12' : 'w-16 h-16'
        )}>
          <Icon 
            className={cn(
              'text-muted-foreground',
              compact ? 'w-6 h-6' : 'w-8 h-8'
            )} 
          />
        </div>
      )}
      
      <h3 className={cn(
        'font-semibold text-foreground',
        compact ? 'text-base mb-1' : 'text-lg mb-2'
      )}>
        {title}
      </h3>
      
      {description && (
        <p className={cn(
          'text-muted-foreground max-w-sm',
          compact ? 'text-xs mb-3' : 'text-sm mb-6'
        )}>
          {description}
        </p>
      )}
      
      {children}
      
      {actionText && onAction && !children && (
        <Button 
          onClick={onAction}
          size={compact ? 'sm' : 'default'}
        >
          {actionText}
        </Button>
      )}
    </div>
  );
}

interface EmptyRequirementProps {
  onCreateNew?: () => void;
  className?: string;
}

/**
 * 需求空状态
 * 
 * 当没有需求时显示的引导界面
 */
export function EmptyRequirement({ onCreateNew, className }: EmptyRequirementProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center h-full min-h-[400px] bg-muted/30 rounded-lg',
      className
    )}>
      <div className="text-center max-w-md px-6">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg 
            viewBox="0 0 24 24" 
            className="w-10 h-10 text-primary"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M9 12h.01M15 12h.01M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold mb-3">
          欢迎使用雕花
        </h2>
        
        <p className="text-muted-foreground mb-8">
          雕花是一款 AI 辅助的产品设计工具。通过截图标注和 AI 生成，
          快速将你的想法转化为可视化的设计效果图。
        </p>
        
        <div className="space-y-3">
          <Button 
            onClick={onCreateNew}
            size="lg"
            className="w-full"
          >
            创建第一个需求
          </Button>
          
          <p className="text-xs text-muted-foreground">
            或者使用快捷键 <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Ctrl+N</kbd> 创建
          </p>
        </div>
        
        <div className="mt-12 grid grid-cols-3 gap-4 text-left">
          <Step 
            number={1} 
            title="截图标注"
            description="截取网页截图并添加标注说明"
          />
          <Step 
            number={2} 
            title="AI 分析"
            description="AI 自动分析并生成设计建议"
          />
          <Step 
            number={3} 
            title="生成效果图"
            description="一键生成专业的设计效果图"
          />
        </div>
      </div>
    </div>
  );
}

interface StepProps {
  number: number;
  title: string;
  description: string;
}

function Step({ number, title, description }: StepProps) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
          {number}
        </span>
        <span className="font-medium text-sm">{title}</span>
      </div>
      <p className="text-xs text-muted-foreground pl-8">
        {description}
      </p>
    </div>
  );
}

interface EmptyScreenshotProps {
  onScreenshot?: () => void;
  className?: string;
}

/**
 * 截图空状态
 * 
 * 当需求没有截图时显示的提示
 */
export function EmptyScreenshot({ onScreenshot, className }: EmptyScreenshotProps) {
  return (
    <EmptyState
      icon={ImageIcon}
      title="暂无截图"
      description="在右侧浏览器中访问网页并截图，或者上传图片开始标注"
      actionText={onScreenshot ? "开始截图" : undefined}
      onAction={onScreenshot}
      className={className}
    >
      {<div className="mt-4 p-4 bg-muted rounded-lg max-w-sm">
        <p className="text-xs text-muted-foreground mb-2 font-medium"></p>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
          <li>在右侧输入网址访问目标页面</li>
          <li>点击截图按钮捕获页面</li>
          <li>添加标注说明需求</li>
        </ul>
      </div>}
    </EmptyState>
  );
}

// 导入图标
import { Image as ImageIcon } from 'lucide-react';

export default EmptyState;
