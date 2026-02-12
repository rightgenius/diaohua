import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { encrypt, decrypt } from '@/utils/crypto';
import type { AppConfig, OSSConfig } from '@/types';

interface ConfigState extends AppConfig {
  isConfigured: boolean;
  isAIConfigured: boolean;
  isOSSConfigured: boolean;
  lastValidatedAt: number | null;
  validationError: string | null;
  localConfigLoaded: boolean;
  localConfigPath: string | null;
  
  // Actions
  setGeminiApiKey: (key: string) => void;
  setOSSConfig: (config: OSSConfig) => void;
  checkConfiguration: () => boolean;
  validateOSSConfig: () => Promise<{ valid: boolean; error?: string }>;
  isOSSConfigValid: () => boolean;
  clearValidationError: () => void;
  resetConfig: () => void;
  loadLocalConfig: () => Promise<void>;
  saveToLocalConfig: () => Promise<void>;
}

const defaultConfig: AppConfig = {
  geminiApiKey: '',
  oss: {
    provider: 's3',
    endpoint: '',
    region: 'cn-east-1',
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
      isAIConfigured: false,
      isOSSConfigured: false,
      lastValidatedAt: null,
      validationError: null,
      localConfigLoaded: false,
      localConfigPath: null,

      /**
       * 加载本地配置文件
       */
      loadLocalConfig: async () => {
        try {
          const result = await window.electronAPI.loadLocalConfig();
          
          if (result.success && result.config) {
            const { geminiApiKey, oss } = result.config;
            
            // 合并本地配置（本地配置优先级更高，会覆盖 store 中的值）
            const updates: Partial<ConfigState> = {};
            
            if (geminiApiKey) {
              updates.geminiApiKey = geminiApiKey;
            }
            
            if (oss) {
              updates.oss = {
                ...get().oss,
                ...oss,
                provider: (oss.provider || get().oss.provider) as OSSConfig['provider'],
              };
            }
            
            set({
              ...updates,
              localConfigLoaded: true,
              localConfigPath: result.path,
            });
            
            // 重新检查配置状态
            get().checkConfiguration();
            
            console.log('[ConfigStore] 本地配置已加载:', result.path);
          } else {
            set({ localConfigLoaded: true, localConfigPath: null });
          }
        } catch (error) {
          console.error('[ConfigStore] 加载本地配置失败:', error);
          set({ localConfigLoaded: true, localConfigPath: null });
        }
      },

      /**
       * 保存当前配置到本地配置文件
       */
      saveToLocalConfig: async () => {
        try {
          const { geminiApiKey, oss } = get();
          const result = await window.electronAPI.saveLocalConfig({
            geminiApiKey,
            oss,
          });
          
          if (result.success) {
            set({ localConfigPath: result.path });
            console.log('[ConfigStore] 配置已保存到:', result.path);
          }
        } catch (error) {
          console.error('[ConfigStore] 保存本地配置失败:', error);
        }
      },

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
        // AI 配置：只需要 Gemini API Key
        const isAIConfigured = !!(geminiApiKey && geminiApiKey.length > 10);
        // OSS 配置：需要 bucket、accessKey、secretKey
        const isOSSConfigured = !!(
          oss.bucket &&
          oss.accessKey &&
          oss.secretKey
        );
        // 总体配置状态：至少配置了一项算是已配置
        const isConfigured = isAIConfigured || isOSSConfigured;
        set({ isConfigured, isAIConfigured, isOSSConfigured });
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
          isAIConfigured: false,
          isOSSConfigured: false,
          lastValidatedAt: null,
          validationError: null,
        });
      },
    }),
    {
      name: 'diaohua-config',
      // 加载时解密敏感字段，然后加载本地配置（本地配置优先级更高）
      onRehydrateStorage: () => (state) => {
        console.log('[ConfigStore] onRehydrateStorage 触发, state:', state ? '存在' : 'null');
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
          console.log('[ConfigStore] 解密后的 geminiApiKey:', state.geminiApiKey ? '存在' : '空');
        }
        // 延迟加载本地配置（确保 store 完全初始化后执行）
        setTimeout(() => {
          console.log('[ConfigStore] 延迟加载本地配置...');
          useConfigStore.getState().loadLocalConfig();
        }, 100);
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
