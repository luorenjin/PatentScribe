import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileUp, Zap, Layout, ImagePlus, ShieldAlert, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { Logo } from './Logo';
import { ParticleBackground } from './ParticleBackground';
import { ACTIVATION_CONFIG } from '../config/activation';

interface FileUploadProps {
  onContentUpload: (content: string, files: File[]) => void;
  isLoading: boolean;
  isActivated: boolean;
  expiryDate?: string | null;
  onOpenActivation: () => void;
}

export function FileUpload({ onContentUpload, isLoading, isActivated, expiryDate, onOpenActivation }: FileUploadProps) {
  const [isDragActive, setIsDragActive] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Core file processing logic
  const handleFiles = React.useCallback(async (rawFiles: FileList | File[] | null) => {
    if (!rawFiles || rawFiles.length === 0) return;

    // Check activation
    if (ACTIVATION_CONFIG.REQUIRE_ACTIVATION && !isActivated) {
      onOpenActivation();
      return;
    }

    const files = Array.from(rawFiles);
    
    setIsProcessing(true);
    try {
      let combinedText = '';
      const imageFiles: File[] = [];

      for (const file of files) {
        const fileName = file.name.toLowerCase();
        const fileType = file.type;

        // 1. Handle Images (Multimodal)
        if (fileType.startsWith('image/')) {
          imageFiles.push(file);
          continue;
        }

        // 2. Handle Word Documents (.docx)
        if (
          fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
          fileName.endsWith('.docx')
        ) {
          try {
            const mammoth = await import('mammoth');
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            combinedText += `[文件: ${file.name}]\n${result.value}\n\n`;
          } catch (err) {
            console.error("Mammoth parsing failed:", err);
            throw new Error(`无法解析 Word 文档 ${file.name}，请确保其不是加密文档。`);
          }
          continue;
        }

        // 3. Handle Legacy Word Documents (.doc)
        if (fileType === 'application/msword' || fileName.endsWith('.doc')) {
          combinedText += `[注意: 检测到旧版 .doc 文件 ${file.name}，建议将其另存为 .docx 以获得最佳解析效果]\n`;
          continue;
        }

        // 4. Handle Text Files
        if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
          const text = await file.text();
          combinedText += `[文件: ${file.name}]\n${text}\n\n`;
          continue;
        }

        // 5. Handle PDF Files
        if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
          try {
            const pdfjs = await import('pdfjs-dist');
            const workerUrl = new URL(
              'pdfjs-dist/build/pdf.worker.mjs',
              import.meta.url
            ).toString();
            pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
            let pdfText = `[文件: ${file.name}]\n`;
            for (let p = 1; p <= pdf.numPages; p++) {
              const page = await pdf.getPage(p);
              const content = await page.getTextContent();
              const strings = content.items.map((item: any) => (item as any).str);
              pdfText += strings.join(' ') + '\n';
            }
            combinedText += pdfText + '\n\n';
          } catch (err) {
            console.error("PDF parsing failed:", err);
            throw new Error(`PDF 解析失败: ${file.name}`);
          }
          continue;
        }
      }

      if (!combinedText.trim() && imageFiles.length === 0) {
        throw new Error("未能提取到有效内容。支持格式：.docx, .pdf, .txt 以及各类图片。");
      }

      onContentUpload(combinedText.trim(), imageFiles);
    } catch (error: any) {
      console.error("File processing error:", error);
      alert(error.message || "文件处理出错，请尝试转换格式后重新上传。");
    } finally {
      setIsProcessing(false);
    }
  }, [onContentUpload]);

  // Hybrid Drag and Drop Setup (Browser + Tauri Native)
  React.useEffect(() => {
    let unlisten: any;

    const initTauriDrop = async () => {
      try {
        // Try to import Tauri APIs dynamically to avoid breaking browser mode
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        const { readFile } = await import('@tauri-apps/plugin-fs');
        const win = getCurrentWindow();

        unlisten = await win.onDragDropEvent(async (event) => {
          const payload = event.payload as any;
          if (payload.type === 'drop') {
            setIsDragActive(false);
            const paths = payload.paths;
            if (paths && paths.length > 0) {
              const files = await Promise.all(paths.map(async (path: string) => {
                const name = path.split(/[\\/]/).pop() || 'file';
                const bytes = await readFile(path);
                
                // Mime type detection by extension (Tauri doesn't give mime for paths)
                const ext = name.split('.').pop()?.toLowerCase();
                let type = 'application/octet-stream';
                if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext!)) type = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
                else if (ext === 'pdf') type = 'application/pdf';
                else if (ext === 'docx') type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                else if (ext === 'doc') type = 'application/msword';
                else if (ext === 'txt') type = 'text/plain';
                
                return new File([bytes], name, { type });
              }));
              handleFiles(files);
            }
          } else if (payload.type === 'enter' || payload.type === 'over') {
            setIsDragActive(true);
          } else if (payload.type === 'leave' || payload.type === 'cancelled') {
            setIsDragActive(false);
          }
        });
      } catch (e) {
        // Fallback for browser mode: handled by standard React onDrop below
        console.debug("Tauri drag-drop API not available, falling back to Web API.");
      }
    };

    initTauriDrop();
    return () => { if (unlisten) unlisten(); };
  }, [handleFiles]);

  const showOverlay = isLoading || isProcessing;

  return (
    <div 
      className="h-full flex flex-col items-center justify-center p-6 bg-gray-50 relative overflow-hidden"
      onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(true); }}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(true); }}
      onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(false); }}
      onDrop={(e) => { 
        e.preventDefault(); 
        e.stopPropagation(); 
        setIsDragActive(false); 
        // Note: In Tauri, e.dataTransfer.files is often empty, handled by native listener above
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleFiles(e.dataTransfer.files); 
        }
      }}
    >
      <AnimatePresence>
        {isDragActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] bg-indigo-600/10 backdrop-blur-[2px] border-4 border-dashed border-indigo-600 m-4 rounded-3xl pointer-events-none flex items-center justify-center"
          >
            <div className="bg-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-3">
              <FileUp className="text-indigo-600 animate-bounce" size={24} />
              <span className="text-indigo-600 font-bold text-lg">松开以解析文档内容</span>
            </div>
          </motion.div>
        )}
        
        {showOverlay && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[70] bg-white/80 backdrop-blur-md flex flex-col items-center justify-center gap-4"
          >
            <div className="relative">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full"
              />
              <div className="absolute inset-0 flex items-center justify-center text-indigo-600">
                <Zap size={24} className="animate-pulse" />
              </div>
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-bold text-gray-900 uppercase tracking-widest">
                {isProcessing ? "多模态文件解析中..." : "AI 智能构建文档..."}
              </p>
              <p className="text-[10px] text-gray-400 font-mono">NEURAL_LINK_ESTABLISHED: 100%</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <ParticleBackground />
      
      {/* Activation Status Badge */}
      {ACTIVATION_CONFIG.REQUIRE_ACTIVATION && (
        <div className="absolute top-6 right-6 z-20">
          <button
            onClick={onOpenActivation}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all shadow-lg",
              isActivated 
                ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                : "bg-amber-50 text-amber-600 border border-amber-100 hover:scale-105"
            )}
          >
            {isActivated ? <ShieldCheck size={14} /> : <ShieldAlert size={14} className="animate-pulse" />}
            {isActivated ? `已激活 (有效期至: ${expiryDate || '永久'})` : "未激活 (需授权)"}
          </button>
        </div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 w-full max-w-xl text-center space-y-12 pointer-events-none"
      >
        <div className="space-y-4">
          <motion.div
             animate={{ y: [0, -10, 0] }}
             transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
             className="mb-2 flex justify-center"
          >
            <Logo size={80} className="shadow-2xl shadow-indigo-200" />
          </motion.div>
          <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 border-b-4 border-indigo-600 inline-block px-2">PatentMate AI</h1>          <p className="text-gray-500 text-lg max-w-md mx-auto font-medium">
            专利交底书优化搭档
          </p>
        </div>

        <div
          className={cn(
            "relative group cursor-pointer bg-white border border-gray-200 shadow-xl rounded-3xl p-12 transition-all duration-500 pointer-events-auto",
            isDragActive ? "border-indigo-600 ring-4 ring-indigo-50 -translate-y-2" : "hover:border-indigo-300 hover:-translate-y-1"
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            accept=".docx,.doc,.txt,.pdf,image/*"
          />
          
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileUp size={32} />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xl font-bold text-gray-900">点击或将技术初稿/图纸拖拽至此</p>
              <p className="text-sm text-gray-400 font-medium">支持 文档(.docx/.doc/.pdf/.txt) 及 附图(图纸/照片)</p>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/5 rounded-bl-full pointer-events-none" />
        </div>

        <div className="flex items-center justify-center gap-12 pt-4">
          <FeatureItem icon={<Layout size={18} />} text="块级区块编辑" />
          <FeatureItem icon={<ImagePlus size={18} />} text="多模态图纸解析" />
          <FeatureItem icon={<Zap size={18} />} text="自动推荐保护发散" />
        </div>
      </motion.div>
    </div>
  );
}

function FeatureItem({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
      <span className="text-indigo-600">{icon}</span>
      {text}
    </div>
  );
}
