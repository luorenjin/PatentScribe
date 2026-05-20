import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, HelpCircle, BookOpen, Shield, Cpu, Zap, Save, FileText } from 'lucide-react';

interface HelpCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpCenterModal({ isOpen, onClose }: HelpCenterModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl z-[101] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100/50 rounded-lg text-indigo-600">
                  <HelpCircle size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 leading-tight">帮助中心</h2>
                  <p className="text-[11px] text-gray-500 font-medium">了解如何更好地使用 PatentMate</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400">
                <X size={20} />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="prose prose-sm max-w-none prose-indigo prose-headings:font-serif prose-headings:font-bold prose-p:text-gray-600 prose-li:text-gray-600">
                <h1 className="flex items-center gap-2">
                  <BookOpen className="text-indigo-600" size={28} />
                  PatentMate 用户使用手册
                </h1>
                <p className="lead">
                  欢迎使用 PatentMate —— 您的 AI 专利协作专家。本手册旨在帮助您快速掌握软件的各项功能，从获取授权到最终生成高质量的专利技术交底书。
                </p>

                <hr />

                <section id="license">
                  <h2 className="flex items-center gap-2">
                    <Shield className="text-indigo-500" size={22} />
                    1. 软件授权与激活
                  </h2>
                  <p>为了保障软件的安全与专业服务，PatentMate 采用机器码授权机制。请按照以下步骤获取并激活您的软件使用权限。</p>
                  
                  <h3>1.1 获取机器码</h3>
                  <ol>
                    <li>打开 PatentMate 软件。</li>
                    <li>在弹出的激活窗口或“设置”面板中，找到“机器码 (Machine Code)”一栏。</li>
                    <li>点击机器码旁边的“复制”按钮，将其保存到剪贴板。</li>
                  </ol>

                  <h3>1.2 申请授权码</h3>
                  <ol>
                    <li>使用您的<strong>企业邮箱</strong>撰写一封邮件。</li>
                    <li>邮件主题建议为：“PatentMate 软件授权申请 - [您的姓名/部门]”。</li>
                    <li>在邮件正文中粘贴您刚刚复制的<strong>机器码</strong>，并附上您的基本信息（如所在部门或职务）。</li>
                    <li>将邮件发送至官方授权邮箱：<strong className="text-indigo-600 font-mono">luorj@microviewsz.com</strong>。</li>
                    <li>我们将在收到邮件后的 1-2 个工作日内，将专属的授权码回复至您的邮箱。</li>
                  </ol>

                  <h3>1.3 激活软件</h3>
                  <ol>
                    <li>获取到授权码后，返回 PatentMate 软件。</li>
                    <li>将授权码填入激活窗口的“授权码 (License Key)”输入框中。</li>
                    <li>点击“激活”按钮。验证成功后，即可解锁全部功能。</li>
                  </ol>
                </section>

                <hr />

                <section id="config">
                  <h2 className="flex items-center gap-2">
                    <Cpu className="text-indigo-500" size={22} />
                    2. 模型选择与自定义配置
                  </h2>
                  <p>PatentMate 经过严格测试，推荐使用内置模型和<strong>通义千问</strong>模型，以确保国内网络环境下的稳定生成。同时，软件也支持接入 Google Gemini 和 OpenAI GPT 模型。</p>
                  <blockquote>
                    注：使用 Google Gemini 或 OpenAI 模型需自行配置科学上网环境。
                  </blockquote>

                  <h3>2.1 模型选择</h3>
                  <ol>
                    <li>进入软件工作区后，点击右上角的<strong>设置 (Settings)</strong> 按钮。</li>
                    <li>在“AI 模型配置”选项卡下，您可以看到当前可用的模型列表。</li>
                    <li>推荐选择内置模型或通义千问。如果您具备相应的网络环境，也可以切换至 Google Gemini 或 OpenAI。</li>
                    <li>点击“保存”，系统会自动切换至您选择的模型。</li>
                    <li>配置完成后，您可以在软件主界面看到当前使用的模型名称。</li>
                    <li>如果内置模型调用失败，可以自行注册阿里云账号，阿里百炼可以获取免费的 Token，配置完毕后，点击“保存”，系统会自动切换至阿里云模型。</li>
                  </ol>

                  <h3>2.2 自定义模型配置</h3>
                  <p>如果您拥有个人的模型 API Key 或需要配置内部代理网络，可以通过以下方式进行自定义配置：</p>
                  <ol>
                    <li>在设置面板中选择“自定义模型”或对应模型服务商（如 OpenAI、阿里云）。</li>
                    <li><strong>填写 API Key</strong>：将您从服务商处获取的 API 密钥粘贴到相应的输入框中。</li>
                    <li><strong>高级设置 (可选)</strong>：如有需要，可填写自定义的 Base URL（代理地址）以确保网络连通。</li>
                    <li>点击“保存”，系统会验证 API 的连通性，并在验证通过后生效。</li>
                  </ol>
                </section>

                <hr />

                <section id="usage">
                  <h2 className="flex items-center gap-2">
                    <Zap className="text-indigo-500" size={22} />
                    3. 快速使用与初版优化
                  </h2>
                  <p>PatentMate 的主要使用场景之一是针对研发工程师提供的<strong>初版专利交底书</strong>进行深度优化和提升，引导您挖掘出具有新颖性和创造性的专利点。</p>

                  <h3>3.1 完整内容上传与图例处理</h3>
                  <ol>
                    <li>在<strong>客户端首页</strong>，您可以找到醒目的文件上传框。</li>
                    <li>建议您将已有的技术构思或初版交底书内容尽可能完整地输入或上传给 AI。</li>
                    <li><strong>图例处理建议</strong>：如果您的原稿中包含系统架构图、流程图或结构示意图等图例，最好先将这些图例单独<strong>导出为图片格式</strong>，然后再将图片直接<strong>拖拽至客户端首页的文件上传框</strong>。图文并茂的完整内容有助于 AI 更精准地理解技术方案的空间结构和逻辑关系。</li>
                  </ol>

                  <h3>3.2 AI 引导式追问</h3>
                  <p>AI 收到您提供的初版材料及图片后，不会立即生成最终文档，而是会进行深度的诊断分析。若方案在细节上仍有欠缺，AI 会提出针对性的问题（例如：“该方案与现有技术相比，解决了什么痛点？”或“图中模块 A 与模块 B 之间的具体交互机制是怎样的？”）。</p>

                  <h3>3.3 持续优化</h3>
                  <ol>
                    <li>根据 AI 提出的问题，在对话框中进行补充回答。</li>
                    <li>AI 将根据您的补充，实时更新专利点、技术效果及交底书的结构大纲。</li>
                    <li>这是一个双向互动的过程，您可以通过多次对话不断丰富技术细节，直至方案完整、逻辑严密。</li>
                  </ol>
                </section>

                <hr />

                <section id="export">
                  <h2 className="flex items-center gap-2">
                    <Save className="text-indigo-500" size={22} />
                    4. 交底书保存与导出
                  </h2>
                  <p>当技术方案完善后，您可以随时进行保存和导出，确保数据不丢失。</p>

                  <h3>4.1 工作台保存 (Workbench)</h3>
                  <ol>
                    <li>软件提供本地存档功能（Workbench）。在右侧的预览面板 (Preview Pane) 中，您可以对生成的交底书内容进行实时编辑。</li>
                    <li>编辑完成后，系统会自动进行本地存档（或点击“保存”按钮），将当前版本存储在本地的数据库中，方便日后随时调阅。</li>
                  </ol>

                  <h3>4.2 导出 Word/PDF</h3>
                  <ol>
                    <li>在交底书预览面板的右上角，提供“导出”按钮。</li>
                    <li>您可以选择导出为 <strong>Word (.docx)</strong> 格式，以便进行进一步的精细排版或交由专利代理师审查。</li>
                  </ol>
                </section>

                <hr />

                <section id="disclaimer">
                  <h2 className="flex items-center gap-2">
                    <FileText className="text-indigo-500" size={22} />
                    5. 免责声明
                  </h2>
                  <p>PatentMate 仅提供软件服务，内容由 AI 生成，请勿用于非法用途。</p>
                </section>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-900/10 hover:bg-indigo-700 transition-all active:scale-95 text-sm"
              >
                我知道了
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
