import { useState } from 'react';
import { useConfigStore } from '@/stores/configStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Check, Info, ExternalLink } from 'lucide-react';

export function Settings() {
  const { geminiApiKey, oss, setGeminiApiKey, setOSSConfig, isConfigured } = useConfigStore();
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    geminiApiKey: geminiApiKey || '',
    qiniuAccessKey: oss.accessKey || '',
    qiniuSecretKey: oss.secretKey || '',
    qiniuBucket: oss.bucket || '',
    qiniuDomain: oss.domain || '',
  });

  const handleSave = () => {
    setGeminiApiKey(formData.geminiApiKey);
    setOSSConfig({
      provider: 'qiniu',
      region: 'z0',
      bucket: formData.qiniuBucket,
      accessKey: formData.qiniuAccessKey,
      secretKey: formData.qiniuSecretKey,
      domain: formData.qiniuDomain,
    });
    
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto h-full overflow-auto">
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
              <CardTitle>Google Gemini API</CardTitle>
              {geminiApiKey && (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <Check size={14} /> 已配置
                </span>
              )}
            </div>
            <CardDescription>
              用于 AI 需求优化和效果图生成
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">API Key</label>
              <Input
                type="password"
                placeholder="AIzaSy..."
                value={formData.geminiApiKey}
                onChange={(e) => setFormData({ ...formData, geminiApiKey: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-2">
                从 <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  Google AI Studio <ExternalLink size={12} />
                </a> 获取
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Qiniu OSS */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>七牛云存储</CardTitle>
              {oss.bucket && oss.accessKey && (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <Check size={14} /> 已配置
                </span>
              )}
            </div>
            <CardDescription>
              用于云端存储截图和效果图（可选，默认保存到本地）
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Access Key</label>
              <Input
                type="password"
                placeholder="..."
                value={formData.qiniuAccessKey}
                onChange={(e) => setFormData({ ...formData, qiniuAccessKey: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Secret Key</label>
              <Input
                type="password"
                placeholder="..."
                value={formData.qiniuSecretKey}
                onChange={(e) => setFormData({ ...formData, qiniuSecretKey: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Bucket 名称</label>
              <Input
                placeholder="my-bucket"
                value={formData.qiniuBucket}
                onChange={(e) => setFormData({ ...formData, qiniuBucket: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">域名（可选）</label>
              <Input
                placeholder="https://xxx.qiniudn.com"
                value={formData.qiniuDomain}
                onChange={(e) => setFormData({ ...formData, qiniuDomain: e.target.value })}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              从 <a 
                href="https://portal.qiniu.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                七牛云控制台 <ExternalLink size={12} />
              </a> 获取密钥
            </p>
          </CardContent>
        </Card>

        <Button onClick={handleSave} className="w-full" size="lg">
          保存配置
        </Button>
      </div>
    </div>
  );
}
