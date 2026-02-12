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
import { GripVertical, Trash2, Edit2, ImageIcon, ZoomIn } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Screenshot } from '@/types';
import { EmptyScreenshot } from '@/components/ui/EmptyState';
import { ImageLightbox } from '@/components/ui/ImageLightbox';

// ==================== 类型定义 ====================

export interface ScreenshotListProps {
  screenshots: Screenshot[];
  onReorder?: (newOrder: Screenshot[]) => void;
  onEdit?: (screenshot: Screenshot) => void;
  onDelete?: (screenshotId: string) => void;
  onView?: (screenshot: Screenshot) => void;
  sortable?: boolean;
  showUrl?: boolean;
  showAnnotationCount?: boolean;
  emptyState?: React.ReactNode;
  className?: string;
}

// ==================== 列表项组件 ====================

interface ScreenshotItemProps {
  screenshot: Screenshot;
  index: number;
  sortable?: boolean;
  showUrl?: boolean;
  showAnnotationCount?: boolean;
  onEdit?: (screenshot: Screenshot) => void;
  onDelete?: (screenshotId: string) => void;
  onView?: (screenshot: Screenshot) => void;
}

function ScreenshotItem({
  screenshot,
  index,
  sortable = true,
  showUrl = true,
  showAnnotationCount = true,
  onEdit,
  onDelete,
  onView,
}: ScreenshotItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: screenshot.id, disabled: !sortable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative bg-muted rounded-lg border overflow-hidden',
        isDragging && 'opacity-50',
        onEdit && 'cursor-pointer hover:border-primary transition-colors'
      )}
      onClick={() => onEdit?.(screenshot)}
    >
      {/* Drag Handle - 仅在 sortable 为 true 时显示 */}
      {sortable && (
        <div
          {...attributes}
          {...listeners}
          className="absolute top-1 left-1 z-10 p-1 bg-black/70 text-white rounded cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/90"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={12} />
        </div>
      )}

      {/* Image */}
      <div className="aspect-video relative">
        <img
          src={screenshot.thumbnailUrl || screenshot.imageUrl}
          alt={`截图 ${index + 1}`}
          className="w-full h-full object-cover"
        />

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          {onEdit && <span className="text-white text-sm">编辑标注</span>}
          {onView && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView(screenshot);
              }}
              className="p-2 bg-white/20 rounded-full hover:bg-white/40 transition-colors"
            >
              <ZoomIn size={16} className="text-white" />
            </button>
          )}
        </div>

        {/* Number Badge */}
        <div
          className={cn(
            'absolute top-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded',
            sortable ? 'left-8' : 'left-1'
          )}
        >
          {index + 1}
        </div>

        {/* Delete Button */}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(screenshot.id);
            }}
            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
          >
            <Trash2 size={12} />
          </button>
        )}

        {/* Annotation Count */}
        {showAnnotationCount && screenshot.annotations.length > 0 && (
          <div className="absolute bottom-1 right-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
            {screenshot.annotations.length} 标注
          </div>
        )}
      </div>

      {/* URL Info */}
      {showUrl && (
        <div className="px-2 py-1.5 bg-card border-t">
          <p
            className="text-xs text-muted-foreground truncate"
            title={screenshot.pageUrl}
          >
            {screenshot.pageUrl || '未知页面'}
          </p>
        </div>
      )}
    </div>
  );
}

// ==================== 紧凑列表项组件 ====================

interface CompactScreenshotItemProps {
  screenshot: Screenshot;
  index: number;
  sortable?: boolean;
  showAnnotationCount?: boolean;
  onEdit?: (screenshot: Screenshot) => void;
  onDelete?: (screenshotId: string) => void;
  onView?: (screenshot: Screenshot) => void;
}

function CompactScreenshotItem({
  screenshot,
  index,
  sortable = true,
  showAnnotationCount = true,
  onEdit,
  onDelete,
  onView,
}: CompactScreenshotItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: screenshot.id, disabled: !sortable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative bg-muted rounded-lg border overflow-hidden',
        isDragging && 'opacity-50 shadow-lg ring-2 ring-primary'
      )}
    >
      <div className="flex items-stretch">
        {/* Drag Handle */}
        {sortable ? (
          <button
            {...attributes}
            {...listeners}
            className="flex-shrink-0 w-8 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-muted-foreground/10 transition-colors"
            title="拖拽排序"
          >
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </button>
        ) : (
          <div className="flex-shrink-0 w-8 flex items-center justify-center bg-muted-foreground/5">
            <span className="text-xs font-medium text-muted-foreground">{index + 1}</span>
          </div>
        )}

        {/* Thumbnail */}
        <div
          className="flex-shrink-0 w-24 aspect-video bg-card relative overflow-hidden cursor-pointer"
          onClick={() => onView?.(screenshot) || onEdit?.(screenshot)}
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
          {/* Zoom Overlay */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView?.(screenshot);
            }}
            className="absolute inset-0 bg-black/0 hover:bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-all"
            title="查看大图"
          >
            <ZoomIn className="w-6 h-6 text-white" />
          </button>
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

          {showAnnotationCount && screenshot.annotations.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {screenshot.annotations.length} 个标注
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex flex-col border-l">
          {onEdit && (
            <button
              onClick={() => onEdit(screenshot)}
              className="flex-1 px-3 hover:bg-muted-foreground/10 transition-colors flex items-center justify-center"
              title="编辑标注"
            >
              <Edit2 className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
          {onDelete && (
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
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== 主组件 ====================

/**
 * 统一的截图列表组件
 *
 * 支持两种模式：
 * 1. 卡片模式（默认）- 带图片预览的卡片式布局
 * 2. 紧凑模式（compact）- 横向布局，适合空间有限的场景
 *
 * 两种模式都支持：
 * - 拖拽排序（可选）
 * - 编辑/删除/查看操作
 * - 空状态显示
 */
export function ScreenshotList({
  screenshots,
  onReorder,
  onEdit,
  onDelete,
  onView,
  sortable = true,
  showUrl = true,
  showAnnotationCount = true,
  emptyState,
  className,
}: ScreenshotListProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id && onReorder) {
      const oldIndex = screenshots.findIndex((s) => s.id === active.id);
      const newIndex = screenshots.findIndex((s) => s.id === over.id);

      const newScreenshots = arrayMove(screenshots, oldIndex, newIndex).map(
        (s, index) => ({ ...s, order: index })
      );

      onReorder(newScreenshots);
    }
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const lightboxImages = screenshots.map((s, i) => ({
    src: s.imageUrl,
    alt: s.title || `截图 ${i + 1}`,
  }));

  if (screenshots.length === 0) {
    return emptyState ? <>{emptyState}</> : <EmptyScreenshot />;
  }

  // 非排序模式：简单渲染列表
  if (!sortable || !onReorder) {
    return (
      <>
        <div className={cn('space-y-3', className)}>
          {screenshots.map((screenshot, index) => (
            <ScreenshotItem
              key={screenshot.id}
              screenshot={screenshot}
              index={index}
              sortable={false}
              showUrl={showUrl}
              showAnnotationCount={showAnnotationCount}
              onEdit={onEdit}
              onDelete={onDelete}
              onView={onView || ((s) => openLightbox(screenshots.findIndex((sc) => sc.id === s.id)))}
            />
          ))}
        </div>

        <ImageLightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      </>
    );
  }

  // 排序模式：使用 DndContext
  return (
    <>
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
          <div className={cn('space-y-3', className)}>
            {screenshots.map((screenshot, index) => (
              <ScreenshotItem
                key={screenshot.id}
                screenshot={screenshot}
                index={index}
                sortable={true}
                showUrl={showUrl}
                showAnnotationCount={showAnnotationCount}
                onEdit={onEdit}
                onDelete={onDelete}
                onView={onView || ((s) => openLightbox(screenshots.findIndex((sc) => sc.id === s.id)))}
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

      <ImageLightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}

/**
 * 紧凑模式截图列表
 *
 * 横向布局，适合侧边栏等空间有限场景
 */
export function CompactScreenshotList({
  screenshots,
  onReorder,
  onEdit,
  onDelete,
  onView,
  sortable = true,
  showAnnotationCount = true,
  emptyState,
  className,
}: Omit<ScreenshotListProps, 'showUrl'>) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

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

    if (over && active.id !== over.id && onReorder) {
      const oldIndex = screenshots.findIndex((s) => s.id === active.id);
      const newIndex = screenshots.findIndex((s) => s.id === over.id);

      const newScreenshots = arrayMove(screenshots, oldIndex, newIndex).map(
        (s, index) => ({ ...s, order: index })
      );

      onReorder(newScreenshots);
    }
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const lightboxImages = screenshots.map((s, i) => ({
    src: s.imageUrl,
    alt: s.title || `截图 ${i + 1}`,
  }));

  if (screenshots.length === 0) {
    return emptyState ? <>{emptyState}</> : <EmptyScreenshot />;
  }

  // 非排序模式
  if (!sortable || !onReorder) {
    return (
      <>
        <div className={cn('space-y-3', className)}>
          {screenshots.map((screenshot, index) => (
            <CompactScreenshotItem
              key={screenshot.id}
              screenshot={screenshot}
              index={index}
              sortable={false}
              showAnnotationCount={showAnnotationCount}
              onEdit={onEdit}
              onDelete={onDelete}
              onView={onView || ((s) => openLightbox(screenshots.findIndex((sc) => sc.id === s.id)))}
            />
          ))}
        </div>

        <ImageLightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      </>
    );
  }

  // 排序模式
  return (
    <>
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
          <div className={cn('space-y-3', className)}>
            {screenshots.map((screenshot, index) => (
              <CompactScreenshotItem
                key={screenshot.id}
                screenshot={screenshot}
                index={index}
                sortable={true}
                showAnnotationCount={showAnnotationCount}
                onEdit={onEdit}
                onDelete={onDelete}
                onView={onView || ((s) => openLightbox(screenshots.findIndex((sc) => sc.id === s.id)))}
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
                  <div className="flex items-stretch">
                    <div className="flex-shrink-0 w-24 aspect-video relative">
                      <img
                        src={screenshot.thumbnailUrl || screenshot.imageUrl}
                        alt="拖拽中"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              );
            })()
          ) : null}
        </DragOverlay>
      </DndContext>

      <ImageLightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}

/**
 * @deprecated 使用 ScreenshotList 替代，sortable 参数控制是否可拖拽
 */
export function SortableScreenshotList({
  screenshots,
  onReorder,
  onEdit,
  onDelete,
  emptyState,
}: Required<Pick<ScreenshotListProps, 'screenshots' | 'onReorder' | 'onEdit' | 'onDelete'>> &
  Pick<ScreenshotListProps, 'emptyState'>) {
  return (
    <ScreenshotList
      screenshots={screenshots}
      onReorder={onReorder}
      onEdit={onEdit}
      onDelete={onDelete}
      sortable={true}
      showUrl={true}
      emptyState={emptyState}
    />
  );
}

export default ScreenshotList;
