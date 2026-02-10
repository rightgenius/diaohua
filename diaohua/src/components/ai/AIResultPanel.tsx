import { useState } from 'react';
import { useRequirementStore } from '@/stores/requirementStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { 
  ChevronLeft, 
  Wand2, 
  Download, 
  FileJson, 
  FileText,
  Check,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { MockupReview } from './MockupReview';
import { exportToJSON, exportToMarkdown, downloadFile } from '@/utils/export';

interface AIResultPanelProps {
  onBack: () => void;
}

export function AIResultPanel({ onBack }: AIResultPanelProps) {
  const { 
    currentRequirement,
    updateRequirement,
  } = useRequirementStore();
  
  const [activeTab, setActiveTab] = useState<'prd' | 'design' | 'mockup'>('prd');
  const [isGeneratingMockup, setIsGeneratingMockup] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  if (!currentRequirement) return null;

  const handleGenerateMockup = () => {
    setIsGeneratingMockup(true);
    setTimeout(() => {
      setIsGeneratingMockup(false);
    }, 2000);
  };

  const handleExportJSON = () => {
    if (!currentRequirement) return;
    setIsExporting(true);
    const content = exportToJSON(currentRequirement);
    downloadFile(content, `${currentRequirement.title}_requirement.json`, 'application/json');
    setTimeout(() => setIsExporting(false), 500);
  };

  const handleExportMarkdown = () => {
    if (!currentRequirement) return;
    setIsExporting(true);
    const content = exportToMarkdown(currentRequirement);
    downloadFile(content, `${currentRequirement.title}_prd.md`, 'text/markdown');
    setTimeout(() => setIsExporting(false), 500);
  };

  // Mock PRD content
  const mockPRD = `# ${currentRequirement.title}

## 1. 现状分析

基于截图分析，当前页面存在以下问题：
- 导航栏布局拥挤，信息层级不清晰
- 视觉风格偏向传统，缺乏现代感
- 核心功能入口不够突出

## 2. 优化目标

- 简化导航结构，采用胶囊式设计
- 提升视觉层级，突出核心功能
- 保持品牌调性一致

## 3. 功能需求

### 3.1 导航栏改版
- 将现有横向菜单改为胶囊式按钮组
- 减少菜单项数量，突出3个核心入口
- 添加搜索框居中显示

### 3.2 首页布局优化
- 采用卡片式布局，提升内容可读性
- 增加视觉留白，改善呼吸感

## 4. 验收标准

- [ ] 新导航在所有页面保持一致
- [ ] 移动端适配正常
- [ ] 页面加载时间不超过2秒
`;

  // Mock design reference
  const mockDesignRef = {
    layout: {
      style: '卡片式布局 + 胶囊导航',
      description: '采用现代简约风格，强调内容层级',
    },
    colors: ['#1890ff', '#ffffff', '#f5f5f5', '#262626'],
    components: [
      { name: 'NavigationBar', type: '胶囊式导航' },
      { name: 'SearchBar', type: '居中搜索框' },
      { name: 'ContentCard', type: '圆角卡片' },
    ],
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="h-14 border-b flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ChevronLeft size={16} className="mr-1" />
            返回
          </Button>
          
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {[
              { id: 'prd', label: 'PRD文档' },
              { id: 'design', label: '设计参考' },
              { id: 'mockup', label: '效果图' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={handleExportJSON}
            disabled={isExporting}
          >
            <FileJson size={16} />
            导出JSON
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={handleExportMarkdown}
            disabled={isExporting}
          >
            <FileText size={16} />
            导出Markdown
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'prd' && (
          <div className="max-w-3xl mx-auto">
            <Card className="p-6">
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {mockPRD}
                </pre>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'design' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">布局建议</h3>
              <p className="text-muted-foreground">{mockDesignRef.layout.description}</p>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">配色方案</h3>
              <div className="flex gap-3">
                {mockDesignRef.colors.map((color, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div
                      className="w-16 h-16 rounded-lg border shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs text-muted-foreground">{color}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">组件建议</h3>
              <div className="space-y-3">
                {mockDesignRef.components.map((comp, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="font-medium">{comp.name}</span>
                    <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                      {comp.type}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <div className="flex justify-center">
              <Button 
                size="lg" 
                className="gap-2"
                onClick={handleGenerateMockup}
                disabled={isGeneratingMockup}
              >
                {isGeneratingMockup ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Wand2 size={18} />
                )}
                {isGeneratingMockup ? '生成中...' : '生成效果图'}
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'mockup' && (
          <MockupReview onGenerate={handleGenerateMockup} isGenerating={isGeneratingMockup} />
        )}
      </div>
    </div>
  );
}
