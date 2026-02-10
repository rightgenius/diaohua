import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { 
  Square, 
  Circle, 
  ArrowRight, 
  Pencil, 
  Type, 
  Undo2, 
  Redo2,
  X,
  Check,
  MousePointer2
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Annotation, AnnotationType } from '@/types';

interface AnnotationEditorProps {
  screenshotId: string;
  imageUrl?: string;
  onClose: () => void;
  onCancel: () => void;
}

type Tool = 'select' | 'rectangle' | 'circle' | 'arrow' | 'draw' | 'text';

export function AnnotationEditor({ 
  screenshotId, 
  imageUrl,
  onClose, 
  onCancel 
}: AnnotationEditorProps) {
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [description, setDescription] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mock image for demo
  const demoImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmNWVmIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPueCueWHu+aIkOWKn+WQjue8lui+keS4rTwvdGV4dD48L3N2Zz4=';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Load and draw image
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
    img.src = imageUrl || demoImage;
  }, [imageUrl]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === 'text') {
      // Handle text annotation
      const text = prompt('输入标注文字:');
      if (text) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const newAnnotation: Annotation = {
            id: Date.now().toString(),
            type: 'text',
            text,
            coordinates: {
              x: e.clientX - rect.left,
              y: e.clientY - rect.top,
            },
          };
          setAnnotations([...annotations, newAnnotation]);
          drawAnnotations();
        }
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === 'select') return;
    setIsDrawing(true);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const drawAnnotations = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Redraw image
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      
      // Draw annotations
      annotations.forEach((ann) => {
        ctx.strokeStyle = ann.color || '#ef4444';
        ctx.lineWidth = ann.strokeWidth || 2;
        
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
          case 'text':
            if (ann.text) {
              ctx.font = '14px sans-serif';
              ctx.fillStyle = '#ef4444';
              ctx.fillText(ann.text, ann.coordinates.x, ann.coordinates.y);
            }
            break;
        }
      });
    };
    img.src = imageUrl || demoImage;
  };

  const handleSave = () => {
    // Save annotation data
    onClose();
  };

  const tools: { id: Tool; icon: React.ReactNode; label: string }[] = [
    { id: 'select', icon: <MousePointer2 size={18} />, label: '选择' },
    { id: 'rectangle', icon: <Square size={18} />, label: '矩形' },
    { id: 'circle', icon: <Circle size={18} />, label: '圆形' },
    { id: 'arrow', icon: <ArrowRight size={18} />, label: '箭头' },
    { id: 'draw', icon: <Pencil size={18} />, label: '画笔' },
    { id: 'text', icon: <Type size={18} />, label: '文字' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-8">
      <div className="bg-background rounded-lg shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col">
        {/* Toolbar */}
        <div className="h-14 border-b flex items-center justify-between px-4">
          <div className="flex items-center gap-1">
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={cn(
                  'p-2 rounded-md transition-colors',
                  activeTool === tool.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                )}
                title={tool.label}
              >
                {tool.icon}
              </button>
            ))}
            
            <div className="w-px h-6 bg-border mx-2" />
            
            <button className="p-2 hover:bg-muted rounded-md" title="撤销">
              <Undo2 size={18} />
            </button>
            <button className="p-2 hover:bg-muted rounded-md" title="重做">
              <Redo2 size={18} />
            </button>
          </div>

          <div className="flex items-center gap-2">
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
        <div className="flex-1 overflow-auto bg-muted/30 p-4">
          <div 
            ref={containerRef}
            className="relative inline-block"
          >
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              className="cursor-crosshair shadow-lg bg-white"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </div>
        </div>

        {/* Description */}
        <div className="h-32 border-t p-4">
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
