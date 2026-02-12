const { app, BrowserWindow, ipcMain, desktopCapturer, screen, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const crypto = require('crypto');

// 保持窗口对象的全局引用，防止垃圾回收
let mainWindow = null;

// 创建主窗口
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    title: '雕花 - 产品经理需求标注工具',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
      webSecurity: false, // 允许跨域（开发时）
    },
    show: false, // 先不显示，等加载完成再显示
    center: true,
  });

  // 加载应用
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:1420');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // 加载完成后显示窗口
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // 窗口关闭时清理
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 应用就绪时创建窗口
app.whenReady().then(() => {
  console.log('[Electron] 应用启动中...');
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

// 所有窗口关闭时退出应用
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ===== IPC 处理器 =====

// 日志
ipcMain.handle('log', async (event, level, message) => {
  const prefix = '[渲染进程]';
  switch (level) {
    case 'error':
      console.error(prefix, message);
      break;
    case 'warn':
      console.warn(prefix, message);
      break;
    default:
      console.log(prefix, message);
  }
});

// 系统截图 - 使用 desktopCapturer
ipcMain.handle('capture-screen', async () => {
  console.log('[Electron] 开始截取屏幕');
  
  try {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.size;
    const { x, y } = primaryDisplay.bounds;
    
    console.log(`[Electron] 屏幕尺寸: ${width}x${height} @ (${x}, ${y})`);

    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width, height },
    });

    const primarySource = sources.find(source => source.display_id === String(primaryDisplay.id)) || sources[0];
    
    if (!primarySource) {
      throw new Error('未找到屏幕源');
    }

    // thumbnail 是 NativeImage
    const image = primarySource.thumbnail;
    const base64 = image.toDataURL();
    
    console.log(`[Electron] 截图完成，数据大小: ${base64.length} bytes`);
    return base64;
  } catch (error) {
    console.error('[Electron] 截图失败:', error);
    throw error;
  }
});

// 网页截图 - 使用 BrowserWindow.capturePage
ipcMain.handle('capture-webpage', async (event, url, options = {}) => {
  console.log(`[Electron] 开始截取网页: ${url}`);
  
  const {
    width = 1920,
    height = 1080,
    waitTime = 3000,
    fullPage = false,
  } = options;

  // 创建隐藏的浏览器窗口
  const captureWindow = new BrowserWindow({
    width,
    height,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      offscreen: true, // 离屏渲染
    },
  });

  try {
    // 加载页面
    await captureWindow.loadURL(url);
    
    // 等待页面加载和渲染
    await new Promise(resolve => setTimeout(resolve, waitTime));
    
    // 截图
    let image;
    if (fullPage) {
      // 获取页面完整尺寸
      const pageSize = await captureWindow.webContents.executeJavaScript(`
        (() => {
          const body = document.body;
          const html = document.documentElement;
          return {
            width: Math.max(body.scrollWidth, body.offsetWidth, html.clientWidth, html.scrollWidth, html.offsetWidth),
            height: Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight),
          };
        })()
      `);
      
      // 调整窗口大小
      captureWindow.setSize(pageSize.width, pageSize.height);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      image = await captureWindow.webContents.capturePage();
    } else {
      image = await captureWindow.webContents.capturePage();
    }

    const base64 = image.toDataURL();
    console.log(`[Electron] 网页截图完成，数据大小: ${base64.length} bytes`);
    
    return base64;
  } catch (error) {
    console.error('[Electron] 网页截图失败:', error);
    throw error;
  } finally {
    captureWindow.close();
  }
});

// 文件保存对话框
ipcMain.handle('show-save-dialog', async (event, options) => {
  if (!mainWindow) return { canceled: true };
  
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

// 文件打开对话框
ipcMain.handle('show-open-dialog', async (event, options) => {
  if (!mainWindow) return { canceled: true };
  
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

// 保存文件
ipcMain.handle('save-file', async (event, filePath, data) => {
  try {
    // 如果是 Uint8Array，转换为 Buffer
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    fs.writeFileSync(filePath, buffer);
    return { success: true };
  } catch (error) {
    console.error('[Electron] 保存文件失败:', error);
    throw error;
  }
});

// 读取文件
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const data = fs.readFileSync(filePath);
    return data;
  } catch (error) {
    console.error('[Electron] 读取文件失败:', error);
    throw error;
  }
});

// 读取文件为 base64
ipcMain.handle('read-file-base64', async (event, filePath) => {
  try {
    const data = fs.readFileSync(filePath);
    const base64 = data.toString('base64');
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = getMimeType(ext);
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('[Electron] 读取文件失败:', error);
    throw error;
  }
});

// ===== 七牛云 OSS 相关 =====

// Base64 URL 安全编码
function base64UrlSafe(data) {
  return data.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// HMAC-SHA1 签名
function hmacSha1(key, data) {
  return crypto.createHmac('sha1', key).update(data).digest();
}

// 生成七牛上传 Token
ipcMain.handle('qiniu-upload-token', async (event, config, key) => {
  const { accessKey, secretKey, bucket } = config;
  const deadline = Math.floor(Date.now() / 1000) + 3600;
  
  const putPolicy = JSON.stringify({
    scope: key ? `${bucket}:${key}` : bucket,
    deadline: deadline,
  });
  
  const encodedPolicy = base64UrlSafe(Buffer.from(putPolicy));
  const sign = hmacSha1(secretKey, encodedPolicy);
  const encodedSign = base64UrlSafe(sign);
  
  const token = `${accessKey}:${encodedSign}:${encodedPolicy}`;
  return token;
});

// 七牛云文件上传
ipcMain.handle('qiniu-upload', async (event, config, base64Data, key, mimeType = 'image/png') => {
  const { bucket, domain, region = 'cn-east-2' } = config;
  
  // 获取上传 Token
  const token = await ipcMain.handle('qiniu-upload-token', event, config, key);
  
  // 处理 base64 数据
  const base64String = base64Data.replace(/^data:[^;]+;base64,/, '');
  const buffer = Buffer.from(base64String, 'base64');
  
  // 构建上传 URL
  const uploadUrl = getQiniuUploadUrl(region);
  
  // 构建 multipart/form-data
  const boundary = `----ElectronFormBoundary${Date.now()}`;
  const formData = buildMultipartForm(boundary, [
    { name: 'token', value: token },
    { name: 'key', value: key },
    { name: 'file', filename: key.split('/').pop() || 'file', contentType: mimeType, data: buffer },
  ]);

  return new Promise((resolve, reject) => {
    const url = new URL(uploadUrl);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': formData.length,
      },
    };

    const protocol = url.protocol === 'https:' ? https : http;
    const req = protocol.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          if (res.statusCode === 200) {
            const fileUrl = domain 
              ? `${domain.replace(/\/$/, '')}/${result.key}`
              : `https://s3-${region}.qiniucs.com/${bucket}/${result.key}`;
            resolve({
              key: result.key,
              url: fileUrl,
              hash: result.hash,
              size: buffer.length,
            });
          } else {
            reject(new Error(`上传失败: ${responseData}`));
          }
        } catch (error) {
          reject(new Error(`解析响应失败: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(formData);
    req.end();
  });
});

// 七牛云连接测试
ipcMain.handle('qiniu-test-connection', async (event, config) => {
  try {
    const testKey = `test/${Date.now()}_${Math.random().toString(36).substring(2, 10)}.txt`;
    const testContent = 'test connection';
    const base64Data = `data:text/plain;base64,${Buffer.from(testContent).toString('base64')}`;
    
    await ipcMain.handle('qiniu-upload', event, config, base64Data, testKey, 'text/plain');
    return { success: true, message: '连接成功' };
  } catch (error) {
    console.error('[Electron] 七牛连接测试失败:', error);
    return { success: false, message: `连接失败: ${error.message}` };
  }
});

// 辅助函数：获取七牛上传域名
function getQiniuUploadUrl(region) {
  const regionMap = {
    'z0': 'https://upload.qiniup.com',
    'z1': 'https://upload-z1.qiniup.com',
    'z2': 'https://upload-z2.qiniup.com',
    'na0': 'https://upload-na0.qiniup.com',
    'as0': 'https://upload-as0.qiniup.com',
    'cn-east-2': 'https://upload-cn-east-2.qiniup.com',
  };
  return regionMap[region] || regionMap['z0'];
}

// 辅助函数：构建 multipart/form-data
function buildMultipartForm(boundary, fields) {
  const lines = [];
  
  for (const field of fields) {
    lines.push(`--${boundary}`);
    if (field.filename) {
      lines.push(`Content-Disposition: form-data; name="${field.name}"; filename="${field.filename}"`);
      lines.push(`Content-Type: ${field.contentType || 'application/octet-stream'}`);
      lines.push('');
      lines.push(field.data);
    } else {
      lines.push(`Content-Disposition: form-data; name="${field.name}"`);
      lines.push('');
      lines.push(field.value);
    }
  }
  
  lines.push(`--${boundary}--`);
  
  // 将所有部分转换为 Buffer
  const buffers = [];
  for (let i = 0; i < lines.length; i++) {
    if (Buffer.isBuffer(lines[i])) {
      buffers.push(lines[i]);
      buffers.push(Buffer.from('\r\n'));
    } else {
      buffers.push(Buffer.from(lines[i] + '\r\n'));
    }
  }
  
  return Buffer.concat(buffers);
}

// 辅助函数：获取 MIME 类型
function getMimeType(ext) {
  const mimeTypes = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.json': 'application/json',
    '.md': 'text/markdown',
    '.txt': 'text/plain',
    '.pdf': 'application/pdf',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// 获取应用版本
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// 获取平台信息
ipcMain.handle('get-platform', () => {
  return process.platform;
});

console.log('[Electron] 主进程已加载');
