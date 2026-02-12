import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Camera, ExternalLink, Upload, ImagePlus, X } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

interface BrowserWorkbenchProps {
  onScreenshot?: (imageUrl: string, pageInfo: { url: string; title: string }) => void;
}

export function BrowserWorkbench({ onScreenshot }: BrowserWorkbenchProps) {
  const [url, setUrl] = useState('https://www.baidu.com');
  const [isCapturing, setIsCapturing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [browserOpen, setBrowserOpen] = useState(false);

  const handleOpenBrowser = async () => {
    let targetUrl = url.trim();
    if (!targetUrl) return;
    
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
      setUrl(targetUrl);
    }
    
    try {
      console.log('[前端] 打开浏览器窗口:', targetUrl);
      await invoke('open_browser_window', { 
        url: targetUrl, 
        title: '浏览器 - 雕花' 
      });
      setBrowserOpen(true);
    } catch (error) {
      console.error('打开浏览器窗口失败:', error);
      // 失败时使用系统浏览器
      window.open(targetUrl, '_blank');
    }
  };

  const handleCloseBrowser = async () => {
    try {
      await invoke('close_browser_window');
      setBrowserOpen(false);
    } catch (error) {
      console.error('关闭浏览器窗口失败:', error);
    }
  };

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsCapturing(true);
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setUploadedImage(imageUrl);
        onScreenshot?.(imageUrl, { 
          url: url, 
          title: file.name 
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('上传失败:', error);
      alert('上传失败，请重试');
    } finally {
      setIsCapturing(false);
    }
  }, [onScreenshot, url]);

  const handlePaste = useCallback(async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type);
            const reader = new FileReader();
            reader.onload = (e) => {
              const imageUrl = e.target?.result as string;
              setUploadedImage(imageUrl);
              onScreenshot?.(imageUrl, { 
                url: url, 
                title: '粘贴的截图' 
              });
            };
            reader.readAsDataURL(blob);
            return;
          }
        }
      }
      alert('剪贴板中没有图片，请先截图');
    } catch (error) {
      console.error('粘贴失败:', error);
      alert('无法访问剪贴板，请使用上传功能');
    }
  }, [onScreenshot, url]);

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* 工具栏 */}
      <div className="h-14 border-b flex items-center gap-3 px-4 bg-muted/30">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 h-9"
          placeholder="输入要浏览的网页地址..."
        />
        
        {!browserOpen ? (
          <Button onClick={handleOpenBrowser} size="sm" variant="default" className="gap-1">
            <ExternalLink size={14} />
            打开浏览器
          </Button>
        ) : (
          <Button onClick={handleCloseBrowser} size="sm" variant="destructive" className="gap-1">
            <X size={14} />
            关闭浏览器
          </Button>
        )}
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-muted/10">
        {!uploadedImage ? (
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <ImagePlus className="w-10 h-10 text-muted-foreground" />
            </div>
            
            <h3 className="text-xl font-semibold mb-2">添加截图</h3>
            
            <p className="text-sm text-muted-foreground mb-6">
              {browserOpen 
                ? "浏览器窗口已打开，请在浏览器中截图后粘贴到此处"
                : "点击上方「打开浏览器」按钮，浏览网页并截图"
              }
            </p>
            
            <div className="flex flex-col gap-3">
              <Button 
                onClick={handlePaste} 
                size="lg" 
                className="gap-2"
                disabled={isCapturing}
              >
                <Camera size={18} />
                从剪贴板粘贴截图 (Cmd+V)
              </Button>
              
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="gap-2 w-full"
                  asChild
                >
                  <span>
                    <Upload size={18} />
                    上传图片文件
                  </span>
                </Button>
              </label>
            </div>
            
            <div className="mt-6 text-xs text-muted-foreground">
              <p className="mb-1">💡 Mac 截图快捷键</p>
              <p>Cmd+Shift+3 全屏 | Cmd+Shift+4 选区 | Cmd+Shift+5 录屏</p>
            </div>          
          </div>
        ) : (
          <div className="w-full h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">截图已添加，可在下方标注</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setUploadedImage(null)}
              >
                重新上传
              </Button>
            </div>
            <div className="flex-1 bg-white rounded-lg border overflow-hidden">
              <img 
                src={uploadedImage} 
                alt="截图" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
