import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  LinearProgress,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  Fab,
  Badge,
  Tooltip,
  Paper
} from '@mui/material';
import {
  Download as DownloadIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  CloudDownload as CloudDownloadIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  TableChart as ExcelIcon,
  Code as JsonIcon,
  GetApp as GetAppIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { BulkExportManager } from '../components/export';
import { 
  ExportHistory, 
  ExportStatistics, 
  ExportSettings, 
  ExportNotification 
} from '../types/export';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`export-center-tabpanel-${index}`}
      aria-labelledby={`export-center-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

// Données mockées pour l'historique
const mockExportHistory: ExportHistory[] = [
  {
    id: '1',
    chartId: 'budget-municipal',
    chartTitle: 'Budget Municipal Paris 2024',
    format: 'PDF',
    fileName: 'budget_municipal_paris_2024_2025-01-07.pdf',
    fileSize: 2457600,
    timestamp: new Date('2025-01-07T14:30:00'),
    downloadCount: 5
  },
  {
    id: '2',
    chartId: 'participation-citoyenne',
    chartTitle: 'Évolution Participation Citoyenne',
    format: 'PNG',
    fileName: 'evolution_participation_citoyenne_2025-01-07.png',
    fileSize: 1843200,
    timestamp: new Date('2025-01-07T11:15:00'),
    downloadCount: 12
  },
  {
    id: '3',
    chartId: 'data-demographics',
    chartTitle: 'Données Démographiques',
    format: 'XLSX',
    fileName: 'donnees_demographiques_2025-01-06.xlsx',
    fileSize: 567800,
    timestamp: new Date('2025-01-06T16:45:00'),
    downloadCount: 8
  },
  {
    id: '4',
    chartId: 'carte-participation',
    chartTitle: 'Carte Participation Géographique',
    format: 'PNG',
    fileName: 'carte_participation_geographique_2025-01-06.png',
    fileSize: 3142600,
    timestamp: new Date('2025-01-06T09:20:00'),
    downloadCount: 3
  }
];

// Statistiques mockées
const mockStatistics: ExportStatistics = {
  totalExports: 47,
  exportsByFormat: {
    'PNG': 18,
    'PDF': 12,
    'XLSX': 9,
    'JPG': 5,
    'JSON': 3
  },
  exportsByChart: {
    'budget-municipal': 12,
    'participation-citoyenne': 8,
    'carte-participation': 7,
    'demographics': 6,
    'satisfaction': 4
  },
  averageFileSize: 2.1,
  totalDataTransferred: 98.7,
  popularFormats: [
    { format: 'PNG', count: 18, percentage: 38.3 },
    { format: 'PDF', count: 12, percentage: 25.5 },
    { format: 'XLSX', count: 9, percentage: 19.1 }
  ],
  exportTrends: [
    { date: '2025-01-01', count: 3, formats: { 'PNG': 2, 'PDF': 1 } },
    { date: '2025-01-02', count: 7, formats: { 'PNG': 3, 'PDF': 2, 'XLSX': 2 } },
    { date: '2025-01-03', count: 5, formats: { 'PNG': 2, 'PDF': 3 } },
    { date: '2025-01-04', count: 9, formats: { 'PNG': 4, 'PDF': 3, 'XLSX': 2 } },
    { date: '2025-01-05', count: 8, formats: { 'PNG': 3, 'PDF': 2, 'XLSX': 3 } },
    { date: '2025-01-06', count: 11, formats: { 'PNG': 4, 'PDF': 4, 'XLSX': 3 } },
    { date: '2025-01-07', count: 4, formats: { 'PNG': 2, 'PDF': 2 } }
  ],
  topCharts: [
    { chartId: 'budget-municipal', chartTitle: 'Budget Municipal', exportCount: 12 },
    { chartId: 'participation-citoyenne', chartTitle: 'Participation Citoyenne', exportCount: 8 },
    { chartId: 'carte-participation', chartTitle: 'Carte Participation', exportCount: 7 }
  ]
};

const ExportCenter: React.FC = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);
  const [exportHistory, setExportHistory] = useState<ExportHistory[]>(mockExportHistory);
  const [statistics, setStatistics] = useState<ExportStatistics>(mockStatistics);
  const [searchTerm, setSearchTerm] = useState('');
  const [formatFilter, setFormatFilter] = useState('all');
  const [bulkExportOpen, setBulkExportOpen] = useState(false);
  const [notifications, setNotifications] = useState<ExportNotification[]>([]);

  // Filtrer l'historique
  const filteredHistory = exportHistory.filter(item => {
    const matchesSearch = item.chartTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.fileName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFormat = formatFilter === 'all' || item.format === formatFilter;
    return matchesSearch && matchesFormat;
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFormatIcon = (format: string) => {
    switch (format.toLowerCase()) {
      case 'png':
      case 'jpg':
        return <ImageIcon />;
      case 'pdf':
        return <PdfIcon />;
      case 'xlsx':
        return <ExcelIcon />;
      case 'json':
        return <JsonIcon />;
      default:
        return <DownloadIcon />;
    }
  };

  const getFormatColor = (format: string) => {
    switch (format.toLowerCase()) {
      case 'png':
      case 'jpg':
        return 'primary';
      case 'pdf':
        return 'error';
      case 'xlsx':
        return 'success';
      case 'json':
        return 'warning';
      default:
        return 'default';
    }
  };

  const handleDeleteExport = (exportId: string) => {
    setExportHistory(prev => prev.filter(item => item.id !== exportId));
    setNotifications(prev => [...prev, {
      id: Date.now().toString(),
      type: 'success',
      title: 'Export supprimé',
      message: 'L\'export a été supprimé de l\'historique',
      timestamp: new Date(),
      autoHide: true,
      duration: 3000
    }]);
  };

  const mockCharts = [
    {
      id: 'budget-municipal',
      title: 'Budget Municipal Paris 2024',
      element: document.createElement('div'),
      data: [],
      type: 'chart' as const
    },
    {
      id: 'participation-map',
      title: 'Carte Participation Géographique',
      element: document.createElement('div'),
      data: [],
      type: 'map' as const
    },
    {
      id: 'demographics-table',
      title: 'Tableau Démographique',
      element: document.createElement('div'),
      data: [],
      type: 'table' as const
    }
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* En-tête */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Centre d'Export
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gérez vos exports, consultez l'historique et les statistiques
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => window.location.reload()}
          >
            Actualiser
          </Button>
          <Button
            variant="contained"
            startIcon={<CloudDownloadIcon />}
            onClick={() => setBulkExportOpen(true)}
          >
            Export en Lot
          </Button>
        </Box>
      </Box>

      {/* Statistiques rapides */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        gap: 3,
        mb: 4
      }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <GetAppIcon color="primary" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h4">{statistics.totalExports}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Exports Totaux
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CloudDownloadIcon color="success" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h4">{statistics.totalDataTransferred.toFixed(1)} MB</Typography>
                <Typography variant="body2" color="text.secondary">
                  Données Transférées
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <AssessmentIcon color="warning" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h4">{statistics.averageFileSize.toFixed(1)} MB</Typography>
                <Typography variant="body2" color="text.secondary">
                  Taille Moyenne
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TrendingUpIcon color="info" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h4">
                  {statistics.exportTrends[statistics.exportTrends.length - 1]?.count || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Aujourd'hui
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Notifications */}
      {notifications.slice(0, 2).map((notification) => (
        <Alert 
          key={notification.id}
          severity={notification.type}
          sx={{ mb: 2 }}
          onClose={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
        >
          <Typography variant="subtitle2">{notification.title}</Typography>
          <Typography variant="body2">{notification.message}</Typography>
        </Alert>
      ))}

      {/* Onglets principaux */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
          <Tab 
            label="Historique" 
            icon={<Badge badgeContent={exportHistory.length} color="primary"><HistoryIcon /></Badge>} 
          />
          <Tab label="Statistiques" icon={<TrendingUpIcon />} />
          <Tab label="Paramètres" icon={<SettingsIcon />} />
        </Tabs>
      </Paper>

      {/* Onglet Historique */}
      <TabPanel value={currentTab} index={0}>
        {/* Filtres */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Rechercher dans l'historique..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
            sx={{ minWidth: 300 }}
          />
          
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Format</InputLabel>
            <Select
              value={formatFilter}
              label="Format"
              onChange={(e) => setFormatFilter(e.target.value)}
            >
              <MenuItem value="all">Tous</MenuItem>
              <MenuItem value="PNG">PNG</MenuItem>
              <MenuItem value="PDF">PDF</MenuItem>
              <MenuItem value="XLSX">Excel</MenuItem>
              <MenuItem value="JSON">JSON</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Liste d'historique */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Historique des Exports ({filteredHistory.length})
            </Typography>
            
            <List>
              {filteredHistory.map((item, index) => (
                <React.Fragment key={item.id}>
                  <ListItem>
                    <ListItemIcon>
                      {getFormatIcon(item.format)}
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1">{item.chartTitle}</Typography>
                          <Chip 
                            label={item.format} 
                            size="small" 
                            color={getFormatColor(item.format) as any}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {item.fileName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatFileSize(item.fileSize)} • {item.timestamp.toLocaleDateString('fr-FR')} à {item.timestamp.toLocaleTimeString('fr-FR')} • {item.downloadCount} téléchargements
                          </Typography>
                        </Box>
                      }
                    />
                    
                    <ListItemSecondaryAction>
                      <Tooltip title="Télécharger à nouveau">
                        <IconButton edge="end" sx={{ mr: 1 }}>
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Supprimer">
                        <IconButton 
                          edge="end" 
                          onClick={() => handleDeleteExport(item.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                  
                  {index < filteredHistory.length - 1 && <Box sx={{ borderBottom: 1, borderColor: 'divider', mx: 2 }} />}
                </React.Fragment>
              ))}
            </List>

            {filteredHistory.length === 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Aucun export trouvé avec les critères actuels.
              </Alert>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* Onglet Statistiques */}
      <TabPanel value={currentTab} index={1}>
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
          gap: 3
        }}>
          {/* Formats populaires */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Formats les Plus Populaires
              </Typography>
              
              {statistics.popularFormats.map((format) => (
                <Box key={format.format} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">{format.format}</Typography>
                    <Typography variant="body2">{format.count} ({format.percentage.toFixed(1)}%)</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={format.percentage} 
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              ))}
            </CardContent>
          </Card>

          {/* Graphiques les plus exportés */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Visualisations les Plus Exportées
              </Typography>
              
              <List>
                {statistics.topCharts.map((chart, index) => (
                  <ListItem key={chart.chartId}>
                    <ListItemIcon>
                      <Chip 
                        label={index + 1} 
                        size="small" 
                        color={index === 0 ? 'primary' : index === 1 ? 'secondary' : 'default'}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={chart.chartTitle}
                      secondary={`${chart.exportCount} exports`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>

          {/* Tendances d'export */}
          <Box sx={{ gridColumn: '1 / -1' }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Tendances d'Export (7 derniers jours)
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 2 }}>
                  {statistics.exportTrends.map((trend) => (
                    <Paper 
                      key={trend.date} 
                      sx={{ 
                        p: 2, 
                        minWidth: 120, 
                        textAlign: 'center',
                        bgcolor: trend.count > 5 ? 'primary.50' : 'grey.50'
                      }}
                    >
                      <Typography variant="h6">{trend.count}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(trend.date).toLocaleDateString('fr-FR', { 
                          day: '2-digit', 
                          month: '2-digit' 
                        })}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        {Object.entries(trend.formats).map(([format, count]) => (
                          <Chip 
                            key={format}
                            label={`${format}: ${count}`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', height: 20, mx: 0.25 }}
                          />
                        ))}
                      </Box>
                    </Paper>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </TabPanel>

      {/* Onglet Paramètres */}
      <TabPanel value={currentTab} index={2}>
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
          gap: 3
        }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Paramètres d'Export par Défaut
              </Typography>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                Ces paramètres seront appliqués par défaut lors de vos prochains exports.
              </Alert>
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="body1" color="text.secondary">
                  Les paramètres d'export avancés seront implémentés dans une version future.
                  Actuellement, vous pouvez personnaliser les options lors de chaque export individuel.
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Actions Rapides
              </Typography>
              
              <Button
                fullWidth
                variant="outlined"
                startIcon={<DeleteIcon />}
                onClick={() => setExportHistory([])}
                sx={{ mb: 2 }}
              >
                Vider l'Historique
              </Button>
              
              <Button
                fullWidth
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => setBulkExportOpen(true)}
              >
                Export en Lot
              </Button>
            </CardContent>
          </Card>
        </Box>
      </TabPanel>

      {/* Dialog Export en Lot */}
      <BulkExportManager
        open={bulkExportOpen}
        onClose={() => setBulkExportOpen(false)}
        charts={mockCharts}
      />

      {/* FAB pour accès rapide */}
      <Tooltip title="Nouvel export">
        <Fab 
          color="primary" 
          sx={{ position: 'fixed', bottom: 24, right: 24 }}
          onClick={() => setBulkExportOpen(true)}
        >
          <CloudDownloadIcon />
        </Fab>
      </Tooltip>
    </Container>
  );
};

export default ExportCenter; 