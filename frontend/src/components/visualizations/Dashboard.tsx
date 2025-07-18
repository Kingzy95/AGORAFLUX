import React, { useState, useRef, useEffect } from 'react';
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
  SelectChangeEvent,
  Drawer,
  Fab,
  Badge,
  Tooltip,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as StableIcon,
  People as PeopleIcon,
  Assignment as ProjectIcon,
  Comment as CommentIcon,
  LocationOn as LocationIcon,
  FilterList as FilterIcon,
  TuneRounded as TuneIcon,
  Share as ShareIcon,
  Close as CloseIcon
} from '@mui/icons-material';

import BarChart from '../charts/BarChart';
import PieChart from '../charts/PieChart';
import LineChart from '../charts/LineChart';
import InteractiveMap from '../maps/InteractiveMap';
import AdvancedFilters from '../filters/AdvancedFilters';
import AnnotationSystem from '../annotations/AnnotationSystem';
import ShareExportPanel from '../sharing/ShareExportPanel';
import PipelineControlPanel from '../pipeline/PipelineControlPanel';

import { useVisualizationData, useDataPipeline } from '../../hooks';

import { FilterOptions } from '../../types/visualization';
import { useAuth } from '../../context/AuthContext';

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
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Hooks pour les données
  const { 
    budgetData, 
    participationData, 
    participationStats,
    generalStats,
    demographicsData,
    satisfactionData,
    additionalStats,
    isLoading: dataLoading, 
    error: dataError,
    refreshData,
    useMockData,
    setUseMockData
  } = useVisualizationData();
  
  const { 
    status: pipelineStatus, 
    sources: pipelineSources,
    datasets: pipelineDatasets,
    lastRun,
    isLoading: pipelineLoading,
    error: pipelineError,
    runPipeline,
    refreshData: refreshPipelineData
  } = useDataPipeline();
  
  // États pour les interactions
  const [timeRange, setTimeRange] = useState('6months');
  const [refreshing, setRefreshing] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({});
  const [annotations, setAnnotations] = useState<any[]>([]); // Annotations supprimées
  
  const [snackbar, setSnackbar] = useState<{open: boolean; message: string; severity: 'success' | 'error' | 'info'}>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Refs pour les exports
  const budgetChartRef = useRef<HTMLDivElement>(null);
  const participationChartRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  const handleTimeRangeChange = (event: SelectChangeEvent<string>) => {
    setTimeRange(event.target.value);
    setSnackbar({
      open: true,
      message: `Période changée : ${event.target.value}`,
      severity: 'info'
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshData();
      setSnackbar({
        open: true,
        message: 'Données mises à jour avec succès !',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erreur lors de la mise à jour des données',
        severity: 'error'
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleRunPipeline = async (useDebugData: boolean) => {
    try {
      await runPipeline(useDebugData);
      setSnackbar({
        open: true,
        message: 'Pipeline lancé avec succès ! Les données vont être mises à jour.',
        severity: 'success'
      });
      // Actualiser les données après un délai
      setTimeout(() => {
        refreshData();
      }, 2000);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erreur lors du lancement du pipeline',
        severity: 'error'
      });
    }
  };

  const handleFiltersChange = (filters: FilterOptions) => {
    setActiveFilters(filters);
    // Ici, on appliquerait les filtres aux données
    console.log('Filtres appliqués:', filters);
  };

  const handleAddAnnotation = (annotation: any) => {
    const newAnnotation = {
      ...annotation,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    setAnnotations(prev => [...prev, newAnnotation]);
    setSnackbar({
      open: true,
      message: 'Annotation ajoutée avec succès !',
      severity: 'success'
    });
  };

  const handleUpdateAnnotation = (id: string, updates: any) => {
    setAnnotations(prev => prev.map(ann => 
      ann.id === id ? { ...ann, ...updates } : ann
    ));
  };

  const handleDeleteAnnotation = (id: string) => {
    setAnnotations(prev => prev.filter(ann => ann.id !== id));
    setSnackbar({
      open: true,
      message: 'Annotation supprimée',
      severity: 'info'
    });
  };

  // Compter les filtres actifs
  const activeFiltersCount = 
    (activeFilters.categories?.length || 0) +
    (activeFilters.regions?.length || 0) +
    (activeFilters.status?.length || 0) +
    (activeFilters.dateRange ? 1 : 0);

  return (
    <Box sx={{ p: 3, position: 'relative' }}>
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
              Explorez les données avec des filtres, annotations et partage en temps réel
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
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

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <Chip 
            label="Dernière mise à jour: Aujourd'hui à 14h30" 
            variant="outlined" 
            size="small" 
          />
          {activeFiltersCount > 0 && (
            <Chip 
              label={`${activeFiltersCount} filtre${activeFiltersCount > 1 ? 's' : ''} actif${activeFiltersCount > 1 ? 's' : ''}`}
              color="primary" 
              size="small" 
            />
          )}
          {annotations.length > 0 && (
            <Chip 
              label={`${annotations.length} annotation${annotations.length > 1 ? 's' : ''}`}
              color="secondary" 
              size="small" 
            />
          )}
        </Box>
      </Box>

      {/* Pipeline Control Panel */}
      <PipelineControlPanel
        status={pipelineStatus}
        sources={pipelineSources}
        datasets={pipelineDatasets}
        lastRun={lastRun}
        isLoading={pipelineLoading}
        error={pipelineError}
        onRunPipeline={handleRunPipeline}
        onRefresh={refreshPipelineData}
      />

      {/* Contrôles du pipeline de données */}
      {dataError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Erreur de chargement des données : {dataError}
          <Box sx={{ mt: 1 }}>
            <Chip 
              label={useMockData ? "Mode données de test" : "Mode données réelles"}
              color={useMockData ? "warning" : "success"}
              size="small"
              onClick={() => setUseMockData(!useMockData)}
              clickable
            />
          </Box>
        </Alert>
      )}
      
      {(dataLoading || pipelineLoading) && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {dataLoading ? "Chargement des données..." : "Exécution du pipeline en cours..."}
        </Alert>
      )}

      {/* Cartes de statistiques */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr 1fr' }, 
        gap: 3, 
        mb: 4 
      }}>
        <StatCard
          title="Participants totaux"
          value={generalStats.total}
          change={generalStats.change}
          changeType={generalStats.changeType}
          icon={<PeopleIcon fontSize="large" />}
          period={generalStats.period}
        />
        
        <StatCard
          title="Projets actifs"
          value={additionalStats.activeProjects}
          change={additionalStats.projectsChange}
          changeType="increase"
          icon={<ProjectIcon fontSize="large" />}
          period="ce mois"
        />
        
        <StatCard
          title="Commentaires"
          value={additionalStats.totalComments}
          change={additionalStats.commentsChange}
          changeType="increase"
          icon={<CommentIcon fontSize="large" />}
          period="ce mois"
        />
        
        <StatCard
          title="Arrondissements actifs"
          value={additionalStats.activeDistricts}
          change={additionalStats.districtsChange}
          changeType="stable"
          icon={<LocationIcon fontSize="large" />}
          period="ce mois"
        />
      </Box>

      {/* Graphiques et visualisations avec interactions */}
      <Box sx={{ display: 'grid', gap: 3 }}>
        {/* Première ligne - Évolution de la participation avec annotations */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, 
          gap: 3 
        }}>
          <Box ref={participationChartRef} sx={{ position: 'relative' }}>
            <AnnotationSystem
              chartId="participation-evolution"
              annotations={annotations}
              onAddAnnotation={handleAddAnnotation}
              onUpdateAnnotation={handleUpdateAnnotation}
              onDeleteAnnotation={handleDeleteAnnotation}
            >
              <LineChart
                data={participationStats}
                loading={dataLoading}
                error={dataError || undefined}
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
            </AnnotationSystem>
            
            {/* Contrôles de partage pour ce graphique */}
            <Box sx={{ position: 'absolute', bottom: 8, right: 8 }}>
              <ShareExportPanel
                chartId="participation-evolution"
                chartTitle="Évolution de la participation citoyenne"
                chartData={participationStats}
                chartElement={participationChartRef.current}
              />
            </Box>
          </Box>
          
          <PieChart
            data={demographicsData}
            config={{
              type: 'pie',
              title: 'Répartition par âge',
              description: 'Profil démographique des participants',
              height: 400,
              showLegend: false
            }}
          />
        </Box>

        {/* Deuxième ligne - Budget avec annotations et satisfaction */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, 
          gap: 3 
        }}>
          <Box ref={budgetChartRef} sx={{ position: 'relative' }}>
            <AnnotationSystem
              chartId="budget-municipal"
              annotations={annotations}
              onAddAnnotation={handleAddAnnotation}
              onUpdateAnnotation={handleUpdateAnnotation}
              onDeleteAnnotation={handleDeleteAnnotation}
            >
              <BarChart
                data={budgetData.map((item: any) => ({
                  name: item.category,
                  value: item.amount,
                  color: item.color
                }))}
                loading={dataLoading}
                error={dataError || undefined}
                config={{
                  type: 'bar',
                  title: 'Budget municipal par secteur',
                  description: 'Répartition du budget 2024 (en millions d\'euros)',
                  height: 400,
                  xAxisLabel: 'Secteurs',
                  yAxisLabel: 'Budget (M€)'
                }}
              />
            </AnnotationSystem>
            
            <Box sx={{ position: 'absolute', bottom: 8, right: 8 }}>
              <ShareExportPanel
                chartId="budget-municipal"
                chartTitle="Budget municipal par secteur"
                chartData={budgetData}
                chartElement={budgetChartRef.current}
              />
            </Box>
          </Box>
          
          <PieChart
            data={satisfactionData}
            config={{
              type: 'pie',
              title: 'Satisfaction des participants',
              description: 'Retours sur l\'expérience d\'utilisation de la plateforme',
              height: 400,
              showLegend: false
            }}
          />
        </Box>

        {/* Troisième ligne - Carte interactive */}
        <Box ref={mapRef} sx={{ position: 'relative' }}>
          <InteractiveMap
            data={participationData}
            center={[48.8566, 2.3522]}
            zoom={11}
            height={500}
            onMarkerClick={(data) => {
              setSnackbar({
                open: true,
                message: `Arrondissement sélectionné : ${data.name} (${data.value} participants)`,
                severity: 'info'
              });
            }}
          />
          
          <Box sx={{ position: 'absolute', bottom: 8, right: 8 }}>
            <ShareExportPanel
              chartId="carte-participation"
              chartTitle="Carte de participation par arrondissement"
              chartData={participationData}
              chartElement={mapRef.current}
            />
          </Box>
        </Box>
      </Box>

      {/* Bouton de filtres flottant */}
      <Fab
        color="primary"
        sx={{ 
          position: 'fixed', 
          bottom: 24, 
          right: 24,
          zIndex: 1000
        }}
        onClick={() => setFiltersOpen(true)}
      >
        <Badge badgeContent={activeFiltersCount} color="error">
          <TuneIcon />
        </Badge>
      </Fab>

      {/* Drawer des filtres */}
      <Drawer
        anchor="right"
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '100%', sm: 400 },
            p: 0
          }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Filtres de données</Typography>
          <IconButton onClick={() => setFiltersOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />
        <Box sx={{ p: 2 }}>
          <AdvancedFilters
            onFiltersChange={handleFiltersChange}
            defaultFilters={activeFilters}
            compact={isMobile}
          />
        </Box>
      </Drawer>

      <Divider sx={{ my: 4 }} />

      {/* Informations supplémentaires */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Fonctionnalités interactives
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Ce tableau de bord propose des fonctionnalités avancées d'interaction :
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          <Chip icon={<FilterIcon />} label="Filtres avancés" variant="outlined" size="small" />
          <Chip icon={<CommentIcon />} label="Annotations collaboratives" variant="outlined" size="small" />
          <Chip icon={<ShareIcon />} label="Partage et export" variant="outlined" size="small" />
          <Chip icon={<LocationIcon />} label="Cartes interactives" variant="outlined" size="small" />
        </Box>
        <Typography variant="body2" color="text.secondary">
          Utilisez le bouton de filtres en bas à droite pour explorer les données selon vos critères,
          cliquez sur les graphiques pour ajouter des annotations, et partagez vos découvertes
          avec les boutons d'export intégrés.
        </Typography>
      </Box>

      {/* Snackbar pour les notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard; 