# PatentScribe - AI 专利协作专家

PatentScribe 是一款基于 AI 的专利技术交底书协作工具，旨在协助专利工程师从原始构思中挖掘核心专利点，并自动生成结构化的技术交底书。

## 项目概览 (Project Overview)

- **核心功能**: 多模态专利草稿分析、专利挖掘诊断报告（新颖性/创造性/实用性评估）、结构化交底书生成（包含附图说明、实施例、权利要求图谱）、版本管理及工作台存档。
- **技术栈**: 
  - **前端**: React 19, TypeScript, Vite, Tailwind CSS, Framer Motion.
  - **后端**: Rust (Tauri 1.5).
  - **AI 引擎**: Google Gemini (主要), OpenAI GPT-4o, 阿里通义千问 (Qwen).
  - **文档处理**: docx, jspdf, mammoth, pdfjs-dist.

## 核心架构 (Architecture)

- `src/main.tsx` & `App.tsx`: 应用入口与核心状态管理（AppState）。
- `src/lib/aiService.ts`: AI 服务抽象层，支持多模型供应商，定义了严谨的 JSON Schema 用于结构化输出。
- `src/components/`: 
  - `ChatPane.tsx`: AI 对话与引导式追问。
  - `PreviewPane.tsx`: 结构化交底书预览、实时编辑与导出。
  - `Workbench.tsx`: 本地存档管理。
- `src-tauri/`: Rust 后端代码，处理文件系统访问与桌面集成。

## 开发指南 (Building and Running)

### 前置要求
- Node.js (建议 v18+)
- Rust 环境 (用于 Tauri 编译)

### 常用命令
- **安装依赖**: `npm install`
- **启动网页版预览**: `npm run dev` (访问 http://localhost:3000)
- **启动 Tauri 桌面应用**: `npm run tauri dev`
- **构建前端产物**: `npm run build`
- **构建桌面安装包**: `npm run tauri build`
- **类型检查**: `npm run lint`

## 开发约定 (Development Conventions)

- **AI 交互**: 所有的 AI 提示词（Prompts）和 Schema 定义集中在 `src/lib/aiService.ts`。修改 AI 行为请优先调整 `SYSTEM_PROMPT`。
- **样式**: 使用 Tailwind CSS 4.x 进行样式开发，遵循 Vanilla CSS 优先原则。
- **状态管理**: 使用 React `useState` 和 `useEffect` 进行简单的本地状态管理，重要数据同步至 `localStorage`。
- **多模态**: 系统支持图片解析，确保在调用 AI 接口时处理好 `File` 对象到 Base64 的转换。
- **导出**: 支持导出 Word (.docx) 和 PDF 格式，逻辑位于 `src/lib/exportUtils.ts`。

## 环境变量 (Environment Variables)

- `GEMINI_API_KEY`: Google Gemini API 密钥。
- `VITE_OPENAI_API_KEY`: OpenAI API 密钥（可选）。
- `VITE_QWEN_API_KEY`: 阿里通义千问 API 密钥（可选）。
