import React from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Box, Typography, Card, CircularProgress, Alert } from '@mui/material';
import { ChartProps, ChartDataPoint, BudgetData } from '../../types/visualization';

interface PieChartProps extends Omit<ChartProps, 'data'> {
  data: ChartDataPoint[] | BudgetData[];
}

const PieChart: React.FC<PieChartProps> = ({
  data,
  config,
  loading = false,
  error,
  onDataPointClick,
  className
}) => {
  // Couleurs par défaut si non spécifiées
  const defaultColors = [
    '#1976d2', '#388e3c', '#f57c00', '#d32f2f', 
    '#7b1fa2', '#455a64', '#00838f', '#558b2f'
  ];

  // Formatage des données pour Recharts
  const chartData = data.map((item, index) => {
    if ('amount' in item) {
      // BudgetData
      return {
        name: item.category,
        value: item.amount,
        percentage: item.percentage,
        color: item.color || defaultColors[index % defaultColors.length]
      };
    } else {
      // ChartDataPoint
      return {
        name: item.name,
        value: item.value,
        color: item.color || defaultColors[index % defaultColors.length]
      };
    }
  });

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

  // Tooltip personnalisé
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
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
            {data.name}
          </Typography>
          <Typography variant="body2" color="primary">
            Valeur : {formatValue(data.value)}
          </Typography>
          {data.percentage && (
            <Typography variant="body2" color="text.secondary">
              Pourcentage : {data.percentage.toFixed(1)}%
            </Typography>
          )}
        </Box>
      );
    }
    return null;
  };

  // Label personnalisé pour afficher les pourcentages
  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent * 100 < 5) return null; // N'affiche pas les labels pour les petites tranches

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
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
        <RechartsPieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
            onClick={onDataPointClick}
            style={{ cursor: onDataPointClick ? 'pointer' : 'default' }}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
              />
            ))}
          </Pie>
          {config.showTooltip !== false && <Tooltip content={<CustomTooltip />} />}
          {config.showLegend !== false && (
            <Legend 
              verticalAlign="bottom" 
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '12px' }}
            />
          )}
        </RechartsPieChart>
      </ResponsiveContainer>

      {/* Légende personnalisée avec valeurs */}
      <Box sx={{ mt: 2 }}>
        <Box 
          sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: 1 
          }}
        >
          {chartData.map((item, index) => (
            <Box 
              key={index}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                p: 1,
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
            >
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: item.color,
                  flexShrink: 0
                }}
              />
              <Typography variant="caption" sx={{ flexGrow: 1 }}>
                {item.name}
              </Typography>
              <Typography variant="caption" fontWeight="bold">
                {formatValue(item.value)}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Card>
  );
};

export default PieChart; 