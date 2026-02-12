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

interface QiniuConfig {
  accessKey: string;
  secretKey: string;
  bucket: string;
  domain?: string;
  region?: string;
}

/**
 * OSS 服务类 - 封装七牛云上传逻辑
 */
export class OSSService {
  private config: OSSConfig;

  constructor() {
    const state = useConfigStore.getState();
    this.config = state.oss;
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
  }

  /**
   * 获取七牛配置对象
   */
  private getQiniuConfig(): QiniuConfig {
    return {
      accessKey: this.config.accessKey,
      secretKey: this.config.secretKey,
      bucket: this.config.bucket,
      domain: this.config.domain,
      region: this.config.region,
    };
  }

  /**
   * 上传文件（支持 Base64）
   */
  async uploadFile(
    file: File | Blob | string,
    key: string,
    options?: OSSUploadOptions
  ): Promise<UploadResult> {
    if (!this.isConfigValid()) {
      console.warn('OSSService: OSS not configured, using local fallback');
      return this.localFallback(file, key);
    }

    try {
      // 模拟进度回调
      if (options?.onProgress) {
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          if (progress >= 90) {
            clearInterval(interval);
          } else {
            options.onProgress?.(progress);
          }
        }, 100);
      }

      let base64Data: string;

      if (typeof file === 'string') {
        base64Data = file;
      } else if ((file as Blob) instanceof Blob) {
        base64Data = await this.blobToBase64(file as Blob);
      } else {
        throw new Error('Unsupported file type');
      }

      // 使用 Electron API 上传
      const result = await window.electronAPI.qiniuUpload(
        this.getQiniuConfig(),
        base64Data,
        key,
        options?.mimeType || 'image/png'
      );

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
    const base64 = btoa(unescape(encodeURIComponent(jsonString)));
    return this.uploadFile(`data:application/json;base64,${base64}`, key, {
      mimeType: 'application/json',
    });
  }

  /**
   * 删除文件
   */
  async deleteFile(_key: string): Promise<boolean> {
    // TODO: 实现删除功能
    console.warn('OSSService: Delete not implemented yet');
    return false;
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.isConfigValid()) {
      return { success: false, message: '配置不完整：bucket、accessKey、secretKey 为必填项' };
    }

    try {
      const result = await window.electronAPI.qiniuTestConnection(this.getQiniuConfig());
      return result;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return { success: false, message: `连接失败：${msg}` };
    }
  }

  /**
   * 生成本地降级 URL
   */
  private localFallback(
    file: File | Blob | string,
    key: string
  ): Promise<UploadResult> {
    return new Promise((resolve) => {
      let url: string;

      if (typeof file === 'string') {
        url = file;
      } else {
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
   * Blob 转 Base64
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * 生成唯一 key
   */
  generateKey(prefix: string, ext: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    return `${prefix}/${timestamp}_${random}.${ext}`;
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
