# PatentMate

PatentMate 是一个面向专利技术交底书场景的 AI 协作桌面应用。项目使用 React 19 + Vite 6 构建前端，使用 Tauri 2 提供本地存储、文件系统和桌面交互能力。它的重点不是一次性吐出一份专利文案，而是把工程师的原始草稿、说明文档和附图整理成结构化交底书，并支持后续追问、局部补写、版本回滚、工作台归档和导出。

当前版本：0.1.5

## 核心能力

- 多模态导入：支持 .docx、.doc、.pdf、.txt 以及图片类附图；桌面模式支持原生拖拽导入。
- 专利诊断：输出创新性、新颖性、实用性评分，并提炼技术摘要、核心专利点、缺失信息和替代方案。
- 结构化交底书：生成标准字段，包括发明名称、技术领域、背景技术、发明目的、技术方案、有益效果、附图说明、实施方式和权利要求草图。
- 追问式优化：可基于当前交底书与上下文对话继续追问，持续修订结果。
- 块级改写：支持按章节单独改写或补充实施例，并可结合附图继续优化。
- 工作台管理：支持将完整方案保存到本地工作台，并可重新载入或删除。
- 版本历史：当前会话内自动保留最近 50 个版本，支持回滚到任意保存点。
- 导出归档：支持导出 DOCX 和 PDF。
- 授权激活：应用内置机器码校验与许可证验证流程，可按环境变量控制是否强制激活。
- 多模型接入：支持 Google Gemini、OpenAI、通义千问，以及兼容 OpenAI 协议的自定义接口。

## 技术栈

- 前端：React 19、TypeScript 5、Vite 6、motion、Tailwind CSS 4
- 桌面层：Tauri 2
- AI 接入：@google/genai、openai
- 文档解析：mammoth、pdfjs-dist
- 富文本渲染：react-markdown、remark-gfm、remark-math、rehype-katex
- 导出能力：docx、jspdf、html-to-image
- 本地存储：Tauri Store、Tauri SQL (SQLite)

## 开发与运行

### 先决条件

- Node.js
- Yarn
- 如需运行桌面版，还需要 Rust 工具链及 Tauri 对应平台依赖

### 构建前端

```bash
yarn build
```

该命令会先同步应用版本号，再执行 Vite 构建。

### 构建桌面应用

```bash
yarn tauri build
```

### 类型检查

```bash
yarn lint
```

### 其他脚本

```bash
yarn version-sync
yarn build:keygen
```

- version-sync：同步前端与桌面端版本号
- build:keygen：构建许可证生成工具，并将产物复制到 dist 目录

## 模型与配置

应用内提供系统配置面板，可为不同提供商分别配置：

- API Key
- API Endpoint
- Model ID
- 是否启用多模态分析

当前支持的提供商：

- google：Google Gemini
- openai：OpenAI
- qwen：通义千问兼容接口
- custom：任意兼容 OpenAI 协议的自定义接口

当前默认模型策略：

- google：gemini-3-flash-preview
- openai：gpt-5.4
- qwen：qwen3.6-plus

环境变量说明：

- LICENSE_PUBLIC_KEY：桌面端许可证验签公钥

说明：

- **本项目不提供内置模型 API Key**。所有用户（包括员工）均需在系统设置或首次启动向导中自行配置 API Key 及其对应的端点地址。
- custom 模式适合接入企业私有网关、第三方中转服务或自建兼容 OpenAI 协议的模型服务。
- 是否允许视觉能力由所选模型能力和多模态开关共同决定。

## 授权与激活

项目内置授权校验能力，前端通过设置面板与上传入口暴露激活状态，Tauri 侧提供机器码生成与许可证验签命令。

相关前端环境变量：

- VITE_REQUIRE_ACTIVATION：是否强制激活后才能上传解析，默认开启
- VITE_ENABLE_EMAIL_VERIFICATION：是否启用邮箱验证码激活入口，默认开启
- VITE_ENABLE_LICENSE_FILE：是否启用许可证文件激活入口，默认开启
- VITE_ALLOWED_EMAIL_DOMAINS：允许的企业邮箱域名列表，逗号分隔
- VITE_ACTIVATION_API_BASE_URL：在线激活接口地址
- VITE_ACTIVATION_SUPPORT_EMAIL：离线激活支持邮箱
- VITE_DEBUG_SHOW_ONBOARDING：强制显示首次引导

## 使用流程

1. 启动应用后，先在系统配置中选择模型提供商并完成必要的授权或 API 配置。
2. 上传技术初稿，可混合导入文档与附图。
3. 系统完成解析后，生成诊断报告与结构化交底书。
4. 在对话区继续补充技术细节，推动 AI 迭代修订。
5. 在预览区对单个章节执行局部扩写、补充实施例或继续细化附图说明。
6. 将结果保存到工作台，必要时通过版本历史回滚。
7. 最终导出为 DOCX 或 PDF，用于代理撰写、审阅或归档。

## 输入与输出说明

### 支持的输入格式

- .docx：会通过 mammoth 提取正文
- .doc：当前仅给出兼容性提示，建议先转换为 .docx
- .txt：直接读取文本内容
- .pdf：逐页提取文本
- 图片：作为多模态输入参与分析

### 输出结构

交底书核心字段定义在 src/types/patent.ts，对应以下内容：

- title：发明名称
- field：技术领域
- background：背景技术及现有缺陷
- purpose：发明目的
- solution：技术方案
- effects：有益效果
- figures：附图说明
- implementation：具体实施方式
- claims：权利要求草图，区分独立权利要求和从属权利要求

诊断报告包含：

- innovation、novelty、utility 三项评分
- summary 技术摘要
- patentPoints 区别技术特征与技术效果映射
- missingItems 待补充信息
- alternatives 替代方案建议

## 数据存储

桌面模式下，项目当前使用以下本地存储：

- .settings.dat：通过 Tauri Store 保存系统配置与许可证数据
- patent_scribe.db：通过 SQLite 保存工作台记录

工作台记录包含：

- id
- title
- timestamp
- disclosure
- diagnosis

版本历史目前仅保存在前端会话状态中，不写入长期持久化存储。

## 导出说明

### DOCX 导出

- 自动生成标准技术交底书结构
- 生成问题-方案-效果对照表
- 将 Markdown 标题、列表、表格转换为 Word 内容
- 桌面模式优先使用原生保存对话框，浏览器模式回退为下载

### PDF 导出

- 基于预览区域截图生成 PDF
- 自动分页输出 A4 文档
- 桌面模式优先使用原生保存对话框，浏览器模式回退为下载

## 桌面能力

Tauri 当前已启用以下插件：

- SQL
- Store
- Shell
- Dialog
- Notification
- FS

同时注册了以下原生命令：

- get_machine_code：生成本机机器码
- verify_license：校验许可证签名、机器码和到期时间

## 项目结构

```text
.
├─ README.md                   项目说明文档
├─ package.json                前端依赖、脚本与应用元数据
├─ tsconfig.json               TypeScript 配置
├─ vite.config.ts              Vite 构建配置
├─ index.html                  前端入口 HTML
├─ public/                     静态资源目录
├─ src/
│  ├─ App.tsx                  应用状态管理、初始化与主流程协调
│  ├─ main.tsx                 前端应用入口
│  ├─ index.css                全局样式
│  ├─ vite-env.d.ts            Vite 环境变量类型声明
│  ├─ config/
│  │  ├─ activation.ts         激活配置与环境变量映射
│  │  └─ models.ts             模型列表与默认提供商配置
│  ├─ components/
│  │  ├─ ActivationModal.tsx   授权激活入口
│  │  ├─ ChatPane.tsx          对话区与追问优化
│  │  ├─ FileUpload.tsx        文件导入、多模态解析入口、激活拦截
│  │  ├─ Logo.tsx              品牌标识组件
│  │  ├─ OnboardingModal.tsx   首次引导
│  │  ├─ ParticleBackground.tsx 背景动效组件
│  │  ├─ PreviewPane.tsx       交底书预览与块级改写
│  │  ├─ SettingsModal.tsx     模型、接口与激活状态配置
│  │  ├─ VersionHistoryModal.tsx 版本历史与回滚
│  │  └─ Workbench.tsx         工作台记录管理
│  ├─ lib/
│  │  ├─ aiService.ts          LLM 调用、提示词与结果归一化
│  │  ├─ exportUtils.ts        DOCX/PDF 导出
│  │  ├─ storage.ts            本地设置、授权信息与 SQLite 操作
│  │  └─ utils.ts              通用工具方法
│  └─ types/
│     └─ patent.ts             交底书、诊断、消息、设置等类型定义
├─ scripts/
│  ├─ fix-msi-summary.ps1      Windows 安装包元数据修正脚本
│  ├─ run-tauri.cjs            Tauri 启动脚本
│  ├─ sync-version.cjs         版本同步脚本
│  ├─ keys/                    许可证相关密钥文件目录
│  └─ keygen/                  许可证生成工具
├─ src-tauri/
│  ├─ build.rs                 Rust 构建脚本
│  ├─ Cargo.toml               Tauri Rust 依赖配置
│  ├─ tauri.conf.json          桌面应用配置
│  ├─ capabilities/            Tauri 能力声明
│  ├─ gen/                     Tauri 生成的 schema 文件
│  ├─ icons/                   多平台应用图标资源
│  ├─ src/
│  │  └─ main.rs               Tauri 插件注册与授权命令
│  └─ windows/
│     └─ main.wxs              WiX 安装包模板
```

## 当前实现要点

- AI 输出会被归一化处理，以兼容不同模型返回的字段命名差异。
- 专利点被拆分为区别技术特征和技术效果，便于后续扩权分析。
- 有益效果支持 Markdown 表格，兼顾预览和 DOCX 导出。
- 权利要求草图采用结构化数组表达，并区分独立权利要求与从属权利要求。
- 工作台数据持久化到 SQLite，但版本历史仅保留当前会话最近 50 条。
- 浏览器模式可用于前端联调，但完整能力以 Tauri 桌面模式为准。

## 适用场景

- 工程师将零散技术草稿快速整理为标准交底书
- 专利代理人前置收集技术要点、缺失项和替代方案
- 团队对已有技术方案进行多轮补强、追问和归档导出
