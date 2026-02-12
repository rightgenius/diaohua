import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { 
  Square, 
  Circle, 
  ArrowRight, 
  Type, 
  Grid3X3, 
  Undo, 
  Redo, 
  Check,
  X,
  MousePointer2
} from 'lucide-react';

interface ScreenshotEditorProps {
  imageUrl: string;
  onComplete: (editedImageUrl: string) => void;
  onCancel: () => void;
}

type ToolType = 'select' | 'rect' | 'circle' | 'arrow' | 'text' | 'mosaic';

interface Annotation {
  id: string;
  type: Exclude<ToolType, 'select'>;
  x: number;
  y: number;
  width?: number;
  height?: number;
  endX?: number;
  endY?: number;
  color: string;
  text?: string;
  size?: number;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

const COLORS = ['#ef4444', '#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#000000', '#ffffff'];
const TOOL_SIZES = { thin: 2, medium: 4, thick: 6 };

export function ScreenshotEditor({ imageUrl, onComplete, onCancel }: ScreenshotEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<ToolType>('select');
  const [color, setColor] = useState('#ef4444');
  const [toolSize, setToolSize] = useState<keyof typeof TOOL_SIZES>('medium');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [history, setHistory] = useState<Annotation[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null);
  const [cropArea, setCropArea] = useState<CropArea | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [textInput, setTextInput] = useState<{ x: number; y: number; value: string } | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const scaleRef = useRef(1);

  // 初始化 Canvas 和图片
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const container = containerRef.current;
      if (!container) return;

      // 计算缩放比例以适应屏幕
      const containerRect = container.getBoundingClientRect();
      const padding = 40;
      const maxWidth = containerRect.width - padding * 2;
      const maxHeight = containerRect.height - padding * 2;
      
      const scaleX = maxWidth / img.width;
      const scaleY = maxHeight / img.height;
      scaleRef.current = Math.min(scaleX, scaleY, 1);

      canvas.width = img.width;
      canvas.height = img.height;
      
      redrawCanvas();
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // 重绘 Canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const img = imageRef.current;
    if (!canvas || !ctx || !img) return;

    // 清空并绘制原图
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    // 绘制所有标注
    annotations.forEach(annotation => drawAnnotation(ctx, annotation));
  }, [annotations]);

  // 绘制单个标注
  const drawAnnotation = (ctx: CanvasRenderingContext2D, annotation: Annotation) => {
    ctx.strokeStyle = annotation.color;
    ctx.fillStyle = annotation.color;
    ctx.lineWidth = annotation.size || TOOL_SIZES.medium;

    switch (annotation.type) {
      case 'rect':
        if (annotation.width && annotation.height) {
          ctx.strokeRect(annotation.x, annotation.y, annotation.width, annotation.height);
        }
        break;
      case 'circle':
        if (annotation.width && annotation.height) {
          ctx.beginPath();
          ctx.ellipse(
            annotation.x + annotation.width / 2,
            annotation.y + annotation.height / 2,
            Math.abs(annotation.width / 2),
            Math.abs(annotation.height / 2),
            0, 0, Math.PI * 2
          );
          ctx.stroke();
        }
        break;
      case 'arrow':
        if (annotation.endX !== undefined && annotation.endY !== undefined) {
          drawArrow(ctx, annotation.x, annotation.y, annotation.endX, annotation.endY);
        }
        break;
      case 'text':
        if (annotation.text) {
          ctx.font = `${annotation.size ? annotation.size * 3 + 12 : 24}px sans-serif`;
          ctx.fillText(annotation.text, annotation.x, annotation.y);
        }
        break;
      case 'mosaic':
        if (annotation.width && annotation.height) {
          applyMosaic(ctx, annotation.x, annotation.y, annotation.width, annotation.height);
        }
        break;
    }
  };

  // 绘制箭头
  const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) => {
    const headLength = 15;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  };

  // 应用马赛克
  const applyMosaic = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
    const blockSize = 10;
    const imageData = ctx.getImageData(x, y, width, height);
    const data = imageData.data;

    for (let blockY = 0; blockY < height; blockY += blockSize) {
      for (let blockX = 0; blockX < width; blockX += blockSize) {
        let r = 0, g = 0, b = 0, count = 0;
        
        for (let py = blockY; py < Math.min(blockY + blockSize, height); py++) {
          for (let px = blockX; px < Math.min(blockX + blockSize, width); px++) {
            const i = (py * width + px) * 4;
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            count++;
          }
        }

        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);

        for (let py = blockY; py < Math.min(blockY + blockSize, height); py++) {
          for (let px = blockX; px < Math.min(blockX + blockSize, width); px++) {
            const i = (py * width + px) * 4;
            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
          }
        }
      }
    }

    ctx.putImageData(imageData, x, y);
  };

  // 保存历史记录
  const saveHistory = useCallback(() => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...annotations]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [annotations, history, historyIndex]);

  // 撤销
  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setAnnotations([...history[historyIndex - 1]]);
    } else if (historyIndex === 0) {
      setHistoryIndex(-1);
      setAnnotations([]);
    }
  };

  // 重做
  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setAnnotations([...history[historyIndex + 1]]);
    }
  };

  // 获取鼠标在 Canvas 上的坐标
  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  // 鼠标按下
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const { x, y } = getCanvasCoordinates(e);

    if (tool === 'text') {
      setTextInput({ x, y, value: '' });
      return;
    }

    if (tool === 'select') {
      setIsCropping(true);
      setCropArea({ x, y, width: 0, height: 0 });
      return;
    }

    setIsDrawing(true);
    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      type: tool as Exclude<ToolType, 'select'>,
      x,
      y,
      color,
      size: TOOL_SIZES[toolSize]
    };
    setCurrentAnnotation(newAnnotation);
  };

  // 鼠标移动
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const { x, y } = getCanvasCoordinates(e);

    if (isCropping && cropArea) {
      setCropArea({
        ...cropArea,
        width: x - cropArea.x,
        height: y - cropArea.y
      });
      return;
    }

    if (!isDrawing || !currentAnnotation) return;

    const updated = { ...currentAnnotation };
    if (tool === 'rect' || tool === 'circle' || tool === 'mosaic') {
      updated.width = x - currentAnnotation.x;
      updated.height = y - currentAnnotation.y;
    } else if (tool === 'arrow') {
      updated.endX = x;
      updated.endY = y;
    }
    setCurrentAnnotation(updated);

    // 实时预览
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx || !imageRef.current) return;

    redrawCanvas();
    drawAnnotation(ctx, updated);
  };

  // 鼠标松开
  const handleMouseUp = () => {
    if (isCropping) {
      setIsCropping(false);
      return;
    }

    if (!isDrawing || !currentAnnotation) return;

    // 过滤掉太小的标注
    if ((currentAnnotation.width && Math.abs(currentAnnotation.width) > 5) ||
        (currentAnnotation.endX !== undefined) ||
        currentAnnotation.type === 'text') {
      const newAnnotations = [...annotations, currentAnnotation];
      setAnnotations(newAnnotations);
      saveHistory();
    }

    setIsDrawing(false);
    setCurrentAnnotation(null);
    redrawCanvas();
  };

  // 完成编辑
  const handleComplete = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let finalCanvas = canvas;

    // 如果有裁剪区域，裁剪图片
    if (cropArea && Math.abs(cropArea.width) > 10 && Math.abs(cropArea.height) > 10) {
      const croppedCanvas = document.createElement('canvas');
      const croppedCtx = croppedCanvas.getContext('2d');
      if (!croppedCtx) return;

      const x = Math.min(cropArea.x, cropArea.x + cropArea.width);
      const y = Math.min(cropArea.y, cropArea.y + cropArea.height);
      const width = Math.abs(cropArea.width);
      const height = Math.abs(cropArea.height);

      croppedCanvas.width = width;
      croppedCanvas.height = height;
      croppedCtx.drawImage(canvas, x, y, width, height, 0, 0, width, height);
      finalCanvas = croppedCanvas;
    }

    const dataUrl = finalCanvas.toDataURL('image/png');
    onComplete(dataUrl);
  };

  // 提交文字
  const submitText = () => {
    if (!textInput?.value.trim()) {
      setTextInput(null);
      return;
    }

    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      type: 'text',
      x: textInput.x,
      y: textInput.y,
      color,
      text: textInput.value,
      size: TOOL_SIZES[toolSize]
    };

    setAnnotations([...annotations, newAnnotation]);
    saveHistory();
    setTextInput(null);
    redrawCanvas();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      {/* 顶部工具栏 */}
      <div className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {/* 工具选择 */}
          <ToolButton
            icon={<MousePointer2 size={18} />}
            label="选择"
            active={tool === 'select'}
            onClick={() => setTool('select')}
          />
          <ToolButton
            icon={<Square size={18} />}
            label="矩形"
            active={tool === 'rect'}
            onClick={() => setTool('rect')}
          />
          <ToolButton
            icon={<Circle size={18} />}
            label="圆形"
            active={tool === 'circle'}
            onClick={() => setTool('circle')}
          />
          <ToolButton
            icon={<ArrowRight size={18} />}
            label="箭头"
            active={tool === 'arrow'}
            onClick={() => setTool('arrow')}
          />
          <ToolButton
            icon={<Type size={18} />}
            label="文字"
            active={tool === 'text'}
            onClick={() => setTool('text')}
          />
          <ToolButton
            icon={<Grid3X3 size={18} />}
            label="马赛克"
            active={tool === 'mosaic'}
            onClick={() => setTool('mosaic')}
          />
          
          <div className="w-px h-8 bg-gray-700 mx-2" />
          
          {/* 颜色选择 */}
          <div className="flex items-center gap-1">
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full border-2 ${color === c ? 'border-white' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div className="w-px h-8 bg-gray-700 mx-2" />

          {/* 粗细选择 */}
          <select
            value={toolSize}
            onChange={(e) => setToolSize(e.target.value as keyof typeof TOOL_SIZES)}
            className="bg-gray-800 text-white text-sm rounded px-2 py-1 border border-gray-700"
          >
            <option value="thin">细</option>
            <option value="medium">中</option>
            <option value="thick">粗</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* 撤销/重做 */}
          <button
            onClick={undo}
            disabled={historyIndex < 0}
            className="p-2 rounded hover:bg-gray-800 disabled:opacity-30 text-white"
          >
            <Undo size={18} />
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="p-2 rounded hover:bg-gray-800 disabled:opacity-30 text-white"
          >
            <Redo size={18} />
          </button>
        </div>
      </div>

      {/* Canvas 区域 */}
      <div ref={containerRef} className="flex-1 flex items-center justify-center overflow-hidden p-4">
        <div className="relative">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="max-w-full max-h-[calc(100vh-180px)] cursor-crosshair shadow-2xl"
            style={{ transform: `scale(${scaleRef.current})`, transformOrigin: 'center' }}
          />
          
          {/* 裁剪框预览 */}
          {cropArea && (
            <div
              className="absolute border-2 border-blue-500 bg-blue-500/20 pointer-events-none"
              style={{
                left: Math.min(cropArea.x, cropArea.x + cropArea.width) * scaleRef.current,
                top: Math.min(cropArea.y, cropArea.y + cropArea.height) * scaleRef.current,
                width: Math.abs(cropArea.width) * scaleRef.current,
                height: Math.abs(cropArea.height) * scaleRef.current,
              }}
            />
          )}
        </div>
      </div>

      {/* 文字输入框 */}
      {textInput && (
        <div
          className="fixed z-50"
          style={{
            left: textInput.x * scaleRef.current,
            top: textInput.y * scaleRef.current,
          }}
        >
          <input
            autoFocus
            value={textInput.value}
            onChange={(e) => setTextInput({ ...textInput, value: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && submitText()}
            onBlur={submitText}
            placeholder="输入文字..."
            className="px-2 py-1 text-lg bg-transparent border-2 border-blue-500 text-white outline-none min-w-[100px]"
            style={{ color }}
          />
        </div>
      )}

      {/* 底部操作栏 */}
      <div className="h-16 bg-gray-900 border-t border-gray-800 flex items-center justify-between px-4">
        <div className="text-gray-400 text-sm">
          {tool === 'select' ? '拖拽选择裁剪区域' : 
           tool === 'text' ? '点击添加文字' : 
           '拖拽绘制标注'}
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onCancel} className="gap-2">
            <X size={16} />
            取消
          </Button>
          <Button onClick={handleComplete} className="gap-2">
            <Check size={16} />
            完成
          </Button>
        </div>
      </div>
    </div>
  );
}

// 工具按钮组件
function ToolButton({ 
  icon, 
  label, 
  active, 
  onClick 
}: { 
  icon: React.ReactNode; 
  label: string; 
  active: boolean; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 px-3 py-2 rounded transition-colors ${
        active ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
      }`}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </button>
  );
}
