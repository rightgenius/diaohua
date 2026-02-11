import { useState, useRef, useEffect } from 'react';
import { Send, Reply, AtSign, MessageSquare, X, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/utils/cn';
import type { Comment } from '@/types';

interface CommentSectionProps {
  comments: Comment[];
  requirementId: string;
  currentUserId?: string;
  currentUserName?: string;
  onAddComment: (content: string, replyTo?: string) => void;
  onDeleteComment?: (commentId: string) => void;
  className?: string;
}

export function CommentSection({
  comments,
  requirementId,
  currentUserId = 'user',
  currentUserName = '我',
  onAddComment,
  onDeleteComment,
  className,
}: CommentSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [showMentions, setShowMentions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPosition, setCursorPosition] = useState(0);

  const sortedComments = [...comments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const rootComments = sortedComments.filter((c) => !c.replyTo);

  const handleSubmit = () => {
    if (!newComment.trim()) return;

    onAddComment(newComment, replyingTo?.id);
    setNewComment('');
    setReplyingTo(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursor = e.target.selectionStart || 0;
    setNewComment(value);
    setCursorPosition(cursor);

    // 检测 @ 符号
    const lastChar = value.slice(cursor - 1, cursor);
    const beforeCursor = value.slice(0, cursor);
    const lastAtIndex = beforeCursor.lastIndexOf('@');

    if (lastChar === '@' || (lastAtIndex >= 0 && !beforeCursor.slice(lastAtIndex).includes(' '))) {
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (name: string) => {
    const beforeCursor = newComment.slice(0, cursorPosition);
    const afterCursor = newComment.slice(cursorPosition);
    const lastAtIndex = beforeCursor.lastIndexOf('@');
    const newValue =
      beforeCursor.slice(0, lastAtIndex) + `@${name} ` + afterCursor;
    setNewComment(newValue);
    setShowMentions(false);
    textareaRef.current?.focus();
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 text-lg font-semibold">
        <MessageSquare className="w-5 h-5" />
        评论
        {comments.length > 0 && (
          <span className="text-sm font-normal text-muted-foreground">
            ({comments.length})
          </span>
        )}
      </div>

      {/* Comment Input */}
      <div className="border rounded-lg p-4 space-y-3">
        {replyingTo && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-2 rounded">
            <Reply className="w-3 h-3" />
            回复 {replyingTo.authorName}
            <button
              onClick={() => setReplyingTo(null)}
              className="ml-auto hover:text-foreground"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="relative">
          <Textarea
            ref={textareaRef}
            placeholder={
              replyingTo
                ? `回复 ${replyingTo.authorName}...`
                : '写下你的评论... (使用 @ 提及他人)'
            }
            value={newComment}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            rows={3}
            className="resize-none"
          />

          {/* Mention suggestions */}
          {showMentions && (
            <div className="absolute bottom-full left-0 mb-1 w-48 bg-card border rounded-lg shadow-lg z-10 py-1">
              <div className="px-3 py-1 text-xs text-muted-foreground border-b">
                快速提及
              </div>
              {['所有人', '作者', '设计师'].map((name) => (
                <button
                  key={name}
                  onClick={() => insertMention(name)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                >
                  <AtSign className="w-3 h-3" />
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            按 Cmd/Ctrl + Enter 快速发送
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!newComment.trim()}
            size="sm"
            className="gap-2"
          >
            <Send className="w-4 h-4" />
            发送
          </Button>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {rootComments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>暂无评论，来说点什么吧</p>
          </div>
        ) : (
          rootComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              replies={sortedComments.filter((c) => c.replyTo === comment.id)}
              onReply={() => setReplyingTo(comment)}
              onDelete={onDeleteComment}
              currentUserId={currentUserId}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface CommentItemProps {
  comment: Comment;
  replies: Comment[];
  onReply: () => void;
  onDelete?: (commentId: string) => void;
  currentUserId: string;
}

function CommentItem({
  comment,
  replies,
  onReply,
  onDelete,
  currentUserId,
}: CommentItemProps) {
  const [showActions, setShowActions] = useState(false);
  const isAuthor = comment.authorId === currentUserId;

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return d.toLocaleDateString('zh-CN');
  };

  return (
    <div className="space-y-3">
      <div
        className="flex gap-3 group"
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <Avatar name={comment.authorName} size="sm" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{comment.authorName}</span>
            <span className="text-xs text-muted-foreground">
              {formatDate(comment.createdAt)}
            </span>
          </div>

          <div className="mt-1 text-sm">
            <CommentContent content={comment.content} />
          </div>

          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={onReply}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <Reply className="w-3 h-3" />
              回复
            </button>

            {showActions && isAuthor && onDelete && (
              <button
                onClick={() => onDelete(comment.id)}
                className="text-xs text-destructive hover:text-destructive/80"
              >
                删除
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Replies */}
      {replies.length > 0 && (
        <div className="ml-11 space-y-3 border-l-2 border-muted pl-4">
          {replies.map((reply) => (
            <div key={reply.id} className="flex gap-3">
              <Avatar name={reply.authorName} size="sm" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{reply.authorName}</span>
                  {reply.replyToAuthor && (
                    <>
                      <span className="text-xs text-muted-foreground">回复</span>
                      <span className="text-xs text-primary">@{reply.replyToAuthor}</span>
                    </>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatDate(reply.createdAt)}
                  </span>
                </div>

                <div className="mt-1 text-sm">
                  <CommentContent content={reply.content} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Avatar component
interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function Avatar({ name, size = 'md', className }: AvatarProps) {
  const initials = name.slice(0, 2).toUpperCase();
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
    'bg-rose-500',
  ];
  const colorIndex = name.charCodeAt(0) % colors.length;
  const bgColor = colors[colorIndex];

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center text-white font-medium shrink-0',
        bgColor,
        sizeClasses[size],
        className
      )}
    >
      {initials}
    </div>
  );
}

// Comment content with mention highlighting
function CommentContent({ content }: { content: string }) {
  const parts = content.split(/(@\S+)/g);

  return (
    <span>
      {parts.map((part, index) => {
        if (part.startsWith('@')) {
          return (
            <span key={index} className="text-primary font-medium">
              {part}
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}

export default CommentSection;
