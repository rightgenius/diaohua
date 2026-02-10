import { useRequirementStore } from '@/stores/requirementStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Plus, Clock, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Dashboard() {
  const { currentRequirement } = useRequirementStore();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">欢迎使用 雕花</h1>
          <p className="text-muted-foreground mt-1">
            截图标注需求，AI生成效果图，让产品设计更高效
          </p>
        </div>
        <Link to="/requirement">
          <Button size="lg" className="gap-2">
            <Plus size={20} />
            新建需求
          </Button>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => window.location.href = '/requirement'}>
          <CardHeader>
            <ImageIcon className="h-8 w-8 text-primary mb-2" />
            <CardTitle>快速开始</CardTitle>
            <CardDescription>
              打开任意网站，截图并标注你的需求
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <Clock className="h-8 w-8 text-muted-foreground mb-2" />
            <CardTitle>最近需求</CardTitle>
            <CardDescription>
              {currentRequirement ? currentRequirement.title : '暂无需求'}
            </CardDescription>
          </CardHeader>
          {currentRequirement && (
            <CardContent>
              <Link to={`/requirement/${currentRequirement.id}`}>
                <Button variant="ghost" className="w-full">
                  继续编辑
                </Button>
              </Link>
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
            <CardTitle>使用指南</CardTitle>
            <CardDescription>
              1. 在右侧浏览器访问目标网站<br />
              2. 截图并标注需要修改的地方<br />
              3. AI生成效果图并导出
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle>当前配置状态</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">Gemini API</span>
              <span className="text-green-600 flex items-center gap-1">
                <CheckCircle2 size={16} /> 已配置
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">七牛云存储</span>
              <span className="text-green-600 flex items-center gap-1">
                <CheckCircle2 size={16} /> 已配置
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">当前需求</span>
              <span className="text-muted-foreground">
                {currentRequirement ? currentRequirement.title : '无'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
