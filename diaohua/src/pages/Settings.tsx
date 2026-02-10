import { useState } from 'react';
import { useConfigStore } from '@/stores/configStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Check, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

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
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">设置</h1>
      <p className="text-muted-foreground mb-8">配置 API 密钥和存储服务</p>

      {showSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
          <Check size={20} />
          <span>配置已保存</span>
        </div>
      )}

      {!isConfigured && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-700">
          <AlertCircle size={20} />
          <span>请完成以下配置才能开始使用雕花</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Gemini API Key */}
        <Card>
          <CardHeader>
            <CardTitle>Google Gemini API</CardTitle>
            <CardDescription>
              用于AI需求优化和效果图生成，请从 
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google AI Studio</a>
              获取
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
            </div>
          </CardContent>
        </Card>

        {/* Qiniu OSS */}
        <Card>
          <CardHeader>
            <CardTitle>七牛云存储</CardTitle>
            <CardDescription>
              用于存储截图和效果图，请从 
              <a href="https://portal.qiniu.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">七牛云控制台</a>
              获取密钥
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
          </CardContent>
        </Card>

        <Button onClick={handleSave} className="w-full" size="lg">
          保存配置
        </Button>
      </div>
    </div>
  );
}
