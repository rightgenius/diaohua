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

  // 七牛云 OSS
  qiniuUploadToken: (config: {
    accessKey: string;
    secretKey: string;
    bucket: string;
  }, key: string) => Promise<string>;
  qiniuUpload: (config: {
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
  qiniuTestConnection: (config: {
    accessKey: string;
    secretKey: string;
    bucket: string;
    domain?: string;
    region?: string;
  }) => Promise<{ success: boolean; message: string }>;

  // 应用信息
  getAppVersion: () => Promise<string>;
  getPlatform: () => Promise<string>;
}

interface Window {
  electronAPI: ElectronAPI;
}
