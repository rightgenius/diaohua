import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppConfig } from '@/types';

interface ConfigState extends AppConfig {
  isConfigured: boolean;
  setGeminiApiKey: (key: string) => void;
  setOSSConfig: (config: AppConfig['oss']) => void;
  checkConfiguration: () => boolean;
}

const defaultConfig: AppConfig = {
  geminiApiKey: '',
  oss: {
    provider: 'qiniu',
    region: '',
    bucket: '',
    accessKey: '',
    secretKey: '',
    domain: '',
  },
};

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      ...defaultConfig,
      isConfigured: false,
      
      setGeminiApiKey: (key: string) => {
        set({ geminiApiKey: key });
        get().checkConfiguration();
      },
      
      setOSSConfig: (config: AppConfig['oss']) => {
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
    }),
    {
      name: 'diaohua-config',
    }
  )
);
