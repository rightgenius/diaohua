import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useConfigStore } from '@/stores/configStore';
import { ossService } from '@/services/oss';
import type { OSSConfig } from '@/types';
import { 
  Check, 
  AlertCircle, 
  Loader2, 
  ExternalLink, 
  RefreshCw,
  Shield,
  Database,
  Globe
} from 'lucide-react';

interface OSSConfigFormProps {
  onConfigChange?: (isValid: boolean) => void;
}

export function OSSConfigForm({ onConfigChange }: OSSConfigFormProps) {
  const { 
    oss, 
    setOSSConfig, 
    isOSSConfigValid,
    validateOSSConfig,
    validationError,
    lastValidatedAt,
    clearValidationError,
    localConfigPath,
  } = useConfigStore();

  const [formData, setFormData] = useState<{
    provider: OSSConfig['provider'];
    endpoint: string;
    accessKey: string;
    secretKey: string;
    bucket: string;
    domain: string;
    region: string;
  }>({
    provider: oss.provider || 's3',
    endpoint: oss.endpoint || '',
    accessKey: oss.accessKey || '',
    secretKey: oss.secretKey || '',
    bucket: oss.bucket || '',
    domain: oss.domain || '',
    region: oss.region || 'cn-east-1',
  });

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // 检查表单是否有变更
  useEffect(() => {
    const changed =
      formData.accessKey !== oss.accessKey ||
      formData.secretKey !== oss.secretKey ||
      formData.bucket !== oss.bucket ||
      formData.domain !== oss.domain ||
      formData.region !== oss.region;
    
    setHasChanges(changed);
    if (changed) {
      clearValidationError();
      setTestResult(null);
    }
  }, [formData, oss, clearValidationError]);

  // 通知父组件配置状态
  useEffect(() => {
    onConfigChange?.(isOSSConfigValid());
  }, [isOSSConfigValid, onConfigChange]);

  const handleSave = () => {
    const config: OSSConfig = {
      provider: formData.provider as OSSConfig['provider'],
      endpoint: formData.endpoint,
      region: formData.region,
      bucket: formData.bucket,
      accessKey: formData.accessKey,
      secretKey: formData.secretKey,
      domain: formData.domain,
    };
    setOSSConfig(config);
    setHasChanges(false);
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    // 先保存配置
    const testConfig: OSSConfig = {
      provider: formData.provider as OSSConfig['provider'],
      endpoint: formData.endpoint,
      region: formData.region,
      bucket: formData.bucket,
      accessKey: formData.accessKey,
      secretKey: formData.secretKey,
      domain: formData.domain,
    };
    setOSSConfig(testConfig);

    // 临时更新 OSS 服务配置
    ossService.refreshConfig?.();

    const result = await validateOSSConfig();
    
    setTestResult({
      success: result.valid,
      message: result.error || '连接成功！',
    });
    setIsTesting(false);
  };

  const isConfigComplete = formData.bucket && formData.accessKey && formData.secretKey;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Database className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>对象存储配置</CardTitle>
              <CardDescription>
                配置 S3 兼容的对象存储服务（七牛云、阿里云、MinIO 等）
              </CardDescription>
            </div>
          </div>
          {isOSSConfigValid() && !hasChanges && (
            <Badge variant="success" className="flex items-center gap-1">
              <Check size={14} /> 已配置
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 服务提供商 */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Database size={16} /> 存储服务提供商
          </label>
          <select
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            value={formData.provider}
            onChange={(e) => setFormData({ ...formData, provider: e.target.value as OSSConfig['provider'] })}
          >
            <option value="s3">通用 S3 兼容</option>
            <option value="qiniu">七牛云 Kodo</option>
            <option value="aliyun">阿里云 OSS</option>
            <option value="aws">AWS S3</option>
            <option value="minio">MinIO</option>
            <option value="other">其他</option>
          </select>
        </div>

        {/* Endpoint / 区域 */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Globe size={16} /> 
            {formData.provider === 's3' || formData.provider === 'minio' ? 'Endpoint URL' : '存储区域'}
          </label>
          {formData.provider === 'qiniu' ? (
            <select
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
            >
              <option value="cn-east-1">华东-浙江（cn-east-1）</option>
              <option value="cn-north-1">华北-河北（cn-north-1）</option>
              <option value="cn-south-1">华南-广东（cn-south-1）</option>
              <option value="us-north-1">北美-洛杉矶（us-north-1）</option>
              <option value="ap-southeast-1">亚太-新加坡（ap-southeast-1）</option>
            </select>
          ) : formData.provider === 'aliyun' ? (
            <select
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
            >
              <option value="oss-cn-hangzhou">华东1（杭州）</option>
              <option value="oss-cn-shanghai">华东2（上海）</option>
              <option value="oss-cn-beijing">华北1（北京）</option>
              <option value="oss-cn-shenzhen">华南1（深圳）</option>
            </select>
          ) : (
            <Input
              placeholder={formData.provider === 'minio' ? 'http://localhost:9000' : 'https://s3.amazonaws.com'}
              value={formData.endpoint}
              onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
            />
          )}
          <p className="text-xs text-muted-foreground">
            {formData.provider === 'qiniu' 
              ? '选择七牛云存储区域'
              : formData.provider === 'aliyun'
              ? '选择阿里云 OSS 区域'
              : '输入 S3 兼容服务的 Endpoint URL'}
          </p>
        </div>

        {/* Access Key */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Access Key / Access Key ID
          </label>
          <Input
            type="password"
            placeholder="请输入 Access Key"
            value={formData.accessKey}
            onChange={(e) => setFormData({ ...formData, accessKey: e.target.value })}
          />
        </div>

        {/* Secret Key */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Shield size={16} /> Secret Key / Access Key Secret
          </label>
          <Input
            type="password"
            placeholder="请输入 Secret Key"
            value={formData.secretKey}
            onChange={(e) => setFormData({ ...formData, secretKey: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Secret Key 将被加密存储在本地，不会上传到云端
          </p>
        </div>

        {/* Bucket */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Bucket 名称</label>
          <Input
            placeholder="my-bucket"
            value={formData.bucket}
            onChange={(e) => setFormData({ ...formData, bucket: e.target.value })}
          />
        </div>

        {/* Domain */}
        <div className="space-y-2">
          <label className="text-sm font-medium">自定义域名（可选）</label>
          <Input
            placeholder="https://cdn.example.com"
            value={formData.domain}
            onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            配置自定义 CDN 域名，不填写则使用服务商默认域名
          </p>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={!isConfigComplete || isTesting}
            className="flex items-center gap-2"
          >
            {isTesting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                测试中...
              </>
            ) : (
              <>
                <RefreshCw size={16} />
                测试连接
              </>
            )}
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
            className="flex items-center gap-2"
          >
            <Check size={16} />
            保存配置
          </Button>
        </div>

        {/* 测试结果 */}
        {testResult && (
          <div
            className={`p-4 rounded-lg flex items-start gap-3 ${
              testResult.success
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {testResult.success ? (
              <Check size={20} className="mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
            )}
            <div>
              <p className="font-medium">
                {testResult.success ? '连接成功' : '连接失败'}
              </p>
              <p className="text-sm mt-1">{testResult.message}</p>
            </div>
          </div>
        )}

        {/* 验证错误 */}
        {validationError && !testResult && (
          <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-700 flex items-start gap-3">
            <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">上次验证失败</p>
              <p className="text-sm mt-1">{validationError}</p>
              {lastValidatedAt && (
                <p className="text-xs mt-2 opacity-75">
                  验证时间: {new Date(lastValidatedAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        )}

        {/* 帮助链接和本地配置提示 */}
        <div className="pt-4 border-t space-y-2">
          <p className="text-xs text-muted-foreground">
            常用服务商控制台：
            <a
              href="https://portal.qiniu.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1 ml-1"
            >
              七牛云
              <ExternalLink size={12} />
            </a>
            <a
              href="https://oss.console.aliyun.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1 ml-2"
            >
              阿里云 OSS
              <ExternalLink size={12} />
            </a>
          </p>
          {localConfigPath && (
            <p className="text-xs text-green-600">
              配置已自动从本地文件加载
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default OSSConfigForm;
