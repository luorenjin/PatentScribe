import { PatentDisclosure, DiagnosisReport, AppSettings } from "../types/patent";

// --- Provider Interfaces & Types ---

interface LLMProvider {
  analyze(content: string, files: File[], settings: AppSettings): Promise<{ diagnosis: DiagnosisReport; disclosure: PatentDisclosure }>;
  generateFollowUp(disclosure: PatentDisclosure, diagnosis: DiagnosisReport, history: any[], settings: AppSettings): Promise<string>;
  updateDisclosure(original: PatentDisclosure, history: any[], files: File[], settings: AppSettings): Promise<PatentDisclosure>;
  reviseSection(sectionKey: string, originalSection: string, instruction: string, disclosure: PatentDisclosure, files: File[], settings: AppSettings): Promise<string>;
}

// --- Constants & Prompts ---

const SYSTEM_PROMPT = `你是一位资深专利工程师与专利代理人协作专家。本系统的核心任务是挖掘工程师的原始草稿中的【核心专利点】（即区别技术特征），并为工程师提供专利扩写及替代方案。

请根据提供的原始构思（及可能包含的架构图、流程图等附图），进行深度解析，协助输出结构化的《标准技术交底书》。

【1. 专利点挖掘阶段诊断报告（DiagnosisReport）要求】
- innovation、novelty、utility: 请基于100分制给出 0-100 之间的整数分数。
- summary: 技术痛点与方案概述，一语中的。
- patentPoints: 提取所有值得保护的"专利点"。必须分离"区别技术特征 (feature)"和"技术效果 (effect)"。
- missingItems: 指出专利代理人撰写时缺失的信息。
- alternatives: 根据核心方案，自动发散推荐 2-3 个【替代方案】（例如：若是螺丝固定，推荐卡扣/焊接替代；若是某种算法，推荐其他模型），以扩大专利权利要求保护范围。必须包含 suggestion（建议的替代方案描述）和 reason（替代原因及能扩大的范围）。

【2. 标准技术交底书结构要求】
请直接把内容填入以下 JSON 字段中。每个字段只需填写具体内容（纯字符串类型，严禁在字符串字段中使用嵌套对象，如禁止 {"table": "..."}），不要带有任何外层 Markdown 一级标题。数学公式使用 LaTeX。
- title: 发明名称
- field: 技术领域
- background: 背景技术及现有缺陷（需详尽）
- purpose: 发明目的
- solution: 技术方案（核心保护点，条理清晰）
- effects: 有益效果（必须以 Markdown 格式表格呈现深度对比）。表格推荐包含以下列：对比维度、现有技术、本申请方案、有益效果说明。注意：Markdown 表格前后必须各有至少一个空行，且表格内部行与行之间严禁插入空行，列必须严谨对齐。保证表格连续性。
- figures: 附图说明（如果有用户上传了图片，请根据图片自动生成图解与模块说明，否则根据方案构思写出图的结构要求）
- implementation: 具体实施方式（至少包含 2 个实施例）
- claims: 权利要求草图 (Claims Map)。必须包含 id, type (independent/dependent), content, dependsOn (if dependent)。请确保 JSON 返回值中，Markdown 的换行符使用 \\n 转义。不要在表格行中间插入 \\n\\n。`;

// --- Provider Configs & Defaults ---

const DEFAULT_CONFIGS: Record<string, { model: string; backupModel: string; apiEndpoint?: string }> = {
  builtin: {
    model: "qwen3.6-plus",
    backupModel: "qwen3.6-flash",
    apiEndpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  },
  google: {
    model: "gemini-3-flash-preview",
    backupModel: "gemini-3.1-flash-lite",
  },
  openai: {
    model: "gpt-5.4",
    backupModel: "gpt-5.4-mini",
    apiEndpoint: "https://api.openai.com/v1",
  },
  qwen: {
    model: "qwen3.6-plus",
    backupModel: "qwen3.6-flash",
    apiEndpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  }
};

function getModelId(settings: AppSettings, task: 'analyze' | 'others'): string {
  const provider = settings.llmProvider || 'builtin';
  const providerConfig = settings.providers?.[provider];
  if (providerConfig?.modelId) return providerConfig.modelId;
  if (settings.modelId) return settings.modelId;
  const config = DEFAULT_CONFIGS[provider] || DEFAULT_CONFIGS.builtin;
  return task === 'analyze' ? config.model : config.backupModel;
}

function getCredentials(settings: AppSettings) {
  const provider = settings.llmProvider || 'builtin';
  const providerConfig = settings.providers?.[provider];

  if (provider === 'builtin') {
    return {
      apiKey: (import.meta as any).env.VITE_QWEN_API_KEY || '',
      apiEndpoint: DEFAULT_CONFIGS.builtin.apiEndpoint
    };
  }

  return {
    apiKey: providerConfig?.apiKey || settings.apiKey,
    apiEndpoint: providerConfig?.apiEndpoint || settings.apiEndpoint
  };
}

// --- Utility Functions ---

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
}

function cleanAndParseJSON(text: string): any {
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch (e) {
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (jsonMatch && jsonMatch[1]) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch (e2) {
        const cleaned = jsonMatch[1].trim().replace(/,(\s*[}\]])/g, '$1');
        try {
          return JSON.parse(cleaned);
        } catch (e3) {
          console.error("Failed to parse extracted JSON:", e3);
        }
      }
    }

    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const braceContent = text.substring(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(braceContent);
      } catch (e4) {
        console.error("Failed to parse brace matched JSON:", e4);
      }
    }

    console.error("Original text that failed to parse:", text);
    throw new Error("Failed to parse AI response as JSON structure");
  }
}

function extractDataBlock(parsedData: any, primaryKeys: string[], indicatorKeys: string[]): any {
  if (!parsedData || typeof parsedData !== 'object') return {};

  const normalizeKey = (k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normalizedPrimaryKeys = primaryKeys.map(normalizeKey);

  const isMatch = (obj: any) => {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
    return indicatorKeys.some(key => {
      const normalizedKey = normalizeKey(key);
      return Object.keys(obj).some(k => normalizeKey(k) === normalizedKey);
    });
  };

  // 1. Check top-level primary keys (fuzzy)
  for (const k in parsedData) {
    if (normalizedPrimaryKeys.includes(normalizeKey(k)) && parsedData[k] && typeof parsedData[k] === 'object' && !Array.isArray(parsedData[k])) {
      return parsedData[k];
    }
  }

  // 2. Recursive search
  const queue = [parsedData];
  const visited = new Set();
  let depth = 0;
  const maxDepth = 5;

  while (queue.length > 0 && depth < maxDepth) {
    const size = queue.length;
    for (let i = 0; i < size; i++) {
      const current = queue.shift();
      if (!current || typeof current !== 'object' || visited.has(current)) continue;
      visited.add(current);

      if (isMatch(current)) return current;

      for (const k in current) {
        const next = current[k];
        if (next && typeof next === 'object' && !Array.isArray(next)) {
          queue.push(next);
        }
      }
    }
    depth++;
  }

  return parsedData;
}

function normalizeDiagnosis(data: any): DiagnosisReport {
  if (!data || typeof data !== 'object') data = {};

  const normalizeKey = (k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, '');

  const getFieldValue = (targetKeys: string[]) => {
    const normalizedTargets = targetKeys.map(normalizeKey);
    for (const k in data) {
      if (normalizedTargets.includes(normalizeKey(k))) return data[k];
    }
    return undefined;
  };

  const getNumber = (keys: string[], defaultVal: number = 0) => {
    const val = getFieldValue(keys);
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const parsed = parseInt(val.replace(/[^0-9.-]/g, ''), 10);
      if (!isNaN(parsed)) return parsed;
    }
    return defaultVal;
  };

  const getString = (keys: string[], defaultVal: string = "") => {
    const val = getFieldValue(keys);
    if (val !== undefined && val !== null) return String(val).trim();
    return defaultVal;
  };

  const getArray = (keys: string[]) => {
    const val = getFieldValue(keys);
    return Array.isArray(val) ? val : [];
  };

  return {
    innovation: getNumber(['innovation', '创新性', 'innovationScore']),
    novelty: getNumber(['novelty', '新颖性', 'noveltyScore']),
    utility: getNumber(['utility', '实用性', 'utilityScore']),
    summary: getString(['summary', '摘要', '概述', '技术痛点'], "未生成摘要"),
    patentPoints: getArray(['patentPoints', '核心专利点', '专利点']).map((p: any) => ({
      feature: p.feature || p.特征 || p.区别技术特征 || "未知特征",
      effect: p.effect || p.效果 || p.技术效果 || "未知效果"
    })),
    missingItems: getArray(['missingItems', '缺失信息', '待补充']),
    alternatives: getArray(['alternatives', '替代方案', '建议']).map((a: any) => ({
      suggestion: a.suggestion || a.建议 || a.方案 || "未知建议",
      reason: a.reason || a.原因 || a.理由 || "未知原因"
    }))
  };
}

function normalizeDisclosure(data: any): PatentDisclosure {
  if (!data || typeof data !== 'object') data = {};

  const normalizeKey = (k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, '');

  const getFieldValue = (targetKeys: string[]) => {
    const normalizedTargets = targetKeys.map(normalizeKey);
    for (const k in data) {
      if (normalizedTargets.includes(normalizeKey(k))) return data[k];
    }
    return undefined;
  };

  const smartStringify = (val: any): string => {
    if (val === undefined || val === null) return "";
    if (typeof val === 'string') return val.trim();
    if (Array.isArray(val)) {
      return val.map(item => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object' && item !== null) {
          // Handle implementation-style objects {title, content}
          const title = item.title || item.标题 || item.名称 || "";
          const content = item.content || item.内容 || item.描述 || "";
          if (title && content) return `### ${title}\n${content}`;
          return JSON.stringify(item);
        }
        return String(item);
      }).join('\n\n');
    }
    if (typeof val === 'object') {
      // Handle figures-style objects {"图1": "..."} or {"table": "..."}
      const entries = Object.entries(val);
      if (entries.length === 1 && ['table', 'description', 'content', 'text'].includes(entries[0][0].toLowerCase())) {
        return String(entries[0][1]);
      }
      return entries.map(([k, v]) => `**${k}**: ${v}`).join('\n\n');
    }
    return String(val);
  };

  const getString = (keys: string[], defaultVal: string = "") => {
    const val = getFieldValue(keys);
    return val !== undefined ? smartStringify(val) : defaultVal;
  };

  const getArray = (keys: string[]) => {
    const val = getFieldValue(keys);
    return Array.isArray(val) ? val : [];
  };

  return {
    title: getString(['title', '发明名称', '名称'], "未命名方案"),
    field: getString(['field', '技术领域', '领域']),
    background: getString(['background', '背景技术', '背景']),
    purpose: getString(['purpose', '发明目的', '目的']),
    solution: getString(['solution', '技术方案', '方案']),
    effects: getString(['effects', '有益效果', '效果']),
    figures: getString(['figures', '附图说明', '附图']),
    implementation: getString(['implementation', '具体实施方式', '实施例']),
    claims: getArray(['claims', '权利要求']).map((c: any) => ({
      id: typeof c.id === 'number' ? c.id : parseInt(String(c.id || 0), 10) || Math.floor(Math.random() * 1000),
      type: String(c.type || "").toLowerCase().includes('independent') || String(c.type || "").includes('独立') ? 'independent' : 'dependent',
      dependsOn: typeof c.dependsOn === 'number' ? c.dependsOn : (c.dependsOn ? parseInt(String(c.dependsOn), 10) : undefined),
      content: c.content || c.内容 || ""
    }))
  };
}

// --- Google Provider Implementation ---

class GoogleProvider implements LLMProvider {
  private async getClient(settings: AppSettings) {
    const { apiKey } = getCredentials(settings);
    const key = apiKey || ((import.meta as any).env.VITE_GEMINI_API_KEY || (process.env as any).GEMINI_API_KEY) || '';
    if (!key) throw new Error("Google Gemini API Key is missing");

    const { GoogleGenAI } = await import("@google/genai");
    return new GoogleGenAI({ apiKey: key });
  }

  async analyze(content: string, files: File[], settings: AppSettings) {
    const ai = await this.getClient(settings);
    const modelId = getModelId(settings, 'analyze');
    const { Type } = await import("@google/genai");

    const parts: any[] = [
      { text: SYSTEM_PROMPT },
      { text: `请分析以下专利交底书初稿及附图（如有），按 JSON 格式返回诊断报告和结构化的交底书。\n\n[初稿内容]\n${content}` }
    ];

    if (settings.isMultimodalEnabled) {
      for (const file of files) {
        parts.push({
          inlineData: {
            data: await fileToBase64(file),
            mimeType: file.type
          }
        });
      }
    }

    const result = await ai.models.generateContent({
      model: modelId,
      contents: parts,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            diagnosis: {
              type: Type.OBJECT,
              properties: {
                innovation: { type: Type.INTEGER },
                novelty: { type: Type.INTEGER },
                utility: { type: Type.INTEGER },
                summary: { type: Type.STRING },
                patentPoints: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      feature: { type: Type.STRING },
                      effect: { type: Type.STRING }
                    },
                    required: ["feature", "effect"]
                  }
                },
                missingItems: { type: Type.ARRAY, items: { type: Type.STRING } },
                alternatives: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      suggestion: { type: Type.STRING },
                      reason: { type: Type.STRING }
                    },
                    required: ["suggestion", "reason"]
                  }
                }
              },
              required: ["innovation", "novelty", "utility", "summary", "patentPoints", "missingItems", "alternatives"]
            },
            disclosure: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                field: { type: Type.STRING },
                background: { type: Type.STRING },
                purpose: { type: Type.STRING },
                solution: { type: Type.STRING },
                effects: { type: Type.STRING },
                figures: { type: Type.STRING },
                implementation: { type: Type.STRING },
                claims: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.INTEGER },
                      type: { type: Type.STRING },
                      dependsOn: { type: Type.INTEGER },
                      content: { type: Type.STRING }
                    },
                    required: ["id", "type", "content"]
                  }
                }
              },
              required: ["title", "field", "background", "purpose", "solution", "effects", "figures", "implementation", "claims"]
            }
          },
          required: ["diagnosis", "disclosure"]
        } as any
      }
    });

    const text = result.text;
    const parsedData = cleanAndParseJSON(text || '{}');
    const rawDiagnosis = extractDataBlock(parsedData, ['diagnosis', 'diagnosisReport'], ['innovation', 'patentPoints']);
    const rawDisclosure = extractDataBlock(parsedData, ['disclosure', 'technicalDisclosure', 'technical_disclosure'], ['title', 'claims', 'background']);

    return {
      diagnosis: normalizeDiagnosis(rawDiagnosis),
      disclosure: normalizeDisclosure(rawDisclosure)
    };
  }

  async generateFollowUp(disclosure: PatentDisclosure, diagnosis: DiagnosisReport, history: any[], settings: AppSettings) {
    const ai = await this.getClient(settings);
    const modelId = getModelId(settings, 'others');

    const prompt = `基于以下交底书结构和诊断报告，动态生成一个追问问题。
      
[交底书概态]
${JSON.stringify(disclosure)}

[诊断报告]
${JSON.stringify(diagnosis)}

[历史问答]
${JSON.stringify(history)}

要求：
1. 每次只提一个最关键的问题（如果已经有很多实施例了，不要再问）。
2. 语言友好、引导性强。`;

    const result = await ai.models.generateContent({ model: modelId, contents: prompt });
    return result.text || "";
  }

  async updateDisclosure(original: PatentDisclosure, history: any[], files: File[], settings: AppSettings) {
    const ai = await this.getClient(settings);
    const modelId = getModelId(settings, 'others');

    const userContent = `基于以下交底书原文和目前的问答/图片补充，更新交底书结构体并返回。
    
交底书原文：
${JSON.stringify(original)}

问答与补充指令：
${JSON.stringify(history)}`;

    const parts: any[] = [
      { text: SYSTEM_PROMPT },
      { text: userContent }
    ];

    if (settings.isMultimodalEnabled) {
      for (const file of files) {
        parts.push({
          inlineData: { data: await fileToBase64(file), mimeType: file.type }
        });
      }
    }

    const { Type } = await import("@google/genai");
    const result = await ai.models.generateContent({
      model: modelId,
      contents: parts,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            field: { type: Type.STRING },
            background: { type: Type.STRING },
            purpose: { type: Type.STRING },
            solution: { type: Type.STRING },
            effects: { type: Type.STRING },
            figures: { type: Type.STRING },
            implementation: { type: Type.STRING },
            claims: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  type: { type: Type.STRING },
                  dependsOn: { type: Type.INTEGER },
                  content: { type: Type.STRING }
                },
                required: ["id", "type", "content"]
              }
            }
          },
          required: ["title", "field", "background", "purpose", "solution", "effects", "figures", "implementation", "claims"]
        } as any
      }
    });

    const parsedData = cleanAndParseJSON(result.text || '{}');
    const rawDisclosure = extractDataBlock(parsedData, ['disclosure', 'technicalDisclosure', 'technical_disclosure'], ['title', 'claims', 'background']);
    return normalizeDisclosure(rawDisclosure);
  }

  async reviseSection(sectionKey: string, originalSection: string, instruction: string, disclosure: PatentDisclosure, files: File[], settings: AppSettings) {
    const ai = await this.getClient(settings);
    const modelId = getModelId(settings, 'others');

    const prompt = `你是一个资深的专代，现在受工程师委托为一个现有的交案底书中的特定区块进行改写补充。
    
当前正在编辑的章节：${sectionKey}
整体交底书技术方案概览：${disclosure.solution}

【当前该章节原内容】：
${originalSection}

【工程师提交的局部修改指令】：
${instruction}

请结合任何上传的附图，仅返回修改后【这个区块】的新内容（使用纯 Markdown，不要改变标题级别，不要包含多余的问候语）。`;

    const parts: any[] = [{ text: prompt }];

    if (settings.isMultimodalEnabled) {
      for (const file of files) {
        parts.push({
          inlineData: { data: await fileToBase64(file), mimeType: file.type }
        });
      }
    }

    const result = await ai.models.generateContent({
      model: modelId,
      contents: parts
    });
    return result.text || originalSection;
  }
}


// --- OpenAI / Qwen Provider Implementation ---

class OpenAIProvider implements LLMProvider {
  protected async getClient(settings: AppSettings) {
    const provider = settings.llmProvider || 'openai';
    const config = DEFAULT_CONFIGS[provider] || DEFAULT_CONFIGS.openai;
    const { apiKey, apiEndpoint } = getCredentials(settings);

    const finalApiKey = apiKey || (provider === 'openai' ? (import.meta as any).env.VITE_OPENAI_API_KEY : (import.meta as any).env.VITE_QWEN_API_KEY) || '';

    if (!finalApiKey) throw new Error(`${provider} API Key is missing`);

    const { default: OpenAI } = await import("openai");

    return new OpenAI({
      apiKey: finalApiKey,
      baseURL: apiEndpoint || config.apiEndpoint,
      dangerouslyAllowBrowser: true
    });
  }

  async analyze(content: string, files: File[], settings: AppSettings) {
    const client = await this.getClient(settings);
    const modelId = getModelId(settings, 'analyze');

    const isVisionSupported =
      modelId.includes('gpt-4o') ||
      modelId.includes('gpt-4-turbo') ||
      modelId.includes('vl') ||
      modelId.includes('vision') ||
      modelId.includes('qwen3.6-plus') ||
      modelId.includes('qwen3.6-flash') ||
      modelId.includes('qwen3.5-plus') ||
      modelId.includes('qwen3.5-flash');

    const messages: any[] = [
      { role: 'system', content: SYSTEM_PROMPT + "\n\nIMPORTANT: Your response must be a valid JSON object. Do not include any conversational filler or markdown formatting outside the JSON." },
      {
        role: 'user',
        content: [
          { type: 'text', text: `请分析以下专利交底书初稿及附图（如有），按 JSON 格式返回诊断报告和结构化的交底书。\n\n[初稿内容]\n${content}` },
          ...(settings.isMultimodalEnabled && isVisionSupported ? await Promise.all(files.map(async f => ({
            type: 'image_url' as const,
            image_url: { url: `data:${f.type};base64,${await fileToBase64(f)}` }
          }))) : [])
        ]
      }
    ];

    const response = await client.chat.completions.create({
      model: modelId,
      messages,
      response_format: { type: "json_object" }
    });

    const parsedData = cleanAndParseJSON(response.choices[0].message.content || '{}');
    const rawDiagnosis = extractDataBlock(parsedData, ['diagnosis', 'diagnosisReport'], ['innovation', 'patentPoints']);
    const rawDisclosure = extractDataBlock(parsedData, ['disclosure', 'technicalDisclosure', 'technical_disclosure'], ['title', 'claims', 'background']);

    return {
      diagnosis: normalizeDiagnosis(rawDiagnosis),
      disclosure: normalizeDisclosure(rawDisclosure)
    };
  }

  async generateFollowUp(disclosure: PatentDisclosure, diagnosis: DiagnosisReport, history: any[], settings: AppSettings) {
    const client = await this.getClient(settings);
    const modelId = getModelId(settings, 'others');

    const prompt = `协助生成追问问题：\nDisclosure: ${JSON.stringify(disclosure)}\nDiagnosis: ${JSON.stringify(diagnosis)}\nHistory: ${JSON.stringify(history)}`;

    const response = await client.chat.completions.create({
      model: modelId,
      messages: [
        { role: 'system', content: "你是一个引导互动的专利专家。只返回一个关键的问题。" },
        { role: 'user', content: prompt }
      ]
    });

    return response.choices[0].message.content || '分析完成。';
  }

  async updateDisclosure(original: PatentDisclosure, history: any[], files: File[], settings: AppSettings) {
    const client = await this.getClient(settings);
    const modelId = getModelId(settings, 'analyze');

    const isVisionSupported =
      modelId.includes('gpt-4o') ||
      modelId.includes('gpt-4-turbo') ||
      modelId.includes('vl') ||
      modelId.includes('vision') ||
      modelId.includes('qwen3.6-plus') ||
      modelId.includes('qwen3.6-flash') ||
      modelId.includes('qwen3.5-plus') ||
      modelId.includes('qwen3.5-flash');

    const messages: any[] = [
      { role: 'system', content: SYSTEM_PROMPT + "\n\nIMPORTANT: Your response must be a valid JSON object." },
      {
        role: 'user',
        content: [
          { type: 'text', text: `更新交底书内容：\nOriginal: ${JSON.stringify(original)}\nInstructions: ${JSON.stringify(history)}` },
          ...(settings.isMultimodalEnabled && isVisionSupported ? await Promise.all(files.map(async f => ({
            type: 'image_url' as const,
            image_url: { url: `data:${f.type};base64,${await fileToBase64(f)}` }
          }))) : [])
        ]
      }
    ];

    const response = await client.chat.completions.create({
      model: modelId,
      messages,
      response_format: { type: "json_object" }
    });

    const parsedData = cleanAndParseJSON(response.choices[0].message.content || '{}');
    const rawDisclosure = extractDataBlock(parsedData, ['disclosure', 'technicalDisclosure', 'technical_disclosure'], ['title', 'claims', 'background']);
    return normalizeDisclosure(rawDisclosure);
  }

  async reviseSection(sectionKey: string, originalSection: string, instruction: string, disclosure: PatentDisclosure, files: File[], settings: AppSettings) {
    const client = await this.getClient(settings);
    const modelId = getModelId(settings, 'others');

    const isVisionSupported =
      modelId.includes('gpt-4o') ||
      modelId.includes('gpt-4-turbo') ||
      modelId.includes('vl') ||
      modelId.includes('vision') ||
      modelId.includes('qwen3.6-plus') ||
      modelId.includes('qwen3.6-flash') ||
      modelId.includes('qwen3.5-plus') ||
      modelId.includes('qwen3.5-flash');

    const response = await client.chat.completions.create({
      model: modelId,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: `改写交底书章节 ${sectionKey}。\n方案背景：${disclosure.solution}\n原内容：${originalSection}\n修改指令：${instruction}` },
            ...(settings.isMultimodalEnabled && isVisionSupported ? await Promise.all(files.map(async f => ({
              type: 'image_url' as const,
              image_url: { url: `data:${f.type};base64,${await fileToBase64(f)}` }
            }))) : [])
          ]
        }
      ]
    });

    return response.choices[0].message.content || originalSection;
  }
}

// --- Factory & Exports ---

function getProvider(llmProvider: string): LLMProvider {
  switch (llmProvider) {
    case 'google':
      return new GoogleProvider();
    case 'openai':
    case 'qwen':
    case 'custom':
    case 'builtin':
      return new OpenAIProvider();
    default:
      return new OpenAIProvider();
  }
}

export async function analyzeDraft(content: string, files: File[] = [], settings?: AppSettings): Promise<{ diagnosis: DiagnosisReport; disclosure: PatentDisclosure }> {
  const provider = getProvider(settings?.llmProvider || 'builtin');
  try {
    return await provider.analyze(content, files, settings || { llmProvider: 'builtin', modelId: 'qwen3.6-plus', isMultimodalEnabled: true });
  } catch (error: any) {
    console.error("Analysis Failed:", error);
    throw new Error(error.message || "AI Analysis failed");
  }
}

export async function generateFollowUp(disclosure: PatentDisclosure, diagnosis: DiagnosisReport, history: { role: string; content: string }[], settings?: AppSettings): Promise<string> {
  const provider = getProvider(settings?.llmProvider || 'builtin');
  try {
    return await provider.generateFollowUp(disclosure, diagnosis, history, settings || { llmProvider: 'builtin', modelId: 'qwen3.6-plus', isMultimodalEnabled: true });
  } catch (error) {
    return "我已分析完毕，如需进一步修改请随时通知我。";
  }
}

export async function updateDisclosure(original: PatentDisclosure, history: { role: string; content: string }[], files: File[] = [], settings?: AppSettings): Promise<PatentDisclosure> {
  const provider = getProvider(settings?.llmProvider || 'builtin');
  try {
    return await provider.updateDisclosure(original, history, files, settings || { llmProvider: 'builtin', modelId: 'qwen3.6-plus', isMultimodalEnabled: true });
  } catch (error) {
    console.error("Update failed:", error);
    return original;
  }
}

export async function reviseSection(
  sectionKey: keyof PatentDisclosure,
  originalSection: string,
  instruction: string,
  disclosure: PatentDisclosure,
  files: File[] = [],
  settings?: AppSettings
): Promise<string> {
  const provider = getProvider(settings?.llmProvider || 'builtin');
  try {
    return await provider.reviseSection(sectionKey, originalSection, instruction, disclosure, files, settings || { llmProvider: 'builtin', modelId: 'qwen3.6-plus', isMultimodalEnabled: true });
  } catch (error) {
    return originalSection;
  }
}
