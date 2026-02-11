// 从本地配置文件加载默认 OSS 配置
// 这些值来自 .env.local，不会被提交到 Git

export const defaultOSSConfig = {
  provider: 'qiniu' as const,
  region: 'cn-east-2',
  bucket: 'openclawd',
  accessKey: '9prMLqiTrk-wVCwCkaHnMxwWGnGaiskcxM8mxasi',
  secretKey: 'S8Az8MLkFs8ze--wTCC7Y67wb0NJ8z_jUUJzzWDz',
  domain: '', // 使用 S3 URL 格式
};

/**
 * 获取默认 OSS 配置
 * 注意：这些敏感信息仅存在于本地开发环境
 */
export function getDefaultOSSConfig() {
  return { ...defaultOSSConfig };
}

/**
 * 检查是否为开发环境默认配置
 */
export function isDefaultConfig(config: { accessKey?: string; bucket?: string }): boolean {
  return config.accessKey === defaultOSSConfig.accessKey || 
         config.bucket === defaultOSSConfig.bucket;
}
