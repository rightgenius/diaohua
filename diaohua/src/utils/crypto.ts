/**
 * 简单加密工具 - 用于存储敏感配置
 * 注意：这只是简单的混淆，不是真正的安全加密
 * 真正的安全存储应该使用 Tauri 的安全存储 API
 */

const ENCRYPTION_KEY = 'diaohua_oss_config_key_v1';

/**
 * 简单的 XOR 加密（用于本地存储的混淆）
 */
export function encrypt(text: string): string {
  if (!text) return '';
  
  try {
    const textBytes = new TextEncoder().encode(text);
    const keyBytes = new TextEncoder().encode(ENCRYPTION_KEY);
    const result = new Uint8Array(textBytes.length);
    
    for (let i = 0; i < textBytes.length; i++) {
      result[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    
    // 转换为 Base64
    const base64 = btoa(String.fromCharCode(...result));
    // 添加前缀标记这是加密数据
    return `enc:${base64}`;
  } catch (error) {
    console.error('Encryption failed:', error);
    return text;
  }
}

/**
 * 解密
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return '';
  
  // 检查是否是加密数据
  if (!encryptedText.startsWith('enc:')) {
    return encryptedText; // 明文返回
  }
  
  try {
    const base64 = encryptedText.slice(4); // 移除 'enc:' 前缀
    const encryptedBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const keyBytes = new TextEncoder().encode(ENCRYPTION_KEY);
    const result = new Uint8Array(encryptedBytes.length);
    
    for (let i = 0; i < encryptedBytes.length; i++) {
      result[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    
    return new TextDecoder().decode(result);
  } catch (error) {
    console.error('Decryption failed:', error);
    return '';
  }
}

/**
 * 加密对象中的敏感字段
 */
export function encryptObject<T extends Record<string, string | undefined>>(
  obj: T,
  sensitiveFields: string[]
): T {
  const result: Record<string, string | undefined> = { ...obj };
  
  for (const field of sensitiveFields) {
    const value = result[field];
    if (value && typeof value === 'string') {
      result[field] = encrypt(value);
    }
  }
  
  return result as T;
}

/**
 * 解密对象中的敏感字段
 */
export function decryptObject<T extends Record<string, string | undefined>>(
  obj: T,
  sensitiveFields: string[]
): T {
  const result: Record<string, string | undefined> = { ...obj };
  
  for (const field of sensitiveFields) {
    const value = result[field];
    if (value && typeof value === 'string') {
      result[field] = decrypt(value);
    }
  }
  
  return result as T;
}

/**
 * 生成随机 ID
 */
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${prefix}${timestamp}_${random}`;
}

/**
 * 哈希函数（简单的字符串哈希）
 */
export function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export default {
  encrypt,
  decrypt,
  encryptObject,
  decryptObject,
  generateId,
  hashString,
};
