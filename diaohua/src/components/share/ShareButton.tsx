import { useState, useRef, useEffect } from 'react';
import { Share2, Link2, Check, Copy, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { QRCodeSVG } from 'qrcode.react';
import type { Requirement } from '@/types';
import { cn } from '@/utils/cn';

interface ShareButtonProps {
  requirement: Requirement;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

/**
 * 分享按钮组件
 * 
 * 生成分享链接和二维码
 */
export function ShareButton({
  requirement,
  className,
  variant = 'outline',
  size = 'sm',
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 生成本地分享链接
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/share/${requirement.id}`
    : `/share/${requirement.id}`;

  // 点击外部关闭
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
      // 降级方案
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2"
      >
        <Share2 className="w-4 h-4" />
        分享
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-card border rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-medium">分享需求</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-muted rounded"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* 二维码 */}
            <div className="flex flex-col items-center">
              <div className="p-3 bg-white rounded-lg">
                <QRCodeSVG
                  value={shareUrl}
                  size={160}
                  level="M"
                  includeMargin={true}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                扫描二维码查看需求
              </p>
            </div>

            {/* 链接 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">分享链接</label>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-muted rounded-md border">
                  <Link2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 bg-transparent text-sm outline-none text-muted-foreground"
                  />
                </div>
                <Button
                  variant={copied ? 'default' : 'secondary'}
                  size="sm"
                  onClick={handleCopyLink}
                  className="gap-1"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      复制
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* 提示 */}
            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
              <p><strong>提示:</strong> 分享链接仅在本地设备有效。接收方需要在同一台设备上打开链接查看需求。</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShareButton;
