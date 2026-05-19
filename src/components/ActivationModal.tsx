import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, Mail, Key, Copy, CheckCircle2, AlertCircle, Loader2, Download } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { ACTIVATION_CONFIG } from '../config/activation';
import { saveActivation } from '../lib/storage';
import { cn } from '../lib/utils';

interface ActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivated: (expiryDate?: string) => void;
}

type Tab = 'email' | 'license';

export function ActivationModal({ isOpen, onClose, onActivated }: ActivationModalProps) {
  const [activeTab, setActiveTab] = React.useState<Tab>(
    ACTIVATION_CONFIG.ENABLE_EMAIL_VERIFICATION ? 'email' : 'license'
  );
  const [machineCode, setMachineCode] = React.useState<string>('加载中...');
  const [email, setEmail] = React.useState('');
  const [code, setCode] = React.useState('');
  const [licenseText, setLicenseText] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [countdown, setCountdown] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [isCopied, setIsCopied] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      invoke<string>('get_machine_code').then(setMachineCode).catch(console.error);
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleCopyMachineCode = async () => {
    try {
      await navigator.clipboard.writeText(machineCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSendCode = async () => {
    if (!email || !email.includes('@')) {
      setError('请输入有效的企业邮箱');
      return;
    }
    
    const domain = email.split('@')[1];
    if (ACTIVATION_CONFIG.ALLOWED_EMAIL_DOMAINS.length > 0 && 
        !ACTIVATION_CONFIG.ALLOWED_EMAIL_DOMAINS.includes(domain)) {
      setError(`仅限以下后缀激活: ${ACTIVATION_CONFIG.ALLOWED_EMAIL_DOMAINS.join(', ')}`);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // 模拟发送验证码接口调用
      console.log(`Sending code to ${email} for machine ${machineCode}`);
      await new Promise(resolve => setTimeout(resolve, 1500));
      setCountdown(60);
      alert('验证码已发送，请检查您的企业邮箱（包括垃圾邮件箱）');
    } catch (err) {
      setError('发送失败，请检查网络或联系管理员');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!code) return;
    setIsLoading(true);
    setError(null);
    try {
      // 模拟验证码校验并获取 License
      await new Promise(resolve => setTimeout(resolve, 1500));
      // 这里的逻辑应该是从服务器获取签名的 licenseData
      const mockLicense = `LICENSE_FOR_${machineCode}_EXPIRES_2026_12_31`;
      const result = await invoke<{ isValid: boolean, expiryDate: string | null }>('verify_license', { 
        licenseData: mockLicense, 
        machineCode 
      });
      
      if (result.isValid) {
        await saveActivation(mockLicense);
        onActivated(result.expiryDate || undefined);
        onClose();
      } else {
        setError('激活校验失败，请重试');
      }
    } catch (err) {
      setError('验证出错，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportLicense = async () => {
    if (!licenseText) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await invoke<{ isValid: boolean, expiryDate: string | null }>('verify_license', { 
        licenseData: licenseText, 
        machineCode 
      });
      
      if (result.isValid) {
        await saveActivation(licenseText);
        onActivated(result.expiryDate || undefined);
        onClose();
      } else {
        setError('无效的授权文件或机器码不匹配');
      }
    } catch (err) {
      setError('授权文件解析失败');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100"
      >
        {/* Header */}
        <div className="bg-indigo-600 px-8 py-6 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-indigo-100">软件激活认证</h2>
              <p className="text-indigo-100 text-sm opacity-90">请激活以解锁专利交底书智能解析功能</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {ACTIVATION_CONFIG.ENABLE_EMAIL_VERIFICATION && (
            <button
              onClick={() => setActiveTab('email')}
              className={cn(
                "flex-1 py-4 text-sm font-bold transition-all flex items-center justify-center gap-2",
                activeTab === 'email' ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <Mail size={16} /> 企业邮箱激活
            </button>
          )}
          {ACTIVATION_CONFIG.ENABLE_LICENSE_FILE && (
            <button
              onClick={() => setActiveTab('license')}
              className={cn(
                "flex-1 py-4 text-sm font-bold transition-all flex items-center justify-center gap-2",
                activeTab === 'license' ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <Key size={16} /> 机器码授权激活
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          <AnimatePresence mode="wait">
            {activeTab === 'email' ? (
              <motion.div 
                key="email"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">企业邮箱地址</label>
                  <div className="flex gap-2">
                    <input 
                      type="email" 
                      placeholder="name@company.com"
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <button
                      disabled={isLoading || countdown > 0}
                      onClick={handleSendCode}
                      className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-100 disabled:opacity-50 transition-all whitespace-nowrap"
                    >
                      {countdown > 0 ? `${countdown}s` : '获取验证码'}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">6位数字验证码</label>
                  <input 
                    type="text" 
                    placeholder="000000"
                    maxLength={6}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm tracking-[0.5em] text-center font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
                <button
                  disabled={isLoading || code.length !== 6}
                  onClick={handleVerifyEmail}
                  className="w-full bg-indigo-600 text-white rounded-xl py-4 font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                  立即验证并激活
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="license"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">本机唯一机器码</span>
                    <button 
                      onClick={handleCopyMachineCode}
                      className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:underline"
                    >
                      {isCopied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                      {isCopied ? '已复制' : '复制机器码'}
                    </button>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-3 text-center font-mono text-lg font-bold text-gray-700 tracking-wider">
                    {machineCode}
                  </div>
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    请将上方机器码发送至 <span className="text-indigo-500 font-bold">{ACTIVATION_CONFIG.SUPPORT_EMAIL}</span>，获取对应的授权文件。
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">导入授权内容</label>
                  <textarea 
                    placeholder="粘贴收到的 License 授权密文..."
                    className="w-full h-24 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none"
                    value={licenseText}
                    onChange={(e) => setLicenseText(e.target.value)}
                  />
                </div>

                <button
                  disabled={isLoading || !licenseText}
                  onClick={handleImportLicense}
                  className="w-full bg-indigo-600 text-white rounded-xl py-4 font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
                  导入并激活
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium flex items-center gap-2"
            >
              <AlertCircle size={14} />
              {error}
            </motion.div>
          )}

          <div className="pt-2 text-center">
            <p className="text-[10px] text-gray-400 font-medium">
              激活过程中遇到问题？请联系技术支持：{ACTIVATION_CONFIG.SUPPORT_EMAIL}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
