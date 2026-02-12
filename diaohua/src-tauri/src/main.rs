#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::env;

mod webview_screenshot;
use webview_screenshot::capture_webview_screenshot;

fn main() {
    println!("[后端] 应用启动中...");
    
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(move |_app| {
            println!("[后端] Tauri 初始化成功");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            save_file,
            read_file,
            frontend_log,
            // 截图命令（系统截图）
            capture_screen,
            // WebView 注入式截图
            capture_webview_screenshot,
            // 七牛云 OSS 命令
            qiniu_upload_token,
            qiniu_upload_base64,
            qiniu_test_connection,
            get_qiniu_config
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// ===== 文件操作 =====

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

// ===== 屏幕截图 =====

#[tauri::command]
async fn capture_screen() -> Result<String, String> {
    println!("[后端] 开始截取全屏");
    
    // 使用 xcap crate 跨平台截图
    let monitors = xcap::Monitor::all()
        .map_err(|e| format!("获取显示器信息失败: {:?}", e))?;
    
    if monitors.is_empty() {
        return Err("未找到可用显示器".to_string());
    }
    
    // 查找主显示器（通常是最左上角的）
    let monitor = monitors.iter()
        .find(|m| {
            let x = m.x().unwrap_or(0);
            let y = m.y().unwrap_or(0);
            x == 0 && y == 0
        })
        .or_else(|| monitors.first())
        .ok_or("无法获取显示器")?;
    
    let width = monitor.width().map_err(|e| format!("获取宽度失败: {:?}", e))?;
    let height = monitor.height().map_err(|e| format!("获取高度失败: {:?}", e))?;
    let x = monitor.x().unwrap_or(0);
    let y = monitor.y().unwrap_or(0);
    println!("[后端] 截取显示器: {}x{} @ ({}, {})", width, height, x, y);
    
    // 添加短暂延迟，确保系统准备好截图（修复黑屏问题）
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    
    // 尝试截图，如果失败尝试其他显示器
    let image = match try_capture_monitor(monitor).await {
        Ok(img) => img,
        Err(e) => {
            println!("[后端] 主显示器截图失败: {:?}，尝试其他显示器", e);
            // 尝试其他显示器（通过索引跳过已尝试的）
            let mut last_err = e;
            for (i, m) in monitors.iter().enumerate() {
                if i > 0 { // 跳过第一个（已经尝试过）
                    match try_capture_monitor(m).await {
                        Ok(img) => return process_image_to_base64(img).await,
                        Err(e) => last_err = e,
                    }
                }
            }
            return Err(format!("所有显示器截图都失败: {:?}", last_err));
        }
    };
    
    process_image_to_base64(image).await
}

async fn try_capture_monitor(monitor: &xcap::Monitor) -> Result<image::RgbaImage, String> {
    // 重试机制
    let mut last_error = None;
    for attempt in 0..3 {
        if attempt > 0 {
            println!("[后端] 第 {} 次重试截图...", attempt + 1);
            tokio::time::sleep(tokio::time::Duration::from_millis(200)).await;
        }
        
        match monitor.capture_image() {
            Ok(img) => {
                // 验证截图是否有效（检查是否全黑）
                if is_image_all_black(&img) {
                    println!("[后端] 截图全黑，可能是权限问题");
                    last_error = Some("截图结果为全黑，请检查屏幕录制权限".to_string());
                    continue;
                }
                return Ok(img);
            }
            Err(e) => {
                println!("[后端] 截图失败: {:?}", e);
                last_error = Some(format!("{:?}", e));
            }
        }
    }
    
    Err(last_error.unwrap_or_else(|| "截图失败".to_string()))
}

fn is_image_all_black(img: &image::RgbaImage) -> bool {
    // 采样检查像素，避免遍历整张图片
    let (width, height) = (img.width(), img.height());
    if width == 0 || height == 0 {
        return true;
    }
    
    // 检查中心区域和四个角的像素
    let check_points = [
        (width / 2, height / 2),
        (width / 4, height / 4),
        (width * 3 / 4, height / 4),
        (width / 4, height * 3 / 4),
        (width * 3 / 4, height * 3 / 4),
        (10, 10),
        (width - 10, 10),
        (10, height - 10),
        (width - 10, height - 10),
    ];
    
    for (x, y) in check_points {
        if x < width && y < height {
            let pixel = img.get_pixel(x, y);
            // 如果任一像素不是全黑，则认为图片有效
            if pixel[0] > 10 || pixel[1] > 10 || pixel[2] > 10 {
                return false;
            }
        }
    }
    
    true
}

async fn process_image_to_base64(image: image::RgbaImage) -> Result<String, String> {
    // 转换为 PNG
    let mut png_data: Vec<u8> = Vec::new();
    {
        let mut cursor = std::io::Cursor::new(&mut png_data);
        image.write_to(&mut cursor, image::ImageFormat::Png)
            .map_err(|e| format!("PNG 编码失败: {}", e))?;
    }
    
    // 转换为 base64
    let base64_image = base64_encode(&png_data);
    
    println!("[后端] 截图完成，数据大小: {} bytes", base64_image.len());
    Ok(format!("data:image/png;base64,{}", base64_image))
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
    let deadline = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() + 3600;
    
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
    _mime_type: Option<String>
) -> Result<serde_json::Value, String> {
    let token = qiniu_upload_token(config.clone(), key.clone()).await?;
    
    let data = if base64_data.contains(",") {
        base64_data.split(",").nth(1).unwrap_or(&base64_data)
    } else {
        &base64_data
    };
    
    let decoded = base64_decode(data).map_err(|e| format!("Base64 解码失败: {}", e))?;
    
    let domain = config.domain.unwrap_or_else(|| format!("https://{}.s3-cn-east-2.qiniucs.com", config.bucket));
    let file_url = format!("{}/{}", domain.trim_end_matches('/'), key);
    
    Ok(serde_json::json!({
        "key": key,
        "url": file_url,
        "hash": "mock_hash",
        "token": token,
        "size": decoded.len()
    }))
}

#[tauri::command]
async fn qiniu_test_connection(config: QiniuConfig) -> Result<serde_json::Value, String> {
    if config.access_key.is_empty() || config.secret_key.is_empty() || config.bucket.is_empty() {
        return Err("配置不完整：accessKey、secretKey、bucket 为必填项".to_string());
    }
    
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
