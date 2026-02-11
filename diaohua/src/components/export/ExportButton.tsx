import { useState, useRef, useEffect } from 'react';
import { Download, FileJson, FileText, Package, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { exportToJSON, exportToMarkdown, createExportZip, downloadFile } from '@/utils/export';
import type { Requirement } from '@/types';

interface ExportButtonProps {
  requirement: Requirement;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

type ExportType = 'json' | 'markdown' | 'zip' | null;

/**
 * 导出按钮组件
 * 
 * 支持导出 JSON、Markdown 和 ZIP 图片包
 */
export function ExportButton({
  requirement,
  className,
  variant = 'outline',
  size = 'sm',
}: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState<ExportType>(null);
  const [success, setSuccess] = useState<ExportType>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 重置成功状态
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleExportJSON = async () => {
    setExporting('json');
    try {
      const json = exportToJSON(requirement);
      const filename = `${requirement.title.replace(/[^\w\u4e00-\u9fa5]/g, '_')}_requirement.json`;
      downloadFile(json, filename, 'application/json');
      setSuccess('json');
    } catch (error) {
      console.error('导出 JSON 失败:', error);
      alert('导出失败，请重试');
    } finally {
      setExporting(null);
      setIsOpen(false);
    }
  };

  const handleExportMarkdown = async () => {
    setExporting('markdown');
    try {
      const markdown = exportToMarkdown(requirement);
      const filename = `${requirement.title.replace(/[^\w\u4e00-\u9fa5]/g, '_')}_README.md`;
      downloadFile(markdown, filename, 'text/markdown');
      setSuccess('markdown');
    } catch (error) {
      console.error('导出 Markdown 失败:', error);
      alert('导出失败，请重试');
    } finally {
      setExporting(null);
      setIsOpen(false);
    }
  };

  const handleExportZip = async () => {
    setExporting('zip');
    try {
      const zipBlob = await createExportZip(requirement);
      if (zipBlob) {
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        const filename = `${requirement.title.replace(/[^\w\u4e00-\u9fa5]/g, '_')}_export.zip`;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setSuccess('zip');
      } else {
        alert('创建 ZIP 失败，请确保已安装 jszip 依赖');
      }
    } catch (error) {
      console.error('导出 ZIP 失败:', error);
      alert('导出失败，请重试');
    } finally {
      setExporting(null);
      setIsOpen(false);
    }
  };

  const getButtonIcon = () => {
    if (exporting) return <Loader2 className="animate-spin" size={16} />;
    if (success) return <Check size={16} className="text-green-500" />;
    return <Download size={16} />;
  };

  const getButtonText = () => {
    if (exporting === 'json') return '导出 JSON...';
    if (exporting === 'markdown') return '导出 Markdown...';
    if (exporting === 'zip') return '打包下载...';
    if (success === 'json') return 'JSON 已导出';
    if (success === 'markdown') return 'Markdown 已导出';
    if (success === 'zip') return 'ZIP 已下载';
    return '导出';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsOpen(!isOpen)}
        disabled={!!exporting}
        className={className}
      >
        {getButtonIcon()}
        <span className="ml-1.5">{getButtonText()}</span>
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-popover border rounded-lg shadow-lg z-50 py-1 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b">
            导出选项
          </div>
          
          <button
            onClick={handleExportJSON}
            disabled={!!exporting}
            className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-muted transition-colors text-left disabled:opacity-50"
          >
            <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center">
              <FileJson size={18} className="text-blue-600" />
            </div>
            <div>
              <div className="text-sm font-medium">导出 JSON</div>
              <div className="text-xs text-muted-foreground">完整数据结构</div>
            </div>
          </button>

          <button
            onClick={handleExportMarkdown}
            disabled={!!exporting}
            className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-muted transition-colors text-left disabled:opacity-50"
          >
            <div className="w-8 h-8 rounded bg-purple-100 flex items-center justify-center">
              <FileText size={18} className="text-purple-600" />
            </div>
            <div>
              <div className="text-sm font-medium">导出 Markdown</div>
              <div className="text-xs text-muted-foreground">PRD 文档格式</div>
            </div>
          </button>

          <div className="border-t my-1" />

          <button
            onClick={handleExportZip}
            disabled={!!exporting}
            className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-muted transition-colors text-left disabled:opacity-50"
          >
            <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center">
              <Package size={18} className="text-green-600" />
            </div>
            <div>
              <div className="text-sm font-medium">下载图片包</div>
              <div className="text-xs text-muted-foreground">包含所有截图和效果图</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

export default ExportButton;
