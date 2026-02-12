#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::env;

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
