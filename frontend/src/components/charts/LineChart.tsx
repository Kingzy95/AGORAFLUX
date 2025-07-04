import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Box, Typography, Card, CircularProgress, Alert } from '@mui/material';
import { ChartProps, TimeSeriesData } from '../../types/visualization';

interface LineChartProps extends Omit<ChartProps, 'data'> {
  data: TimeSeriesData[];
}

const LineChart: React.FC<LineChartProps> = ({
  data,
  config,
  loading = false,
  error,
  onDataPointClick,
  className
}) => {
  // Couleurs par défaut pour les différentes catégories
  const defaultColors = [
    '#1976d2', '#388e3c', '#f57c00', '#d32f2f', 
    '#7b1fa2', '#455a64', '#00838f', '#558b2f'
  ];

  // Regroupement des données par date
  const groupedData = data.reduce((acc, item) => {
    const existing = acc.find(d => d.date === item.date);
    if (existing) {
      existing[item.category || 'value'] = item.value;
    } else {
      acc.push({
        date: item.date,
        [item.category || 'value']: item.value
      });
    }
    return acc;
  }, [] as any[]);

  // Extraction des catégories uniques
  const categories = Array.from(new Set(data.map(item => item.category || 'value')));

  // Formatage des valeurs pour l'affichage
  const formatValue = (value: number): string => {
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(1)}Md€`;
    } else if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M€`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  };

  // Formatage des dates
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { 
      month: 'short', 
      year: '2-digit' 
    });
  };

  // Tooltip personnalisé
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            backgroundColor: 'white',
            p: 2,
            border: '1px solid #ccc',
            borderRadius: 1,
            boxShadow: 2,
            minWidth: 200
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            {formatDate(label)}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Typography 
              key={index}
              variant="body2" 
              sx={{ color: entry.color }}
            >
              {entry.name} : {formatValue(entry.value)}
            </Typography>
          ))}
        </Box>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card className={className} sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Chargement du graphique...
        </Typography>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className} sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className={className} sx={{ p: 3 }}>
        <Alert severity="info">Aucune donnée à afficher</Alert>
      </Card>
    );
  }

  return (
    <Card className={className} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {config.title}
      </Typography>
      {config.description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {config.description}
        </Typography>
      )}
      
      <ResponsiveContainer
        width="100%"
        height={config.height || 400}
      >
        <RechartsLineChart
          data={groupedData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 20
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            tickFormatter={formatValue}
            tick={{ fontSize: 12 }}
          />
          {config.showTooltip !== false && <Tooltip content={<CustomTooltip />} />}
          {config.showLegend !== false && categories.length > 1 && <Legend />}
          
          {categories.map((category, index) => (
            <Line
              key={category}
              type="monotone"
              dataKey={category}
              stroke={defaultColors[index % defaultColors.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name={category}
              onClick={onDataPointClick}
              style={{ cursor: onDataPointClick ? 'pointer' : 'default' }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        {config.xAxisLabel && (
          <Typography variant="caption" color="text.secondary">
            {config.xAxisLabel}
          </Typography>
        )}
        {config.yAxisLabel && (
          <Typography variant="caption" color="text.secondary">
            {config.yAxisLabel}
          </Typography>
        )}
      </Box>
    </Card>
  );
};

export default LineChart; 