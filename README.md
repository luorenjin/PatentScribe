# PatentMate

PatentMate 是一个面向专利交底书场景的 AI 协作工具，使用 React + Vite 构建前端，使用 Tauri 2 提供桌面能力。它的目标不是简单生成一段专利文案，而是把工程师的初稿、说明文档和附图，整理成结构化的技术交底书，并在后续追问、局部扩写、版本回滚、导出归档这些环节持续协作。

当前版本：0.1.1

## 核心能力

- 多模态输入：支持导入 .docx、.pdf、.txt 以及图片类附图。
- 专利诊断：输出创新性、新颖性、实用性评分，并提炼核心专利点、缺失信息和替代方案。
- 结构化交底书：生成标准化字段，包括发明名称、技术领域、背景技术、发明目的、技术方案、有益效果、附图说明、实施方式和权利要求草图。
- 追问式优化：AI 会基于当前交底书继续追问，并根据对话结果持续更新文稿。
- 块级改写：可针对单个章节进行局部扩写或补充实施例，并可附加图片继续优化。
- 工作台管理：支持保存、检索、加载、删除已完成的专利方案记录。
- 会话版本历史：当前会话内保留最近 50 个版本，支持回滚。
- 文档导出：支持导出 .docx 和 .pdf。
- 多模型支持：内置 Google Gemini、OpenAI、通义千问，以及兼容 OpenAI 接口的自定义模型配置。

## 技术栈

- 前端：React 19、TypeScript、Vite
- 桌面层：Tauri 2
- AI 接入：@google/genai、openai
- 文档处理：mammoth、pdfjs-dist、react-markdown、KaTeX
- 导出能力：docx、jspdf、html2canvas
- 本地存储：Tauri Store、Tauri SQL (SQLite)

## 运行方式

### 先决条件

- Node.js
- Yarn
- 如需运行桌面版，还需要 Rust 工具链与 Tauri 对应的本机依赖

建议优先使用 Yarn。项目中的 Tauri 配置也默认使用 Yarn 作为前置命令。

### 安装依赖

```bash
yarn
```

### 启动前端开发环境

```bash
yarn dev
```

默认地址为 http://localhost:3000。

### 启动 Tauri 桌面开发环境

```bash
yarn tauri dev
```

这是最接近实际使用场景的运行方式。设置持久化、工作台 SQLite、本地插件能力等都以桌面环境为主。

### 构建前端产物

```bash
yarn build
```

### 构建桌面应用

```bash
yarn tauri build
```

### 类型检查

```bash
yarn lint
```

## 配置说明

应用内提供系统配置面板，可为不同模型提供商分别设置：

- API Key
- API Endpoint
- Model ID
- 是否启用多模态分析

支持的提供商：

- Google Gemini
- OpenAI
- 通义千问
- 自定义 OpenAI 兼容接口

说明：

- Google 提供商在未配置界面 Key 时，还会尝试读取环境变量 VITE_GEMINI_API_KEY 或 GEMINI_API_KEY。
- OpenAI、通义千问和自定义接口的凭据，当前主要通过应用内设置保存。
- 自定义模式适合接入私有部署模型或第三方兼容 OpenAI 协议的网关。

## 使用流程

1. 打开应用，在系统配置中选择模型提供商并填写对应凭据。
2. 上传技术初稿，可混合导入文档和附图。
3. 等待系统完成解析，查看诊断评分、核心专利点、缺失项和替代方案。
4. 在左侧对话区继续补充技术细节，推动 AI 迭代更新交底书。
5. 在右侧预览区对单个章节执行局部扩写，补齐实施例、附图说明或保护范围。
6. 将结果保存到工作台，必要时从版本历史中回滚。
7. 导出为 .docx 或 .pdf，进入代理撰写或归档流程。

## 数据存储

桌面模式下，项目使用两套本地存储：

- 配置数据：通过 Tauri Store 保存在 .settings.dat
- 工作台记录：通过 SQLite 保存在 patent_scribe.db

其中：

- 工作台记录包含标题、时间戳、结构化交底书内容和诊断结果
- 版本历史目前保存在前端会话状态中，用于当前编辑过程内的快速回滚，不属于长期持久化数据

## 导出结果

### DOCX 导出

- 自动生成标准技术交底书结构
- 包含发明名称、问题-方案-效果对照表、正文各章节内容
- 支持基础 Markdown 内容转为 Word 段落和表格

### PDF 导出

- 基于预览面板截图生成 PDF
- 适合快速分发和审阅

## 桌面能力

Tauri 侧已启用以下插件：

- SQL
- Store
- Shell
- Dialog
- Notification
- FS

这些能力支撑了本地数据库、配置持久化、文件系统访问和桌面交互等功能。

## 项目结构

```text
src/
   components/
      FileUpload.tsx          文件导入与解析入口
      ChatPane.tsx            对话区与诊断图谱
      PreviewPane.tsx         交底书预览与块级改写
      Workbench.tsx           已保存方案工作台
      SettingsModal.tsx       模型与接口配置
      VersionHistoryModal.tsx 版本历史与回滚
   lib/
      aiService.ts            LLM 调用与提示词编排
      exportUtils.ts          DOCX/PDF 导出
      storage.ts              本地存储与 SQLite 操作
   types/
      patent.ts               交底书、诊断、设置等类型定义
src-tauri/
   src/main.rs               Tauri 插件注册入口
   tauri.conf.json           桌面应用配置
```

## 当前实现要点

- 诊断报告会把专利点拆分为区别技术特征和技术效果，便于后续扩权。
- 有益效果部分要求输出 Markdown 表格，便于预览和导出。
- 权利要求草图使用结构化数组表达，区分独立权利要求与从属权利要求。
- 工作台记录会落库，但会话中的版本历史仅保留最近 50 条。

## 适用场景

- 工程师把零散技术草稿快速整理成专利交底书
- 专利代理人前置收集技术要点与补充问题
- 团队对已有方案做多轮补强、替代方案发散和归档导出
