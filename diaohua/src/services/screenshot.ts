import html2canvas from 'html2canvas';

export class ScreenshotService {
  /**
   * 捕获 iframe 或指定元素的截图
   */
  static async captureElement(element: HTMLElement): Promise<string> {
    try {
      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        scale: 2, // 高清截图
        logging: false,
      });
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('截图失败:', error);
      throw new Error('截图失败，请重试');
    }
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
   * 生成缩略图
   */
  static async generateThumbnail(dataURL: string, maxWidth: number = 200): Promise<string> {
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
        canvas.height = img.height * scale;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = dataURL;
    });
  }
}
