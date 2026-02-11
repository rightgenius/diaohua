import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ImageLightboxProps {
  images: { src: string; alt: string }[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 图片放大查看组件 (Lightbox)
 * 
 * 支持:
 * - ESC 关闭
 * - 左右箭头切换
 * - 点击背景关闭
 * - 下载图片
 */
export function ImageLightbox({
  images,
  initialIndex,
  isOpen,
  onClose,
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // 重置索引当打开时
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  // 键盘事件处理
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;
    
    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowLeft':
        goToPrevious();
        break;
      case 'ArrowRight':
        goToNext();
        break;
    }
  }, [isOpen, currentIndex, images.length]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // 禁止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const handleDownload = () => {
    const image = images[currentIndex];
    if (!image) return;
    
    const link = document.createElement('a');
    link.href = image.src;
    link.download = image.alt || `image_${currentIndex + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* 顶部工具栏 */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent">
        <div className="text-white/80 text-sm">
          {currentIndex + 1} / {images.length}
          {currentImage?.alt && (
            <span className="ml-3 text-white/60">{currentImage.alt}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="下载图片"
          >
            <Download size={20} />
          </button>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="关闭 (ESC)"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* 图片显示区域 */}
      <div 
        className="relative max-w-[90vw] max-h-[85vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {currentImage && (
          <img
            src={currentImage.src}
            alt={currentImage.alt}
            className="max-w-full max-h-[85vh] object-contain"
          />
        )}
      </div>

      {/* 左右切换按钮 */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
            className={cn(
              "absolute left-4 top-1/2 -translate-y-1/2 p-3",
              "text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all",
              "focus:outline-none focus:ring-2 focus:ring-white/30"
            )}
            title="上一张 (←)"
          >
            <ChevronLeft size={32} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            className={cn(
              "absolute right-4 top-1/2 -translate-y-1/2 p-3",
              "text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all",
              "focus:outline-none focus:ring-2 focus:ring-white/30"
            )}
            title="下一张 (→)"
          >
            <ChevronRight size={32} />
          </button>
        </>
      )}

      {/* 底部缩略图导航 */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-black/50 rounded-full overflow-x-auto max-w-[80vw]">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              className={cn(
                "flex-shrink-0 w-12 h-12 rounded overflow-hidden border-2 transition-all",
                idx === currentIndex 
                  ? "border-white scale-110" 
                  : "border-transparent opacity-60 hover:opacity-100"
              )}
            >
              <img
                src={img.src}
                alt={img.alt}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ImageLightbox;
