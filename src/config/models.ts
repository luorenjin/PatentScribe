export interface ModelInfo {
  id: string;
  name: string;
  provider: 'google' | 'openai' | 'qwen' | 'builtin' | 'custom';
  supportsVision: boolean;
}

/**
 * 同步自 SettingsModal.tsx 原有模型列表
 */
export const AVAILABLE_MODELS: ModelInfo[] = [
  // Google Gemini
  { id: 'gemini-3-flash-preview', name: 'Gemini 3.1 Flash (Fast & Balanced)', provider: 'google', supportsVision: true },
  { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro (Deep Reasoning)', provider: 'google', supportsVision: true },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Advanced Logic)', provider: 'google', supportsVision: true },
  
  // OpenAI
  { id: 'gpt-5.4', name: 'OpenAI GPT5.4 (Next Gen Reasoning)', provider: 'openai', supportsVision: true },
  { id: 'gpt-5.4-mini', name: 'OpenAI GPT5.4 Mini (Preview)', provider: 'openai', supportsVision: true },
  { id: 'gpt-4o', name: 'OpenAI GPT-4o (Stable)', provider: 'openai', supportsVision: true },
  
  // Qwen (Alibaba)
  { id: 'qwen3.6-plus', name: 'Qwen 3.6 Plus (Latest Precision)', provider: 'qwen', supportsVision: true },
  { id: 'qwen3.6-flash', name: 'Qwen 3.6 Flash (Fast & Powerful)', provider: 'qwen', supportsVision: true },
  { id: 'qwen3.5-plus', name: 'Qwen 3.5 Plus (Speed & Efficiency)', provider: 'qwen', supportsVision: true },
  { id: 'qwen3.5-flash', name: 'Qwen 3.5 Flash (Lightweight)', provider: 'qwen', supportsVision: true },
];

export interface ProviderDefaultConfig {
  mainModel: string;
  backupModel: string;
  apiEndpoint?: string;
}

export const DEFAULT_PROVIDER_CONFIGS: Record<string, ProviderDefaultConfig> = {
  builtin: {
    mainModel: "qwen3.6-flash-2026-04-16",
    backupModel: "qwen3.6-plus-2026-04-02",
    apiEndpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  },
  google: {
    mainModel: "gemini-3-flash-preview",
    backupModel: "gemini-3.1-flash-lite", // 保持 aiService.ts 原有逻辑
  },
  openai: {
    mainModel: "gpt-5.4",
    backupModel: "gpt-5.4-mini",
    apiEndpoint: "https://api.openai.com/v1",
  },
  qwen: {
    mainModel: "qwen3.6-plus",
    backupModel: "qwen3.6-flash",
    apiEndpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  },
  custom: {
    mainModel: "custom-model",
    backupModel: "custom-model",
  }
};

/**
 * 判断模型是否支持视觉能力
 */
export function isModelVisionSupported(modelId: string): boolean {
  const model = AVAILABLE_MODELS.find(m => m.id === modelId);
  if (model) return model.supportsVision;
  
  // 智能降级匹配
  const lowId = modelId.toLowerCase();
  return (
    lowId.includes('gpt-4o') || 
    lowId.includes('gpt-5') || 
    lowId.includes('vision') || 
    lowId.includes('vl') || 
    lowId.includes('gemini') ||
    lowId.includes('qwen3')
  );
}
