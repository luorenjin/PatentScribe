import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Settings2, 
  Cpu, 
  Zap, 
  Globe, 
  Sparkles, 
  MessageSquare, 
  Terminal, 
  Key, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  ShieldCheck 
} from 'lucide-react';
import { AppSettings, ProviderConfig } from '../types/patent';
import { cn } from '../lib/utils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
}

export function SettingsModal({ isOpen, onClose, settings, onUpdateSettings }: SettingsModalProps) {
  const [showApiKey, setShowApiKey] = React.useState(false);

  const providers = [
    { 
      id: 'builtin', 
      name: '内置', 
      icon: Sparkles, 
      color: 'text-indigo-500', 
      disabled: false,
      consoleUrl: '',
      defaultEndpoint: ''
    },
    { 
      id: 'qwen', 
      name: '通义千问 (Qwen)', 
      icon: MessageSquare, 
      color: 'text-purple-500', 
      disabled: false,
      consoleUrl: 'https://dashscope.console.aliyun.com/apiKey',
      defaultEndpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
    },
    { 
      id: 'google', 
      name: 'Google Gemini', 
      icon: Globe, 
      color: 'text-blue-500', 
      disabled: false,
      consoleUrl: 'https://aistudio.google.com/app/apikey',
      defaultEndpoint: 'https://generativelanguage.googleapis.com'
    },
    { 
      id: 'openai', 
      name: 'OpenAI', 
      icon: Zap, 
      color: 'text-emerald-500', 
      disabled: false,
      consoleUrl: 'https://platform.openai.com/api-keys',
      defaultEndpoint: 'https://api.openai.com/v1'
    },
    { 
      id: 'custom', 
      name: '自定义配置', 
      icon: Terminal, 
      color: 'text-gray-500', 
      disabled: false,
      defaultEndpoint: ''
    },
  ];

  const models = [
    { id: 'gemini-3-flash-preview', name: 'Gemini 3.1 Flash (Fast & Balanced)', type: 'google' },
    { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro (Deep Reasoning)', type: 'google' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Advanced Logic)', type: 'google' },
    { id: 'gpt-5.4', name: 'OpenAI GPT5.4 (Next Gen Reasoning)', type: 'openai' },
    { id: 'gpt-5.4-mini', name: 'OpenAI GPT5.4 Mini (Preview)', type: 'openai' },
    { id: 'qwen3.6-plus', name: 'Qwen 3.6 Plus (Latest Precision)', type: 'qwen' },
    { id: 'qwen3.6-flash', name: 'Qwen 3.6 Flash (Fast & Powerful)', type: 'qwen' },
    { id: 'qwen3.5-plus', name: 'Qwen 3.5 Plus (Speed & Efficiency)', type: 'qwen' },
    { id: 'qwen3.5-flash', name: 'Qwen 3.5 Flash (Lightweight)', type: 'qwen' },

  ];

  const currentProviderConfig = settings.providers?.[settings.llmProvider] || {};

  const handleUpdateProviderConfig = (updates: Partial<ProviderConfig>) => {
    onUpdateSettings({
      ...settings,
      modelId: (settings.llmProvider === settings.llmProvider && updates.modelId) ? updates.modelId : settings.modelId,
      providers: {
        ...settings.providers,
        [settings.llmProvider]: {
          ...currentProviderConfig,
          ...updates
        }
      }
    });
  };

  const handleModelSelect = (modelId: string) => {
    onUpdateSettings({
      ...settings,
      modelId: modelId,
      providers: {
        ...settings.providers,
        [settings.llmProvider]: {
          ...currentProviderConfig,
          modelId: modelId
        }
      }
    });
  };

  const handleProviderChange = (providerId: string) => {
    if (providerId === settings.llmProvider) return;

    const providerConfig = settings.providers?.[providerId as keyof typeof settings.providers] || {};
    const providerDef = providers.find(p => p.id === providerId);
    let targetModelId = providerConfig.modelId;

    if (!targetModelId) {
      if (providerId === 'builtin') {
        targetModelId = 'qwen3.6-plus';
      } else if (providerId === 'custom') {
        targetModelId = 'custom-model';
      } else {
        const firstModel = models.find(m => m.type === providerId);
        targetModelId = firstModel ? firstModel.id : '';
      }
    }

    onUpdateSettings({ 
      ...settings, 
      llmProvider: providerId as any, 
      modelId: targetModelId,
      providers: {
        ...settings.providers,
        [providerId]: {
          ...providerConfig,
          modelId: targetModelId,
          apiEndpoint: providerConfig.apiEndpoint || providerDef?.defaultEndpoint || ''
        }
      }
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl z-[101] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100/50 rounded-lg text-indigo-600">
                  <Settings2 size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 leading-tight">系统配置</h2>
                  <p className="text-[11px] text-gray-500 font-medium">配置您的 AI 专利分析引擎</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar">
              {/* Provider */}
              <section>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 block">
                  模型提供商 (PROVIDER)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {providers.map((p) => {
                    const Icon = p.icon;
                    const isSelected = settings.llmProvider === p.id;
                    return (
                      <button
                        key={p.id}
                        disabled={p.disabled}
                        onClick={() => handleProviderChange(p.id)}
                        className={cn(
                          "relative flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all group",
                          isSelected 
                            ? "border-indigo-600 bg-indigo-50/50 shadow-sm" 
                            : "border-gray-100 hover:border-indigo-100 bg-white shadow-sm hover:shadow-md",
                          p.disabled && "opacity-50 cursor-not-allowed grayscale"
                        )}
                      >
                        <Icon size={24} className={isSelected ? "text-indigo-600" : "text-gray-400 group-hover:text-indigo-400"} />
                        <span className={cn(
                          "text-xs font-bold",
                          isSelected ? "text-indigo-900" : "text-gray-500"
                        )}>
                          {p.name}
                        </span>
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Model Select */}
              <section>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 block">
                  核心计算引擎 (ENGINE)
                </label>
                <div className="space-y-2">
                  {settings.llmProvider === 'builtin' ? (
                    <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Cpu size={18} className="text-indigo-600" />
                        <span className="text-sm font-semibold text-indigo-900">内置智能引擎 (Qwen 核心)</span>
                      </div>
                      <Sparkles size={16} className="text-indigo-500 animate-pulse" />
                    </div>
                  ) : settings.llmProvider === 'custom' ? (
                    <div className="space-y-4">
                      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
                        <Terminal size={18} className="text-amber-600 mt-0.5 shrink-0" />
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-amber-900">自定义中转环境 (Custom API Proxy)</h4>
                          <p className="text-[10px] text-amber-700 leading-relaxed font-medium">
                            此模式允许您接入任何兼容 OpenAI 接口标准的私有模型或第三方代理。
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">自定义模型识别码 (MODEL ID)</label>
                        <div className="relative group">
                          <Cpu className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                          <input 
                            type="text"
                            placeholder="如: deepseek-reasoner, llama-3.1"
                            value={currentProviderConfig.modelId || ''}
                            onChange={(e) => handleUpdateProviderConfig({ modelId: e.target.value })}
                            className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-4 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {models.filter(m => m.type === settings.llmProvider).map((m) => (
                        <button
                          key={m.id}
                          onClick={() => handleModelSelect(m.id)}
                          className={cn(
                            "flex items-center justify-between p-4 rounded-xl border transition-all",
                            (currentProviderConfig.modelId || settings.modelId) === m.id 
                              ? "border-indigo-600 bg-indigo-50/50" 
                              : "border-gray-100 hover:border-indigo-100 bg-white"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Cpu size={18} className={(currentProviderConfig.modelId || settings.modelId) === m.id ? "text-indigo-600" : "text-gray-400"} />
                            <span className={cn(
                              "text-sm font-semibold",
                              (currentProviderConfig.modelId || settings.modelId) === m.id ? "text-indigo-900" : "text-gray-600"
                            )}>
                              {m.name}
                            </span>
                          </div>
                          {(currentProviderConfig.modelId || settings.modelId) === m.id && <Sparkles size={16} className="text-indigo-600 animate-pulse" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* API Credentials */}
              <section className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                {settings.llmProvider === 'builtin' ? (
                  <div className="flex items-start gap-3 p-2">
                    <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600 shrink-0">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">开箱即用</h4>
                      <p className="text-[11px] text-gray-500 leading-relaxed mt-1">
                        系统正在使用预置的内置大模型引擎。您无需配置任何 API Key 或代理地址即可开始使用全部核心分析功能。如果需要更高级的自定义，请随时切换到其他提供商。
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                        接口配置 (API CREDENTIALS)
                      </label>
                      {providers.find(p => p.id === settings.llmProvider)?.consoleUrl && (
                        <a 
                          href={providers.find(p => p.id === settings.llmProvider)?.consoleUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[10px] text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-indigo-100 shadow-sm transition-all"
                        >
                          获取 API KEY
                          <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div className="relative group">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                          type={showApiKey ? "text" : "password"}
                          placeholder="请输入 API Key"
                          value={currentProviderConfig.apiKey || ''}
                          onChange={(e) => handleUpdateProviderConfig({ apiKey: e.target.value })}
                          className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-12 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors"
                        >
                          {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      <div className="relative">
                        <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                          type="text"
                          placeholder="请输入 API 代理地址 (Endpoint URL)"
                          value={currentProviderConfig.apiEndpoint || ''}
                          onChange={(e) => handleUpdateProviderConfig({ apiEndpoint: e.target.value })}
                          className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex items-start gap-2 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                      <div className="p-1 bg-indigo-100 rounded text-indigo-600 mt-0.5">
                        <ShieldCheck size={12} />
                      </div>
                      <p className="text-[10px] text-indigo-700 leading-relaxed font-medium">
                        <span className="font-bold underline">安全说明</span>：API Key 已通过 Tauri Store 安全地存储在您的本地文件系统中，不再依赖浏览器的 LocalStorage。
                      </p>
                    </div>
                  </>
                )}
              </section>

              {/* Features */}
              <section>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 block">
                  高级功能 (FEATURES)
                </label>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm text-indigo-500">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-900">多模态识别 (Vision)</div>
                      <div className="text-[10px] text-gray-500">支持技术图纸、流程图自动解析</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => onUpdateSettings({ ...settings, isMultimodalEnabled: !settings.isMultimodalEnabled })}
                    className={cn(
                      "w-10 h-5 rounded-full transition-colors relative",
                      settings.isMultimodalEnabled ? "bg-indigo-600" : "bg-gray-300"
                    )}
                  >
                    <motion.div 
                      animate={{ x: settings.isMultimodalEnabled ? 20 : 4 }}
                      className="absolute top-1 w-3 h-3 bg-white rounded-full transition-all" 
                    />
                  </button>
                </div>
              </section>
            </div>

            <div className="p-6 bg-gray-50/50 border-t border-gray-100 shrink-0 flex gap-3">
              <button
                onClick={() => {
                  const defaultSettings: AppSettings = {
                    llmProvider: 'builtin',
                    modelId: 'qwen3.6-plus',
                    isMultimodalEnabled: true,
                    providers: {
                      builtin: { modelId: 'qwen3.6-plus' },
                      qwen: { modelId: 'qwen3.6-plus' },
                      google: { modelId: 'gemini-3-flash-preview' },
                      openai: { modelId: 'gpt-4o' },
                      custom: { modelId: 'custom-model' }
                    }
                  };
                  onUpdateSettings(defaultSettings);
                }}
                className="flex-1 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-all active:scale-95"
              >
                恢复默认
              </button>
              <button
                onClick={onClose}
                className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-900/20 hover:bg-indigo-700 transition-all active:scale-95"
              >
                保存并载入
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
