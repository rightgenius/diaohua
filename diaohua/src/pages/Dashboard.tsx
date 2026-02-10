import { useState } from 'react';
import { useRequirementStore } from '@/stores/requirementStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { 
  Plus, 
  Clock, 
  CheckCircle2, 
  Image as ImageIcon,
  Trash2,
  Edit3,
  Search,
  FileText,
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
      draft: 'bg-gray-100 text-gray-600',
      annotating: 'bg-blue-100 text-blue-600',
      ai_generating: 'bg-purple-100 text-purple-600',
      mockup_review: 'bg-amber-100 text-amber-600',
      designing: 'bg-green-100 text-green-600',
      completed: 'bg-emerald-100 text-emerald-600',
      archived: 'bg-gray-100 text-gray-400',
    };
    return colors[status] || colors.draft;
  };

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
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>总需求数</CardDescription>
            <CardTitle className="text-3xl">{requirements.length}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>标注中</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {requirements.filter((r) => r.status === 'annotating').length}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>已完成</CardDescription>
            <CardTitle className="text-3xl text-emerald-600">
              {requirements.filter((r) => r.status === 'completed').length}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>总截图数</CardDescription>
            <CardTitle className="text-3xl">
              {requirements.reduce((sum, r) => sum + r.screenshots.length, 0)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Quick Start Guide */}
      {requirements.length === 0 && (
        <Card className="mb-8 border-dashed border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              使用指南
            </CardTitle>
            <CardDescription>
              跟随以下步骤开始使用雕花
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">1</span>
                点击「新建需求」创建一个需求文档
              </li>
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">2</span>
                在浏览器中访问需要改版的网站
              </li>
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">3</span>
                点击「截图」按钮，标注需要修改的地方
              </li>
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">4</span>
                使用 AI 生成效果图和 PRD 文档
              </li>
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Requirements List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">需求列表</h2>
          
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

        {filteredRequirements.length === 0 ? (
          <div className="text-center py-16 bg-muted/30 rounded-lg">
            <FileText size={48} className="mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              {searchQuery ? '没有找到匹配的需求' : '暂无需求，点击右上角新建'}
            </p>
          </div>
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
