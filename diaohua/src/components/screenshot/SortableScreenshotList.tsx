import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import type { Screenshot } from '@/types';

interface SortableScreenshotItemProps {
  screenshot: Screenshot;
  index: number;
  onEdit: (screenshot: Screenshot) => void;
  onDelete: (screenshotId: string) => void;
}

function SortableScreenshotItem({
  screenshot,
  index,
  onEdit,
  onDelete,
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
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative bg-muted rounded-lg border overflow-hidden cursor-pointer hover:border-primary transition-colors"
      onClick={() => onEdit(screenshot)}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 z-10 p-1 bg-black/70 text-white rounded cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/90"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={12} />
      </div>

      {/* Image */}
      <div className="aspect-video relative">
        <img
          src={screenshot.thumbnailUrl || screenshot.imageUrl}
          alt={`截图 ${index + 1}`}
          className="w-full h-full object-cover"
        />

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="text-white text-sm">编辑标注</span>
        </div>

        {/* Number Badge */}
        <div className="absolute top-1 left-8 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
          {index + 1}
        </div>

        {/* Delete Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(screenshot.id);
          }}
          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
        >
          <Trash2 size={12} />
        </button>

        {/* Annotation Count */}
        {screenshot.annotations.length > 0 && (
          <div className="absolute bottom-1 right-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
            {screenshot.annotations.length} 标注
          </div>
        )}
      </div>

      {/* URL Info */}
      <div className="px-2 py-1.5 bg-card border-t">
        <p
          className="text-xs text-muted-foreground truncate"
          title={screenshot.pageUrl}
        >
          {screenshot.pageUrl || '未知页面'}
        </p>
      </div>
    </div>
  );
}

interface SortableScreenshotListProps {
  screenshots: Screenshot[];
  onReorder: (newOrder: Screenshot[]) => void;
  onEdit: (screenshot: Screenshot) => void;
  onDelete: (screenshotId: string) => void;
  emptyState?: React.ReactNode;
}

/**
 * 可拖拽排序的截图列表组件
 * 
 * 使用 @dnd-kit 实现拖拽排序功能
 */
export function SortableScreenshotList({
  screenshots,
  onReorder,
  onEdit,
  onDelete,
  emptyState,
}: SortableScreenshotListProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = screenshots.findIndex((s) => s.id === active.id);
      const newIndex = screenshots.findIndex((s) => s.id === over.id);

      const newScreenshots = arrayMove(screenshots, oldIndex, newIndex).map(
        (s, index) => ({ ...s, order: index })
      );

      onReorder(newScreenshots);
    }
  };

  if (screenshots.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={screenshots.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {screenshots.map((screenshot, index) => (
            <SortableScreenshotItem
              key={screenshot.id}
              screenshot={screenshot}
              index={index}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeId ? (
          (() => {
            const screenshot = screenshots.find((s) => s.id === activeId);
            if (!screenshot) return null;
            return (
              <div className="bg-muted rounded-lg border overflow-hidden shadow-lg opacity-90">
                <div className="aspect-video relative">
                  <img
                    src={screenshot.thumbnailUrl || screenshot.imageUrl}
                    alt="拖拽中"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            );
          })()
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default SortableScreenshotList;
