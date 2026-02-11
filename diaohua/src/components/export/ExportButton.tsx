import { useState, useRef, useEffect } from 'react';
import { Download, FileJson, FileText, Package, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { exportToJSON, exportToMarkdown, createExportZip, downloadFile } from '@/utils/export';
import type { Requirement } from '@/types';

interface ExportButtonProps {
  requirement: Requirement;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
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

  const handleExport = async (type: 'json' | 'markdown' | 'zip') => {
    if (exporting) return;
    
    setExporting(type);
    setIsOpen(false);
    
    try {
      switch (type) {
        case 'json': {
          const json = exportToJSON(requirement);
          downloadFile(json, `${requirement.title}.json`, 'application/json');
          break;
        }
        case 'markdown': {
          const md = exportToMarkdown(requirement);
          downloadFile(md, `${requirement.title}.md`, 'text/markdown');
          break;
        }
        case 'zip': {
          const zip = await createExportZip(requirement);
          if (zip) {
            const url = URL.createObjectURL(zip);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${requirement.title}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
          break;
        }
      }
      
      setSuccess(type);
      setTimeout(() => setSuccess(null), 2000);
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试');
    } finally {
      setExporting(null);
    }
  };

  const getIcon = () => {
    if (exporting) return <Loader2 className="w-4 h-4 animate-spin" />;
    if (success) return <Check className="w-4 h-4" />;
    return <Download className="w-4 h-4" />;
  };

  return (
    <div className={className} ref={dropdownRef}>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsOpen(!isOpen)}
        disabled={!!exporting}
        className="gap-2"
      >
        {getIcon()}
        {size !== 'icon' && (
          exporting ? '导出中...' : success ? '已导出' : '导出'
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-card border rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="p-3 border-b">
            <p className="font-medium">导出格式</p>
          </div>
          
          <div className="p-2 space-y-1">
            <ExportOption
              icon={<FileJson className="w-5 h-5 text-blue-500" />}
              label="JSON 格式"
              description="AI Coding Agent 友好"
              onClick={() => handleExport('json')}
              isLoading={exporting === 'json'}
            />
            
            <ExportOption
              icon={<FileText className="w-5 h-5 text-purple-500" />}
              label="Markdown PRD"
              description="产品需求文档"
              onClick={() => handleExport('markdown')}
              isLoading={exporting === 'markdown'}
            />
            
            <ExportOption
              icon={<Package className="w-5 h-5 text-green-500" />}
              label="完整包 (ZIP)"
              description="包含所有图片"
              onClick={() => handleExport('zip')}
              isLoading={exporting === 'zip'}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface ExportOptionProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
  isLoading?: boolean;
}

function ExportOption({ icon, label, description, onClick, isLoading }: ExportOptionProps) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-muted transition-colors text-left disabled:opacity-50"
    >
      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : icon}
      </div>
      <div>
        <p className="font-medium text-sm">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}

export default ExportButton;
