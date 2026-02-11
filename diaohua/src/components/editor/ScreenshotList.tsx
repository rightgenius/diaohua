import { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Edit2, ImageIcon } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Screenshot } from '@/types';
import { EmptyScreenshot } from '@/components/ui/EmptyState';

interface ScreenshotListProps {
  screenshots: Screenshot[];
  onReorder: (newOrder: string[]) => void;
  onEdit: (screenshot: Screenshot) => void;
  onDelete: (screenshotId: string) => void;
  className?: string;
}

/**
 * 截图列表组件
 * 
 * 支持拖拽排序、编辑和删除
 */
export function ScreenshotList({
  screenshots,
  onReorder,
  onEdit,
  onDelete,
  className,
}: ScreenshotListProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  // 配置传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = screenshots.findIndex((s) => s.id === active.id);
      const newIndex = screenshots.findIndex((s) => s.id === over.id);

      const newScreenshots = arrayMove(screenshots, oldIndex, newIndex);
      onReorder(newScreenshots.map((s) => s.id));
    }

    setActiveId(null);
  };

  if (screenshots.length === 0) {
    return <EmptyScreenshot />;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(e) => setActiveId(e.active.id as string)}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={screenshots.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className={cn('space-y-3', className)}>
          {screenshots.map((screenshot, index) => (
            <SortableScreenshotItem
              key={screenshot.id}
              screenshot={screenshot}
              index={index}
              onEdit={onEdit}
              onDelete={onDelete}
              isActive={activeId === screenshot.id}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

interface SortableScreenshotItemProps {
  screenshot: Screenshot;
  index: number;
  onEdit: (screenshot: Screenshot) => void;
  onDelete: (screenshotId: string) => void;
  isActive?: boolean;
}

function SortableScreenshotItem({
  screenshot,
  index,
  onEdit,
  onDelete,
  isActive,
}: SortableScreenshotItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: screenshot.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative bg-muted rounded-lg border overflow-hidden',
        isDragging && 'opacity-50 shadow-lg ring-2 ring-primary',
        isActive && 'ring-2 ring-primary',
        'hover:border-primary/50 transition-colors'
      )}
    >
      <div className="flex items-stretch">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="flex-shrink-0 w-8 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-muted-foreground/10 transition-colors"
          title="拖拽排序"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Thumbnail */}
        <div
          className="flex-shrink-0 w-24 aspect-video bg-card cursor-pointer overflow-hidden"
          onClick={() => onEdit(screenshot)}
        >
          {screenshot.thumbnailUrl || screenshot.imageUrl ? (
            <img
              src={screenshot.thumbnailUrl || screenshot.imageUrl}
              alt={`截图 ${index + 1}`}
              className="w-full h-full object-cover hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-muted-foreground/50" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 p-3 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded">
              {index + 1}
            </span>
            <p className="text-sm font-medium truncate">
              {screenshot.title || `截图 ${index + 1}`}
            </p>
          </div>
          
          <p className="text-xs text-muted-foreground truncate">
            {screenshot.pageUrl || '未知页面'}
          </p>
          
          {screenshot.annotations.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {screenshot.annotations.length} 个标注
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex flex-col border-l">
          <button
            onClick={() => onEdit(screenshot)}
            className="flex-1 px-3 hover:bg-muted-foreground/10 transition-colors flex items-center justify-center"
            title="编辑标注"
          >
            <Edit2 className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={() => {
              if (confirm('确定要删除这张截图吗？')) {
                onDelete(screenshot.id);
              }
            }}
            className="flex-1 px-3 hover:bg-red-50 hover:text-red-500 transition-colors flex items-center justify-center border-t"
            title="删除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 简单的截图列表（无拖拽）
 * 
 * 用于只读场景
 */
export function SimpleScreenshotList({
  screenshots,
  onEdit,
  onDelete,
  className,
}: Omit<ScreenshotListProps, 'onReorder'>) {
  if (screenshots.length === 0) {
    return <EmptyScreenshot />;
  }

  return (
    <div className={cn('space-y-3', className)}>
      {screenshots.map((screenshot, index) => (
        <div
          key={screenshot.id}
          className="group relative bg-muted rounded-lg border overflow-hidden hover:border-primary/50 transition-colors"
        >
          <div className="flex items-stretch">
            {/* Number */}
            <div className="flex-shrink-0 w-8 flex items-center justify-center bg-muted-foreground/5">
              <span className="text-xs font-medium text-muted-foreground">{index + 1}</span>
            </div>

            {/* Thumbnail */}
            <div
              className="flex-shrink-0 w-24 aspect-video bg-card cursor-pointer overflow-hidden"
              onClick={() => onEdit?.(screenshot)}
            >
              {screenshot.thumbnailUrl || screenshot.imageUrl ? (
                <img
                  src={screenshot.thumbnailUrl || screenshot.imageUrl}
                  alt={`截图 ${index + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-muted-foreground/50" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 p-3 flex flex-col justify-center">
              <p className="text-sm font-medium truncate">
                {screenshot.title || `截图 ${index + 1}`}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {screenshot.pageUrl || '未知页面'}
              </p>
              {screenshot.annotations.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {screenshot.annotations.length} 个标注
                </p>
              )}
            </div>

            {/* Actions */}
            {onDelete && (
              <button
                onClick={() => {
                  if (confirm('确定要删除这张截图吗？')) {
                    onDelete(screenshot.id);
                  }
                }}
                className="flex-shrink-0 px-3 hover:bg-red-50 hover:text-red-500 transition-colors"
                title="删除"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ScreenshotList;
