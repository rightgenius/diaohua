import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

interface LoadingProps {
  /**
   * 加载文本
   */
  text?: string;
  /**
   * 加载器大小
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /**
   * 是否全屏显示
   */
  fullScreen?: boolean;
  /**
   * 是否覆盖在内容上
   */
  overlay?: boolean;
  /**
   * 自定义类名
   */
  className?: string;
  /**
   * 子元素（当 overlay 为 true 时有效）
   */
  children?: React.ReactNode;
}

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

/**
 * 加载组件
 * 
 * 用于显示加载状态，支持多种尺寸和显示模式
 */
export function Loading({
  text,
  size = 'md',
  fullScreen = false,
  overlay = false,
  className,
  children,
}: LoadingProps) {
  const spinner = (
    <Loader2 
      className={cn(
        'animate-spin text-primary',
        sizeMap[size]
      )} 
    />
  );

  const content = (
    <div className={cn(
      'flex flex-col items-center justify-center gap-3',
      className
    )}>
      {spinner}
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  // 全屏模式
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
        {content}
      </div>
    );
  }

  // 覆盖层模式
  if (overlay && children) {
    return (
      <div className="relative">
        {children}
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center rounded-lg">
          {content}
        </div>
      </div>
    );
  }

  // 默认内联模式
  return content;
}

interface LoadingOverlayProps {
  loading: boolean;
  text?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * 加载覆盖层组件
 * 
 * 当 loading 为 true 时显示覆盖层
 */
export function LoadingOverlay({
  loading,
  text = '加载中...',
  children,
  className,
}: LoadingOverlayProps) {
  if (!loading) return <>{children}</>;

  return (
    <div className={cn('relative', className)}>
      {children}
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{text}</p>
        </div>
      </div>
    </div>
  );
}

interface SkeletonProps {
  /**
   * 骨架屏类型
   */
  type?: 'text' | 'avatar' | 'image' | 'card' | 'custom';
  /**
   * 自定义宽度
   */
  width?: string | number;
  /**
   * 自定义高度
   */
  height?: string | number;
  /**
   * 是否显示动画
   */
  animate?: boolean;
  /**
   * 自定义类名
   */
  className?: string;
}

/**
 * 骨架屏组件
 * 
 * 用于在内容加载前显示占位符
 */
export function Skeleton({
  type = 'text',
  width,
  height,
  animate = true,
  className,
}: SkeletonProps) {
  const baseStyles = cn(
    'bg-muted rounded',
    animate && 'animate-pulse',
    className
  );

  const typeStyles = {
    text: 'h-4 w-3/4',
    avatar: 'w-10 h-10 rounded-full',
    image: 'w-full aspect-video',
    card: 'w-full h-32',
    custom: '',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div 
      className={cn(baseStyles, typeStyles[type])}
      style={style}
    />
  );
}

export default Loading;
