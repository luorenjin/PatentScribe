# PatentMate 软件开发指导手册

## 1. 文档目的

本文档面向接手 `PatentMate` 项目的开发同事，目标是说明：

- 项目是什么
- 本地如何启动和构建
- 关键模块分别负责什么
- 修改功能时应注意哪些边界
- 当前版本的已知限制和交付注意事项

当前仓库是一个基于 `React 19 + Vite 6 + TypeScript + Tauri 2` 的桌面应用，主要用于辅助生成和优化专利技术交底书。

## 2. 项目概览

PatentMate 的主流程可以概括为 5 步：

1. 用户上传技术文档或附图
2. 前端解析文件内容
3. 通过 LLM 输出诊断报告和结构化交底书
4. 用户继续追问、补充、改写局部内容
5. 将结果保存到工作台，或导出为 `DOCX / PDF`

桌面模式是完整运行形态，浏览器模式主要用于前端联调。

## 3. 技术栈

- 前端：`React 19`、`TypeScript 5`、`Vite 6`
- 桌面壳：`Tauri 2`
- UI/动画：`Tailwind CSS 4`、`motion`、`lucide-react`
- 大模型接入：`@google/genai`、`openai`
- 文件解析：`mammoth`、`pdfjs-dist`
- 导出：`docx`、`jspdf`、`html-to-image`
- 本地存储：`@tauri-apps/plugin-store`、`@tauri-apps/plugin-sql`
- 授权校验：Rust 侧 `RSA + SHA256`

## 4. 目录结构

```text
docs/                   文档目录
public/                 静态资源
scripts/                构建与发布辅助脚本
src/                    React 前端源码
  components/           页面组件与弹窗
  config/               模型和激活配置
  lib/                  AI、存储、导出等核心能力
  types/                全局类型定义
src-tauri/              Tauri/Rust 桌面端代码
```

关键文件：

- `src/App.tsx`：应用主状态和主流程编排
- `src/lib/aiService.ts`：模型调用、JSON 清洗、结果归一化
- `src/lib/storage.ts`：本地配置、许可证、工作台记录存储
- `src/lib/exportUtils.ts`：DOCX/PDF 导出
- `src/components/FileUpload.tsx`：上传、拖拽、文件解析入口
- `src/config/models.ts`：模型清单和默认模型
- `src/config/activation.ts`：激活开关和授权相关环境变量
- `src-tauri/src/main.rs`：Tauri 插件注册与授权命令
- `src-tauri/tauri.conf.json`：桌面应用构建配置

## 5. 环境准备

### 5.1 必备环境

- Node.js
- Yarn
- Rust toolchain
- Tauri 2 对应平台依赖

Windows 环境下建议优先开发和打包，因为仓库已经包含：

- `src-tauri/windows/main.wxs`
- `scripts/fix-msi-summary.ps1`

说明当前发布流程对 Windows 安装包有专门处理。

### 5.2 环境变量

以 `.env.example` 为模板创建本地 `.env`。

主要变量：

- `VITE_QWEN_API_KEY`
- `GEMINI_API_KEY`
- `VITE_OPENAI_API_KEY`
- `LICENSE_PUBLIC_KEY`
- `VITE_REQUIRE_ACTIVATION`
- `VITE_ENABLE_EMAIL_VERIFICATION`
- `VITE_ENABLE_LICENSE_FILE`
- `VITE_ALLOWED_EMAIL_DOMAINS`
- `VITE_ACTIVATION_API_BASE_URL`
- `VITE_ACTIVATION_SUPPORT_EMAIL`
- `VITE_DEBUG_SHOW_ONBOARDING`

说明：

- 默认提供商是 `qwen`。
- 系统不再提供内置 API Key。开发者必须在 `.env` 中或通过应用设置面板手动配置 API Key。
- OpenAI、Gemini、Qwen、自定义兼容 OpenAI 的接口都支持从设置面板配置。
- `.gitignore` 已忽略 `.env*`，仅保留 `.env.example` 可提交。

## 6. 本地启动与常用命令

### 6.1 安装依赖

```bash
yarn
```

### 6.2 前端浏览器模式

```bash
yarn dev
```

默认地址：

```text
http://localhost:3000
```

用途：

- 联调样式
- 联调纯前端交互
- 快速排查组件问题

限制：

- 浏览器模式下不能完整覆盖 Tauri 能力
- 本地文件系统、原生保存对话框、SQLite、授权命令需要桌面模式验证

### 6.3 桌面开发模式

```bash
yarn tauri dev
```

`package.json` 中的 `tauri` 脚本会先执行 `scripts/run-tauri.cjs`，再由该脚本调用 Tauri CLI。

### 6.4 类型检查

```bash
yarn lint
```

注意：当前 `lint` 实际执行的是 `tsc --noEmit`，并不包含 ESLint。

### 6.5 前端构建

```bash
yarn build
```

构建前会先执行：

```bash
yarn version-sync
```

### 6.6 桌面打包

```bash
yarn tauri build
```

打包完成后，Windows 下会额外执行 MSI 元数据修补脚本。

### 6.7 授权工具构建

```bash
yarn build:keygen
```

该命令会构建 `scripts/keygen` 下的 Rust 工具，并复制产物到 `dist/keygen.exe`。

## 7. 核心架构说明

## 7.1 前端状态主线

`src/App.tsx` 是应用主入口，负责：

- 初始化设置、工作台记录、许可证状态
- 控制主视图切换：`idle / analyzing / diagnosed / workbench`
- 编排首轮分析、追问优化、导出、保存、版本回滚

主要状态对象定义在 `src/types/patent.ts`：

- `PatentDisclosure`：结构化交底书
- `DiagnosisReport`：诊断结果
- `AppSettings`：模型与接口配置
- `WorkbenchRecord`：本地工作台记录

## 7.2 文件导入链路

入口在 `src/components/FileUpload.tsx`。

当前支持：

- `.docx`：通过 `mammoth` 提取正文
- `.doc`：只给出提示，不做结构化解析
- `.txt`：直接读取
- `.pdf`：通过 `pdfjs-dist` 逐页提取文本
- 图片：作为多模态输入传给模型

补充说明：

- 浏览器拖拽和 Tauri 原生拖拽都做了适配
- 当 `VITE_REQUIRE_ACTIVATION !== false` 且未激活时，上传会被拦截

## 7.3 模型调用链路

`src/lib/aiService.ts` 是核心模块，负责：

- 选择 Provider
- 选择模型 ID
- 组装 Prompt
- 处理图片转 Base64
- 解析模型返回 JSON
- 做诊断结果与交底书结果归一化

目前代码结构上实际分为两类 Provider：

- `GoogleProvider`
- `OpenAIProvider`

其中 `openai / qwen / custom` 最终都复用 `OpenAIProvider`。

因此修改模型接入时，需要同时关注：

- `src/config/models.ts`
- `src/types/patent.ts`
- `src/lib/aiService.ts`
- `src/components/SettingsModal.tsx`

避免出现“设置面板有选项，但调用层没处理”或“默认模型已改，但 UI 未同步”的问题。

## 7.4 本地存储

`src/lib/storage.ts` 分为两类存储：

1. `Tauri Store`
   - 文件：`.settings.dat`
   - 内容：系统设置、许可证数据

2. `SQLite`
   - 数据库：`patent_scribe.db`
   - 表：`workbench_records`
   - 内容：工作台记录

当前持久化边界：

- 工作台记录会落 SQLite
- 许可证和设置会落 Store
- 版本历史只保存在前端内存中，最多保留 50 条
- 聊天消息不会持久化到 SQLite

这点在做“恢复会话”“云同步”“多设备接续”时需要先补数据模型。

## 7.5 导出逻辑

`src/lib/exportUtils.ts` 提供两类导出：

- `exportToDocx`
- `exportToPdf`

行为差异：

- Tauri 模式优先使用原生保存对话框
- 浏览器模式退化为下载

其中：

- DOCX 是基于结构化内容拼装
- PDF 是对预览区域截图后分页输出

所以如果调整预览 DOM 结构，需要同步验证 PDF 导出是否仍然正常分页。

## 7.6 授权与激活

桌面端授权逻辑在 `src-tauri/src/main.rs`。

暴露的 Tauri 命令：

- `get_machine_code`
- `verify_license`

校验流程：

1. 读取许可证 Base64 信封
2. 解析 `data + signature`
3. 使用公钥验签
4. 比对机器码
5. 返回是否有效和到期时间

注意：

- 公钥优先读取环境变量 `LICENSE_PUBLIC_KEY`
- 未提供时会退回到代码里的 `PUBLIC_KEY_PEM_FALLBACK`

如果要更换授权体系，前端和 Rust 侧都需要一起调整。

## 8. 开发约定

### 8.1 改界面时的基本原则

- 先用 `yarn dev` 联调
- 最终必须用 `yarn tauri dev` 回归
- 涉及导出、拖拽、授权、工作台存储的修改，必须走桌面模式验证

### 8.2 改模型配置时的基本原则

- 默认模型、备选模型、Provider 枚举保持一致
- 新增 Provider 时至少同步更新：
  - `src/config/models.ts`
  - `src/types/patent.ts`
  - `src/lib/aiService.ts`
  - 设置弹窗相关代码

### 8.3 改文案时的基本原则

当前存在两套用户帮助内容：

- `docs/USER_GUIDE.md`
- `src/components/HelpCenterModal.tsx` 中的硬编码内容

也就是说，修改 `docs/USER_GUIDE.md` 不会自动反映到应用内帮助中心。若需要保持一致，应同步修改两处，或后续重构为单一来源。

### 8.4 改数据结构时的基本原则

如果调整 `PatentDisclosure` 或 `DiagnosisReport` 字段，至少要检查：

- 类型定义
- AI 返回 JSON 的 Schema
- 归一化逻辑
- 预览组件
- 导出逻辑
- 本地工作台读写

这是当前最容易产生隐性回归的地方。

## 9. 验证建议

当前仓库没有完善的自动化测试体系，最低建议如下：

### 9.1 提交前命令

```bash
yarn lint
yarn build
```

涉及桌面能力时再执行：

```bash
yarn tauri dev
```

### 9.2 手工冒烟清单

- 应用能正常启动
- 设置面板可以保存不同 Provider 配置
- 首次上传 `.docx/.pdf/.txt/图片` 至少各测一次
- 未激活时上传是否按预期拦截
- 已激活后上传是否恢复
- 首轮分析后是否生成诊断和结构化交底书
- 追问后是否更新交底书内容
- 工作台保存、加载、删除是否正常
- 版本历史回滚是否正常
- DOCX 导出是否可打开
- PDF 导出是否分页正常

## 10. 构建与发布说明

### 10.1 版本号来源

`package.json` 中的 `version` 是主版本源。

`scripts/sync-version.cjs` 会尝试同步到：

- `src-tauri/Cargo.toml`
- `README.md`

因此改版本时建议只改 `package.json`，再执行：

```bash
yarn version-sync
```

### 10.2 桌面打包

```bash
yarn tauri build
```

执行链路：

1. `scripts/run-tauri.cjs`
2. 同步版本号
3. 调用 Tauri CLI
4. 若是 Windows 且构建出 MSI，则执行 `scripts/fix-msi-summary.ps1`

### 10.3 授权工具

如果需要生成许可证相关辅助工具，使用：

```bash
yarn build:keygen
```

对应源码目录：

```text
scripts/keygen/
```

## 11. 当前实现限制

- 当前没有单元测试或集成测试
- `yarn lint` 仅做 TypeScript 类型检查
- `.doc` 文件暂未真正解析，只提示用户转 `.docx`
- 版本历史只存在当前前端会话，不持久化
- 工作台不保存完整聊天上下文
- 应用内帮助中心未直接复用 `docs/USER_GUIDE.md`
- 浏览器模式不是完整产品形态，桌面模式才是实际交付基准

## 12. 交付给下一位同事时的检查项

- 确认 `.env` 不包含不应外发的生产密钥
- 确认 `LICENSE_PUBLIC_KEY` 使用的是目标环境需要的公钥
- 确认 `scripts/keys/` 下的密钥材料是否应随交付一起提供
- 确认默认模型与默认 API 地址符合交付环境
- 确认 `yarn build` 和 `yarn tauri build` 至少各成功一次
- 确认用户手册、应用内帮助、实际功能没有明显不一致

发布和授权交付的详细检查项，另见：

- `docs/RELEASE_DELIVERY_CHECKLIST.md`
- `docs/INSTALLATION_FIRST_RUN_GUIDE.md`
- `docs/ENVIRONMENT_SETUP_GUIDE.md`

## 13. 建议的后续治理项

优先级建议如下：

1. 增加自动化测试，至少覆盖 `aiService` 归一化逻辑和 `storage` 读写
2. 将应用内帮助内容改为从文档或统一配置生成，避免双份维护
3. 补齐 `.doc` 兼容方案或明确移除支持文案
4. 为工作台和聊天记录建立更完整的持久化模型
5. 将发布、密钥、授权相关流程拆分为更明确的内部交付文档
