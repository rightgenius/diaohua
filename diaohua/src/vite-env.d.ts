/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Electron API 类型声明
interface ElectronAPI {
  // 日志
  log: (level: string, message: string) => Promise<void>;

  // 截图
  captureScreen: () => Promise<string>;
  captureWebpage: (url: string, options?: {
    width?: number;
    height?: number;
    waitTime?: number;
    fullPage?: boolean;
  }) => Promise<string>;

  // 文件对话框
  showSaveDialog: (options: {
    title?: string;
    defaultPath?: string;
    filters?: { name: string; extensions: string[] }[];
  }) => Promise<{ canceled: boolean; filePath?: string }>;
  showOpenDialog: (options: {
    title?: string;
    defaultPath?: string;
    filters?: { name: string; extensions: string[] }[];
    properties?: string[];
  }) => Promise<{ canceled: boolean; filePaths?: string[] }>;

  // 文件操作
  saveFile: (filePath: string, data: Uint8Array) => Promise<{ success: boolean }>;
  readFile: (filePath: string) => Promise<Uint8Array>;
  readFileBase64: (filePath: string) => Promise<string>;

  // 对象存储服务（S3 兼容）
  storageUploadToken: (config: {
    accessKey: string;
    secretKey: string;
    bucket: string;
  }, key: string) => Promise<string>;
  storageUpload: (config: {
    accessKey: string;
    secretKey: string;
    bucket: string;
    domain?: string;
    region?: string;
  }, base64Data: string, key: string, mimeType?: string) => Promise<{
    key: string;
    url: string;
    hash: string;
    size: number;
  }>;
  storageTestConnection: (config: {
    accessKey: string;
    secretKey: string;
    bucket: string;
    domain?: string;
    region?: string;
  }) => Promise<{ success: boolean; message: string }>;

  // 本地配置文件
  loadLocalConfig: () => Promise<{
    success: boolean;
    config?: {
      geminiApiKey?: string;
      oss?: {
        provider?: string;
        endpoint?: string;
        region?: string;
        bucket?: string;
        accessKey?: string;
        secretKey?: string;
        domain?: string;
      };
    };
    path?: string;
    error?: string;
  }>;
  saveLocalConfig: (config: {
    geminiApiKey?: string;
    oss?: object;
  }) => Promise<{
    success: boolean;
    path?: string;
    error?: string;
  }>;

  // 应用信息
  getAppVersion: () => Promise<string>;
  getPlatform: () => Promise<string>;
}

interface Window {
  electronAPI: ElectronAPI;
}
