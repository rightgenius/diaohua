import { useState, useRef, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { 
  Camera, 
  RotateCw, 
  ArrowLeft, 
  ArrowRight, 
  ExternalLink,
  Loader2,
  Maximize2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface BrowserWorkbenchProps {
  onScreenshot?: (imageUrl: string, pageInfo: { url: string; title: string }) => void;
}

export function BrowserWorkbench({ onScreenshot }: BrowserWorkbenchProps) {
  const [url, setUrl] = useState('https://www.baidu.com');
  const [inputUrl, setInputUrl] = useState('https://www.baidu.com');
  const [isLoading, setIsLoading] = useState(false);
  const [hasBrowser, setHasBrowser] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 确保 URL 有协议前缀
  const normalizeUrl = (input: string): string => {
    let normalized = input.trim();
    if (!normalized) return '';
    
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = 'https://' + normalized;
    }
    return normalized;
  };

  // 导航/打开浏览器
  const navigate = useCallback(() => {
    const normalized = normalizeUrl(inputUrl);
    if (!normalized) return;
    
    setError(null);
    setIsLoading(true);
    setUrl(normalized);
    setHasBrowser(true);
  }, [inputUrl]);

  // 刷新
  const refresh = useCallback(() => {
    if (iframeRef.current) {
      setIsLoading(true);
      iframeRef.current.src = iframeRef.current.src;
    }
  }, []);

  // 关闭浏览器
  const closeBrowser = useCallback(() => {
    setHasBrowser(false);
  }, []);

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
    try {
      const iframe = iframeRef.current;
      if (iframe?.contentWindow) {
        const currentUrl = iframe.contentWindow.location.href;
        if (currentUrl !== 'about:blank') {
          setInputUrl(currentUrl);
          setUrl(currentUrl);
        }
      }
    } catch {
      // 跨域错误，忽略
    }
  }, []);

  const handleIframeError = useCallback(() => {
    setIsLoading(false);
    setError('页面加载失败，可能是网站禁止了 iframe 嵌入');
  }, []);

  // 截图功能 - 使用系统截图
  const captureScreenshot = useCallback(async () => {
    setIsCapturing(true);
    
    try {
      // 提示用户使用系统截图
      alert('请使用系统截图工具 (Cmd+Shift+4) 截图后，按 Cmd+V 粘贴到应用中');
    } finally {
      setIsCapturing(false);
    }
  }, []);

  // 处理粘贴事件 - 接收系统截图
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (!hasBrowser) return;
      
      const items = e.clipboardData?.items;
      if (!items) return;
      
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const imageUrl = event.target?.result as string;
              if (imageUrl && onScreenshot) {
                onScreenshot(imageUrl, { 
                  url: url, 
                  title: '浏览器截图' 
                });
              }
            };
            reader.readAsDataURL(file);
          }
          break;
        }
      }
    };
    
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [hasBrowser, url, onScreenshot]);

  // 在外部浏览器打开
  const openExternal = useCallback(() => {
    const normalized = normalizeUrl(inputUrl);
    window.open(normalized, '_blank');
  }, [inputUrl]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* 工具栏 */}
      <div className="h-14 border-b flex items-center gap-2 px-4 bg-muted/30">
        {/* 导航按钮 */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={!hasBrowser}
            title="后退"
          >
            <ArrowLeft size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={!hasBrowser}
            title="前进"
          >
            <ArrowRight size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={refresh}
            disabled={!hasBrowser || isLoading}
            title="刷新"
          >
            <RotateCw size={16} className={cn(isLoading && "animate-spin")} />
          </Button>
        </div>

        {/* 地址栏 */}
        <div className="flex-1 flex items-center gap-2">
          <Input
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && navigate()}
            className="flex-1 h-9"
            placeholder="输入网址..."
          />
          <Button 
            onClick={navigate} 
            size="sm"
            disabled={isLoading}
          >
            {hasBrowser ? '跳转' : '打开'}
          </Button>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-2">
          {hasBrowser && (
            <Button
              variant="outline"
              size="sm"
              onClick={closeBrowser}
            >
              关闭
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={openExternal}
            title="在外部浏览器打开"
          >
            <ExternalLink size={14} />
            外部
          </Button>
          <Button
            onClick={captureScreenshot}
            disabled={isCapturing || !hasBrowser}
            size="sm"
            className="gap-1"
          >
            {isCapturing ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Camera size={14} />
            )}
            截图
          </Button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-center gap-2 text-amber-700 text-sm">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button 
            onClick={() => setError(null)}
            className="ml-auto text-xs hover:underline"
          >
            关闭
          </button>
        </div>
      )}

      {/* 浏览器区域 */}
      <div className="flex-1 relative bg-white overflow-hidden">
        {!hasBrowser ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
            <Maximize2 size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-medium">
              点击「打开」在应用内浏览网页
            </p>
            <p className="text-sm mt-2 max-w-md text-center">
              使用 iframe 嵌入，部分网站可能因安全设置无法显示
            </p>
            <div className="mt-6 flex gap-4 text-xs">
              <span className="px-3 py-1 bg-muted rounded">Cmd+Shift+4 截图</span>
              <span className="px-3 py-1 bg-muted rounded">Cmd+V 粘贴</span>
            </div>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={url}
            className="w-full h-full border-0"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            title="浏览器"
          />
        )}
      </div>

      {/* 提示信息 */}
      <div className="h-8 border-t bg-muted/20 flex items-center px-4 text-xs text-muted-foreground">
        <span className="flex-1">
          💡 提示：iframe 模式可能受跨域限制，如无法显示请在外部浏览器打开
        </span>
        <span className="hidden md:inline">
          Mac: Cmd+Shift+4 截图 | Cmd+V 粘贴
        </span>
      </div>
    </div>
  );
}
