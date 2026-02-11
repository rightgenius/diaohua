import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { encrypt, decrypt } from '@/utils/crypto';
import type { AppConfig, OSSConfig } from '@/types';

interface ConfigState extends AppConfig {
  isConfigured: boolean;
  lastValidatedAt: number | null;
  validationError: string | null;
  
  // Actions
  setGeminiApiKey: (key: string) => void;
  setOSSConfig: (config: OSSConfig) => void;
  checkConfiguration: () => boolean;
  validateOSSConfig: () => Promise<{ valid: boolean; error?: string }>;
  isOSSConfigValid: () => boolean;
  clearValidationError: () => void;
  resetConfig: () => void;
}

const defaultConfig: AppConfig = {
  geminiApiKey: '',
  oss: {
    provider: 'qiniu',
    region: 'z0',
    bucket: '',
    accessKey: '',
    secretKey: '',
    domain: '',
  },
};

// 需要加密的敏感字段
const SENSITIVE_FIELDS: (keyof OSSConfig)[] = ['secretKey', 'accessKey'];

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      ...defaultConfig,
      isConfigured: false,
      lastValidatedAt: null,
      validationError: null,

      setGeminiApiKey: (key: string) => {
        set({ geminiApiKey: key });
        get().checkConfiguration();
      },

      setOSSConfig: (config: OSSConfig) => {
        set({ oss: config });
        get().checkConfiguration();
      },

      checkConfiguration: () => {
        const { geminiApiKey, oss } = get();
        const isConfigured = !!(
          geminiApiKey &&
          oss.bucket &&
          oss.accessKey &&
          oss.secretKey
        );
        set({ isConfigured });
        return isConfigured;
      },

      /**
       * 验证 OSS 配置是否有效
       */
      validateOSSConfig: async () => {
        const { oss } = get();
        
        // 基本校验
        if (!oss.bucket || !oss.accessKey || !oss.secretKey) {
          const error = 'OSS 配置不完整：bucket、accessKey、secretKey 为必填项';
          set({ validationError: error, lastValidatedAt: Date.now() });
          return { valid: false, error };
        }

        // 动态导入 OSSService 避免循环依赖
        try {
          const { OSSService } = await import('@/services/oss');
          const service = new OSSService();
          const result = await service.testConnection();
          
          if (result.success) {
            set({ validationError: null, lastValidatedAt: Date.now() });
            return { valid: true };
          } else {
            set({ validationError: result.message, lastValidatedAt: Date.now() });
            return { valid: false, error: result.message };
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : '验证失败';
          set({ validationError: errorMsg, lastValidatedAt: Date.now() });
          return { valid: false, error: errorMsg };
        }
      },

      /**
       * 检查 OSS 配置是否完整（不验证连接）
       */
      isOSSConfigValid: () => {
        const { oss } = get();
        return !!(oss.bucket && oss.accessKey && oss.secretKey);
      },

      clearValidationError: () => {
        set({ validationError: null });
      },

      resetConfig: () => {
        set({
          ...defaultConfig,
          isConfigured: false,
          lastValidatedAt: null,
          validationError: null,
        });
      },
    }),
    {
      name: 'diaohua-config',
      // 加载时解密敏感字段
      onRehydrateStorage: () => (state) => {
        if (state) {
          // 解密敏感字段
          const newOss = { ...state.oss };
          for (const field of SENSITIVE_FIELDS) {
            const value = newOss[field];
            if (value && typeof value === 'string' && value.startsWith('enc:')) {
              (newOss as Record<string, string>)[field] = decrypt(value);
            }
          }
          state.oss = newOss;
        }
      },
      // 存储前加密敏感字段
      partialize: (state) => {
        const partial = { ...state, oss: { ...state.oss } };
        // 加密敏感字段
        for (const field of SENSITIVE_FIELDS) {
          const value = partial.oss[field];
          if (value && typeof value === 'string' && !value.startsWith('enc:')) {
            (partial.oss as Record<string, string>)[field] = encrypt(value);
          }
        }
        return partial;
      },
    }
  )
);

export default useConfigStore;
