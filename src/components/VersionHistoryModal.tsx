import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, RotateCcw, X, ChevronRight, Calendar } from 'lucide-react';
import { DisclosureVersion } from '../types/patent';
import { cn } from '../lib/utils';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  versions: DisclosureVersion[];
  onRevert: (version: DisclosureVersion) => void;
}

export function VersionHistoryModal({ isOpen, onClose, versions, onRevert }: VersionHistoryModalProps) {
  const [selectedVersionId, setSelectedVersionId] = React.useState<string | null>(null);
  const [isConfirming, setIsConfirming] = React.useState(false);

  const selectedVersion = versions.find(v => v.id === selectedVersionId);

  // Reset confirmation state when version changes or modal opens/closes
  React.useEffect(() => {
    setIsConfirming(false);
  }, [selectedVersionId, isOpen]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white w-full max-w-4xl max-h-[80vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-100"
          >
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-600/20">
                  <Clock className="text-white" size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">版本历史 (Version History)</h2>
                  <p className="text-xs text-gray-400 font-medium tracking-wide uppercase">管理并回滚您的技术方案状态</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 group"
              >
                <X size={20} className="group-hover:text-gray-900" />
              </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Sidebar: Version List */}
              <div className="w-1/3 border-r border-gray-100 overflow-y-auto bg-gray-50/30">
                <div className="p-4 space-y-2">
                  {versions.length === 0 ? (
                    <div className="text-center py-12 opacity-30">
                      <Clock size={32} className="mx-auto mb-2" />
                      <p className="text-xs font-bold">无版本记录</p>
                    </div>
                  ) : (
                    versions.map((v, index) => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVersionId(v.id)}
                        className={cn(
                          "w-full text-left p-4 rounded-2xl transition-all border-2 group",
                          selectedVersionId === v.id
                            ? "bg-white border-indigo-600 shadow-md ring-4 ring-indigo-50"
                            : "bg-transparent border-transparent hover:bg-white hover:border-gray-200"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest block">
                              {index === 0 ? "当前版本 / LATEST" : `版本 / V${versions.length - index}`}
                            </span>
                            <h4 className="text-sm font-bold text-gray-900">
                              {v.label || "自动保存点"}
                            </h4>
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium">
                              <Calendar size={10} />
                              {formatDate(v.timestamp)}
                            </div>
                          </div>
                          <ChevronRight 
                            size={16} 
                            className={cn(
                              "mt-1 transition-transform",
                              selectedVersionId === v.id ? "text-indigo-600 translate-x-1" : "text-gray-300"
                            )} 
                          />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Main Content: Version Preview */}
              <div className="flex-1 overflow-y-auto bg-white p-8">
                {selectedVersion ? (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between pb-6 border-b border-gray-100">
                      <div className="space-y-1">
                        <h3 className="text-lg font-bold text-gray-900">{selectedVersion.disclosure.title || '未命名交底书'}</h3>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-tight">预览所选版本的核心内容</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <AnimatePresence mode="wait">
                          {isConfirming ? (
                            <motion.div 
                              key="confirm"
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              className="flex items-center gap-2"
                            >
                              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-tight mr-2">确定覆盖当前预览并回滚吗？</span>
                              <button
                                onClick={() => onRevert(selectedVersion)}
                                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-600/20"
                              >
                                确定回滚
                              </button>
                              <button
                                onClick={() => setIsConfirming(false)}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold transition-all"
                              >
                                取消
                              </button>
                            </motion.div>
                          ) : (
                            <motion.button
                              key="revert-btn"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              onClick={() => setIsConfirming(true)}
                              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30"
                            >
                              <RotateCcw size={14} />
                              回滚到此版本
                            </motion.button>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <section className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">技术领域</label>
                        <p className="text-sm text-gray-700 bg-gray-50/50 p-4 rounded-xl border border-gray-100 leading-relaxed font-medium">
                          {selectedVersion.disclosure.field || '未填写'}
                        </p>
                      </section>
                      <section className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">背景技术概述</label>
                        <div className="text-sm text-gray-700 bg-gray-50/50 p-4 rounded-xl border border-gray-100 leading-relaxed max-h-40 overflow-y-auto scrollbar-hide">
                          {selectedVersion.disclosure.background || '未填写'}
                        </div>
                      </section>
                      <section className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">核心技术手段</label>
                        <div className="text-sm text-gray-700 bg-gray-50/50 p-4 rounded-xl border border-gray-100 leading-relaxed max-h-40 overflow-y-auto scrollbar-hide">
                          {selectedVersion.disclosure.solution || '未填写'}
                        </div>
                      </section>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-30 select-none">
                    <Clock size={48} className="text-gray-300 mb-4" />
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">请从左侧选择一个版本</h3>
                    <p className="text-[10px] font-medium mt-1">版本记录包含自动保存的操作节点</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
