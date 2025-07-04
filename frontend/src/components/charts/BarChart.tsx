import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Box, Typography, Card, CircularProgress, Alert } from '@mui/material';
import { ChartProps, ChartDataPoint } from '../../types/visualization';

interface BarChartProps extends Omit<ChartProps, 'data'> {
  data: ChartDataPoint[];
}

const BarChart: React.FC<BarChartProps> = ({
  data,
  config,
  loading = false,
  error,
  onDataPointClick,
  className
}) => {
  // Formatage des valeurs pour l'affichage
  const formatValue = (value: number): string => {
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(1)}Md€`;
    } else if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M€`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k€`;
    }
    return value.toString();
  };

  // Tooltip personnalisé
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box
          sx={{
            backgroundColor: 'white',
            p: 2,
            border: '1px solid #ccc',
            borderRadius: 1,
            boxShadow: 2
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            {label}
          </Typography>
          <Typography variant="body2" color="primary">
            Montant : {formatValue(data.value)}
          </Typography>
          {data.category && (
            <Typography variant="body2" color="text.secondary">
              Catégorie : {data.category}
            </Typography>
          )}
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
        <RechartsBarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 20
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            tickFormatter={formatValue}
            tick={{ fontSize: 12 }}
          />
          {config.showTooltip !== false && <Tooltip content={<CustomTooltip />} />}
          {config.showLegend && <Legend />}
          <Bar
            dataKey="value"
            fill={(data[0]?.color) || '#1976d2'}
            radius={[4, 4, 0, 0]}
            onClick={onDataPointClick}
            style={{ cursor: onDataPointClick ? 'pointer' : 'default' }}
          />
        </RechartsBarChart>
      </ResponsiveContainer>
      
      {config.xAxisLabel && (
        <Typography variant="caption" display="block" textAlign="center" sx={{ mt: 1 }}>
          {config.xAxisLabel}
        </Typography>
      )}
    </Card>
  );
};

export default BarChart; 