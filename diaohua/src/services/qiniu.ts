import * as qiniu from 'qiniu';
import type { OSSConfig } from '@/types';

export interface QiniuUploadResult {
  url: string;
  key: string;
  hash: string;
}

export interface QiniuUploadProgress {
  percent: number;
  loaded: number;
  total: number;
}

export class QiniuService {
  private config: OSSConfig;
  private mac: qiniu.auth.digest.Mac | null = null;

  constructor(config: OSSConfig) {
    this.config = config;
    this.initAuth();
  }

  /**
   * 初始化认证
   */
  private initAuth(): void {
    if (!this.config.accessKey || !this.config.secretKey) {
      throw new Error('Qiniu: accessKey and secretKey are required');
    }
    this.mac = new qiniu.auth.digest.Mac(this.config.accessKey, this.config.secretKey);
  }

  /**
   * 获取上传 Token
   */
  getUploadToken(key?: string, expires?: number): string {
    if (!this.mac) {
      throw new Error('Qiniu: not initialized');
    }

    const scope = key ? `${this.config.bucket}:${key}` : this.config.bucket;
    const putPolicy = new qiniu.rs.PutPolicy({
      scope,
      expires: expires || 3600, // 默认1小时
    });

    return putPolicy.uploadToken(this.mac);
  }

  /**
   * 上传文件（Buffer 方式）
   */
  async uploadBuffer(
    buffer: Buffer,
    key: string,
    mimeType?: string
  ): Promise<QiniuUploadResult> {
    if (!this.config.bucket) {
      throw new Error('Qiniu: bucket is required');
    }

    const uploadToken = this.getUploadToken(key);
    const config = new qiniu.conf.Config();
    // 根据区域设置上传域名
    if (this.config.region) {
      config.zone = this.getZone(this.config.region);
    }

    const formUploader = new qiniu.form_up.FormUploader(config);
    const putExtra = new qiniu.form_up.PutExtra();
    if (mimeType) {
      putExtra.mimeType = mimeType;
    }

    return new Promise((resolve, reject) => {
      formUploader.put(uploadToken, key, buffer, putExtra, (err, body, info) => {
        if (err) {
          reject(err);
          return;
        }
        if (info.statusCode === 200) {
          const url = this.getFileUrl(body.key);
          resolve({
            url,
            key: body.key,
            hash: body.hash,
          });
        } else {
          reject(new Error(`Qiniu upload failed: ${info.statusCode} - ${JSON.stringify(body)}`));
        }
      });
    });
  }

  /**
   * 上传文件流
   */
  async uploadStream(
    stream: NodeJS.ReadableStream,
    key: string,
    mimeType?: string
  ): Promise<QiniuUploadResult> {
    if (!this.config.bucket) {
      throw new Error('Qiniu: bucket is required');
    }

    const uploadToken = this.getUploadToken(key);
    const config = new qiniu.conf.Config();
    if (this.config.region) {
      config.zone = this.getZone(this.config.region);
    }

    const formUploader = new qiniu.form_up.FormUploader(config);
    const putExtra = new qiniu.form_up.PutExtra();
    if (mimeType) {
      putExtra.mimeType = mimeType;
    }

    return new Promise((resolve, reject) => {
      formUploader.putStream(uploadToken, key, stream, putExtra, (err, body, info) => {
        if (err) {
          reject(err);
          return;
        }
        if (info.statusCode === 200) {
          const url = this.getFileUrl(body.key);
          resolve({
            url,
            key: body.key,
            hash: body.hash,
          });
        } else {
          reject(new Error(`Qiniu upload failed: ${info.statusCode} - ${JSON.stringify(body)}`));
        }
      });
    });
  }

  /**
   * 上传 Base64 图片
   */
  async uploadBase64(
    base64Data: string,
    key: string
  ): Promise<QiniuUploadResult> {
    // 移除 data:image/png;base64, 前缀
    const base64String = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64String, 'base64');
    
    // 检测 MIME 类型
    const mimeMatch = base64Data.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';

    return this.uploadBuffer(buffer, key, mimeType);
  }

  /**
   * 删除文件
   */
  async deleteFile(key: string): Promise<void> {
    if (!this.mac) {
      throw new Error('Qiniu: not initialized');
    }

    const config = new qiniu.conf.Config();
    const bucketManager = new qiniu.rs.BucketManager(this.mac, config);

    return new Promise((resolve, reject) => {
      bucketManager.delete(this.config.bucket, key, (err, _respBody, respInfo) => {
        if (err) {
          reject(err);
          return;
        }
        if (respInfo.statusCode === 200) {
          resolve();
        } else {
          reject(new Error(`Qiniu delete failed: ${respInfo.statusCode}`));
        }
      });
    });
  }

  /**
   * 获取文件信息
   */
  async getFileInfo(key: string): Promise<any> {
    if (!this.mac) {
      throw new Error('Qiniu: not initialized');
    }

    const config = new qiniu.conf.Config();
    const bucketManager = new qiniu.rs.BucketManager(this.mac, config);

    return new Promise((resolve, reject) => {
      bucketManager.stat(this.config.bucket, key, (err, respBody, respInfo) => {
        if (err) {
          reject(err);
          return;
        }
        if (respInfo.statusCode === 200) {
          resolve(respBody);
        } else {
          reject(new Error(`Qiniu stat failed: ${respInfo.statusCode}`));
        }
      });
    });
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.config.bucket || !this.config.accessKey || !this.config.secretKey) {
        return { success: false, message: '配置不完整：bucket、accessKey、secretKey 为必填项' };
      }

      // 尝试获取 bucket 信息来验证连接
      const testKey = `test/connection_${Date.now()}.txt`;
      const testContent = Buffer.from('test');
      
      await this.uploadBuffer(testContent, testKey, 'text/plain');
      await this.deleteFile(testKey);

      return { success: true, message: '连接成功！' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, message: `连接失败：${errorMessage}` };
    }
  }

  /**
   * 生成文件访问 URL
   * 使用 S3 兼容格式：https://s3-{region}.qiniucs.com/{bucket}/{key}
   */
  getFileUrl(key: string): string {
    // 优先使用自定义域名
    if (this.config.domain) {
      const domain = this.config.domain.replace(/\/$/, '');
      return `${domain}/${key}`;
    }
    
    // 使用 S3 兼容 URL 格式
    const region = this.config.region || 'cn-east-2';
    return `https://s3-${region}.qiniucs.com/${this.config.bucket}/${key}`;
  }

  /**
   * 获取区域配置
   */
  private getZone(region: string): qiniu.conf.Zone {
    const zoneMap: Record<string, qiniu.conf.Zone> = {
      'z0': qiniu.zone.Zone_z0,    // 华东
      'z1': qiniu.zone.Zone_z1,    // 华北
      'z2': qiniu.zone.Zone_z2,    // 华南
      'na0': qiniu.zone.Zone_na0,  // 北美
      'as0': qiniu.zone.Zone_as0,  // 东南亚
    };
    return zoneMap[region] || qiniu.zone.Zone_z0;
  }

  /**
   * 生成唯一文件名
   */
  static generateKey(prefix: string, ext: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    return `${prefix}/${timestamp}_${random}.${ext}`;
  }
}

export default QiniuService;
