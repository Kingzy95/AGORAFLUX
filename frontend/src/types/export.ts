export interface ExportOptions {
  format: 'png' | 'jpg' | 'svg' | 'pdf' | 'csv' | 'json' | 'xlsx';
  quality?: number;
  scale?: number;
  includeMetadata?: boolean;
  includeWatermark?: boolean;
  customTitle?: string;
  customDescription?: string;
  backgroundColor?: string;
  dimensions?: {
    width: number;
    height: number;
  };
  orientation?: 'portrait' | 'landscape';
  compression?: boolean;
  author?: string;
  timestamp?: boolean;
}

export interface ExportResult {
  success: boolean;
  fileName: string;
  fileSize?: number;
  downloadUrl?: string;
  error?: string;
  duration?: number;
}

export interface BulkExportOptions {
  charts: Array<{
    id: string;
    title: string;
    element: HTMLElement;
    data: any;
  }>;
  format: ExportOptions['format'];
  options: Omit<ExportOptions, 'format'>;
  combinePdf?: boolean;
  zipArchive?: boolean;
  naming?: 'sequential' | 'title' | 'custom';
  customNames?: string[];
}

export interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  format: ExportOptions['format'];
  defaultOptions: ExportOptions;
  preview?: string;
  category: 'report' | 'presentation' | 'data' | 'social';
}

export interface ExportHistory {
  id: string;
  chartId: string;
  chartTitle: string;
  format: string;
  fileName: string;
  fileSize: number;
  timestamp: Date;
  exportDate: Date; // Pour compatibilité
  downloadCount: number;
  expiresAt?: Date;
  downloadUrl?: string;
  userId: string;
  userName: string;
  status: 'completed' | 'pending' | 'error'; // Statut de l'export
}

export interface ExportProgress {
  step: string;
  progress: number;
  message: string;
  estimatedTime?: number;
}

export interface ExportSettings {
  defaultFormat: ExportOptions['format'];
  defaultQuality: number;
  defaultScale: number;
  includeWatermark: boolean;
  watermarkText: string;
  watermarkPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  maxFileSize: number;
  autoCleanup: boolean;
  cleanupAfterDays: number;
  compressionLevel: number;
}

export interface ShareableExport {
  id: string;
  fileName: string;
  title: string;
  description?: string;
  format: string;
  fileSize: number;
  downloadUrl: string;
  shareUrl: string;
  visibility: 'public' | 'private' | 'team';
  password?: string;
  expiresAt?: Date;
  downloadLimit?: number;
  downloadCount: number;
  createdBy: string;
  createdAt: Date;
  lastAccessed?: Date;
}

export interface ExportStatistics {
  totalExports: number;
  totalSize: number; // Taille totale en bytes
  thisMonth: number; // Exports ce mois
  favoriteFormat: string; // Format le plus utilisé
  exportsByFormat: Record<string, number>;
  exportsByChart: Record<string, number>;
  averageFileSize: number;
  totalDataTransferred: number;
  popularFormats: Array<{
    format: string;
    count: number;
    percentage: number;
  }>;
  exportTrends: Array<{
    date: string;
    count: number;
    formats: Record<string, number>;
  }>;
  topCharts: Array<{
    chartId: string;
    chartTitle: string;
    exportCount: number;
  }>;
}

export interface ExportNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
  autoHide?: boolean;
  duration?: number;
} 