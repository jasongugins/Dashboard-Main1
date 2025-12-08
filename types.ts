export enum ViewState {
  OVERVIEW = 'OVERVIEW',
  ATTRIBUTION = 'ATTRIBUTION',
  PROFITABILITY = 'PROFITABILITY',
  COMPLIANCE = 'COMPLIANCE',
  SETTINGS = 'SETTINGS'
}

export interface KPIMetric {
  label: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  suffix?: string;
  prefix?: string;
  description?: string;
}

export interface AttributionData {
  date: string;
  platformROAS: number;
  actualPOAS: number;
  adSpend: number;
}

export interface RiskFactor {
  id: string;
  category: string;
  score: number; // 0-100, higher is safer
  riskLevel: 'Critical' | 'High' | 'Moderate' | 'Low' | 'Safe';
  details: string;
}
