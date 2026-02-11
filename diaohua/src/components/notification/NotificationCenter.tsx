import { useState, useEffect, useRef } from 'react';
import { Bell, Check, MessageSquare, AtSign, X, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/utils/cn';
import type { Comment } from '@/types';

export interface Notification {
  id: string;
  type: 'comment' | 'mention' | 'reply';
  title: string;
  message: string;
  requirementId: string;
  commentId?: string;
  createdAt: string;
  isRead: boolean;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onNotificationClick?: (notification: Notification) => void;
  className?: string;
}

/**
 * 通知中心组件
 * 
 * 显示评论通知、@提及通知等
 * 放在 MainLayout 右上角
 */
export function NotificationCenter({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onNotificationClick,
  className,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'mention':
        return <AtSign className="w-4 h-4 text-blue-500" />;
      case 'reply':
        return <MessageSquare className="w-4 h-4 text-green-500" />;
      case 'comment':
      default:
        return <MessageSquare className="w-4 h-4 text-purple-500" />;
    }
  };

  const sortedNotifications = [...notifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative p-2 rounded-lg transition-colors',
          isOpen ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
        )}
        title="通知"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-card border rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="p-3 border-b flex items-center justify-between">
            <h3 className="font-medium">通知</h3>
            {notifications.length > 0 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={onMarkAllAsRead}
                  className="p-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded"
                  title="全部已读"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
                <button
                  onClick={onClearAll}
                  className="p-1.5 text-xs text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded"
                  title="清空通知"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {sortedNotifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">暂无通知</p>
              </div>
            ) : (
              <div className="divide-y">
                {sortedNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      'p-3 hover:bg-muted/50 cursor-pointer transition-colors',
                      !notification.isRead && 'bg-blue-50/50'
                    )}
                    onClick={() => {
                      onMarkAsRead(notification.id);
                      onNotificationClick?.(notification);
                      setIsOpen(false);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium line-clamp-1">
                              {notification.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {notification.message}
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            {!notification.isRead && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 从评论生成通知
 * 
 * 当有新评论时调用此函数生成通知
 */
export function createCommentNotifications(
  newComment: Comment,
  requirementTitle: string,
  currentUserId: string
): Notification[] {
  const notifications: Notification[] = [];

  // 如果评论包含 @提及，为被提及的人生成通知
  if (newComment.mentions.length > 0) {
    newComment.mentions.forEach((mentionedUser) => {
      notifications.push({
        id: `notif_${Date.now()}_${mentionedUser}`,
        type: 'mention',
        title: `${newComment.authorName} 在 "${requirementTitle}" 中提到了你`,
        message: newComment.content.slice(0, 100) + (newComment.content.length > 100 ? '...' : ''),
        requirementId: newComment.requirementId,
        commentId: newComment.id,
        createdAt: newComment.createdAt,
        isRead: false,
      });
    });
  }

  // 如果是回复，为父评论作者生成通知
  if (newComment.parentId) {
    notifications.push({
      id: `notif_${Date.now()}_reply`,
      type: 'reply',
      title: `${newComment.authorName} 回复了你的评论`,
      message: newComment.content.slice(0, 100) + (newComment.content.length > 100 ? '...' : ''),
      requirementId: newComment.requirementId,
      commentId: newComment.id,
      createdAt: newComment.createdAt,
      isRead: false,
    });
  }

  return notifications;
}

export default NotificationCenter;
