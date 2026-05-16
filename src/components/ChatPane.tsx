import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Bot, Loader2, PlayCircle, AlertCircle, ImagePlus, X, Lightbulb, ChevronUp, ChevronDown, MessageSquare, PieChart } from 'lucide-react';
import { ChatMessage, DiagnosisReport, PatentDisclosure } from '../types/patent';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';

interface ChatPaneProps {
  messages: ChatMessage[];
  onSendMessage: (content: string, files: File[]) => void;
  isAnalyzing: boolean;
  diagnosis: DiagnosisReport | null;
  onReset: () => void;
}

export function ChatPane({ messages, onSendMessage, isAnalyzing, diagnosis, onReset }: ChatPaneProps) {
  const [input, setInput] = React.useState('');
  const [attachedFiles, setAttachedFiles] = React.useState<File[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'diagnosis'>('chat');
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (scrollRef.current && activeTab === 'chat') {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isAnalyzing, activeTab]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && attachedFiles.length === 0) || isAnalyzing) return;
    onSendMessage(input, attachedFiles);
    setInput('');
    setAttachedFiles([]);
    setActiveTab('chat');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
      setActiveTab('chat');
    }
  };

  const handleApplyAlternative = (alternative: string) => {
    onSendMessage(`请采用这个替代方案进行扩充：${alternative}`, []);
    setActiveTab('chat');
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 border-r border-gray-200 relative overflow-hidden">
      {/* Tabs Header */}
      <div className="flex border-b border-gray-200 bg-white shrink-0 shadow-sm z-10 px-4 pt-2 gap-2">
        <button
          onClick={() => setActiveTab('chat')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors border-b-2",
            activeTab === 'chat' 
              ? "bg-indigo-50/50 text-indigo-700 border-indigo-600" 
              : "text-gray-500 hover:bg-gray-100 hover:text-gray-700 border-transparent"
          )}
        >
          <MessageSquare size={16} />
          智能助手
        </button>
        <button
          onClick={() => setActiveTab('diagnosis')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors border-b-2 relative",
            activeTab === 'diagnosis' 
              ? "bg-indigo-50/50 text-indigo-700 border-indigo-600" 
              : "text-gray-500 hover:bg-gray-100 hover:text-gray-700 border-transparent"
          )}
        >
          <PieChart size={16} />
          诊断图谱
          {diagnosis && activeTab !== 'diagnosis' && (
            <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto relative hidden-scrollbar" ref={scrollRef}>
        <AnimatePresence mode="wait">
          {activeTab === 'diagnosis' && (
            <motion.div
              key="diagnosis"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 overflow-y-auto bg-white p-6"
            >
              <div className="max-w-md mx-auto">
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center justify-between">
                  <span>诊断报告 (DIAGNOSTIC)</span>
                  {diagnosis && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[9px]">已完成</span>}
                </h3>
                  
                {diagnosis ? (
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <ScoreRow label="创新性 (Innovation)" score={diagnosis.innovation} color="bg-indigo-600" />
                      <ScoreRow label="新颖性 (Novelty)" score={diagnosis.novelty} color="bg-amber-400" textColor="text-amber-600" />
                      <ScoreRow label="实用性 (Utility)" score={diagnosis.utility} color="bg-indigo-500" />
                    </div>

                    {diagnosis.patentPoints && diagnosis.patentPoints.length > 0 && (
                      <div className="pt-6 border-t border-gray-100">
                        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <PlayCircle size={14} className="text-emerald-500" />
                          提炼出的核心专利点
                        </h4>
                        <div className="space-y-4">
                          {diagnosis.patentPoints.map((point, i) => (
                            <div key={i} className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100/50 shadow-sm transition-all hover:shadow-md">
                              <div className="text-sm font-bold text-indigo-900 mb-2 flex items-start gap-2">
                                <span className="bg-indigo-200 text-indigo-800 text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0 mt-0.5">#{i + 1}</span>
                                {point.feature}
                              </div>
                              <div className="text-xs text-indigo-700/80 leading-relaxed border-t border-indigo-100/50 pt-2 mt-2">
                                <span className="font-semibold mix-blend-multiply text-indigo-800">技术效果：</span>{point.effect}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {diagnosis.alternatives && diagnosis.alternatives.length > 0 && (
                      <div className="pt-6 border-t border-gray-100">
                        <h4 className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <Lightbulb size={14} />
                          AI 发散推荐 (扩展保护范围)
                        </h4>
                        <div className="space-y-4">
                          {diagnosis.alternatives.map((alt, i) => (
                            <div key={i} className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100/50 shadow-sm transition-all hover:shadow-md">
                              <div className="text-sm font-bold text-amber-900 mb-2">{alt.suggestion}</div>
                              <div className="text-xs text-amber-800/80 leading-relaxed my-2 bg-white/50 p-2 rounded">
                                <span className="font-semibold">发散原因：</span>{alt.reason}
                              </div>
                              <button 
                                onClick={() => handleApplyAlternative(alt.suggestion)}
                                className="mt-3 w-full justify-center text-xs bg-white border border-amber-200 text-amber-700 px-3 py-2 rounded-lg hover:bg-amber-100 hover:border-amber-300 transition-colors flex items-center gap-1.5 font-semibold shadow-sm"
                              >
                                <Bot size={14} />
                                采用该建议并扩写
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {diagnosis.missingItems && diagnosis.missingItems.length > 0 && (
                      <div className="pt-6 border-t border-gray-100">
                        <h4 className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <AlertCircle size={14} />
                          待补充技术细节
                        </h4>
                        <ul className="space-y-2">
                          {diagnosis.missingItems.map((item, i) => (
                            <li key={i} className="text-sm text-gray-600 flex items-start gap-2 bg-rose-50/30 p-2 rounded-lg border border-rose-100/50">
                              <span className="text-rose-400 mt-0.5 shrink-0">•</span>
                              <span className="leading-snug">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                    <PieChart size={32} className="text-gray-300 mb-4" />
                    <span className="text-sm text-gray-400 font-medium">暂无诊断数据</span>
                    <span className="text-xs text-gray-400 mt-1">上传交底书后在此查看</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="min-h-full p-6 space-y-6 flex flex-col justify-end"
            >
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-30 grayscale my-auto">
                  <Bot size={48} className="text-gray-400" />
                  <p className="text-xs font-mono uppercase tracking-widest">Awaiting Uplink...</p>
                </div>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className={cn("flex w-full", msg.role === 'user' ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "flex gap-3 max-w-[90%]", 
                    msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                  )}>
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                      msg.role === 'user' ? "bg-indigo-100 text-indigo-600" : 
                      msg.role === 'system' ? "bg-gray-100 text-gray-500" : "bg-gradient-to-br from-indigo-600 to-violet-600 text-white"
                    )}>
                      {msg.role === 'user' ? <User size={16} /> : msg.role === 'system' ? <Loader2 size={16} className="animate-spin" /> : <Bot size={16} />}
                    </div>
                    
                    <div className={cn(
                      "px-4 py-3 text-sm shadow-sm",
                      msg.role === 'user' 
                        ? "bg-indigo-600 text-white border-transparent rounded-2xl rounded-tr-sm" 
                        : "bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-tl-sm"
                    )}>
                      {msg.files && msg.files.length > 0 && (
                        <div className="flex gap-2 mb-3 flex-wrap">
                          {msg.files.map((f, i) => (
                            <div key={i} className={cn("text-[10px] px-2 py-1 rounded-md flex items-center gap-1 border", msg.role === 'user' ? "bg-white/20 text-white border-white/30 backdrop-blur-sm" : "bg-gray-50 text-gray-600 border-gray-200")}>
                              <ImagePlus size={10} />
                              <span className="truncate max-w-[150px]">{f.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {msg.role === 'system' ? (
                        <div className="flex items-center gap-2 text-indigo-600 font-mono italic font-semibold">
                          <Loader2 className="animate-spin" size={14} />
                          {msg.content}
                        </div>
                      ) : (
                        <div className={cn(
                          "prose prose-sm max-w-none leading-relaxed", 
                          msg.role === 'user' ? "text-white/90" : "text-gray-700 prose-p:my-1.5"
                        )}>
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                            components={{
                              code({ node, inline, className, children, ...props }: any) {
                                const match = /language-(\w+)/.exec(className || '');
                                return !inline && match ? (
                                  <div className="my-3 rounded-lg overflow-hidden text-xs shadow-md border border-white/10">
                                    <div className="bg-slate-800 px-3 py-1.5 text-slate-400 font-mono text-[9px] uppercase flex justify-between items-center border-b border-white/5">
                                      <span className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                                        {match[1]}
                                      </span>
                                    </div>
                                    <SyntaxHighlighter
                                      style={vscDarkPlus}
                                      language={match[1]}
                                      PreTag="div"
                                      customStyle={{ margin: 0, padding: '1rem', borderRadius: 0, background: '#1e1e1e' }}
                                      {...props}
                                    >
                                      {String(children).replace(/\n$/, '')}
                                    </SyntaxHighlighter>
                                  </div>
                                ) : (
                                  <code className={cn(
                                    "px-1 py-0.5 rounded font-mono text-[11px] font-bold", 
                                    msg.role === 'user' ? "bg-white/20 text-white" : "bg-gray-100 text-indigo-600"
                                  )} {...props}>
                                    {children}
                                  </code>
                                );
                              }
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      )}
                      <div className={cn(
                        "text-[9px] mt-2 font-mono opacity-50",
                        msg.role === 'user' ? "text-right text-indigo-200" : "text-left text-gray-400"
                      )}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {isAnalyzing && messages[messages.length - 1]?.role !== 'system' && (
                <div className="flex w-full justify-start">
                  <div className="flex gap-3 max-w-[85%] flex-row">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
                      <Bot size={16} />
                    </div>
                    <div className="px-4 py-3 text-sm shadow-sm bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-tl-sm flex items-center gap-3">
                      <Loader2 className="animate-spin text-indigo-500" size={16} />
                      <span className="text-gray-500 italic">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      {activeTab === 'chat' ? (
        <div className="p-4 border-t border-gray-200 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.02)] z-20">
          {attachedFiles.length > 0 && (
            <div className="flex gap-2 mb-3 flex-wrap">
              {attachedFiles.map((f, i) => (
                <div key={i} className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                  <ImagePlus size={12} />
                  <span className="truncate max-w-[150px] font-medium">{f.name}</span>
                  <button type="button" className="hover:bg-indigo-200/50 rounded-full p-0.5 transition-colors" onClick={() => setAttachedFiles(fs => fs.filter((_, idx) => idx !== i))}>
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute left-2 p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors z-10"
              title="上传附图或文件"
            >
              <ImagePlus size={18} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              multiple 
              accept="image/*"
              onChange={handleFileChange}
            />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isAnalyzing ? "Processing Signal..." : "贴附图、回答追问或嘱咐AI改进..."}
              className="w-full bg-gray-50/50 border border-gray-200 rounded-xl pl-11 pr-12 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-inner focus:bg-white"
              disabled={isAnalyzing}
            />
            <button
              type="submit"
              disabled={(!input.trim() && attachedFiles.length === 0) || isAnalyzing}
              className="absolute right-1.5 p-2 bg-indigo-600 text-white rounded-lg disabled:bg-gray-100 disabled:text-gray-300 hover:bg-indigo-700 transition-colors shadow-sm disabled:shadow-none"
            >
              {isAnalyzing ? <Loader2 className="animate-spin -ml-0.5" size={16} /> : <Send size={16} className="-ml-0.5" />}
            </button>
          </form>
        </div>
      ) : (
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-center z-20">
           <button 
             onClick={() => setActiveTab('chat')}
             className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg shadow-sm hover:border-indigo-200 hover:text-indigo-600 flex items-center gap-2 transition-all"
           >
             <MessageSquare size={16} />
             切换回对话继续沟通
           </button>
        </div>
      )}

    </div>
  );
}

function ScoreRow({ label, score, color, textColor }: { label: string, score: number, color: string, textColor?: string }) {
  const percentage = score;
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-2 font-semibold">
        <span className="text-gray-500 uppercase tracking-tight">{label}</span>
        <span className={cn(textColor || "text-gray-700", "font-mono")}>{score} / 100</span>
      </div>
      <div className="w-full bg-slate-100 h-2 rounded-full border border-slate-200">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className={cn(color, "h-full rounded-full shadow-[0_0_10px_rgba(79,70,229,0.3)]")} 
        />
      </div>
    </div>
  );
}
