import { domToPng } from 'modern-screenshot';

export interface WebviewScreenshotOptions {
  /** 截图质量 (0-1) */
  quality?: number;
  /** 缩放比例 */
  scale?: number;
  /** 背景色 */
  backgroundColor?: string;
  /** 超时时间（毫秒） */
  timeout?: number;
  /** WebView 窗口宽度 */
  width?: number;
  /** WebView 窗口高度 */
  height?: number;
  /** 等待页面加载时间（毫秒） */
  waitTimeMs?: number;
}

export interface ScreenshotResult {
  /** 成功标志 */
  success: boolean;
  /** 图片数据 (dataURL) */
  dataUrl?: string;
  /** 错误信息 */
  error?: string;
  /** 是否使用了降级方案 */
  isFallback?: boolean;
  /** 截图耗时（毫秒） */
  duration?: number;
}

/**
 * WebView 截图服务
 * 
 * 提供多种截图方案：
 * 1. WebView 注入截图（推荐）- 创建隐藏 WebView，注入脚本截图，无需权限
 * 2. iframe 直接截图 - 使用 modern-screenshot 截取 iframe，可能受跨域限制
 * 3. 系统截图 - 使用 xcap 截取屏幕，需要权限
 */
export class WebviewScreenshotService {
  private static readonly DEFAULT_OPTIONS: WebviewScreenshotOptions = {
    quality: 0.95,
    scale: 2,
    backgroundColor: '#ffffff',
    timeout: 30000,
    width: 1920,
    height: 1080,
    waitTimeMs: 2000,
  };

  /**
   * 使用 WebView 注入脚本截图（暂不支持）
   * 
   * 由于 Tauri 2.0 的 eval 限制，无法直接从外部 URL 的 WebView 获取截图结果。
   * 需要使用更复杂的 IPC 机制，如 WebSocket 或 HTTP 服务器。
   * 
   * 当前建议使用：
   * 1. iframe 直接截图（同域）
   * 2. 系统截图（xcap）
   * 3. 粘贴方案（Cmd+Shift+4 + Cmd+V）
   */
  static async captureWithWebView(
    _url: string,
    _options: WebviewScreenshotOptions = {}
  ): Promise<ScreenshotResult> {
    return {
      success: false,
      error: 'WebView 注入截图功能开发中，请使用其他方案',
    };
  }

  /**
   * 检测目标元素是否可能受 CSP 限制
   */
  static async checkCSPLimitations(iframe: HTMLIFrameElement): Promise<{
    hasCSPLimitation: boolean;
    message: string;
  }> {
    try {
      // 尝试访问 iframe 的内容
      const iframeDoc = iframe.contentDocument;
      const iframeWin = iframe.contentWindow;
      
      if (!iframeDoc || !iframeWin) {
        return {
          hasCSPLimitation: true,
          message: '无法访问 iframe 内容，可能是跨域限制',
        };
      }

      // 检查常见的 CSP 限制迹象
      const testScript = iframeDoc.createElement('script');
      testScript.textContent = 'window.__csp_test__ = true;';
      iframeDoc.head.appendChild(testScript);
      
      const canExecuteScript = !!(iframeWin as any).__csp_test__;
      delete (iframeWin as any).__csp_test__;
      testScript.remove();

      if (!canExecuteScript) {
        return {
          hasCSPLimitation: true,
          message: '目标页面禁止脚本执行，无法使用注入式截图',
        };
      }

      return {
        hasCSPLimitation: false,
        message: '可以正常截图',
      };
    } catch (error) {
      return {
        hasCSPLimitation: true,
        message: `检测失败: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * 捕获 iframe 内容的截图（同域时使用）
   */
  static async captureIFrame(
    iframe: HTMLIFrameElement,
    options: WebviewScreenshotOptions = {}
  ): Promise<ScreenshotResult> {
    const startTime = Date.now();
    const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };

    try {
      // 首先检查 CSP 限制
      const cspCheck = await this.checkCSPLimitations(iframe);
      if (cspCheck.hasCSPLimitation) {
        return {
          success: false,
          error: cspCheck.message,
          duration: Date.now() - startTime,
        };
      }

      const iframeDoc = iframe.contentDocument;
      const iframeBody = iframeDoc?.body;
      
      if (!iframeBody) {
        return {
          success: false,
          error: '无法获取 iframe body 元素',
          duration: Date.now() - startTime,
        };
      }

      // 使用 modern-screenshot 截图
      const dataUrl = await Promise.race([
        domToPng(iframeBody, {
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
      console.error('[WebView截图] iframe 截图失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * 捕获任意 DOM 元素的截图
   */
  static async captureElement(
    element: HTMLElement,
    options: WebviewScreenshotOptions = {}
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
      console.error('[WebView截图] 元素截图失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * 获取推荐截图方案
   */
  static getRecommendedMethod(iframe: HTMLIFrameElement | null): {
    method: 'webview-inject' | 'iframe-direct' | 'paste' | 'system';
    reason: string;
  } {
    // 如果有 iframe，先检测是否可访问
    if (iframe) {
      try {
        const iframeDoc = iframe.contentDocument;
        if (iframeDoc) {
          return {
            method: 'iframe-direct',
            reason: 'iframe 同域可访问，直接使用 modern-screenshot',
          };
        }
      } catch {
        // 跨域，无法访问
      }
    }

    // 检查是否是常见受限网站
    if (iframe) {
      const src = iframe.src.toLowerCase();
      const restrictedSites = [
        'github.com',
        'google.com',
        'youtube.com',
        'bilibili.com',
        'twitter.com',
        'x.com',
      ];
      
      const isRestricted = restrictedSites.some(site => src.includes(site));
      if (isRestricted) {
        return {
          method: 'webview-inject',
          reason: '受限网站，使用 WebView 注入截图绕过限制',
        };
      }
    }

    // 默认推荐 WebView 注入截图
    return {
      method: 'webview-inject',
      reason: '推荐使用 WebView 注入截图，无需权限且效果好',
    };
  }
}

export default WebviewScreenshotService;
