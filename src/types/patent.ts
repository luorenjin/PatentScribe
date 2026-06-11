export interface ClaimMap {
  id: number;
  type: 'independent' | 'dependent';
  dependsOn?: number;
  content: string;
}

export interface PatentDisclosure {
  title: string;
  field: string;
  background: string;
  purpose: string;
  solution: string;
  effects: string;
  figures: string;
  implementation: string;
  claims: ClaimMap[];
}

export type DiagnosisScore = number;

export interface PatentPoint {
  feature: string; // 区别技术特征 (The novel technical feature)
  effect: string;  // 带来的技术效果 (The technical effect)
}

export interface Alternative {
  suggestion: string;
  reason: string;
}

export interface DiagnosisReport {
  innovation: DiagnosisScore;
  novelty: DiagnosisScore;
  utility: DiagnosisScore;
  summary: string;
  patentPoints: PatentPoint[];
  missingItems: string[];
  alternatives: Alternative[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  files?: File[];
}

export interface WorkbenchRecord {
  id: string;
  title: string;
  timestamp: number;
  disclosure: PatentDisclosure;
  diagnosis: DiagnosisReport;
}

export interface ProviderConfig {
  apiKey?: string;
  apiEndpoint?: string;
  modelId?: string;
}

export interface AppSettings {
  llmProvider: 'google' | 'openai' | 'qwen' | 'custom';
  modelId: string;
  isMultimodalEnabled: boolean;
  apiKey?: string; // Legacy/Current (might still be used by some parts)
  apiEndpoint?: string; // Legacy/Current
  providers?: {
    google?: ProviderConfig;
    openai?: ProviderConfig;
    qwen?: ProviderConfig;
    custom?: ProviderConfig;
  };
}

export interface DisclosureVersion {
  id: string;
  timestamp: number;
  disclosure: PatentDisclosure;
  label?: string;
}

export interface AppState {
  originalContent: string;
  currentDisclosure: PatentDisclosure | null;
  diagnosisReport: DiagnosisReport | null;
  messages: ChatMessage[];
  isAnalyzing: boolean;
  status: 'idle' | 'analyzing' | 'diagnosed' | 'improving' | 'workbench';
  settings: AppSettings;
  versionHistory: DisclosureVersion[];
}
