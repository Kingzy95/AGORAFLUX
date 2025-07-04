export interface ChartDataPoint {
  name: string;
  value: number;
  label?: string;
  color?: string;
  category?: string;
  date?: string;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  category?: string;
  label?: string;
}

export interface BudgetData {
  category: string;
  amount: number;
  percentage: number;
  subcategories?: BudgetData[];
  color?: string;
}

export interface GeographicData {
  id: string;
  name: string;
  value: number;
  coordinates: [number, number];
  properties?: Record<string, any>;
}

export interface StatisticsData {
  total: number;
  change: number;
  changeType: 'increase' | 'decrease' | 'stable';
  period: string;
  breakdown?: { name: string; value: number; percentage: number }[];
}

export interface VisualizationConfig {
  type: 'bar' | 'line' | 'pie' | 'area' | 'scatter' | 'map' | 'timeline';
  title: string;
  description?: string;
  width?: number;
  height?: number;
  showLegend?: boolean;
  showTooltip?: boolean;
  interactive?: boolean;
  colors?: string[];
  xAxisLabel?: string;
  yAxisLabel?: string;
}

export interface ChartProps {
  data: ChartDataPoint[] | TimeSeriesData[] | BudgetData[];
  config: VisualizationConfig;
  loading?: boolean;
  error?: string;
  onDataPointClick?: (dataPoint: any) => void;
  className?: string;
}

export interface MapProps {
  data: GeographicData[];
  center?: [number, number];
  zoom?: number;
  height?: number;
  onMarkerClick?: (data: GeographicData) => void;
  showClusters?: boolean;
}

export interface DashboardWidget {
  id: string;
  title: string;
  type: 'chart' | 'stat' | 'map' | 'list';
  size: 'small' | 'medium' | 'large';
  data: any;
  config: VisualizationConfig;
  refreshInterval?: number;
  lastUpdated?: string;
}

export interface FilterOptions {
  dateRange?: {
    start: string;
    end: string;
  };
  categories?: string[];
  regions?: string[];
  status?: string[];
}

export interface DataExportOptions {
  format: 'csv' | 'json' | 'pdf' | 'png';
  includeCharts?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
} 