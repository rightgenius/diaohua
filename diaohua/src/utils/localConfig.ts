// 本地配置文件加载
// 用于加载不包含在 Git 中的敏感配置

export interface LocalConfig {
  qiniu: {
    accessKey: string;
    secretKey: string;
    bucket: string;
    s3Url: string;
    region?: string;
  };
}

// 默认配置（开发环境）
const defaultConfig: LocalConfig = {
  qiniu: {
    accessKey: '',
    secretKey: '',
    bucket: '',
    s3Url: 'https://s3-cn-east-2.qiniucs.com/',
    region: 'cn-east-2',
  },
};

/**
 * 加载本地配置
 * 优先级：运行时注入 > .env 解析
 */
export function loadLocalConfig(): LocalConfig {
  // 尝试从环境变量加载（Tauri 可以在 Rust 层注入）
  const config: LocalConfig = {
    qiniu: {
      accessKey: import.meta.env?.VITE_QINIU_ACCESS_KEY || 
                 (window as any).__DIAOHUA_CONFIG__?.qiniu?.accessKey ||
                 defaultConfig.qiniu.accessKey,
      secretKey: import.meta.env?.VITE_QINIU_SECRET_KEY || 
                 (window as any).__DIAOHUA_CONFIG__?.qiniu?.secretKey ||
                 defaultConfig.qiniu.secretKey,
      bucket: import.meta.env?.VITE_QINIU_BUCKET || 
              (window as any).__DIAOHUA_CONFIG__?.qiniu?.bucket ||
              defaultConfig.qiniu.bucket,
      s3Url: import.meta.env?.VITE_QINIU_S3_URL || 
             (window as any).__DIAOHUA_CONFIG__?.qiniu?.s3Url ||
             defaultConfig.qiniu.s3Url,
      region: import.meta.env?.VITE_QINIU_REGION || 
              (window as any).__DIAOHUA_CONFIG__?.qiniu?.region ||
              defaultConfig.qiniu.region,
    },
  };

  return config;
}

/**
 * 检查本地配置是否完整
 */
export function isLocalConfigValid(config: LocalConfig): boolean {
  return !!(
    config.qiniu.accessKey &&
    config.qiniu.secretKey &&
    config.qiniu.bucket
  );
}

export default loadLocalConfig;
