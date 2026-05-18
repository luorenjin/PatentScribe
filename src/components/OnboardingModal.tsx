import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Globe, 
  Zap, 
  MessageSquare, 
  Terminal, 
  Key, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  ShieldCheck,
  ArrowRight,
  Cpu
} from 'lucide-react';
import { AppSettings, ProviderConfig } from '../types/patent';
import { cn } from '../lib/utils';
import { Logo } from './Logo';

interface OnboardingModalProps {
  isOpen: boolean;
  settings: AppSettings;
  onComplete: (settings: AppSettings) => void;
}

export function OnboardingModal({ isOpen, settings, onComplete }: OnboardingModalProps) {
  const [currentSettings, setCurrentSettings] = React.useState<AppSettings>(settings);
  const [showApiKey, setShowApiKey] = React.useState(false);

  const providers = [
    { 
      id: 'google', 
      name: 'Google Gemini', 
      icon: Globe, 
      color: 'text-blue-500', 
      disabled: false,
      consoleUrl: 'https://aistudio.google.com/app/apikey',
      defaultEndpoint: 'https://generativelanguage.googleapis.com',
      description: '免费额度高，支持多模态解析（推荐）'
    },
    { 
      id: 'qwen', 
      name: '通义千问 (Qwen)', 
      icon: MessageSquare, 
      color: 'text-purple-500', 
      disabled: false,
      consoleUrl: 'https://dashscope.console.aliyun.com/apiKey',
      defaultEndpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      description: '国内访问稳定，专利文档理解能力强'
    },
    { 
      id: 'openai', 
      name: 'OpenAI', 
      icon: Zap, 
      color: 'text-emerald-500', 
      disabled: false,
      consoleUrl: 'https://platform.openai.com/api-keys',
      defaultEndpoint: 'https://api.openai.com/v1',
      description: '行业标准，逻辑推理能力出色'
    },
    { 
      id: 'custom', 
      name: '自定义 API', 
      icon: Terminal, 
      color: 'text-gray-500', 
      disabled: false,
      defaultEndpoint: '',
      description: '接入中转接口或私有化部署模型'
    },
  ];

  const currentProviderConfig = currentSettings.providers?.[currentSettings.llmProvider] || {};
  const isKeyEntered = !!currentProviderConfig.apiKey?.trim();

  const handleProviderChange = (providerId: string) => {
    const providerDef = providers.find(p => p.id === providerId);
    const providerConfig = currentSettings.providers?.[providerId as keyof typeof currentSettings.providers] || {};
    
    let targetModelId = providerConfig.modelId;
    if (!targetModelId) {
      if (providerId === 'google') targetModelId = 'gemini-3-flash-preview';
      else if (providerId === 'openai') targetModelId = 'gpt-4o';
      else if (providerId === 'qwen') targetModelId = 'qwen-max';
      else targetModelId = 'custom-model';
    }

    setCurrentSettings({ 
      ...currentSettings, 
      llmProvider: providerId as any, 
      modelId: targetModelId,
      providers: {
        ...currentSettings.providers,
        [providerId]: {
          ...providerConfig,
          modelId: targetModelId,
          apiEndpoint: providerConfig.apiEndpoint || providerDef?.defaultEndpoint || ''
        }
      }
    });
  };

  const handleUpdateProviderConfig = (updates: Partial<ProviderConfig>) => {
    setCurrentSettings({
      ...currentSettings,
      providers: {
        ...currentSettings.providers,
        [currentSettings.llmProvider]: {
          ...currentProviderConfig,
          ...updates
        }
      }
    });
  };

  const selectedProvider = providers.find(p => p.id === currentSettings.llmProvider);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/90 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col m-4"
          >
            {/* Header / Intro */}
            <div className="p-8 pb-4 text-center">
              <div className="flex justify-center mb-6">
                <Logo size={64} className="shadow-xl shadow-indigo-500/20" />
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2 font-serif">欢迎开启 PatentScribe AI</h2>
              <p className="text-gray-500 max-w-md mx-auto text-sm leading-relaxed">
                在使用 AI 专利协作功能前，我们需要您配置一个大模型引擎。您的 API Key 将被安全地存储在本地。
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-8 pt-4 custom-scrollbar">
              <div className="space-y-8">
                {/* Step 1: Provider Selection */}
                <section>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 block text-center">
                    第一步：选择计算引擎提供商 (SELECT PROVIDER)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {providers.map((p) => {
                      const Icon = p.icon;
                      const isSelected = currentSettings.llmProvider === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => handleProviderChange(p.id)}
                          className={cn(
                            "flex items-start gap-4 p-4 rounded-2xl border text-left transition-all relative group",
                            isSelected 
                              ? "border-indigo-600 bg-indigo-50 shadow-sm" 
                              : "border-gray-100 hover:border-indigo-200 bg-white"
                          )}
                        >
                          <div className={cn(
                            "p-3 rounded-xl transition-colors",
                            isSelected ? "bg-indigo-600 text-white" : "bg-gray-50 text-gray-400 group-hover:text-indigo-400"
                          )}>
                            <Icon size={20} />
                          </div>
                          <div className="space-y-0.5">
                            <div className={cn(
                              "text-sm font-bold",
                              isSelected ? "text-indigo-900" : "text-gray-900"
                            )}>
                              {p.name}
                            </div>
                            <div className="text-[10px] text-gray-500 leading-tight">
                              {p.description}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="absolute top-3 right-3">
                              <Sparkles size={14} className="text-indigo-600 animate-pulse" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Step 2: Credentials */}
                <section className={cn(
                  "space-y-4 transition-all",
                  !currentSettings.llmProvider ? "opacity-30 pointer-events-none" : "opacity-100"
                )}>
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                      第二步：配置接口凭证 (API CREDENTIALS)
                    </label>
                    {selectedProvider?.consoleUrl && (
                      <a 
                        href={selectedProvider.consoleUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[10px] text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1"
                      >
                        去获取 API KEY
                        <ExternalLink size={10} />
                      </a>
                    )}
                  </div>

                  <div className="bg-slate-50 p-6 rounded-2xl border border-gray-100 space-y-4">
                    <div className="space-y-2">
                      <div className="text-[10px] font-bold text-gray-500 uppercase ml-1">API Key</div>
                      <div className="relative group">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                          type={showApiKey ? "text" : "password"}
                          placeholder="请输入您的 API Key"
                          value={currentProviderConfig.apiKey || ''}
                          onChange={(e) => handleUpdateProviderConfig({ apiKey: e.target.value })}
                          className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-12 py-3.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors"
                        >
                          {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-[10px] font-bold text-gray-500 uppercase ml-1">默认模型 (Model ID)</div>
                      <div className="relative group">
                        <Cpu className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                          type="text"
                          placeholder="例如: gemini-3-flash-preview"
                          value={currentProviderConfig.modelId || ''}
                          onChange={(e) => handleUpdateProviderConfig({ modelId: e.target.value })}
                          className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-600 mt-0.5">
                      <ShieldCheck size={16} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-emerald-900">安全与隐私保障</h4>
                      <p className="text-[10px] text-emerald-700 leading-relaxed font-medium">
                        您的 API Key 仅存储在本地设备。我们绝不会在云端存储您的任何接口凭证或原始专利交底内容。
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            {/* Footer / Complete */}
            <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex flex-col gap-4 shrink-0">
              <button
                disabled={!isKeyEntered}
                onClick={() => onComplete(currentSettings)}
                className={cn(
                  "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95",
                  isKeyEntered 
                    ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200" 
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                )}
              >
                {isKeyEntered ? (
                  <>
                    进入 PatentScribe
                    <ArrowRight size={18} />
                  </>
                ) : (
                  "请先输入 API Key 以继续"
                )}
              </button>
              <p className="text-[10px] text-gray-400 text-center font-medium">
                您可以随时在应用右上角的“设置”中修改这些配置
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
