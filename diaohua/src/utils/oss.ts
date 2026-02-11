import { syncService } from '@/services/sync';
import { ossService } from '@/services/oss';
import type { Screenshot, Requirement } from '@/types';

export interface UploadScreenshotOptions {
  requirementId: string;
  screenshotId: string;
  imageUrl: string;
  thumbnailUrl?: string;
  onProgress?: (percent: number) => void;
  onComplete?: (result: { success: boolean; ossUrl?: string; isLocalFallback: boolean }) => void;
}

/**
 * 上传截图并处理结果
 * 截图后自动上传到 OSS（如果配置了）
 */
export async function uploadScreenshotToOSS(
  options: UploadScreenshotOptions
): Promise<{ success: boolean; ossUrl?: string; isLocalFallback: boolean }> {
  const { requirementId, screenshotId, imageUrl, onProgress, onComplete } = options;

  // 检查 OSS 是否可用
  if (!ossService.isConfigValid()) {
    console.log('OSSUtils: OSS not configured, using local storage');
    const result = { success: true, ossUrl: undefined, isLocalFallback: true };
    onComplete?.(result);
    return result;
  }

  try {
    // 创建截图对象用于上传
    const screenshot: Screenshot = {
      id: screenshotId,
      url: '',
      pageUrl: '',
      title: '',
      imageUrl,
      thumbnailUrl: options.thumbnailUrl || imageUrl,
      annotations: [],
      description: '',
      order: 0,
      createdAt: new Date().toISOString(),
    };

    const result = await syncService.uploadScreenshot(
      requirementId,
      screenshot,
      onProgress
    );

    const finalResult = {
      success: result.success,
      ossUrl: result.url,
      isLocalFallback: result.isLocalFallback || false,
    };

    onComplete?.(finalResult);
    return finalResult;
  } catch (error) {
    console.error('OSSUtils: Upload failed:', error);
    const result = { success: false, ossUrl: undefined, isLocalFallback: true };
    onComplete?.(result);
    return result;
  }
}

/**
 * 生成缩略图
 */
export async function generateThumbnail(
  imageUrl: string,
  maxWidth: number = 400
): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      // 计算缩略图尺寸
      const ratio = Math.min(maxWidth / img.width, 1);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;

      // 绘制缩略图
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // 转换为 Base64
      const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
      resolve(thumbnailUrl);
    };

    img.onerror = () => {
      console.error('Failed to load image for thumbnail');
      resolve(null);
    };

    img.src = imageUrl;
  });
}

/**
 * 同步需求到 OSS
 */
export async function syncRequirementToOSS(
  requirement: Requirement
): Promise<{
  success: boolean;
  uploaded: number;
  failed: number;
  errors: string[];
}> {
  return syncService.syncRequirement(requirement);
}

/**
 * 批量同步需求
 */
export async function syncAllRequirementsToOSS(
  requirements: Requirement[],
  onProgress?: (current: number, total: number) => void
): Promise<{
  success: boolean;
  uploaded: number;
  failed: number;
  errors: string[];
}> {
  return syncService.syncAllRequirements(requirements, { onProgress });
}

/**
 * 检查 OSS 配置状态
 */
export function checkOSSStatus(): {
  isConfigured: boolean;
  bucket?: string;
  domain?: string;
}
{
  return ossService.getConfigStatus();
}

/**
 * 生成 OSS Key
 */
export function generateOSSKey(prefix: string, ext: string): string {
  return ossService.generateKey(prefix, ext);
}
