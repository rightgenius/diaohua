import { QiniuService } from './qiniu';
import { useConfigStore } from '@/stores/configStore';
import type { OSSConfig } from '@/types';

export interface UploadResult {
  url: string;
  key: string;
  isLocalFallback?: boolean;
}

export interface OSSUploadOptions {
  mimeType?: string;
  onProgress?: (percent: number) => void;
}

/**
 * OSS 服务类 - 封装七牛云上传逻辑，支持本地降级
 */
export class OSSService {
  private qiniuService: QiniuService | null = null;
  private config: OSSConfig;

  constructor() {
    const state = useConfigStore.getState();
    this.config = state.oss;
    this.initService();
  }

  /**
   * 初始化服务
   */
  private initService(): void {
    if (this.isConfigValid()) {
      try {
        this.qiniuService = new QiniuService(this.config);
      } catch (error) {
        console.warn('OSSService: Failed to initialize Qiniu service:', error);
        this.qiniuService = null;
      }
    }
  }

  /**
   * 检查配置是否有效
   */
  isConfigValid(): boolean {
    return !!(
      this.config.bucket &&
      this.config.accessKey &&
      this.config.secretKey
    );
  }

  /**
   * 刷新配置（配置变更后调用）
   */
  refreshConfig(): void {
    const state = useConfigStore.getState();
    this.config = state.oss;
    this.initService();
  }

  /**
   * 上传文件（支持 Buffer、Blob、File、Base64）
   */
  async uploadFile(
    file: File | Blob | Buffer | string,
    key: string,
    options?: OSSUploadOptions
  ): Promise<UploadResult> {
    // 检查配置
    if (!this.isConfigValid()) {
      console.warn('OSSService: OSS not configured, using local fallback');
      return this.localFallback(file, key);
    }

    if (!this.qiniuService) {
      this.initService();
    }

    if (!this.qiniuService) {
      return this.localFallback(file, key);
    }

    try {
      // 模拟进度回调
      if (options?.onProgress) {
        let progress = 0;
        const progressInterval = setInterval(() => {
          progress += 10;
          if (progress >= 90) {
            clearInterval(progressInterval);
          } else {
            options.onProgress!(progress);
          }
        }, 100);
      }

      let result: { url: string; key: string };

      // 处理不同类型的输入
      if (typeof file === 'string') {
        // Base64 图片
        result = await this.qiniuService.uploadBase64(file, key);
      } else if (file instanceof Blob || file instanceof File) {
        // Blob/File 转换为 Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        result = await this.qiniuService.uploadBuffer(buffer, key, options?.mimeType || file.type);
      } else {
        // 假设是 Buffer
        result = await this.qiniuService.uploadBuffer(file as Buffer, key, options?.mimeType);
      }

      // 完成进度
      if (options?.onProgress) {
        options.onProgress(100);
      }

      return {
        url: result.url,
        key: result.key,
        isLocalFallback: false,
      };
    } catch (error) {
      console.error('OSSService: Upload failed, falling back to local:', error);
      return this.localFallback(file, key);
    }
  }

  /**
   * 上传截图（Base64 格式）
   */
  async uploadScreenshot(
    base64Image: string,
    requirementId: string,
    screenshotId: string,
    onProgress?: (percent: number) => void
  ): Promise<UploadResult> {
    const key = `screenshots/${requirementId}/${screenshotId}.png`;
    return this.uploadFile(base64Image, key, { onProgress });
  }

  /**
   * 上传缩略图
   */
  async uploadThumbnail(
    base64Image: string,
    requirementId: string,
    screenshotId: string
  ): Promise<UploadResult> {
    const key = `screenshots/${requirementId}/${screenshotId}_thumb.png`;
    return this.uploadFile(base64Image, key);
  }

  /**
   * 上传效果图
   */
  async uploadMockup(
    base64Image: string,
    requirementId: string,
    mockupId: string,
    variant: 'A' | 'B'
  ): Promise<UploadResult> {
    const key = `mockups/${requirementId}/${mockupId}_${variant}.png`;
    return this.uploadFile(base64Image, key);
  }

  /**
   * 上传需求数据（JSON）
   */
  async uploadRequirementData(
    data: object,
    requirementId: string
  ): Promise<UploadResult> {
    const key = `requirements/${requirementId}.json`;
    const jsonString = JSON.stringify(data, null, 2);
    const buffer = Buffer.from(jsonString, 'utf-8');
    return this.uploadFile(buffer, key, { mimeType: 'application/json' });
  }

  /**
   * 删除文件
   */
  async deleteFile(key: string): Promise<boolean> {
    if (!this.qiniuService) {
      console.warn('OSSService: Cannot delete, service not initialized');
      return false;
    }

    try {
      await this.qiniuService.deleteFile(key);
      return true;
    } catch (error) {
      console.error('OSSService: Delete failed:', error);
      return false;
    }
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.isConfigValid()) {
      return { success: false, message: '配置不完整：bucket、accessKey、secretKey 为必填项' };
    }

    if (!this.qiniuService) {
      try {
        this.qiniuService = new QiniuService(this.config);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { success: false, message: `初始化失败：${msg}` };
      }
    }

    return this.qiniuService.testConnection();
  }

  /**
   * 生成本地降级 URL（data URL 或 localStorage key）
   */
  private localFallback(
    file: File | Blob | Buffer | string,
    key: string
  ): Promise<UploadResult> {
    return new Promise((resolve) => {
      let url: string;

      if (typeof file === 'string') {
        // 已经是 Base64
        url = file;
      } else if (Buffer.isBuffer(file)) {
        // Buffer 转 Base64
        url = `data:application/octet-stream;base64,${file.toString('base64')}`;
      } else {
        // Blob/File 转 URL
        url = URL.createObjectURL(file);
      }

      resolve({
        url,
        key,
        isLocalFallback: true,
      });
    });
  }

  /**
   * 生成唯一 key
   */
  generateKey(prefix: string, ext: string): string {
    return QiniuService.generateKey(prefix, ext);
  }

  /**
   * 获取 OSS 配置状态
   */
  getConfigStatus(): {
    isConfigured: boolean;
    bucket?: string;
    domain?: string;
  } {
    return {
      isConfigured: this.isConfigValid(),
      bucket: this.config.bucket,
      domain: this.config.domain,
    };
  }
}

// 导出单例
export const ossService = new OSSService();

export default ossService;
