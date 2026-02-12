import { useState } from 'react';
import { useConfigStore } from '@/stores/configStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { OSSConfigForm } from '@/components/settings/OSSConfigForm';
import { Check, Info, ExternalLink, Key, Database, Sparkles } from 'lucide-react';

export function Settings() {
  console.log('[前端] Settings 组件渲染');
  const { geminiApiKey, setGeminiApiKey, isConfigured, isOSSConfigValid } = useConfigStore();
  const [showSuccess, setShowSuccess] = useState(false);
  const [geminiKey, setGeminiKey] = useState(geminiApiKey || '');
  const [hasGeminiChanges, setHasGeminiChanges] = useState(false);

  const handleSaveGemini = () => {
    setGeminiApiKey(geminiKey);
    setHasGeminiChanges(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleGeminiChange = (value: string) => {
    setGeminiKey(value);
    setHasGeminiChanges(value !== geminiApiKey);
  };

  return (
    <div className="p-8 max-w-3xl mx-auto h-full overflow-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">设置</h1>
        <p className="text-muted-foreground">配置 API 密钥和存储服务</p>
      </div>

      {showSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
          <Check size={20} />
          <span>配置已保存</span>
        </div>
      )}

      {!isConfigured && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
          <Info size={20} className="text-blue-500 mt-0.5" />
          <div>
            <p className="text-blue-900 font-medium">本地功能已可用</p>
            <p className="text-sm text-blue-700 mt-1">
              您可以立即开始使用截图和标注功能。配置 API 密钥后，可使用 AI 生成效果图和 PRD 文档。
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Gemini API Key */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Sparkles className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <CardTitle>Google Gemini API</CardTitle>
                  <CardDescription>
                    用于 AI 需求优化和效果图生成
                  </CardDescription>
                </div>
              </div>
              {geminiApiKey && !hasGeminiChanges && (
                <Badge variant="success" className="flex items-center gap-1">
                  <Check size={14} /> 已配置
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <Key size={16} /> API Key
              </label>
              <Input
                type="password"
                placeholder="AIzaSy..."
                value={geminiKey}
                onChange={(e) => handleGeminiChange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-2">
                从{' '}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  Google AI Studio<ExternalLink size={12} />
                </a>{' '}
                获取
              </p>
            </div>
            <Button
              onClick={handleSaveGemini}
              disabled={!hasGeminiChanges}
              className="flex items-center gap-2"
            >
              <Check size={16} />
              保存 API Key
            </Button>
          </CardContent>
        </Card>

        {/* OSS Configuration */}
        <OSSConfigForm />

        {/* Storage Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Database className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <CardTitle>存储说明</CardTitle>
                <CardDescription>
                  了解数据存储方式
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium mb-1">本地存储</p>
                  <p className="text-muted-foreground text-xs">
                    截图和标注数据默认保存在浏览器本地存储中
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium mb-1">云端存储</p>
                  <p className="text-muted-foreground text-xs">
                    {isOSSConfigValid()
                      ? '已启用七牛云 OSS，数据将自动同步到云端'
                      : '配置七牛云后，数据将自动备份到云端'}
                  </p>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                <p>• 未配置 OSS 时，所有数据仅保存在本地</p>
                <p>• 配置 OSS 后，截图将自动上传到云端</p>
                <p>• 上传失败时会自动回退到本地存储</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Settings;
