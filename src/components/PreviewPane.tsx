import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Edit2, Check, X, Loader2, ImagePlus, Plus } from 'lucide-react';
import { PatentDisclosure, AppSettings } from '../types/patent';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';
import { cn } from '../lib/utils';
import { reviseSection } from '../lib/aiService';

interface PreviewPaneProps {
  disclosure: PatentDisclosure | null;
  isLoading: boolean;
  onExportDocx: () => void;
  onExportPdf: () => void;
  onUpdateSection: (key: keyof PatentDisclosure, content: string) => void;
  settings: AppSettings;
}

const SECTIONS: { key: keyof PatentDisclosure; label: string }[] = [
  { key: 'title', label: '一、发明名称' },
  { key: 'field', label: '二、技术领域' },
  { key: 'background', label: '三、背景技术及现有缺陷' },
  { key: 'purpose', label: '四、发明目的' },
  { key: 'solution', label: '五、技术方案（核心保护点）' },
  { key: 'effects', label: '六、有益效果' },
  { key: 'figures', label: '七、附图说明' },
  { key: 'implementation', label: '八、具体实施方式' },
];

export function PreviewPane({ disclosure, isLoading, onExportDocx, onExportPdf, onUpdateSection, settings }: PreviewPaneProps) {
  if (!disclosure) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-6 opacity-30">
        <FileText size={80} strokeWidth={1} />
        <div className="space-y-2">
          <h2 className="text-xl font-mono tracking-widest uppercase">Draft Visualization</h2>
          <p className="text-sm max-w-xs mx-auto">Upload a technical draft to see the optimized patent structure here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-100">
      <div className="h-12 px-6 flex items-center justify-between border-b border-gray-200 bg-white shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4 text-[10px] font-bold tracking-widest text-gray-400">
          <span className="text-indigo-600">块级编辑(SECTION) / PREVIEW DOCUMENT</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onExportDocx}
            className="bg-white text-indigo-600 border border-indigo-200 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wide hover:bg-indigo-50 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <FileText size={12} />
            导出DOCX
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 bg-gray-200/50 flex justify-center items-start relative">
        {isLoading && (
          <div className="fixed inset-0 bg-white/40 backdrop-blur-sm flex items-center justify-center z-50 pointer-events-auto">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full"
            />
          </div>
        )}

        <motion.div
          id="patent-preview-container"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full  bg-white shadow-lg p-10 serif-doc border border-gray-300 min-h-[1100px] mb-12 relative"
        >
          <div className="mb-6 border-b-2 border-slate-900 pb-4">
            <h1 className="text-3xl font-bold mb-2 tracking-tight text-gray-900 font-serif">专利技术交底书</h1>
            <p className="text-[10px] font-sans text-gray-500 uppercase tracking-[0.4em] font-medium">Intellectual Property Protection Protocol</p>
          </div>

          {disclosure.claims && disclosure.claims.length > 0 && (
            <div className="mb-8 bg-slate-50 border border-slate-200 rounded-xl p-5 relative">
              <h3 className="font-serif text-lg font-bold mb-4 flex items-center gap-2 text-slate-800">
                权利要求布局草图 (Claims Map)
              </h3>
              <div className="space-y-3">
                {disclosure.claims.map((claim, idx) => (
                  <div key={idx} className={cn(
                    "p-4 rounded-lg border text-sm flex gap-3",
                    claim.type === 'independent'
                      ? "bg-white border-indigo-200 shadow-sm"
                      : "bg-white/60 border-slate-200 ml-8"
                  )}>
                    <div className={cn(
                      "shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs",
                      claim.type === 'independent' ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-600"
                    )}>
                      {claim.id}
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        {claim.type === 'independent' ? '独立权利要求' : `引用权要 ${claim.dependsOn}`}
                      </div>
                      <div className="text-slate-700 leading-relaxed font-medium">
                        {claim.content}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {SECTIONS.map((sec) => (
              <SectionBlock
                key={sec.key}
                sectionKey={sec.key}
                label={sec.label}
                content={disclosure[sec.key] as string}
                disclosure={disclosure}
                onUpdate={onUpdateSection}
                settings={settings}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function SectionBlock({
  sectionKey,
  label,
  content,
  disclosure,
  onUpdate,
  settings
}: {
  sectionKey: keyof PatentDisclosure;
  label: string;
  content: string;
  disclosure: PatentDisclosure;
  onUpdate: (k: keyof PatentDisclosure, v: string) => void;
  settings: AppSettings;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleRefine = async () => {
    if (!instruction.trim() && attachedFiles.length === 0) return;
    setIsRefining(true);
    try {
      const newContent = await reviseSection(sectionKey, content, instruction, disclosure, attachedFiles, settings);
      onUpdate(sectionKey, newContent);
      setIsEditing(false);
      setInstruction('');
      setAttachedFiles([]);
    } catch (error) {
      console.error("Refine failed:", error);
    } finally {
      setIsRefining(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const preprocessMarkdown = (text: string) => {
    if (!text) return '';

    // Step 1: Normalize newlines
    let lines = text.split('\n');
    let processedLines: string[] = [];
    let insideTable = false;

    for (let i = 0; i < lines.length; i++) {
      const currentLine = lines[i].trim();
      const isTableRow = currentLine.startsWith('|');

      if (isTableRow) {
        if (!insideTable) {
          // Table starts: ensure a blank line above
          if (processedLines.length > 0 && processedLines[processedLines.length - 1] !== '') {
            processedLines.push('');
          }
          insideTable = true;
        }
        processedLines.push(currentLine);
      } else {
        if (insideTable) {
          if (currentLine === '') {
            // Check if next non-empty line is a table row. If it is, skip this empty line.
            let nextRowIdx = -1;
            for (let j = i + 1; j < lines.length; j++) {
              if (lines[j].trim() !== '') {
                if (lines[j].trim().startsWith('|')) nextRowIdx = j;
                break;
              }
            }
            if (nextRowIdx !== -1) {
              // It's a broken table row, ignore this empty line and continue
              continue;
            } else {
              // Table actually ended
              insideTable = false;
              processedLines.push('');
            }
          } else {
            // Hit normal text, table ends
            insideTable = false;
            processedLines.push('');
            processedLines.push(currentLine);
          }
        } else {
          processedLines.push(lines[i]);
        }
      }
    }

    let processed = processedLines.join('\n');

    // Implementation-specific formatting for bolding 实施例
    if (sectionKey === 'implementation') {
      processed = processed.replace(/(实施例[一二三四五六七八九十\d]+[:：])/g, '\n\n**$1**\n\n');
    }

    return processed.replace(/\n{3,}/g, '\n\n');
  };

  return (
    <div className="group relative border border-transparent hover:border-indigo-100 rounded-xl p-2 -mx-2 transition-colors">
      <h2 className="text-xl font-bold text-gray-900 font-serif mb-2 flex items-center justify-between">
        {label}
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="opacity-0 group-hover:opacity-100 p-2 text-indigo-500 hover:bg-indigo-50 rounded bg-white shadow-sm border border-indigo-100 transition-all text-xs font-sans tracking-wide flex items-center gap-1.5"
        >
          <Edit2 size={12} />
          局部扩写
        </button>
      </h2>

      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-3 relative font-sans text-sm shadow-inner">
              <textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="在此告诉 AI 你想怎样改写这一节？（如：补充一个通过卡扣固定的替代实施例）"
                className="w-full bg-transparent border-0 focus:ring-0 resize-none outline-none text-indigo-900 placeholder:text-indigo-300"
                rows={3}
                disabled={isRefining}
              />

              {attachedFiles.length > 0 && (
                <div className="flex gap-2 mt-2 mb-2 flex-wrap">
                  {attachedFiles.map((f, i) => (
                    <div key={i} className="text-[10px] bg-white border border-indigo-200 text-indigo-700 px-2 py-1 rounded flex items-center gap-1">
                      {f.name}
                      <X size={10} className="cursor-pointer" onClick={() => setAttachedFiles(fs => fs.filter((_, idx) => idx !== i))} />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center mt-2 border-t border-indigo-100/50 pt-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isRefining}
                  className="text-indigo-500 hover:text-indigo-700 flex items-center gap-1 text-[11px] font-medium transition-colors"
                >
                  <ImagePlus size={14} />
                  上传附图
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    disabled={isRefining}
                    className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-200/50 rounded transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleRefine}
                    disabled={isRefining || (!instruction.trim() && attachedFiles.length === 0)}
                    className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded shadow disabled:opacity-50 flex items-center gap-1.5 transition-all"
                  >
                    {isRefining ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    确 认
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="prose prose-slate max-w-none prose-p:text-lg prose-p:leading-relaxed text-gray-800 markdown-body">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex, rehypeRaw]}
          components={{
            h1: ({ node, ...props }) => <h3 className="text-xl font-bold font-serif mb-3 mt-4" {...props} />,
            h2: ({ node, ...props }) => <h4 className="text-lg font-bold font-serif mb-2 mt-3" {...props} />,
            table: ({ node, ...props }) => (
              <div className="my-6 overflow-x-auto rounded-xl border border-slate-200 shadow-sm overflow-hidden bg-white">
                <table className="min-w-full border-collapse" {...props} />
              </div>
            ),
            th: ({ node, ...props }) => (
              <th className="bg-slate-50/80 backdrop-blur-sm px-4 py-4 text-left text-[10px] font-bold text-slate-800 uppercase tracking-widest border border-slate-200 first:border-l-0 last:border-r-0" {...props} />
            ),
            td: ({ node, ...props }) => (
              <td className="px-4 py-4 text-sm text-slate-700 border border-slate-200 first:border-l-0 last:border-r-0 align-top leading-relaxed even:bg-slate-50/30" {...props} />
            ),
            code({ node, inline, className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <div className="my-6 rounded-lg overflow-hidden text-sm shadow-lg border border-white/10">
                  <div className="bg-slate-800 px-4 py-2 text-slate-400 font-mono text-[10px] uppercase flex justify-between items-center border-b border-white/5">
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-slate-600" />
                      {match[1]}
                    </span>
                  </div>
                  <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={match[1]}
                    PreTag="div"
                    customStyle={{ margin: 0, padding: '1.5rem', borderRadius: 0, background: '#1e1e1e' }}
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                </div>
              ) : (
                <code className={cn("bg-slate-100 text-indigo-600 px-1.5 py-0.5 rounded font-mono text-sm font-bold border border-slate-200", className)} {...props}>
                  {children}
                </code>
              );
            },
            // Improved math rendering
            span: ({ node, className, children, ...props }) => {
              if (className?.includes('katex')) {
                return <span className={cn(className, "my-2 mx-1 inline-block")} {...props}>{children}</span>;
              }
              return <span className={className} {...props}>{children}</span>;
            }
          }}
        >
          {preprocessMarkdown(content)}
        </ReactMarkdown>
      </div>
    </div>
  );
}
