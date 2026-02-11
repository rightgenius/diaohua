import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { useKeyboard } from '@/hooks/useKeyboard';
import { 
  Square, 
  Circle, 
  ArrowRight, 
  Pencil, 
  Type, 
  Undo2, 
  Redo2,
  Check,
  MousePointer2,
  Trash2,
  Palette,
  Keyboard
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Annotation, AnnotationType } from '@/types';

interface AnnotationEditorProps {
  imageUrl?: string;
  initialAnnotations?: Annotation[];
  initialDescription?: string;
  onClose: (annotations: Annotation[], description: string) => void;
  onCancel: () => void;
}

type Tool = 'select' | 'rectangle' | 'circle' | 'arrow' | 'draw' | 'text';

const COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#3b82f6', // blue
  '#a855f7', // purple
  '#ec4899', // pink
  '#1f2937', // black
];

export function AnnotationEditor({ 
  imageUrl,
  initialAnnotations = [],
  initialDescription = '',
  onClose, 
  onCancel 
}: AnnotationEditorProps) {
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations);
  const [description, setDescription] = useState(initialDescription);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#ef4444');
  const [textInput, setTextInput] = useState({ x: 0, y: 0, visible: false, value: '' });
  const [history, setHistory] = useState<Annotation[][]>([initialAnnotations]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const startPosRef = useRef({ x: 0, y: 0 });
  const currentAnnotationRef = useRef<Annotation | null>(null);
  const drawPointsRef = useRef<{ x: number; y: number }[]>([]);

  // 加载图片
  useEffect(() => {
    if (!imageUrl) return;
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      canvas.width = img.width;
      canvas.height = img.height;
      redrawCanvas();
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // 重绘画布
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const img = imageRef.current;
    if (!canvas || !ctx || !img) return;

    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制背景图
    ctx.drawImage(img, 0, 0);

    // 绘制所有标注
    annotations.forEach((ann) => {
      drawAnnotation(ctx, ann);
    });

    // 绘制当前正在绘制的标注
    if (currentAnnotationRef.current) {
      drawAnnotation(ctx, currentAnnotationRef.current);
    }
  }, [annotations]);

  // 绘制单个标注
  const drawAnnotation = (ctx: CanvasRenderingContext2D, ann: Annotation) => {
    ctx.strokeStyle = ann.color || '#ef4444';
    ctx.fillStyle = ann.color || '#ef4444';
    ctx.lineWidth = ann.strokeWidth || 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (ann.type) {
      case 'rectangle':
        if (ann.coordinates.width && ann.coordinates.height) {
          ctx.strokeRect(
            ann.coordinates.x,
            ann.coordinates.y,
            ann.coordinates.width,
            ann.coordinates.height
          );
        }
        break;
      
      case 'circle': {
        if (ann.coordinates.width && ann.coordinates.height) {
          const centerX = ann.coordinates.x + ann.coordinates.width / 2;
          const centerY = ann.coordinates.y + ann.coordinates.height / 2;
          const radiusX = Math.abs(ann.coordinates.width) / 2;
          const radiusY = Math.abs(ann.coordinates.height) / 2;
          
          ctx.beginPath();
          ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
          ctx.stroke();
        }
        break;
      }
      
      case 'arrow': {
        if (ann.coordinates.width && ann.coordinates.height) {
          const startX = ann.coordinates.x;
          const startY = ann.coordinates.y;
          const endX = ann.coordinates.x + ann.coordinates.width;
          const endY = ann.coordinates.y + ann.coordinates.height;
          
          drawArrow(ctx, startX, startY, endX, endY);
        }
        break;
      }
      
      case 'draw': {
        if (ann.coordinates.points && ann.coordinates.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(ann.coordinates.points[0].x, ann.coordinates.points[0].y);
          for (let i = 1; i < ann.coordinates.points.length; i++) {
            ctx.lineTo(ann.coordinates.points[i].x, ann.coordinates.points[i].y);
          }
          ctx.stroke();
        }
        break;
      }
      
      case 'text': {
        if (ann.text) {
          ctx.font = `${ann.strokeWidth || 14}px sans-serif`;
          ctx.fillStyle = ann.color || '#ef4444';
          ctx.fillText(ann.text, ann.coordinates.x, ann.coordinates.y);
          
          // 绘制文字背景
          const metrics = ctx.measureText(ann.text);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.fillRect(
            ann.coordinates.x - 2,
            ann.coordinates.y - (ann.strokeWidth || 14),
            metrics.width + 4,
            (ann.strokeWidth || 14) + 4
          );
          
          // 重绘文字
          ctx.fillStyle = ann.color || '#ef4444';
          ctx.fillText(ann.text, ann.coordinates.x, ann.coordinates.y);
        }
        break;
      }
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
    ctx.lineTo(
      toX - headLength * Math.cos(angle - Math.PI / 6),
      toY - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      toX - headLength * Math.cos(angle + Math.PI / 6),
      toY - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
  };

  // 获取鼠标在 canvas 上的坐标
  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  // 鼠标按下
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === 'select' || activeTool === 'text') return;
    
    const pos = getMousePos(e);
    startPosRef.current = pos;
    setIsDrawing(true);
    
    const newAnnotation: Annotation = {
      id: `temp_${Date.now()}`,
      type: activeTool as AnnotationType,
      color: currentColor,
      strokeWidth: 2,
      coordinates: { x: pos.x, y: pos.y, width: 0, height: 0, points: [] },
    };
    
    if (activeTool === 'draw') {
      newAnnotation.coordinates.points = [{ x: pos.x, y: pos.y }];
      drawPointsRef.current = [{ x: pos.x, y: pos.y }];
    }
    
    currentAnnotationRef.current = newAnnotation;
  };

  // 鼠标移动
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentAnnotationRef.current) return;
    
    const pos = getMousePos(e);
    const ann = currentAnnotationRef.current;
    
    switch (ann.type) {
      case 'rectangle':
      case 'circle':
      case 'arrow':
        ann.coordinates.width = pos.x - startPosRef.current.x;
        ann.coordinates.height = pos.y - startPosRef.current.y;
        break;
      
      case 'draw':
        ann.coordinates.points!.push({ x: pos.x, y: pos.y });
        drawPointsRef.current.push({ x: pos.x, y: pos.y });
        break;
    }
    
    redrawCanvas();
  };

  // 鼠标松开
  const handleMouseUp = () => {
    if (!isDrawing || !currentAnnotationRef.current) return;
    
    const ann = currentAnnotationRef.current;
    
    // 检查是否有有效绘制
    let isValid = false;
    switch (ann.type) {
      case 'rectangle':
      case 'circle':
      case 'arrow':
        isValid = Math.abs(ann.coordinates.width || 0) > 5 && Math.abs(ann.coordinates.height || 0) > 5;
        break;
      case 'draw':
        isValid = (ann.coordinates.points?.length || 0) > 2;
        break;
    }
    
    if (isValid) {
      const finalAnnotation = { ...ann, id: Date.now().toString() };
      const newAnnotations = [...annotations, finalAnnotation];
      setAnnotations(newAnnotations);
      addToHistory(newAnnotations);
    }
    
    currentAnnotationRef.current = null;
    setIsDrawing(false);
    drawPointsRef.current = [];
    redrawCanvas();
  };

  // 点击添加文字
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool !== 'text') return;
    
    const pos = getMousePos(e);
    setTextInput({ x: pos.x, y: pos.y, visible: true, value: '' });
  };

  // 确认添加文字
  const handleTextSubmit = () => {
    if (!textInput.value.trim()) {
      setTextInput({ x: 0, y: 0, visible: false, value: '' });
      return;
    }
    
    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      type: 'text',
      color: currentColor,
      strokeWidth: 16,
      coordinates: { x: textInput.x, y: textInput.y },
      text: textInput.value,
    };
    
    const newAnnotations = [...annotations, newAnnotation];
    setAnnotations(newAnnotations);
    addToHistory(newAnnotations);
    setTextInput({ x: 0, y: 0, visible: false, value: '' });
    redrawCanvas();
  };

  // 历史记录管理
  const addToHistory = (newAnnotations: Annotation[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newAnnotations);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setAnnotations(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setAnnotations(history[newIndex]);
    }
  };

  const handleDeleteLast = () => {
    if (annotations.length > 0) {
      const newAnnotations = annotations.slice(0, -1);
      setAnnotations(newAnnotations);
      addToHistory(newAnnotations);
    }
  };

  const handleSave = () => {
    onClose(annotations, description);
  };

  // 键盘快捷键 - 必须在 handleSave/handleUndo/handleDeleteLast 定义之后
  useKeyboard({
    onSave: handleSave,
    onUndo: handleUndo,
    onDelete: handleDeleteLast,
    onEscape: onCancel,
    isEnabled: !textInput.visible, // 文字输入时禁用
  });

  // 重新绘制
  useEffect(() => {
    redrawCanvas();
  }, [annotations, redrawCanvas]);

  const tools: { id: Tool; icon: React.ReactNode; label: string }[] = [
    { id: 'select', icon: <MousePointer2 size={18} />, label: '选择' },
    { id: 'rectangle', icon: <Square size={18} />, label: '矩形' },
    { id: 'circle', icon: <Circle size={18} />, label: '圆形' },
    { id: 'arrow', icon: <ArrowRight size={18} />, label: '箭头' },
    { id: 'draw', icon: <Pencil size={18} />, label: '画笔' },
    { id: 'text', icon: <Type size={18} />, label: '文字' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-2xl w-full max-w-6xl h-[95vh] flex flex-col">
        {/* Toolbar */}
        <div className="h-16 border-b flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            {/* Tools */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id)}
                  className={cn(
                    'p-2 rounded-md transition-colors',
                    activeTool === tool.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted-foreground/10'
                  )}
                  title={tool.label}
                >
                  {tool.icon}
                </button>
              ))}
            </div>

            <div className="w-px h-8 bg-border mx-2" />

            {/* Color Picker */}
            <div className="flex items-center gap-1">
              <Palette size={16} className="text-muted-foreground mr-1" />
              {COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setCurrentColor(color)}
                  className={cn(
                    'w-6 h-6 rounded-full border-2 transition-all',
                    currentColor === color ? 'border-foreground scale-110' : 'border-transparent'
                  )}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>

            <div className="w-px h-8 bg-border mx-2" />

            {/* Actions */}
            <button 
              onClick={handleUndo} 
              disabled={historyIndex <= 0}
              className="p-2 hover:bg-muted rounded-md disabled:opacity-30"
              title="撤销 (Ctrl+Z)"
            >
              <Undo2 size={18} />
            </button>
            <button 
              onClick={handleRedo} 
              disabled={historyIndex >= history.length - 1}
              className="p-2 hover:bg-muted rounded-md disabled:opacity-30"
              title="重做 (Ctrl+Y)"
            >
              <Redo2 size={18} />
            </button>
            <button 
              onClick={handleDeleteLast}
              disabled={annotations.length === 0}
              className="p-2 hover:bg-muted rounded-md text-red-500 disabled:opacity-30"
              title="删除最后一个 (Delete)"
            >
              <Trash2 size={18} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {annotations.length} 个标注
            </span>
            
            {/* Keyboard Shortcuts Hint */}
            <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
              <Keyboard size={12} />
              <span>Ctrl+S 保存</span>
              <span className="mx-1">|</span>
              <span>Ctrl+Z 撤销</span>
              <span className="mx-1">|</span>
              <span>ESC 关闭</span>
            </div>
            
            <Button variant="ghost" onClick={onCancel}>
              取消
            </Button>
            <Button onClick={handleSave} className="gap-2">
              <Check size={16} />
              完成
            </Button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto bg-muted/50 p-4 relative">
          <div 
            ref={containerRef}
            className="relative inline-block shadow-2xl"
          >
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onClick={handleCanvasClick}
              className={cn(
                'block bg-white',
                activeTool === 'draw' && 'cursor-crosshair',
                activeTool === 'text' && 'cursor-text',
                ['rectangle', 'circle', 'arrow'].includes(activeTool) && 'cursor-crosshair'
              )}
              style={{ maxWidth: '100%', height: 'auto' }}
            />
            
            {/* Text Input */}
            {textInput.visible && (
              <div
                className="absolute bg-white shadow-lg rounded-lg p-2 border"
                style={{
                  left: `${(textInput.x / (canvasRef.current?.width || 1)) * 100}%`,
                  top: `${(textInput.y / (canvasRef.current?.height || 1)) * 100}%`,
                  transform: 'translate(0, -100%)',
                }}
              >
                <input
                  type="text"
                  autoFocus
                  value={textInput.value}
                  onChange={(e) => setTextInput({ ...textInput, value: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTextSubmit();
                    if (e.key === 'Escape') setTextInput({ x: 0, y: 0, visible: false, value: '' });
                  }}
                  placeholder="输入文字..."
                  className="px-2 py-1 border rounded text-sm min-w-[150px]"
                />
                <div className="flex justify-end gap-1 mt-2">
                  <button
                    onClick={() => setTextInput({ x: 0, y: 0, visible: false, value: '' })}
                    className="px-2 py-1 text-xs text-muted-foreground hover:bg-muted rounded"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleTextSubmit}
                    className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded"
                  >
                    确认
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="h-32 border-t p-4 bg-card">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="描述这张截图的问题或需求..."
            className="h-full resize-none"
          />
        </div>
      </div>
    </div>
  );
}
