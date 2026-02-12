const { app, BrowserWindow, ipcMain, desktopCapturer, screen, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const crypto = require('crypto');

// 安全的日志函数，防止 EPIPE 错误
function safeLog(...args) {
  try {
    console.log(...args);
  } catch (e) {
    // 忽略控制台写入错误
  }
}

function safeError(...args) {
  try {
    console.error(...args);
  } catch (e) {
    // 忽略控制台写入错误
  }
}

// 保持窗口对象的全局引用，防止垃圾回收
let mainWindow = null;

// 创建主窗口
function createMainWindow() {
  // 根据平台选择图标
  const iconPath = (() => {
    if (process.platform === 'win32') {
      return path.join(__dirname, '../public/icon.ico');
    }
    // macOS 和 Linux 使用 PNG
    return path.join(__dirname, '../public/icon.png');
  })();
  
  safeLog('[Electron] 使用图标:', iconPath);

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    title: '雕花 - 产品经理需求标注工具',
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
      webSecurity: false, // 允许跨域（开发时）
    },
    show: false, // 先不显示，等加载完成再显示
    center: true,
  });

  // macOS: 设置 Dock 图标（使用 PNG，ICNS 只用于打包）
  if (process.platform === 'darwin') {
    const dockIconPath = path.join(__dirname, '../public/icon.png');
    if (fs.existsSync(dockIconPath)) {
      try {
        app.dock.setIcon(dockIconPath);
        safeLog('[Electron] Dock 图标已设置');
      } catch (e) {
        safeError('[Electron] 设置 Dock 图标失败:', e.message);
      }
    }
  }

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
  safeLog('[Electron] 应用启动中...');
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
  try {
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
  } catch (e) {
    // 忽略控制台写入错误
  }
});

// 系统截图 - 使用 desktopCapturer
ipcMain.handle('capture-screen', async () => {
  safeLog('[Electron] 开始截取屏幕');
  
  try {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.size;
    const { x, y } = primaryDisplay.bounds;
    
    safeLog(`[Electron] 屏幕尺寸: ${width}x${height} @ (${x}, ${y})`);

    // 获取屏幕源，添加超时处理
    const sources = await Promise.race([
      desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width, height },
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('获取屏幕源超时')), 10000)
      )
    ]);

    if (!sources || sources.length === 0) {
      throw new Error('未找到屏幕源，请检查屏幕录制权限');
    }

    const primarySource = sources.find(source => source.display_id === String(primaryDisplay.id)) || sources[0];
    
    if (!primarySource) {
      throw new Error('未找到主屏幕源');
    }

    // thumbnail 是 NativeImage
    const image = primarySource.thumbnail;
    if (!image || image.isEmpty()) {
      throw new Error('截图数据为空，请检查屏幕录制权限');
    }
    
    const base64 = image.toDataURL();
    
    safeLog(`[Electron] 截图完成，数据大小: ${base64.length} bytes`);
    return base64;
  } catch (error) {
    safeError('[Electron] 截图失败:', error);
    // 返回更友好的错误信息
    if (error.message && error.message.includes('screen recording')) {
      throw new Error('需要屏幕录制权限。请在系统设置 > 隐私与安全性 > 屏幕录制中启用本应用。');
    }
    throw error;
  }
});

// 网页截图 - 使用 BrowserWindow.capturePage
ipcMain.handle('capture-webpage', async (event, url, options = {}) => {
  safeLog(`[Electron] 开始截取网页: ${url}`);
  
  const {
    width = 1920,
    height = 1080,
    waitTime = 3000,
    fullPage = false,
  } = options;

  let captureWindow = null;

  try {
    // 创建隐藏的浏览器窗口（不使用离屏渲染，更稳定）
    captureWindow = new BrowserWindow({
      width,
      height,
      show: false,
      skipTaskbar: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        // 不使用 offscreen 渲染，避免不稳定问题
      },
    });

    // 处理加载失败事件
    let didFailLoad = false;
    captureWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      didFailLoad = true;
      safeError(`[Electron] 页面加载失败: ${errorDescription} (${errorCode})`);
    });

    // 加载页面，添加超时处理
    await Promise.race([
      captureWindow.loadURL(url),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('页面加载超时')), 30000)
      )
    ]);
    
    if (didFailLoad) {
      throw new Error('页面加载失败，请检查网址是否可访问');
    }
    
    // 等待页面加载和渲染
    await new Promise(resolve => setTimeout(resolve, waitTime));
    
    // 检查页面是否加载成功（可以通过检查标题或执行简单的 JS）
    try {
      await captureWindow.webContents.executeJavaScript('document.readyState');
    } catch (e) {
      throw new Error('页面脚本执行失败，可能受 CSP 限制');
    }
    
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
    safeLog(`[Electron] 网页截图完成，数据大小: ${base64.length} bytes`);
    
    return base64;
  } catch (error) {
    safeError('[Electron] 网页截图失败:', error);
    // 提供更友好的错误信息
    const errorMsg = error.message || String(error);
    if (errorMsg.includes('ERR_NAME_NOT_RESOLVED') || errorMsg.includes('ERR_CONNECTION_REFUSED')) {
      throw new Error('无法连接到目标网站，请检查网址和网络连接');
    } else if (errorMsg.includes('timeout')) {
      throw new Error('页面加载超时，请稍后重试');
    }
    throw error;
  } finally {
    // 确保窗口被销毁
    if (captureWindow && !captureWindow.isDestroyed()) {
      captureWindow.destroy();
    }
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
    safeError('[Electron] 保存文件失败:', error);
    throw error;
  }
});

// 读取文件
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const data = fs.readFileSync(filePath);
    return data;
  } catch (error) {
    safeError('[Electron] 读取文件失败:', error);
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
    safeError('[Electron] 读取文件失败:', error);
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
    safeError('[Electron] 七牛连接测试失败:', error);
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

// 读取本地配置文件
ipcMain.handle('load-local-config', async () => {
  try {
    // 按优先级查找配置文件
    // electron/main.cjs 的 __dirname 是 electron/ 目录，上溯一级到 diaohua/ 目录
    const configPaths = [
      // 1. 项目根目录（开发时）
      path.join(__dirname, '../diaohua-config.json'),
      // 2. 用户数据目录
      path.join(app.getPath('userData'), 'diaohua-config.json'),
      // 3. 应用目录（生产环境）
      path.join(process.resourcesPath || '', 'diaohua-config.json'),
    ];
    
    for (const configPath of configPaths) {
      if (fs.existsSync(configPath)) {
        safeLog('[Electron] 找到本地配置文件:', configPath);
        const content = fs.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(content);
        
        // 规范化配置结构
        const result = {
          geminiApiKey: config.geminiApiKey || '',
          oss: config.storage ? {
            provider: config.storage.provider || 'qiniu',
            endpoint: config.storage.endpoint || '',
            region: config.storage.region || 'z0',
            bucket: config.storage.bucket || '',
            accessKey: config.storage.accessKey || '',
            secretKey: config.storage.secretKey || '',
            domain: config.storage.domain || '',
          } : null,
        };
        
        safeLog('[Electron] 本地配置加载成功');
        return { success: true, config: result, path: configPath };
      }
    }
    
    // 没有找到配置文件
    return { success: true, config: null, path: null };
  } catch (error) {
    safeError('[Electron] 读取本地配置文件失败:', error.message);
    return { success: false, error: error.message, config: null, path: null };
  }
});

// 保存本地配置文件（仅保存到用户数据目录）
ipcMain.handle('save-local-config', async (event, config) => {
  try {
    const configPath = path.join(app.getPath('userData'), 'diaohua-config.json');
    const configData = {
      geminiApiKey: config.geminiApiKey || '',
      storage: config.oss ? {
        provider: config.oss.provider || 'qiniu',
        endpoint: config.oss.endpoint || '',
        region: config.oss.region || '',
        bucket: config.oss.bucket || '',
        accessKey: config.oss.accessKey || '',
        secretKey: config.oss.secretKey || '',
        domain: config.oss.domain || '',
      } : undefined,
    };
    
    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2), 'utf-8');
    safeLog('[Electron] 本地配置已保存:', configPath);
    return { success: true, path: configPath };
  } catch (error) {
    safeError('[Electron] 保存本地配置文件失败:', error.message);
    return { success: false, error: error.message };
  }
});

safeLog('[Electron] 主进程已加载');

// 防止 EPIPE 等错误导致应用崩溃
process.stdout.on('error', (err) => {
  // 忽略 stdout 写入错误（通常是管道被关闭）
  if (err.code === 'EPIPE') {
    return;
  }
  // 其他错误记录到文件（使用用户目录，避免依赖 app 是否 ready）
  try {
    const logDir = app.isReady() ? app.getPath('logs') : require('os').tmpdir();
    fs.appendFileSync(
      path.join(logDir, 'electron-error.log'),
      `[${new Date().toISOString()}] stdout error: ${err.message}\n`
    );
  } catch (e) {
    // 如果连文件写入都失败，就只能忽略
  }
});

process.stderr.on('error', (err) => {
  // 忽略 stderr 写入错误
  if (err.code === 'EPIPE') {
    return;
  }
});

// 捕获未处理的错误，防止应用崩溃
process.on('uncaughtException', (error) => {
  if (error.code === 'EPIPE') {
    // EPIPE 错误不需要崩溃应用
    safeError('[Electron] 捕获到 EPIPE 错误，已忽略');
    return;
  }
  safeError('[Electron] 未捕获的异常:', error);
  // 其他严重错误可能需要退出应用
});

process.on('unhandledRejection', (reason, promise) => {
  safeError('[Electron] 未处理的 Promise 拒绝:', reason);
});
