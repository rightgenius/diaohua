import { useState, useRef } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';

export function BrowserWorkbench() {
  const [url, setUrl] = useState('https://www.example.com');
  const [inputUrl, setInputUrl] = useState('https://www.example.com');
  const webviewRef = useRef<HTMLWebViewElement>(null);

  const handleNavigate = () => {
    let targetUrl = inputUrl;
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }
    setUrl(targetUrl);
    setInputUrl(targetUrl);
  };

  const handleGoBack = () => {
    if (webviewRef.current) {
      webviewRef.current.goBack();
    }
  };

  const handleGoForward = () => {
    if (webviewRef.current) {
      webviewRef.current.goForward();
    }
  };

  const handleReload = () => {
    if (webviewRef.current) {
      webviewRef.current.reload();
    }
  };

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
        
        <Button onClick={handleNavigate} size="sm">
          访问
        </Button>
      </div>

      {/* WebView Container */}
      <div className="flex-1 relative">
        {/* Note: In a real Tauri app, we'd use the webview tag or a custom protocol */}
        {/* For this demo, we'll use an iframe as a placeholder */}
        <div className="absolute inset-4 border rounded-lg overflow-hidden bg-white shadow-sm">
          <iframe
            src={url}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            title="Browser"
          />
        </div>
        
        {/* Overlay hint */}
        <div className="absolute bottom-6 right-6 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none">
          在此页面操作后点击「截图」按钮
        </div>
      </div>
    </div>
  );
}
