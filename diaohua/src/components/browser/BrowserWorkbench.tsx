import { useState, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { RotateCcw, ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import { ScreenshotService } from '@/services/screenshot';

interface BrowserWorkbenchProps {
  onScreenshot?: (imageUrl: string, pageInfo: { url: string; title: string }) => void;
}

export function BrowserWorkbench({ onScreenshot }: BrowserWorkbenchProps) {
  const [url, setUrl] = useState('https://www.baidu.com');
  const [inputUrl, setInputUrl] = useState('https://www.baidu.com');
  const [isCapturing, setIsCapturing] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleNavigate = () => {
    let targetUrl = inputUrl.trim();
    if (!targetUrl) return;
    
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }
    setUrl(targetUrl);
    setInputUrl(targetUrl);
  };

  const handleGoBack = () => {
    try {
      iframeRef.current?.contentWindow?.history.back();
    } catch {
      // 跨域限制，忽略
    }
  };

  const handleGoForward = () => {
    try {
      iframeRef.current?.contentWindow?.history.forward();
    } catch {
      // 跨域限制，忽略
    }
  };

  const handleReload = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const handleCapture = useCallback(async () => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument?.body) {
      alert('无法截图，请等待页面加载完成');
      return;
    }

    setIsCapturing(true);
    try {
      // 获取当前页面信息
      const pageUrl = iframe.contentWindow?.location?.href || url;
      const pageTitle = iframe.contentDocument?.title || '未命名页面';
      
      // 使用 html2canvas 截取 iframe 内容
      const imageUrl = await ScreenshotService.captureElement(iframe.contentDocument.body);
      onScreenshot?.(imageUrl, { url: pageUrl, title: pageTitle });
    } catch (error) {
      console.error('截图失败:', error);
      alert('截图失败，请重试');
    } finally {
      setIsCapturing(false);
    }
  }, [onScreenshot, url]);

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Address Bar */}
      <div className="h-12 border-b flex items-center gap-2 px-4 bg-muted/30">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleGoBack}
          className="h-8 w-8"
        >
          <ChevronLeft size={16} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleGoForward}
          className="h-8 w-8"
        >
          <ChevronRight size={16} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleReload}
          className="h-8 w-8"
        >
          <RotateCcw size={14} />
        </Button>
        
        <Input
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleNavigate()}
          className="flex-1 h-8"
          placeholder="输入网址..."
        />
        
        <Button onClick={handleNavigate} size="sm" variant="secondary">
          访问
        </Button>
        
        <Button 
          onClick={handleCapture} 
          size="sm" 
          disabled={isCapturing}
          className="gap-2"
        >
          <Camera size={14} />
          {isCapturing ? '截图中...' : '截图'}
        </Button>
      </div>

      {/* Iframe Container */}
      <div className="flex-1 relative bg-white">
        <iframe
          ref={iframeRef}
          src={url}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
          title="Browser"
        />
        
        {/* Overlay hint */}
        <div className="absolute bottom-6 right-6 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none">
          在此页面操作后点击「截图」按钮
        </div>
      </div>
    </div>
  );
}
