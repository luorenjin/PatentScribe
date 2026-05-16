/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppState, ChatMessage, PatentDisclosure, DisclosureVersion } from './types/patent';
import { analyzeDraft, generateFollowUp, updateDisclosure } from './lib/aiService';
import { ChatPane } from './components/ChatPane';
import { PreviewPane } from './components/PreviewPane';
import { FileUpload } from './components/FileUpload';
import { Workbench } from './components/Workbench';
import { SettingsModal } from './components/SettingsModal';
import { VersionHistoryModal } from './components/VersionHistoryModal';
import { FileText, Edit2, Check, X, Loader2, ImagePlus, FileDown, Clock } from 'lucide-react';
import { exportToDocx, exportToPdf } from './lib/exportUtils';
import { Brain, Cpu, MessageSquare, Save, CheckCircle, Archive, Plus, Settings } from 'lucide-react';
import { Logo } from './components/Logo';
import { cn } from './lib/utils';
import { WorkbenchRecord, AppSettings } from './types/patent';

const INITIAL_SETTINGS: AppSettings = {
  llmProvider: 'google',
  modelId: 'gemini-3-flash-preview',
  isMultimodalEnabled: true,
  providers: {
    google: { modelId: 'gemini-3-flash-preview' },
    openai: { modelId: 'gpt-4o' },
    qwen: { modelId: 'qwen-max' },
    custom: { modelId: 'custom-model' }
  }
};

const INITIAL_STATE: AppState = {
  originalContent: '',
  currentDisclosure: null,
  diagnosisReport: null,
  messages: [],
  isAnalyzing: false,
  status: 'idle',
  settings: INITIAL_SETTINGS,
  versionHistory: [],
};

export default function App() {
  const [state, setState] = React.useState<AppState>(INITIAL_STATE);
  const [workbenchRecords, setWorkbenchRecords] = React.useState<WorkbenchRecord[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'saved'>('idle');

  // Initialize Workbench and Settings from localStorage
  React.useEffect(() => {
    const savedWorkbench = localStorage.getItem('patent_scribe_workbench');
    if (savedWorkbench) {
      try {
        setWorkbenchRecords(JSON.parse(savedWorkbench));
      } catch (e) {
        console.error("Failed to parse workbench records", e);
      }
    }

    const savedSettings = localStorage.getItem('patent_scribe_settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        // Merge with initial settings to ensure all required fields are present
        setState(prev => ({ 
          ...prev, 
          settings: { ...INITIAL_SETTINGS, ...parsedSettings } 
        }));
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

  // Sync to localStorage
  React.useEffect(() => {
    localStorage.setItem('patent_scribe_workbench', JSON.stringify(workbenchRecords));
  }, [workbenchRecords]);

  React.useEffect(() => {
    localStorage.setItem('patent_scribe_settings', JSON.stringify(state.settings));
  }, [state.settings]);

  const handleUpdateSettings = (settings: AppSettings) => {
    setState(prev => ({ ...prev, settings }));
  };

  const handleSaveVersion = (label?: string) => {
    if (!state.currentDisclosure) return;

    const newVersion = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      disclosure: { ...state.currentDisclosure },
      label
    };

    setState(prev => ({
      ...prev,
      versionHistory: [newVersion, ...prev.versionHistory].slice(0, 50) // Keep last 50 versions
    }));
  };

  const handleRevertVersion = (version: DisclosureVersion) => {
    setState(prev => ({
      ...prev,
      currentDisclosure: { ...version.disclosure }
    }));
    setIsHistoryOpen(false);
    addMessage('system', `🔙 **已回滚至版本:** ${version.label || '自动保存点'} (${new Date(version.timestamp).toLocaleString()})`);
  };

  const handleSaveToWorkbench = () => {
    if (!state.currentDisclosure || !state.diagnosisReport) return;

    setSaveStatus('saving');

    const newRecord: WorkbenchRecord = {
      id: Date.now().toString(),
      title: state.currentDisclosure.title || "未命名技术方案",
      timestamp: Date.now(),
      disclosure: state.currentDisclosure,
      diagnosis: state.diagnosisReport,
    };

    setWorkbenchRecords(prev => [newRecord, ...prev]);
    
    // Artificial delay for feedback
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 600);
  };

  const handleDeleteRecord = (id: string) => {
    setWorkbenchRecords(prev => prev.filter(r => r.id !== id));
  };

  const handleLoadRecord = (record: WorkbenchRecord) => {
    setState({
      ...INITIAL_STATE,
      currentDisclosure: record.disclosure,
      diagnosisReport: record.diagnosis,
      status: 'diagnosed',
      messages: [{ 
        id: 'reload', 
        role: 'assistant', 
        content: `📁 **已从工作台载入记录:** ${record.title}\n您可以继续对该方案进行优化或问答。`, 
        timestamp: Date.now() 
      }]
    });
  };

  const addMessage = (role: 'user' | 'assistant' | 'system', content: string, files?: File[]) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: Date.now(),
      files,
    };
    setState(prev => ({ ...prev, messages: [...prev.messages, newMessage] }));
  };

  const handleInitialUpload = async (content: string, files: File[] = []) => {
    setState(prev => ({ 
      ...prev, 
      originalContent: content, 
      isAnalyzing: true, 
      status: 'analyzing',
      messages: [{ id: 'init', role: 'assistant', content: '📡 **Signal Received.** 正在进行多模态深度解析图文结构...', timestamp: Date.now() }]
    }));

    try {
      const { diagnosis, disclosure } = await analyzeDraft(content, files, state.settings);
      
      setState(prev => {
        const newState = {
          ...prev,
          currentDisclosure: disclosure,
          diagnosisReport: diagnosis,
          isAnalyzing: false,
          status: 'diagnosed' as const,
        };
        
        // Save initial version
        const initialVersion = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          disclosure: { ...disclosure },
          label: '由初稿解析生成'
        };
        
        return {
          ...newState,
          versionHistory: [initialVersion]
        };
      });

      addMessage('assistant', `**深度挖掘完成。** 我已梳理出本方案与现有技术的本质区别，并为您构建了分块式交底书。

📊 **创新指数评估:**
- **创新性:** ${diagnosis.innovation}/100  
- **新颖性:** ${diagnosis.novelty}/100  
- **实用性:** ${diagnosis.utility}/100  

💡 **技术痛点与方案概述:**
${diagnosis.summary}

✨ **挖掘出的核心专利点:**
${diagnosis.patentPoints.map((p, i) => `**特征${i+1}:** ${p.feature}\n**效果:** ${p.effect}`).join('\n\n')}

为了让专利代理人能一次性看懂，进一步完善权利要求，我们还需要您补充细节，或者通过上方按钮对特定区块进行改写：`);

      // Generate first question
      const question = await generateFollowUp(disclosure, diagnosis, [], state.settings);
      addMessage('assistant', question);

    } catch (error) {
      addMessage('assistant', "❌ **System Error during analysis.** 解析失败，请重试或检查代码格式。");
      setState(prev => ({ ...prev, isAnalyzing: false }));
    }
  };

  const handleSendMessage = async (content: string, files: File[] = []) => {
    addMessage('user', content, files);
    setState(prev => ({ ...prev, isAnalyzing: true }));

    const history = state.messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role, content: m.content }));
    
    try {
      // 1. Update disclosure based on answer
      if (state.currentDisclosure) {
        const updated = await updateDisclosure(state.currentDisclosure, [...history, { role: 'user', content }], files, state.settings);
        setState(prev => ({ 
          ...prev, 
          currentDisclosure: updated,
          versionHistory: [{
            id: Date.now().toString(),
            timestamp: Date.now(),
            disclosure: { ...updated },
            label: `AI 对话优化 (${content.slice(0, 10)}${content.length > 10 ? '...' : ''})`
          }, ...prev.versionHistory].slice(0, 50)
        }));
      }

      // 2. Generate next question or conclude
      const nextQuestion = await generateFollowUp(state.currentDisclosure!, state.diagnosisReport!, history, state.settings);
      addMessage('assistant', nextQuestion);
    } catch (error) {
      addMessage('assistant', "⚠️ Failed to process response. Please try repeating your last information.");
    } finally {
      setState(prev => ({ ...prev, isAnalyzing: false }));
    }
  };

  const handleUpdateSection = (key: keyof PatentDisclosure, content: string) => {
    setState(prev => ({
      ...prev,
      currentDisclosure: prev.currentDisclosure ? {
        ...prev.currentDisclosure,
        [key]: content
      } : null
    }));
  };

  const handleExportDocx = async () => {
    if (state.currentDisclosure && state.diagnosisReport) {
      await exportToDocx(state.currentDisclosure, state.diagnosisReport);
    }
  };

  const handleExportPdf = async () => {
    if (state.currentDisclosure) {
      const filename = `专利交底书_${state.currentDisclosure.title || '未命名'}`;
      await exportToPdf('patent-preview-container', filename);
    }
  };

  const reset = () => {
    setState(INITIAL_STATE);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-app-bg text-gray-800">
      {/* Top Navbar */}
      <header className="h-14 border-b border-gray-100 bg-slate-900 text-white flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-3">
          <Logo size={32} className="shadow-lg shadow-indigo-900/20" />
          <div className="flex items-baseline gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white font-serif">PatentScribe AI</h1>
            <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-[0.3em] font-semibold">v0.6 Beta</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {state.status !== 'idle' && state.status !== 'workbench' && (
            <>
              <button 
                onClick={() => setIsHistoryOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white rounded-lg text-[11px] font-bold transition-all border border-white/5"
                title="查看历史版本"
              >
                <Clock size={14} className="text-indigo-400" />
                历史
              </button>
              <button 
                onClick={handleSaveToWorkbench}
                disabled={saveStatus !== 'idle'}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all border shrink-0 min-w-[80px] justify-center",
                  saveStatus === 'saved' 
                    ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20"
                    : saveStatus === 'saving'
                    ? "bg-white/5 border-white/10 text-white/50"
                    : "bg-white/10 hover:bg-white/20 text-white border-white/10"
                )}
                title="保存当前进度到工作台"
              >
                {saveStatus === 'saving' ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : saveStatus === 'saved' ? (
                  <CheckCircle size={14} />
                ) : (
                  <Save size={14} />
                )}
                <span>
                  {saveStatus === 'saving' ? '保存中' : saveStatus === 'saved' ? '已保存' : '保存'}
                </span>
              </button>
              <div className="h-4 w-[1px] bg-white/20 mx-2" />
              <div className="flex items-center gap-2 text-[11px] font-medium tracking-wide">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-gray-300">AI Engine:</span>
                <span className="text-white font-semibold flex items-center gap-1 uppercase tracking-tighter">
                  {state.settings.modelId.replace(/-/g, ' ')}
                </span>
              </div>
            </>
          )}

          {state.status === 'idle' && (
             <button 
               onClick={() => setState(prev => ({ ...prev, status: 'workbench' }))}
               className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all shadow-lg shadow-indigo-900/50"
             >
               <Archive size={14} />
               进入工作台
               {workbenchRecords.length > 0 && (
                 <span className="bg-white text-indigo-600 px-1.5 rounded-full text-[10px] font-bold">
                   {workbenchRecords.length}
                 </span>
               )}
             </button>
          )}

          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white ml-2"
            title="配置系统设置"
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <AnimatePresence mode="wait">
          {state.status === 'idle' ? (
            <motion.div 
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full"
            >
              <FileUpload onContentUpload={handleInitialUpload} isLoading={state.isAnalyzing} />
            </motion.div>
          ) : state.status === 'workbench' ? (
            <motion.div 
              key="workbench"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="w-full h-full"
            >
              <Workbench 
                records={workbenchRecords} 
                onLoad={handleLoadRecord} 
                onDelete={handleDeleteRecord}
                onBack={() => setState(prev => ({ ...prev, status: 'idle' }))}
                onOpenSettings={() => setIsSettingsOpen(true)}
              />
            </motion.div>
          ) : (
            <motion.div 
              key="workspace"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex w-full h-full max-w-[1440px] mx-auto border-x border-gray-200 bg-white"
            >
              <div className="w-[400px] lg:w-[450px] shrink-0 border-r border-gray-200 flex flex-col bg-gray-50">
                <ChatPane 
                  messages={state.messages} 
                  onSendMessage={handleSendMessage} 
                  isAnalyzing={state.isAnalyzing}
                  diagnosis={state.diagnosisReport}
                  onReset={reset}
                />
              </div>
              <div className="flex-1 bg-gray-100/50">
                <PreviewPane 
                  disclosure={state.currentDisclosure} 
                  isLoading={state.isAnalyzing} 
                  onExportDocx={handleExportDocx}
                  onExportPdf={handleExportPdf}
                  onUpdateSection={handleUpdateSection}
                  settings={state.settings}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Info */}
      <footer className="h-8 border-t border-gray-200 flex items-center px-6 justify-between text-[10px] font-mono text-gray-400 bg-white shrink-0 uppercase tracking-widest">
        <div className="flex gap-4">
          <div>Powered by Advanced LLM Engine</div>
          <button 
            onClick={() => setIsFeedbackOpen(true)}
            className="text-indigo-500 hover:text-indigo-600 transition-colors font-bold flex items-center gap-1"
          >
            <MessageSquare size={10} />
            反馈 BUG/需求 (Feedback)
          </button>
        </div>
        <div>Copyright © 2026 PatentScribe. All Rights Reserved.</div>
      </footer>
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        settings={state.settings}
        onUpdateSettings={handleUpdateSettings}
      />
      <VersionHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        versions={state.versionHistory}
        onRevert={handleRevertVersion}
      />

      {/* Feedback Confirmation Modal */}
      <AnimatePresence>
        {isFeedbackOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFeedbackOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100"
            >
              <div className="p-8">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
                  <MessageSquare className="text-indigo-600" size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 font-serif">反馈 BUG 或功能需求</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-6">
                  我们非常重视您的反馈！点击下方按钮将打开您的系统默认邮件客户端。
                  您可以将相关截图或详细描述发送至我们的反馈邮箱。
                </p>
                <div className="bg-gray-50 rounded-xl p-4 mb-8 border border-gray-100">
                  <div className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">反馈邮箱 (Support Email)</div>
                  <div className="text-sm font-mono font-bold text-indigo-600">luorenjin@126.com</div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button 
                    onClick={() => setIsFeedbackOpen(false)}
                    className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                  >
                    取消
                  </button>
                  <a 
                    href="mailto:luorenjin@126.com?subject=PatentScribe Feedback (Bug/Feature Request)"
                    onClick={() => setIsFeedbackOpen(false)}
                    className="flex-1 py-3 px-4 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all text-center shadow-lg shadow-indigo-200"
                  >
                    前往反馈
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
