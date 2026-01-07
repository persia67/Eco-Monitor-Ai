export interface PollutantData {
  CO: number;
  CO2: number;
  SO2: number;
  NOx: number;
  PM: number;
  [key: string]: number;
}

export interface Exhaust {
  id: number;
  name: string;
  data: PollutantData;
  location: string;
  lastCheck: string;
}

export interface StandardDef {
  limit: number;
  unit: string;
  name: string;
}

export interface Standards {
  [key: string]: StandardDef;
}

export interface DiagnosticInfo {
  high: string;
  veryHigh: string;
}

export interface Diagnostics {
  [key: string]: DiagnosticInfo;
}

export interface AIAnalysisResult {
  exhaustId: number;
  analysis: string;
  timestamp: string;
}

export interface HistoryLogEntry {
  id: string;
  action: 'data_entry' | 'ai_analysis' | 'new_exhaust' | 'system';
  title: string;
  description: string;
  timestamp: string;
  exhaustName?: string;
}

export type TabType = 'dashboard' | 'data-entry' | 'analysis' | 'history';