export interface PollutantData {
  CO: number;
  CO2: number;
  SO2: number;
  NOx: number;
  PM: number;
  O2: number;
  [key: string]: number;
}

export interface Measurement {
  period: string;
  date: string;
  data: PollutantData;
}

export interface Exhaust {
  id: number;
  name: string;
  data: PollutantData; // Latest data
  history: Measurement[]; // Historical data
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

export type TabType = 'dashboard' | 'data-entry' | 'analysis' | 'history' | 'details';