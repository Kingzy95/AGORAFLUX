import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Chip,
  Divider,
  useTheme,
  useMediaQuery,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as StableIcon,
  People as PeopleIcon,
  Assignment as ProjectIcon,
  Comment as CommentIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';

import BarChart from '../charts/BarChart';
import PieChart from '../charts/PieChart';
import LineChart from '../charts/LineChart';
import InteractiveMap from '../maps/InteractiveMap';

import {
  mockBudgetData,
  mockParticipationData,
  mockParticipationStats,
  mockSatisfactionData,
  mockDemographicsData,
  mockGeneralStats
} from '../../utils/data/mockData';

interface StatCardProps {
  title: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease' | 'stable';
  icon: React.ReactNode;
  period: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  change, 
  changeType, 
  icon, 
  period 
}) => {
  const formatValue = (val: number): string => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
    return val.toString();
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case 'increase':
        return <TrendingUpIcon color="success" fontSize="small" />;
      case 'decrease':
        return <TrendingDownIcon color="error" fontSize="small" />;
      default:
        return <StableIcon color="disabled" fontSize="small" />;
    }
  };

  const getChangeColor = () => {
    switch (changeType) {
      case 'increase': return 'success.main';
      case 'decrease': return 'error.main';
      default: return 'text.secondary';
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h4" component="div" gutterBottom>
              {formatValue(value)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              {getChangeIcon()}
              <Typography 
                variant="body2" 
                sx={{ color: getChangeColor(), ml: 0.5 }}
              >
                {Math.abs(change)}% {period}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ color: 'primary.main' }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [timeRange, setTimeRange] = useState('6months');
  const [refreshing, setRefreshing] = useState(false);

  const handleTimeRangeChange = (event: SelectChangeEvent<string>) => {
    setTimeRange(event.target.value);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulation d'un rechargement des données
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* En-tête du tableau de bord */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 2,
          flexDirection: isMobile ? 'column' : 'row',
          gap: 2
        }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Tableau de Bord AgoraFlux
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Vue d'ensemble de la participation citoyenne et des projets en cours
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Période</InputLabel>
              <Select
                value={timeRange}
                label="Période"
                onChange={handleTimeRangeChange}
              >
                <MenuItem value="1month">1 mois</MenuItem>
                <MenuItem value="3months">3 mois</MenuItem>
                <MenuItem value="6months">6 mois</MenuItem>
                <MenuItem value="1year">1 an</MenuItem>
              </Select>
            </FormControl>
            
            <IconButton 
              onClick={handleRefresh}
              disabled={refreshing}
              color="primary"
            >
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>

        <Chip 
          label="Dernière mise à jour: Aujourd'hui à 14h30" 
          variant="outlined" 
          size="small" 
        />
      </Box>

      {/* Cartes de statistiques */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { 
          xs: '1fr', 
          sm: 'repeat(2, 1fr)', 
          md: 'repeat(4, 1fr)' 
        }, 
        gap: 3, 
        mb: 4 
      }}>
        <StatCard
          title="Participants totaux"
          value={mockGeneralStats.total}
          change={mockGeneralStats.change}
          changeType={mockGeneralStats.changeType}
          icon={<PeopleIcon fontSize="large" />}
          period={mockGeneralStats.period}
        />
        
        <StatCard
          title="Projets actifs"
          value={124}
          change={15.2}
          changeType="increase"
          icon={<ProjectIcon fontSize="large" />}
          period="ce mois"
        />
        
        <StatCard
          title="Commentaires"
          value={2980}
          change={8.7}
          changeType="increase"
          icon={<CommentIcon fontSize="large" />}
          period="ce mois"
        />
        
        <StatCard
          title="Arrondissements actifs"
          value={20}
          change={0}
          changeType="stable"
          icon={<LocationIcon fontSize="large" />}
          period="ce mois"
        />
      </Box>

      {/* Graphiques et visualisations */}
      <Box sx={{ display: 'grid', gap: 3 }}>
        {/* Première ligne - Évolution de la participation et démographie */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, 
          gap: 3 
        }}>
          <LineChart
            data={mockParticipationStats}
            config={{
              type: 'line',
              title: 'Évolution de la participation citoyenne',
              description: 'Nombre de participants, projets et commentaires par mois',
              height: 400,
              showLegend: true,
              xAxisLabel: 'Mois',
              yAxisLabel: 'Nombre'
            }}
          />
          
          <PieChart
            data={mockDemographicsData}
            config={{
              type: 'pie',
              title: 'Répartition par âge',
              description: 'Profil démographique des participants',
              height: 400,
              showLegend: false
            }}
          />
        </Box>

        {/* Deuxième ligne - Budget et satisfaction */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, 
          gap: 3 
        }}>
          <BarChart
            data={mockBudgetData.map(item => ({
              name: item.category,
              value: item.amount,
              color: item.color
            }))}
            config={{
              type: 'bar',
              title: 'Budget municipal par secteur',
              description: 'Répartition du budget 2024 (en millions d\'euros)',
              height: 400,
              xAxisLabel: 'Secteurs',
              yAxisLabel: 'Budget (M€)'
            }}
          />
          
          <PieChart
            data={mockSatisfactionData}
            config={{
              type: 'pie',
              title: 'Satisfaction des participants',
              description: 'Retours sur l\'expérience d\'utilisation de la plateforme',
              height: 400,
              showLegend: false
            }}
          />
        </Box>

        {/* Troisième ligne - Carte de participation */}
        <InteractiveMap
          data={mockParticipationData}
          center={[48.8566, 2.3522]}
          zoom={11}
          height={500}
          onMarkerClick={(data) => {
            console.log('Arrondissement sélectionné:', data);
          }}
        />
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Informations supplémentaires */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Informations sur les données
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Les données présentées dans ce tableau de bord sont mises à jour en temps réel 
          et reflètent l'activité de la plateforme AgoraFlux. Les visualisations incluent 
          des données budgétaires municipales, des statistiques de participation citoyenne 
          et des métriques d'engagement par arrondissement parisien.
        </Typography>
      </Box>
    </Box>
  );
};

export default Dashboard; 