import { useState } from 'react';
import { useRequirementStore } from '@/stores/requirementStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { ExportButton } from '@/components/export/ExportButton';
import { 
  Plus, 
  Clock, 
  CheckCircle2, 
  Image as ImageIcon,
  Trash2,
  Edit3,
  Search,
  FileText,
  LayoutGrid,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/utils/cn';

export function Dashboard() {
  const { requirements, deleteRequirement, setCurrentRequirement } = useRequirementStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filteredRequirements = requirements.filter((req) =>
    req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.userDescription.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (req: typeof requirements[0]) => {
    setCurrentRequirement(req);
    navigate('/requirement');
  };

  const handleDelete = (id: string) => {
    deleteRequirement(id);
    setDeleteConfirmId(null);
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: '草稿',
      annotating: '标注中',
      ai_generating: 'AI生成中',
      mockup_review: '效果图评审',
      designing: '设计中',
      completed: '已完成',
      archived: '已归档',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
      annotating: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      ai_generating: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
      mockup_review: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
      designing: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
      completed: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
      archived: 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500',
    };
    return colors[status] || colors.draft;
  };

  // 空状态 - 没有任何需求
  if (requirements.length === 0) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">欢迎使用 雕花</h1>
          <p className="text-muted-foreground mt-1">
            截图标注需求，AI生成效果图，让产品设计更高效
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left - Empty State */}
          <div className="bg-muted/30 rounded-xl p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            
            <h2 className="text-2xl font-bold mb-3">开始您的第一个需求</h2>
            
            <p className="text-muted-foreground mb-8 max-w-sm">
              雕花是一款 AI 辅助的产品设计工具。通过截图标注和 AI 生成，
              快速将你的想法转化为可视化的设计效果图。
            </p>
            
            <Button 
              size="lg" 
              className="gap-2"
              onClick={() => navigate('/requirement')}
            >
              <Plus size={20} />
              创建第一个需求
            </Button>
          </div>

          {/* Right - Quick Start */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">使用指南</h3>
            
            <QuickStartStep
              number={1}
              title="创建需求"
              description="点击「新建需求」创建一个新的需求文档，填写标题和描述。"
              icon={FileText}
            />
            
            <QuickStartStep
              number={2}
              title="截图标注"
              description="在浏览器中访问目标网页，截取屏幕并添加标注说明需要修改的地方。"
              icon={ImageIcon}
            />
            
            <QuickStartStep
              number={3}
              title="AI 分析"
              description="AI 自动分析截图和描述，生成 PRD 文档和设计建议。"
              icon={Sparkles}
            />
            
            <QuickStartStep
              number={4}
              title="生成效果图"
              description="一键生成专业的设计效果图，选择满意的方案开始设计。"
              icon={LayoutGrid}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">欢迎使用 雕花</h1>
          <p className="text-muted-foreground mt-1">
            截图标注需求，AI生成效果图，让产品设计更高效
          </p>
        </div>
        <Button 
          size="lg" 
          className="gap-2"
          onClick={() => navigate('/requirement')}
        >
          <Plus size={20} />
          新建需求
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="总需求数"
          value={requirements.length}
          icon={FileText}
        />
        
        <StatCard
          label="标注中"
          value={requirements.filter((r) => r.status === 'annotating').length}
          icon={Edit3}
          highlight="blue"
        />
        
        <StatCard
          label="已完成"
          value={requirements.filter((r) => r.status === 'completed').length}
          icon={CheckCircle2}
          highlight="green"
        />
        
        <StatCard
          label="总截图数"
          value={requirements.reduce((sum, r) => sum + r.screenshots.length, 0)}
          icon={ImageIcon}
        />
      </div>

      {/* Requirements List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">需求列表</h2>
          
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索需求..."
                className="pl-9"
              />
            </div>
          </div>
        </div>

        {filteredRequirements.length === 0 ? (
          <EmptyState
            icon={Search}
            title="没有找到匹配的需求"
            description="尝试使用其他关键词搜索，或者创建一个新的需求"
            actionText="新建需求"
            onAction={() => navigate('/requirement')}
            className="py-16 bg-muted/30 rounded-lg"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRequirements.map((req) => (
              <Card key={req.id} className="group hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{req.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {new Date(req.updatedAt).toLocaleDateString('zh-CN')}
                      </CardDescription>
                    </div>
                    <span className={cn('px-2 py-1 rounded text-xs font-medium', getStatusColor(req.status))}>
                      {getStatusLabel(req.status)}
                    </span>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <ImageIcon size={14} />
                      {req.screenshots.length} 张截图
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {req.screenshots.reduce((sum, s) => sum + s.annotations.length, 0)} 个标注
                    </span>
                  </div>

                  {/* Screenshots Preview */}
                  {req.screenshots.length > 0 && (
                    <div className="flex gap-2 mb-4 overflow-hidden">
                      {req.screenshots.slice(0, 3).map((s, i) => (
                        <div
                          key={s.id}
                          className="w-16 h-12 bg-muted rounded overflow-hidden flex-shrink-0"
                        >
                          <img
                            src={s.thumbnailUrl || s.imageUrl}
                            alt={`截图 ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      {req.screenshots.length > 3 && (
                        <div className="w-16 h-12 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                          +{req.screenshots.length - 3}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1"
                      onClick={() => handleEdit(req)}
                    >
                      <Edit3 size={14} />
                      编辑
                    </Button>
                    
                    <ExportButton
                      requirement={req}
                      size="sm"
                      variant="outline"
                    />
                    
                    {deleteConfirmId === req.id ? (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirmId(null)}
                        >
                          取消
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(req.id)}
                        >
                          确认
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => setDeleteConfirmId(req.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 统计卡片组件
interface StatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  highlight?: 'blue' | 'green' | 'purple';
}

function StatCard({ label, value, icon: Icon, highlight }: StatCardProps) {
  const highlightClasses = {
    blue: 'text-blue-600',
    green: 'text-emerald-600',
    purple: 'text-purple-600',
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardDescription>{label}</CardDescription>
          <Icon size={18} className="text-muted-foreground/60" />
        </div>
        <CardTitle className={cn('text-3xl', highlight && highlightClasses[highlight])}>
          {value}
        </CardTitle>
      </CardHeader>
    </Card>
  );
}

// 快速开始步骤组件
interface QuickStartStepProps {
  number: number;
  title: string;
  description: string;
  icon: React.ElementType;
}

function QuickStartStep({ number, title, description, icon: Icon }: QuickStartStepProps) {
  return (
    <div className="flex gap-4 p-4 rounded-lg bg-muted/50">
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center">
            {number}
          </span>
          <h4 className="font-medium">{title}</h4>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export default Dashboard;
