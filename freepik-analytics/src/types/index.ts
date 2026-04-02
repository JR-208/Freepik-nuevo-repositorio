export interface Asset {
  assetType: string;
  fileName: string;
  description: string;
  url: string;
  assetId: string;
  downloads: number;
  earnings: number;
  month: string;
  sourceFile?: string;
}

export interface MonthlyData {
  month: string;
  earnings: number;
  downloads: number;
  newAssets: number;
}

export interface AssetTypeData {
  type: string;
  earnings: number;
  downloads: number;
  count: number;
  earningsPerDownload: number;
}

export interface KeywordData {
  keyword: string;
  count: number;
  earnings: number;
  downloads: number;
}

export interface Insight {
  id: string;
  type: "positive" | "warning" | "neutral" | "tip";
  title: string;
  description: string;
  value?: string;
}

export interface UploadedFile {
  name: string;
  uploadedAt: string;
  rowCount: number;
}

export interface DashboardState {
  assets: Asset[];
  uploadedFiles: UploadedFile[];
}
