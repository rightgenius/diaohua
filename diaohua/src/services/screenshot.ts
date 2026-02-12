import { domToPng } from 'modern-screenshot';

export interface ScreenshotOptions {
  /** 截图质量 (0-1) */
  quality?: number;
  /** 缩放比例 */
  scale?: number;
  /** 背景色 */
  backgroundColor?: string;
  /** 超时时间（毫秒） */
  timeout?: number;
}

export interface ScreenshotResult {
  /** 成功标志 */
  success: boolean;
  /** 图片数据 (dataURL) */
  dataUrl?: string;
  /** 错误信息 */
  error?: string;
  /** 截图耗时（毫秒） */
  duration?: number;
}

export interface WebpageCaptureOptions {
  /** 窗口宽度 */
  width?: number;
  /** 窗口高度 */
  height?: number;
  /** 等待页面加载时间（毫秒） */
  waitTime?: number;
}

/**
 * 统一截图服务
 * 
 * 提供多种截图方案：
 * 1. DOM 元素截图 - 使用 modern-screenshot，适用于同域 iframe 或 DOM 元素
 * 2. 网页截图 - 通过 Electron 主进程截取任意网页，支持跨域
 * 3. 系统截图 - 调用系统 API 截取全屏
 * 4. 缩略图生成 - 为截图生成缩略图
 */
export class ScreenshotService {
  private static readonly DEFAULT_OPTIONS: Required<ScreenshotOptions> = {
    quality: 0.95,
    scale: 2,
    backgroundColor: '#ffffff',
    timeout: 30000,
  };

  /**
   * 捕获 DOM 元素的截图
   * 使用 modern-screenshot，性能更好，支持现代浏览器特性
   */
  static async captureElement(
    element: HTMLElement,
    options: ScreenshotOptions = {}
  ): Promise<ScreenshotResult> {
    const startTime = Date.now();
    const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };

    try {
      const dataUrl = await Promise.race([
        domToPng(element, {
          scale: mergedOptions.scale,
          backgroundColor: mergedOptions.backgroundColor,
        }),
        new Promise<never>((_, reject) => {
          setTimeout(
            () => reject(new Error('截图超时')),
            mergedOptions.timeout
          );
        }),
      ]);

      return {
        success: true,
        dataUrl,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      console.error('[ScreenshotService] 元素截图失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * 捕获 iframe 内容的截图
   * 注意：仅在同域时可用，跨域会失败
   */
  static async captureIFrame(
    iframe: HTMLIFrameElement,
    options: ScreenshotOptions = {}
  ): Promise<ScreenshotResult> {
    const startTime = Date.now();

    try {
      // 检查 iframe 是否可访问
      const checkResult = await this.checkCSPLimitations(iframe);
      if (checkResult.hasLimitation) {
        return {
          success: false,
          error: checkResult.message,
          duration: Date.now() - startTime,
        };
      }

      const iframeBody = iframe.contentDocument?.body;
      if (!iframeBody) {
        return {
          success: false,
          error: '无法获取 iframe body 元素',
          duration: Date.now() - startTime,
        };
      }

      return await this.captureElement(iframeBody, options);
    } catch (error) {
      console.error('[ScreenshotService] iframe 截图失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * 通过 Electron 截取网页截图
   * 支持跨域，无需系统权限
   */
  static async captureWebpage(
    url: string,
    options: WebpageCaptureOptions = {}
  ): Promise<string> {
    const { width = 1920, height = 1080, waitTime = 3000 } = options;

    if (!window.electronAPI?.captureWebpage) {
      throw new Error('Electron API 不可用，请检查应用配置');
    }

    return await window.electronAPI.captureWebpage(url, {
      width,
      height,
      waitTime,
    });
  }

  /**
   * 系统全屏截图
   * 需要屏幕录制权限
   */
  static async captureScreen(): Promise<string> {
    if (!window.electronAPI?.captureScreen) {
      throw new Error('Electron API 不可用，请检查应用配置');
    }

    return await window.electronAPI.captureScreen();
  }

  /**
   * 检测目标 iframe 是否可能受 CSP 限制
   */
  static async checkCSPLimitations(iframe: HTMLIFrameElement): Promise<{
    hasLimitation: boolean;
    message: string;
  }> {
    try {
      const iframeDoc = iframe.contentDocument;
      const iframeWin = iframe.contentWindow;

      if (!iframeDoc || !iframeWin) {
        return {
          hasLimitation: true,
          message: '无法访问 iframe 内容，可能是跨域限制',
        };
      }

      // 检查脚本执行能力
      const testScript = iframeDoc.createElement('script');
      testScript.textContent = 'window.__csp_test__ = true;';
      iframeDoc.head.appendChild(testScript);

      const canExecuteScript = !!(iframeWin as any).__csp_test__;
      delete (iframeWin as any).__csp_test__;
      testScript.remove();

      if (!canExecuteScript) {
        return {
          hasLimitation: true,
          message: '目标页面禁止脚本执行，无法使用 iframe 截图',
        };
      }

      return {
        hasLimitation: false,
        message: '可以正常截图',
      };
    } catch (error) {
      return {
        hasLimitation: true,
        message: `检测失败: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * 获取推荐截图方案
   */
  static getRecommendedMethod(iframe: HTMLIFrameElement | null): {
    method: 'iframe-direct' | 'electron-webpage' | 'system' | 'paste';
    reason: string;
  } {
    // 检查 iframe 是否可访问
    if (iframe) {
      try {
        if (iframe.contentDocument?.body) {
          return {
            method: 'iframe-direct',
            reason: 'iframe 同域可访问，直接使用内置截图',
          };
        }
      } catch {
        // 跨域
      }

      // 检查是否是常见受限网站
      const src = iframe.src.toLowerCase();
      const restrictedSites = [
        'github.com',
        'google.com',
        'youtube.com',
        'bilibili.com',
        'twitter.com',
        'x.com',
      ];

      const isRestricted = restrictedSites.some((site) => src.includes(site));
      if (isRestricted) {
        return {
          method: 'electron-webpage',
          reason: '受限网站，使用 Electron 网页截图绕过限制',
        };
      }
    }

    // 默认推荐 Electron 网页截图
    return {
      method: 'electron-webpage',
      reason: '推荐使用 Electron 网页截图，支持跨域且无需系统权限',
    };
  }

  /**
   * 生成缩略图
   */
  static async generateThumbnail(
    dataURL: string,
    maxWidth: number = 300
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法创建 canvas context'));
          return;
        }

        const scale = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = Math.round(img.height * scale);

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = dataURL;
    });
  }

  /**
   * 将 DataURL 转换为 File 对象
   */
  static dataURLToFile(dataURL: string, filename: string): File {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }

  /**
   * 将 DataURL 转换为 Blob
   */
  static dataURLToBlob(dataURL: string): Blob {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }
}

export default ScreenshotService;
