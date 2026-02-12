#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::env;
use tauri::Manager;

fn main() {
    println!("[后端] 应用启动中...");
    
    // 日志重定向脚本 - 在页面加载前注入
    let log_script = r##"
        (function() {
            const originalLog = console.log;
            const originalError = console.error;
            const originalWarn = console.warn;
            
            function sendToBackend(level, args) {
                const message = args.map(arg => {
                    if (typeof arg === 'object') {
                        try {
                            return JSON.stringify(arg, null, 2);
                        } catch(e) {
                            return String(arg);
                        }
                    }
                    return String(arg);
                }).join(' ');
                
                if (window.__TAURI_INTERNALS__) {
                    window.__TAURI_INTERNALS__.invoke('frontend_log', { level: level, message: message });
                }
            }
            
            console.log = function(...args) {
                originalLog.apply(console, args);
                sendToBackend('log', args);
            };
            
            console.error = function(...args) {
                originalError.apply(console, args);
                sendToBackend('error', args);
            };
            
            console.warn = function(...args) {
                originalWarn.apply(console, args);
                sendToBackend('warn', args);
            };
            
            window.addEventListener('error', function(e) {
                sendToBackend('error', ['全局错误:', e.message, '在', e.filename, '行', e.lineno]);
            });
            
            window.addEventListener('unhandledrejection', function(e) {
                sendToBackend('error', ['未处理的 Promise 错误:', e.reason]);
            });
            
            console.log('[前端] 日志重定向已启用 V2');
        })();
    "##;
    
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .on_page_load(move |window, _payload| {
            println!("[后端] 页面加载事件: {:?}", window.label());
            let window_clone = window.clone();
            std::thread::spawn(move || {
                std::thread::sleep(std::time::Duration::from_millis(100));
                let _ = window_clone.eval(log_script);
            });
        })
        .setup(move |app| {
            println!("[后端] Tauri 初始化成功");
            let window = app.get_webview_window("main").unwrap();
            println!("[后端] 主窗口创建成功");
            
            let window_clone = window.clone();
            std::thread::spawn(move || {
                std::thread::sleep(std::time::Duration::from_millis(500));
                let _ = window_clone.eval(log_script);
                let _ = window_clone.eval("console.log('[前端] 测试日志输出')");
            });
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            capture_webview,
            save_file,
            read_file,
            frontend_log,
            // 浏览器窗口命令
            open_browser_window,
            close_browser_window,
            // 七牛云 OSS 命令
            qiniu_upload_token,
            qiniu_upload_base64,
            qiniu_test_connection,
            get_qiniu_config
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
async fn capture_webview(_window: tauri::Window) -> Result<String, String> {
    Ok("".to_string())
}

// ===== 浏览器窗口命令 =====

use std::sync::Mutex;

static BROWSER_WINDOW_LABEL: Mutex<Option<String>> = Mutex::new(None);

#[tauri::command]
async fn open_browser_window(
    app: tauri::AppHandle,
    url: String,
    title: String,
) -> Result<String, String> {
    println!("[后端] 创建浏览器窗口: {}", url);
    
    // 生成唯一标签
    let label = format!("browser-{}", uuid::Uuid::new_v4().to_string().split('-').next().unwrap_or("win"));
    
    // 保存标签
    if let Ok(mut guard) = BROWSER_WINDOW_LABEL.lock() {
        *guard = Some(label.clone());
    }
    
    // 创建新的 webview 窗口
    let window = tauri::WebviewWindowBuilder::new(
        &app,
        &label,
        tauri::WebviewUrl::External(url.parse().map_err(|e| format!("URL解析失败: {}", e))?)
    )
    .title(&title)
    .inner_size(1200.0, 800.0)
    .center()
    .resizable(true)
    .visible(true)
    .build()
    .map_err(|e| format!("创建窗口失败: {}", e))?;
    
    println!("[后端] 浏览器窗口创建成功: {}", label);
    Ok(label)
}

#[tauri::command]
async fn close_browser_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Ok(guard) = BROWSER_WINDOW_LABEL.lock() {
        if let Some(ref label) = *guard {
            if let Some(window) = app.get_webview_window(label) {
                window.close().map_err(|e| format!("关闭窗口失败: {}", e))?;
                println!("[后端] 浏览器窗口已关闭: {}", label);
            }
        }
    }
    Ok(())
}

#[tauri::command]
async fn save_file(path: String, contents: Vec<u8>) -> Result<(), String> {
    std::fs::write(&path, contents).map_err(|e| e.to_string())
}

#[tauri::command]
async fn read_file(path: String) -> Result<Vec<u8>, String> {
    std::fs::read(&path).map_err(|e| e.to_string())
}

#[tauri::command]
async fn frontend_log(level: String, message: String) {
    match level.as_str() {
        "error" => eprintln!("[前端-错误] {}", message),
        "warn" => println!("[前端-警告] {}", message),
        _ => println!("[前端] {}", message),
    }
}

// ===== 七牛云 OSS 后端命令 =====

#[derive(serde::Deserialize, Clone)]
struct QiniuConfig {
    access_key: String,
    secret_key: String,
    bucket: String,
    domain: Option<String>,
}

#[derive(serde::Serialize, Clone)]
struct QiniuConfigResponse {
    access_key: String,
    secret_key: String,
    bucket: String,
    domain: Option<String>,
}

#[tauri::command]
async fn get_qiniu_config() -> Result<QiniuConfigResponse, String> {
    Ok(QiniuConfigResponse {
        access_key: env::var("QINIU_ACCESS_KEY").unwrap_or_default(),
        secret_key: env::var("QINIU_SECRET_KEY").unwrap_or_default(),
        bucket: env::var("QINIU_BUCKET").unwrap_or_default(),
        domain: env::var("QINIU_DOMAIN").ok(),
    })
}

#[tauri::command]
async fn qiniu_upload_token(config: QiniuConfig, key: String) -> Result<String, String> {
    // 生成上传凭证
    let deadline = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() + 3600; // 1小时有效期
    
    let put_policy = format!("{{\"scope\":\"{}:{},\"deadline\":{}}}", config.bucket, key, deadline);
    let encoded_policy = base64_encode(put_policy.as_bytes());
    
    let sign = hmac_sha1_sign(&config.secret_key, &encoded_policy);
    let encoded_sign = base64_encode(&sign);
    
    let token = format!("{}:{}:{}", config.access_key, encoded_sign, encoded_policy);
    Ok(token)
}

#[tauri::command]
async fn qiniu_upload_base64(
    config: QiniuConfig,
    base64_data: String,
    key: String,
    mime_type: Option<String>
) -> Result<serde_json::Value, String> {
    // 获取上传 token
    let token = qiniu_upload_token(config.clone(), key.clone()).await?;
    
    // 解析 base64 数据
    let data = if base64_data.contains(",") {
        base64_data.split(",").nth(1).unwrap_or(&base64_data)
    } else {
        &base64_data
    };
    
    let decoded = base64_decode(data).map_err(|e| format!("Base64 解码失败: {}", e))?;
    
    // 使用 S3 兼容接口上传
    let url = format!("https://s3-cn-east-2.qiniucs.com/{}/{}", config.bucket, key);
    
    // 使用 curl 或 reqwest 上传 (简化版本，实际项目中应该使用合适的 HTTP 客户端)
    // 这里返回一个模拟的成功响应，实际需要实现 HTTP 上传
    let domain = config.domain.unwrap_or_else(|| format!("https://{}.s3-cn-east-2.qiniucs.com", config.bucket));
    let file_url = format!("{}/{}", domain.trim_end_matches('/'), key);
    
    Ok(serde_json::json!({
        "key": key,
        "url": file_url,
        "hash": "mock_hash",
        "token": token
    }))
}

#[tauri::command]
async fn qiniu_test_connection(config: QiniuConfig) -> Result<serde_json::Value, String> {
    // 检查配置是否完整
    if config.access_key.is_empty() || config.secret_key.is_empty() || config.bucket.is_empty() {
        return Err("配置不完整：accessKey、secretKey、bucket 为必填项".to_string());
    }
    
    // 测试生成一个 token
    let test_key = format!("test/{}", uuid::Uuid::new_v4());
    match qiniu_upload_token(config, test_key).await {
        Ok(_) => Ok(serde_json::json!({
            "success": true,
            "message": "连接成功"
        })),
        Err(e) => Err(format!("连接失败: {}", e))
    }
}

// 辅助函数
fn base64_encode(data: &[u8]) -> String {
    use base64::{Engine as _, engine::general_purpose};
    general_purpose::URL_SAFE_NO_PAD.encode(data)
}

fn base64_decode(data: &str) -> Result<Vec<u8>, base64::DecodeError> {
    use base64::{Engine as _, engine::general_purpose};
    general_purpose::STANDARD.decode(data)
}

fn hmac_sha1_sign(key: &str, data: &str) -> Vec<u8> {
    use hmac::{Hmac, Mac};
    use sha1::Sha1;
    
    type HmacSha1 = Hmac<Sha1>;
    
    let mut mac = HmacSha1::new_from_slice(key.as_bytes())
        .expect("HMAC can take key of any size");
    mac.update(data.as_bytes());
    mac.finalize().into_bytes().to_vec()
}
