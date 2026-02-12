import { ossService } from './oss';
import type { Requirement, Screenshot } from '@/types';

export interface SyncOptions {
  onProgress?: (current: number, total: number) => void;
  onError?: (error: Error) => void;
}

export interface SyncResult {
  success: boolean;
  uploaded: number;
  failed: number;
  errors: string[];
}

export interface UploadQueueItem {
  id: string;
  type: 'screenshot' | 'thumbnail' | 'mockup' | 'data';
  requirementId: string;
  data: string | object;
  key: string;
  retryCount: number;
}

/**
 * 数据同步服务 - 负责将数据同步到 OSS
 */
export class SyncService {
  private uploadQueue: UploadQueueItem[] = [];
  private isProcessing = false;
  private maxRetries = 3;

  /**
   * 检查 OSS 是否可用
   */
  isOSSAvailable(): boolean {
    return ossService.isConfigValid();
  }

  /**
   * 上传截图到 OSS
   * 截图先存 localStorage（快速响应），后台异步上传到 OSS
   */
  async uploadScreenshot(
    requirementId: string,
    screenshot: Screenshot,
    onProgress?: (percent: number) => void
  ): Promise<{ success: boolean; url?: string; isLocalFallback?: boolean }> {
    // 检查 OSS 配置
    if (!this.isOSSAvailable()) {
      console.log('SyncService: OSS not configured, keeping local data URL');
      return { success: true, url: screenshot.imageUrl, isLocalFallback: true };
    }

    try {
      // 上传原图
      const imageResult = await ossService.uploadScreenshot(
        screenshot.imageUrl,
        requirementId,
        screenshot.id,
        onProgress
      );

      // 如果缩略图是单独的数据，也上传
      if (screenshot.thumbnailUrl && screenshot.thumbnailUrl !== screenshot.imageUrl) {
        await ossService.uploadThumbnail(
          screenshot.thumbnailUrl,
          requirementId,
          screenshot.id
        );
      }

      return {
        success: true,
        url: imageResult.url,
        isLocalFallback: imageResult.isLocalFallback,
      };
    } catch (error) {
      console.error('SyncService: Failed to upload screenshot:', error);
      return { success: false, url: screenshot.imageUrl, isLocalFallback: true };
    }
  }

  /**
   * 同步单个需求到 OSS
   */
  async syncRequirement(requirement: Requirement): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      uploaded: 0,
      failed: 0,
      errors: [],
    };

    if (!this.isOSSAvailable()) {
      return { ...result, success: false, errors: ['OSS not configured'] };
    }

    try {
      // 1. 同步截图
      for (const screenshot of requirement.screenshots) {
        const uploadResult = await this.uploadScreenshot(requirement.id, screenshot);
        if (uploadResult.success && !uploadResult.isLocalFallback) {
          result.uploaded++;
        } else if (!uploadResult.success) {
          result.failed++;
        }
      }

      // 2. 同步效果图
      if (requirement.mockupDesigns) {
        for (const mockup of requirement.mockupDesigns) {
          try {
            await ossService.uploadMockup(
              mockup.imageUrl,
              requirement.id,
              mockup.id,
              mockup.variant
            );
            result.uploaded++;
          } catch (error) {
            result.failed++;
            result.errors.push(`Mockup ${mockup.id}: ${error}`);
          }
        }
      }

      // 3. 同步需求数据（JSON）
      try {
        // 创建不包含大文件的数据副本
        const dataToSync = {
          ...requirement,
          // 不重复同步图片数据
          screenshots: requirement.screenshots.map(s => ({
            ...s,
            // 如果已经上传到 OSS，使用 OSS URL
            imageUrl: s.imageUrl.startsWith('data:') ? '' : s.imageUrl,
            thumbnailUrl: s.thumbnailUrl?.startsWith('data:') ? '' : s.thumbnailUrl,
          })),
        };
        await ossService.uploadRequirementData(dataToSync, requirement.id);
        result.uploaded++;
      } catch (error) {
        result.failed++;
        result.errors.push(`Data: ${error}`);
      }

      result.success = result.failed === 0;
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return {
        ...result,
        success: false,
        errors: [...result.errors, errorMsg],
      };
    }
  }

  /**
   * 批量同步所有需求
   */
  async syncAllRequirements(
    requirements: Requirement[],
    options?: SyncOptions
  ): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      uploaded: 0,
      failed: 0,
      errors: [],
    };

    const total = requirements.length;

    for (let i = 0; i < requirements.length; i++) {
      const requirement = requirements[i];
      
      if (options?.onProgress) {
        options.onProgress(i + 1, total);
      }

      try {
        const syncResult = await this.syncRequirement(requirement);
        result.uploaded += syncResult.uploaded;
        result.failed += syncResult.failed;
        result.errors.push(...syncResult.errors);
      } catch (error) {
        result.failed++;
        result.errors.push(`Requirement ${requirement.id}: ${error}`);
        if (options?.onError) {
          options.onError(error instanceof Error ? error : new Error(String(error)));
        }
      }
    }

    result.success = result.failed === 0;
    return result;
  }

  /**
   * 添加到上传队列
   */
  enqueueUpload(item: Omit<UploadQueueItem, 'retryCount'>): void {
    this.uploadQueue.push({ ...item, retryCount: 0 });
    this.processQueue();
  }

  /**
   * 处理上传队列
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.uploadQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.uploadQueue.length > 0) {
      const item = this.uploadQueue.shift();
      if (!item) continue;

      try {
        if (typeof item.data === 'string') {
          await ossService.uploadFile(item.data, item.key);
        } else {
          const jsonStr = JSON.stringify(item.data);
          const blob = new Blob([jsonStr], { type: 'application/json' });
          await ossService.uploadFile(blob, item.key, { mimeType: 'application/json' });
        }
      } catch (error) {
        console.error(`SyncService: Failed to upload ${item.id}:`, error);
        
        // 重试逻辑
        if (item.retryCount < this.maxRetries) {
          item.retryCount++;
          this.uploadQueue.push(item);
        }
      }
    }

    this.isProcessing = false;
  }

  /**
   * 删除需求的云端数据
   */
  async deleteRequirementData(requirementId: string): Promise<boolean> {
    if (!this.isOSSAvailable()) {
      return false;
    }

    try {
      // 删除需求数据文件
      await ossService.deleteFile(`requirements/${requirementId}.json`);
      return true;
    } catch (error) {
      console.error('SyncService: Failed to delete requirement data:', error);
      return false;
    }
  }

  /**
   * 获取同步状态
   */
  getSyncStatus(): {
    isConfigured: boolean;
    queueLength: number;
    isProcessing: boolean;
  } {
    return {
      isConfigured: this.isOSSAvailable(),
      queueLength: this.uploadQueue.length,
      isProcessing: this.isProcessing,
    };
  }
}

// 导出单例
export const syncService = new SyncService();

export default syncService;
