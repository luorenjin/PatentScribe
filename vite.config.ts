import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    // 防止 Vite 在脚本错误时清空控制台
    clearScreen: false,
    // 环境变变量前缀，允许在前端访问 TAURI_ 变量
    envPrefix: ['VITE_', 'TAURI_'],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      strictPort: true,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'motion/react',
        'lucide-react',
        'docx',
        'mammoth',
        'jspdf',
        'html-to-image',
        'pdfjs-dist',
        'react-markdown',
        'remark-gfm',
        'remark-math',
        'rehype-katex',
        'rehype-raw',
        'react-syntax-highlighter',
        'katex',
        '@google/genai',
        'openai'
      ]
    },
    build: {
      target: process.env.TAURI_PLATFORM === 'windows' ? 'chrome105' : 'safari13',
      minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
      sourcemap: !!process.env.TAURI_DEBUG,
      rollupOptions: {
        output: {
          manualChunks: {
            'pdf-vendor': ['pdfjs-dist'],
            'doc-vendor': ['docx', 'mammoth'],
            'pdf-export-vendor': ['jspdf', 'html-to-image'],
            'ui-vendor': ['motion', 'lucide-react', 'react', 'react-dom'],
            'markdown-vendor': ['react-markdown', 'remark-gfm', 'remark-math', 'rehype-katex', 'rehype-raw'],
            'katex-vendor': ['katex'],
            'highlight-vendor': ['react-syntax-highlighter'],
          }
        }
      }
    }
  };
});
