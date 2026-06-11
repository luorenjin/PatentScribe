import fs from "node:fs/promises";
import path from "node:path";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from "docx";

const root = process.cwd();
const outputPath = path.join(root, "README.docx");
const fallbackOutputPath = path.join(root, "README.updated.docx");
const today = "2026-06-09";

function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({
    text,
    heading: level,
    spacing: { before: 240, after: 120 },
  });
}

function para(text) {
  return new Paragraph({
    children: [new TextRun({ text })],
    spacing: { after: 120 },
  });
}

function bullets(items) {
  return items.map(
    (text) =>
      new Paragraph({
        text,
        bullet: { level: 0 },
        spacing: { after: 80 },
      }),
  );
}

function numbered(items) {
  return items.map(
    (text) =>
      new Paragraph({
        text,
        numbering: { reference: "handover-numbering", level: 0 },
        spacing: { after: 80 },
      }),
  );
}

function codeBlock(lines) {
  return lines.map(
    (line) =>
      new Paragraph({
        children: [new TextRun({ text: line, font: "Consolas" })],
        spacing: { after: 60 },
        border: {
          left: { style: BorderStyle.SINGLE, size: 4, color: "D9D9D9" },
        },
        indent: { left: 240 },
      }),
  );
}

const children = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 160 },
    children: [
      new TextRun({
        text: "PatentMate 程序交接文档",
        bold: true,
        size: 34,
      }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 320 },
    children: [
      new TextRun({
        text: `生成日期：${today}`,
        color: "666666",
      }),
    ],
  }),

  heading("1. 交接目的"),
  para("本文档面向接手 PatentMate 项目的开发、测试、实施或维护同事，用于在原负责人离岗后，尽快建立对项目现状、架构、配置方式、发布流程、授权机制与当前风险点的整体认知。"),
  para("这份文档不是用户手册，而是偏工程管理和维护落地的交接材料。阅读顺序建议为：先看项目概览，再看运行与发布，再看授权和密钥，最后看风险与后续建议。"),

  heading("2. 项目概览"),
  para("PatentMate 是一个用于专利技术交底书生成与优化的桌面应用。应用支持导入文档与附图，经由大模型生成诊断报告和结构化交底书，随后支持追问式优化、局部改写、工作台保存、版本回滚与 DOCX/PDF 导出。"),
  ...bullets([
    "前端技术栈：React 19、TypeScript 5、Vite 6、Tailwind CSS 4、motion",
    "桌面壳：Tauri 2",
    "模型接入：OpenAI SDK 兼容模式、Google Gemini SDK",
    "默认国内模型通道：阿里百炼 Qwen 兼容接口",
    "本地存储：Tauri Store + SQLite",
    "授权校验：Tauri Rust 侧通过机器码与 RSA 签名许可证完成校验",
  ]),

  heading("3. 当前仓库中最关键的事实"),
  ...bullets([
    "默认 builtin 模式当前实际依赖前端构建期环境变量 VITE_QWEN_API_KEY。",
    "builtin 模式不是用户可在设置页内自行修改 Key 的模式。",
    "qwen 模式才是终端用户或内部同事自行填写百炼 API Key 的模式。",
    "企业邮箱激活路径当前仍是模拟逻辑，并未形成真实服务端闭环。",
    "当前正式可用的授权流程应视为：机器码申请 -> 生成授权码 -> 粘贴导入激活。",
    "scripts/keygen/src/main.rs 中存在内嵌私钥，keygen.exe 不应发给普通使用者。",
  ]),

  heading("4. 仓库结构与职责划分"),
  ...bullets([
    "src/App.tsx：主状态管理、应用初始化、会话流转、工作台与导出入口。",
    "src/components/：上传页、聊天区、预览区、设置弹窗、帮助弹窗、激活弹窗等 UI 组件。",
    "src/lib/aiService.ts：模型选择、Prompt 组织、文件多模态处理、结果清洗和 JSON 归一化。",
    "src/lib/storage.ts：Tauri Store 和 SQLite 读写。",
    "src/lib/exportUtils.ts：DOCX 与 PDF 导出逻辑。",
    "src/config/models.ts：Provider 默认配置、模型列表、默认百炼/OpenAI/Gemini 端点。",
    "src/config/activation.ts：激活相关环境变量映射。",
    "src-tauri/src/main.rs：Tauri 插件注册、机器码生成、许可证校验。",
    "scripts/run-tauri.cjs：Tauri 命令包装、版本同步和 Windows MSI 后处理。",
    "scripts/sync-version.cjs：同步 package.json、Cargo.toml 与 README 版本号。",
    "scripts/keygen/：离线授权码生成工具。",
  ]),

  heading("5. 业务主流程"),
  ...numbered([
    "用户启动应用，完成首次模型配置。",
    "若环境要求激活，则先通过机器码导入授权码。",
    "用户上传 .docx、.pdf、.txt 或图片。",
    "前端先解析文本，图片作为多模态文件透传给模型。",
    "aiService 调用目标模型，输出 diagnosis 和 disclosure 两个主结果。",
    "用户在聊天区继续补充信息，系统迭代更新 disclosure。",
    "需要时保存到工作台、本地回看或导出为 DOCX/PDF。",
  ]),

  heading("6. 本地运行与构建"),
  para("日常开发和交付常用命令如下。当前 lint 实际仅执行 TypeScript 类型检查，不包含 ESLint。"),
  ...codeBlock([
    "yarn",
    "yarn dev",
    "yarn tauri dev",
    "yarn lint",
    "yarn build",
    "yarn tauri build",
    "yarn build:keygen",
  ]),
  para("浏览器模式主要用于前端联调；涉及拖拽、原生保存、SQLite、授权校验等能力时，必须通过 Tauri 模式验证。"),

  heading("7. 环境安装教程（面向非开发同事）"),
  para("不是所有接手人都需要安装开发环境。如果只是安装软件、填写百炼 Key、申请授权码并正常使用，不需要安装 Node.js、Yarn、Rust 或 Visual Studio Build Tools。只有在需要重新打包、改代码、重建 keygen.exe 时，才需要完整环境。"),
  ...numbered([
    "先安装 Microsoft Visual Studio C++ Build Tools，并勾选 Desktop development with C++。",
    "确认系统具备 Microsoft Edge WebView2 Runtime；大多数 Windows 10/11 已自带，如缺失再补装。",
    "安装 Rust，使用官方 rustup，保持默认 stable-msvc 工具链。",
    "安装 Node.js，选择官网标注的 LTS 版本。",
    "安装 Yarn。结合本仓库现状，建议使用 Yarn Classic 1.22.x，避免非开发同事直接踩到 Yarn 4 的兼容差异。",
    "安装完成后，在 PowerShell 中依次检查 node -v、npm -v、yarn -v、rustc --version、cargo --version。",
    "进入项目目录执行 yarn，随后执行 yarn tauri dev 验证桌面环境是否可正常启动。",
  ]),
  para("推荐的最低掌握程度是：会安装 Node.js、Yarn、Rust，会执行 yarn、yarn tauri dev、yarn tauri build、yarn build:keygen。只要做到这一层，即使不懂代码，也基本具备接手打包和授权签发的能力。"),
  para("详细按步骤安装说明已单独整理在 docs/ENVIRONMENT_SETUP_GUIDE.md 中，建议和本文一并交付。"),

  heading("8. 模型与配置说明"),
  para("当前项目支持 builtin、qwen、google、openai、custom 五类 Provider。实际实现上，google 走 Google SDK，其余 openai、qwen、builtin、custom 都走 OpenAI 兼容调用链。"),
  ...bullets([
    "builtin：当前读取 VITE_QWEN_API_KEY，默认端点为 https://dashscope.aliyuncs.com/compatible-mode/v1。",
    "qwen：在设置页由用户填写 API Key、Endpoint、Model ID。",
    "openai：在设置页填写 OpenAI 兼容配置。",
    "google：读取设置值或 Gemini 环境变量。",
    "custom：接任意兼容 OpenAI 协议的代理或私有网关。",
  ]),
  para("如果未来继续维护内部交付，最值得推进的改造方向是：把模型调用迁移到 Tauri Rust 侧，让前端不再直接持有 Key；builtin 改为企业预置配置，而不是构建期写死的 VITE_QWEN_API_KEY。"),

  heading("9. 数据存储现状"),
  ...bullets([
    ".settings.dat：通过 Tauri Store 保存模型设置与许可证数据。",
    "patent_scribe.db：通过 SQLite 保存工作台记录。",
    "versionHistory：仅保存在前端会话内存，最多 50 条，不持久化。",
    "聊天消息不会完整落库，恢复工作台只能恢复 disclosure 和 diagnosis，不能恢复完整对话链。",
  ]),

  heading("10. 导出能力说明"),
  ...bullets([
    "DOCX：使用 docx 库基于结构化 disclosure 与 diagnosis 生成。",
    "PDF：通过 html-to-image 截图预览区域，再由 jsPDF 分页输出。",
    "Tauri 模式优先使用原生保存对话框，浏览器模式退化为下载。",
  ]),
  para("如果后续修改 PreviewPane 的 DOM 结构或样式，要同步回归 PDF 导出，因为当前 PDF 实现对页面结构比较敏感。"),

  heading("11. 授权机制与机器码流程"),
  para("授权机制运行在 Tauri Rust 侧。客户端生成机器码，导入一个 Base64 编码的许可证文本，Rust 侧解包、验签、检查 machineCode 与 expiryDate，返回是否有效。"),
  ...numbered([
    "用户在设置页或激活弹窗中复制机器码。",
    "将机器码发送给授权负责人。",
    "授权负责人使用 keygen 工具生成 License 文本。",
    "用户在激活弹窗中粘贴 License，点击导入并激活。",
    "客户端调用 verify_license 完成校验并将授权信息保存到本地。",
  ]),
  para("注意：邮箱验证码激活当前不是正式交付路径。ActivationModal 中该路径使用 mockLicense 逻辑，仅适合作为后续功能占位。"),

  heading("12. 授权码生成工具使用方式"),
  para("授权码生成工具位于 scripts/keygen。建议只由少数维护人员掌握。"),
  ...codeBlock([
    "yarn build:keygen",
    "dist\\keygen.exe",
    "dist\\keygen.exe ABCD-1234-EF56-7890 2026-12-31",
  ]),
  ...bullets([
    "不带参数运行时，工具会交互式要求输入机器码和到期日。",
    "只输入机器码不输入日期时，默认日期为 2026-12-31。",
    "输出结果是一整段 Base64 文本，应原样发给用户，不要裁剪或格式化。",
    "当前 keygen 源码中内嵌私钥，这是最高敏感项之一。",
  ]),

  heading("13. 发布与交付要点"),
  ...numbered([
    "修改 package.json 版本号。",
    "执行 yarn version-sync。",
    "确认 .env 中目标环境变量，特别是 VITE_QWEN_API_KEY 与 LICENSE_PUBLIC_KEY。",
    "执行 yarn lint、yarn build、yarn tauri build。",
    "回归上传、分析、工作台、导出、激活流程。",
    "交付时附带用户手册、开发手册、发布/授权清单、安装与首次配置说明。",
  ]),
  para("Windows 打包结束后，scripts/run-tauri.cjs 会在构建完成后尝试修补 MSI Summary 信息。当前发布流程更偏 Windows 内部分发。"),

  heading("14. 当前已知问题与高风险点"),
  ...bullets([
    "builtin 依赖 VITE_QWEN_API_KEY，Key 会进入前端构建产物。",
    "企业邮箱激活未闭环，勿按正式功能对外承诺。",
    "keygen 源码内嵌私钥，若被无控制扩散，会导致许可证体系失守。",
    "工作台不保存完整聊天上下文，长会话恢复能力不足。",
    "自动化测试基本缺失，回归高度依赖手工验证。",
    "docs/USER_GUIDE.md 与应用内 HelpCenterModal 内容目前是双份维护，存在不一致风险。",
  ]),

  heading("15. 我建议接手人优先做的事情"),
  ...numbered([
    "先按现有文档完成一次从配置、激活、上传、导出到打包的全流程自测。",
    "整理并收紧私钥、keygen.exe 和组织级百炼 Key 的持有范围。",
    "把 builtin 的对外语义改成企业默认配置，而不是默认内置密钥。",
    "中期把大模型调用从前端迁到 Tauri 侧，降低密钥暴露面。",
    "补至少一层自动化验证：aiService 归一化、storage 读写、授权校验回归脚本。",
  ]),

  heading("16. 交接资料清单"),
  ...bullets([
    "docs/DEVELOPMENT_GUIDE.md：开发指导手册",
    "docs/RELEASE_DELIVERY_CHECKLIST.md：发布/授权交付清单",
    "docs/INSTALLATION_FIRST_RUN_GUIDE.md：安装与首次配置说明",
    "docs/ENVIRONMENT_SETUP_GUIDE.md：环境安装教程（面向非开发同事）",
    "docs/USER_GUIDE.md：用户使用手册",
    "scripts/keygen/：授权码生成工具源码",
    "scripts/keys/public.pem：公开公钥材料",
    "scripts/keys/private.pem：私钥材料，必须严格控权",
  ]),

  heading("17. 结语"),
  para("从功能完整度看，这个项目已经具备内部使用价值；从工程化和安全性看，仍处在可维护但不够稳健的状态。真正影响后续维护成本的，不是功能是否再多一两个按钮，而是模型密钥管理、授权体系边界、回归流程和文档一致性。只要把这几个点收住，后续接手会顺很多。"),
];

const doc = new Document({
  numbering: {
    config: [
      {
        reference: "handover-numbering",
        levels: [
          {
            level: 0,
            format: "decimal",
            text: "%1.",
            alignment: AlignmentType.START,
          },
        ],
      },
    ],
  },
  sections: [{ children }],
});

const buffer = await Packer.toBuffer(doc);

try {
  await fs.writeFile(outputPath, buffer);
  console.log(`Generated ${outputPath}`);
} catch (error) {
  if (error && error.code === "EBUSY") {
    await fs.writeFile(fallbackOutputPath, buffer);
    console.log(`Target locked, generated ${fallbackOutputPath}`);
  } else {
    throw error;
  }
}
