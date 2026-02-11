import { useEffect, useCallback, useRef } from 'react';

interface KeyboardShortcuts {
  onSave?: () => void;
  onUndo?: () => void;
  onDelete?: () => void;
  onEscape?: () => void;
  isEnabled?: boolean;
}

/**
 * 键盘快捷键 Hook
 * 
 * 支持的快捷键:
 * - Ctrl/Cmd + S: 保存
 * - Ctrl/Cmd + Z: 撤销
 * - Delete: 删除选中
 * - ESC: 关闭/退出
 */
export function useKeyboard({
  onSave,
  onUndo,
  onDelete,
  onEscape,
  isEnabled = true,
}: KeyboardShortcuts) {
  const callbacksRef = useRef({ onSave, onUndo, onDelete, onEscape });
  
  // 保持回调引用最新
  useEffect(() => {
    callbacksRef.current = { onSave, onUndo, onDelete, onEscape };
  }, [onSave, onUndo, onDelete, onEscape]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isEnabled) return;
    
    const { key, ctrlKey, metaKey, target } = event;
    
    // 如果在输入框中，只响应 ESC
    const isInputElement = target instanceof HTMLInputElement || 
                           target instanceof HTMLTextAreaElement;
    
    // Cmd/Ctrl + S: 保存
    if ((ctrlKey || metaKey) && key === 's') {
      event.preventDefault();
      callbacksRef.current.onSave?.();
      return;
    }
    
    // 在输入框中不响应其他快捷键
    if (isInputElement) {
      if (key === 'Escape') {
        (target as HTMLElement).blur();
        callbacksRef.current.onEscape?.();
      }
      return;
    }
    
    // Cmd/Ctrl + Z: 撤销
    if ((ctrlKey || metaKey) && key === 'z') {
      event.preventDefault();
      callbacksRef.current.onUndo?.();
      return;
    }
    
    // Delete: 删除
    if (key === 'Delete' || key === 'Backspace') {
      callbacksRef.current.onDelete?.();
      return;
    }
    
    // ESC: 关闭/退出
    if (key === 'Escape') {
      callbacksRef.current.onEscape?.();
      return;
    }
  }, [isEnabled]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

/**
 * 全局键盘快捷键 Hook
 * 用于应用级别的快捷键，不考虑焦点
 */
export function useGlobalKeyboard(shortcuts: Record<string, () => void>) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const { key, ctrlKey, metaKey, shiftKey, altKey } = event;
      
      // 构建快捷键字符串
      const parts: string[] = [];
      if (ctrlKey || metaKey) parts.push('ctrl');
      if (shiftKey) parts.push('shift');
      if (altKey) parts.push('alt');
      parts.push(key.toLowerCase());
      
      const shortcut = parts.join('+');
      const handler = shortcuts[shortcut];
      
      if (handler) {
        event.preventDefault();
        handler();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);
}

export default useKeyboard;
