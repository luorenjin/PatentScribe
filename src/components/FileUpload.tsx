import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileUp, Zap, Layout, ImagePlus } from 'lucide-react';
import { cn } from '../lib/utils';
import { Logo } from './Logo';
import { ParticleBackground } from './ParticleBackground';

interface FileUploadProps {
  onContentUpload: (content: string, files: File[]) => void;
  isLoading: boolean;
}

export function FileUpload({ onContentUpload, isLoading }: FileUploadProps) {
  const [isDragActive, setIsDragActive] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList) => {
    setIsProcessing(true);
    try {
      let combinedText = '';
      const imageFiles: File[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
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
            // extractRawText is faster and cleaner for technical extraction
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
          // Note: Browser-side .doc parsing is extremely limited. 
          // We suggest conversion or use a fallback if available.
          combinedText += `[注意: 检测到旧版 .doc 文件 ${file.name}，建议将其另存为 .docx 以获得最佳解析效果]\n`;
          // For now, treat as potentially binary and warn, or try a basic text sweep (though rarely useful for OLE files)
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
            // Fix worker path for Vite/Tauri
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
              const strings = content.items.map((item: any) => item.str);
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
      // Alert user with a more friendly message
      alert(error.message || "文件处理出错，请尝试转换格式后重新上传。");
    } finally {
      setIsProcessing(false);
    }
  };

  const showOverlay = isLoading || isProcessing;

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 bg-gray-50 relative overflow-hidden">
      <AnimatePresence>
        {showOverlay && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center gap-4"
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
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 w-full max-w-xl text-center space-y-12"
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
            多模态 AI 专利交底书搭档
          </p>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
          onDragLeave={() => setIsDragActive(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragActive(false); if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files); }}
          className={cn(
            "relative group cursor-pointer bg-white border border-gray-200 shadow-xl rounded-3xl p-12 transition-all duration-500",
            isDragActive ? "border-indigo-600 ring-4 ring-indigo-50 -translate-y-2" : "hover:border-indigo-300 hover:-translate-y-1"
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            multiple
            onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files); }}
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
