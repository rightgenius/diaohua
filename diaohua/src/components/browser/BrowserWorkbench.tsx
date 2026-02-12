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
  Monitor,
  LayoutTemplate,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { ScreenshotEditor } from '@/components/screenshot/ScreenshotEditor';
import { WebviewScreenshotService } from '@/services/webviewScreenshot';

interface BrowserWorkbenchProps {
  onScreenshot?: (imageUrl: string, pageInfo: { url: string; title: string }) => void;
}

type ScreenshotMethod = 'auto' | 'iframe-direct' | 'system' | 'electron-webview';

export function BrowserWorkbench({ onScreenshot }: BrowserWorkbenchProps) {
  const [url, setUrl] = useState('http://10.20.3.2:9780/');
  const [inputUrl, setInputUrl] = useState('http://10.20.3.2:9780/');
  const [isLoading, setIsLoading] = useState(false);
  const [hasBrowser, setHasBrowser] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [screenshotMethod, setScreenshotMethod] = useState<ScreenshotMethod>('auto');
  const [showMethodMenu, setShowMethodMenu] = useState(false);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const methodMenuRef = useRef<HTMLDivElement>(null);

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

  // 智能选择截图方案
  const getActualScreenshotMethod = useCallback((): ScreenshotMethod => {
    if (screenshotMethod !== 'auto') return screenshotMethod;
    
    // 检查 iframe 是否可访问
    const iframe = iframeRef.current;
    if (iframe) {
      try {
        // 尝试访问 contentDocument
        if (iframe.contentDocument && iframe.contentDocument.body) {
          return 'iframe-direct';
        }
      } catch {
        // 跨域，使用 Electron webview 截图
        return 'electron-webview';
      }
    }
    
    // 默认使用 Electron webview 截图
    return 'electron-webview';
  }, [screenshotMethod]);

  // 截图功能 - 支持多种截图方案
  const captureScreenshot = useCallback(async () => {
    setIsCapturing(true);
    setError(null);
    
    const actualMethod = getActualScreenshotMethod();
    
    try {
      if (actualMethod === 'iframe-direct' && iframeRef.current) {
        // 使用 iframe 直接截图（同域时使用）
        console.log('[截图] 使用 iframe 直接截图方案');
        
        const result = await WebviewScreenshotService.captureIFrame(iframeRef.current, {
          scale: 2,
          backgroundColor: '#ffffff',
          timeout: 30000,
        });

        if (result.success && result.dataUrl) {
          setCapturedImage(result.dataUrl);
          setShowEditor(true);
          return;
        } else {
          console.warn('[截图] iframe 截图失败:', result.error);
          setError(
            `iframe 截图失败: ${result.error}\n\n` +
            '该页面可能跨域限制，建议切换到「Electron 截图」模式。'
          );
          return;
        }
      } else if (actualMethod === 'electron-webview') {
        // 使用 Electron 网页截图（支持跨域）
        console.log('[截图] 使用 Electron 网页截图方案');
        const normalized = normalizeUrl(url);
        const imageUrl = await window.electronAPI.captureWebpage(normalized, {
          width: 1920,
          height: 1080,
          waitTime: 3000,
        });
        setCapturedImage(imageUrl);
        setShowEditor(true);
      } else {
        // 使用系统截图
        console.log('[截图] 使用系统截图方案');
        const imageUrl = await window.electronAPI.captureScreen();
        setCapturedImage(imageUrl);
        setShowEditor(true);
      }
    } catch (err: any) {
      console.error('截图失败:', err);
      const errorMsg = String(err);
      
      if (errorMsg.includes('权限') || errorMsg.includes('全黑') || errorMsg.includes('screen recording')) {
        setError(
          '系统截图需要屏幕录制权限。\n\n' +
          'macOS 用户请前往：\n' +
          '系统设置 → 隐私与安全性 → 屏幕录制 → 添加/启用本应用\n\n' +
          '或者使用 Cmd+Shift+4 截图后 Cmd+V 粘贴'
        );
      } else if (errorMsg.includes('未找到可用显示器')) {
        setError('无法找到可用显示器，请检查显示器连接');
      } else {
        setError('截图失败: ' + errorMsg);
      }
    } finally {
      setIsCapturing(false);
    }
  }, [getActualScreenshotMethod, url]);

  // 快速检测当前页面是否支持 WebView 截图
  const checkWebviewSupport = useCallback(async () => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    
    const result = await WebviewScreenshotService.checkCSPLimitations(iframe);
    
    if (result.hasCSPLimitation) {
      setError(
        `当前页面${result.message}\n` +
        '建议使用 Electron 截图模式或系统截图 (Cmd+Shift+4) 后粘贴 (Cmd+V)'
      );
    } else {
      setError(null);
    }
  }, []);

  // 完成编辑
  const handleEditorComplete = useCallback((editedImageUrl: string) => {
    if (onScreenshot) {
      onScreenshot(editedImageUrl, { 
        url: hasBrowser ? url : inputUrl, 
        title: '浏览器截图' 
      });
    }
    setShowEditor(false);
    setCapturedImage(null);
  }, [hasBrowser, url, inputUrl, onScreenshot]);

  // 取消编辑
  const handleEditorCancel = useCallback(() => {
    setShowEditor(false);
    setCapturedImage(null);
  }, []);

  // 处理粘贴事件 - 接收系统截图
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
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
                  url: hasBrowser ? url : inputUrl, 
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
  }, [hasBrowser, url, inputUrl, onScreenshot]);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (methodMenuRef.current && !methodMenuRef.current.contains(event.target as Node)) {
        setShowMethodMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 在外部浏览器打开
  const openExternal = useCallback(() => {
    const normalized = normalizeUrl(inputUrl);
    window.open(normalized, '_blank');
  }, [inputUrl]);

  // 获取当前截图方法标签
  const getMethodLabel = (method: ScreenshotMethod) => {
    switch (method) {
      case 'iframe-direct': return 'iframe直接截图';
      case 'electron-webview': return 'Electron截图';
      case 'system': return '系统截图';
      case 'auto': return '智能选择';
    }
  };

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

          {/* 截图方法选择器 */}
          <div className="relative" ref={methodMenuRef}>
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => setShowMethodMenu(!showMethodMenu)}
              title="选择截图方案"
            >
              {screenshotMethod === 'iframe-direct' ? <LayoutTemplate size={14} /> : <Monitor size={14} />}
              <ChevronDown size={12} />
            </Button>
            
            {showMethodMenu && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-white border rounded-md shadow-lg z-50 py-1">
                <button
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2",
                    screenshotMethod === 'auto' && "bg-muted"
                  )}
                  onClick={() => {
                    setScreenshotMethod('auto');
                    setShowMethodMenu(false);
                  }}
                >
                  <LayoutTemplate size={14} className="text-blue-500" />
                  <div>
                    <div className="font-medium">智能选择</div>
                    <div className="text-xs text-muted-foreground">同域用iframe，跨域用Electron</div>
                  </div>
                </button>
                <button
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2",
                    screenshotMethod === 'iframe-direct' && "bg-muted"
                  )}
                  onClick={() => {
                    setScreenshotMethod('iframe-direct');
                    setShowMethodMenu(false);
                    checkWebviewSupport();
                  }}
                >
                  <LayoutTemplate size={14} className="text-green-500" />
                  <div>
                    <div className="font-medium">iframe直接截图</div>
                    <div className="text-xs text-muted-foreground">同域时可用，速度快</div>
                  </div>
                </button>
                <button
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2",
                    screenshotMethod === 'electron-webview' && "bg-muted"
                  )}
                  onClick={() => {
                    setScreenshotMethod('electron-webview');
                    setShowMethodMenu(false);
                  }}
                >
                  <Monitor size={14} className="text-purple-500" />
                  <div>
                    <div className="font-medium">Electron截图</div>
                    <div className="text-xs text-muted-foreground">支持跨域，无需系统权限</div>
                  </div>
                </button>
                <button
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2",
                    screenshotMethod === 'system' && "bg-muted"
                  )}
                  onClick={() => {
                    setScreenshotMethod('system');
                    setShowMethodMenu(false);
                  }}
                >
                  <Monitor size={14} className="text-orange-500" />
                  <div>
                    <div className="font-medium">系统截图</div>
                    <div className="text-xs text-muted-foreground">截取整个屏幕</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          <Button
            onClick={captureScreenshot}
            disabled={isCapturing}
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
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-start gap-2 text-amber-700 text-sm">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span className="whitespace-pre-line flex-1">{error}</span>
          <button 
            onClick={() => setError(null)}
            className="ml-auto text-xs hover:underline flex-shrink-0"
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
          💡 提示：截图方案「{getMethodLabel(screenshotMethod)}」
          {screenshotMethod === 'auto' && (
            <span className="ml-2">(自动选择)</span>
          )}
        </span>
        <span className="hidden md:inline">
          Mac: Cmd+Shift+4 截图 | Cmd+V 粘贴
        </span>
      </div>

      {/* 截图编辑器 */}
      {showEditor && capturedImage && (
        <ScreenshotEditor
          imageUrl={capturedImage}
          onComplete={handleEditorComplete}
          onCancel={handleEditorCancel}
        />
      )}
    </div>
  );
}
