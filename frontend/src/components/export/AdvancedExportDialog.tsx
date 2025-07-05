import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardMedia,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Switch,
  FormControlLabel,
  Slider,
  Chip,
  LinearProgress,
  Alert,
  Grid,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Code as JsonIcon,
  TableChart as CsvIcon,
  Settings as SettingsIcon,
  Preview as PreviewIcon,
  Palette as PaletteIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { exportService } from '../../utils/exportUtils';
import { 
  ExportOptions, 
  ExportTemplate, 
  ExportProgress, 
  ExportNotification,
  ExportResult 
} from '../../types/export';

interface AdvancedExportDialogProps {
  open: boolean;
  onClose: () => void;
  element: HTMLElement | null;
  data: any;
  title: string;
  chartId?: string;
}

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
      id={`export-tabpanel-${index}`}
      aria-labelledby={`export-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

// Templates prédéfinis
const exportTemplates: ExportTemplate[] = [
  {
    id: 'report-professional',
    name: 'Rapport Professionnel',
    description: 'PDF haute qualité avec métadonnées complètes',
    format: 'pdf',
    category: 'report',
    preview: '/images/templates/report-professional.png',
    defaultOptions: {
      format: 'pdf',
      scale: 2,
      includeMetadata: true,
      includeWatermark: true,
      backgroundColor: '#ffffff',
      orientation: 'portrait',
      timestamp: true,
      quality: 1.0
    }
  },
  {
    id: 'presentation-slide',
    name: 'Slide de Présentation',
    description: 'Image PNG optimisée pour présentations',
    format: 'png',
    category: 'presentation',
    defaultOptions: {
      format: 'png',
      scale: 3,
      includeWatermark: false,
      backgroundColor: '#ffffff',
      quality: 1.0,
      dimensions: { width: 1920, height: 1080 }
    }
  },
  {
    id: 'data-export',
    name: 'Export de Données',
    description: 'Fichier Excel avec données structurées',
    format: 'xlsx',
    category: 'data',
    defaultOptions: {
      format: 'xlsx',
      includeMetadata: true,
      timestamp: true
    }
  },
  {
    id: 'social-media',
    name: 'Réseaux Sociaux',
    description: 'Image carrée pour partage social',
    format: 'png',
    category: 'social',
    defaultOptions: {
      format: 'png',
      scale: 2,
      backgroundColor: '#f5f5f5',
      dimensions: { width: 1080, height: 1080 },
      includeWatermark: true
    }
  }
];

const AdvancedExportDialog: React.FC<AdvancedExportDialogProps> = ({
  open,
  onClose,
  element,
  data,
  title,
  chartId
}) => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<ExportTemplate | null>(null);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'png',
    scale: 2,
    quality: 0.9,
    includeMetadata: true,
    includeWatermark: false,
    backgroundColor: '#ffffff',
    orientation: 'portrait',
    timestamp: true,
    author: user?.first_name + ' ' + user?.last_name || 'AgoraFlux'
  });
  
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [exportResults, setExportResults] = useState<ExportResult[]>([]);
  const [notifications, setNotifications] = useState<ExportNotification[]>([]);

  useEffect(() => {
    if (!open) return;

    const unsubscribeProgress = exportService.onProgress((progress) => {
      setExportProgress(progress);
    });

    const unsubscribeNotifications = exportService.onNotification((notification) => {
      setNotifications(prev => [notification, ...prev].slice(0, 5));
    });

    return () => {
      unsubscribeProgress();
      unsubscribeNotifications();
    };
  }, [open]);

  const handleTemplateSelect = (template: ExportTemplate) => {
    setSelectedTemplate(template);
    setExportOptions(template.defaultOptions);
  };

  const handleOptionChange = (key: keyof ExportOptions, value: any) => {
    setExportOptions(prev => ({ ...prev, [key]: value }));
  };

  const handleExport = async () => {
    if (!element || !data) return;

    setIsExporting(true);
    setExportProgress(null);
    setExportResults([]);

    try {
      let result: ExportResult;

      switch (exportOptions.format) {
        case 'png':
        case 'jpg':
          result = await exportService.exportImage(element, title, exportOptions);
          break;
        case 'pdf':
          result = await exportService.exportPDF(element, title, exportOptions);
          break;
        case 'csv':
        case 'json':
        case 'xlsx':
          result = await exportService.exportData(data, title, exportOptions);
          break;
        default:
          throw new Error(`Format non supporté: ${exportOptions.format}`);
      }

      setExportResults([result]);

      if (result.success) {
        setTimeout(() => {
          onClose();
        }, 2000);
      }

    } catch (error) {
      console.error('Erreur d\'export:', error);
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'png':
      case 'jpg':
        return <ImageIcon />;
      case 'pdf':
        return <PdfIcon />;
      case 'xlsx':
        return <ExcelIcon />;
      case 'json':
        return <JsonIcon />;
      case 'csv':
        return <CsvIcon />;
      default:
        return <DownloadIcon />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Export Avancé - {title}</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
            <Tab label="Templates" icon={<PreviewIcon />} />
            <Tab label="Options" icon={<SettingsIcon />} />
            <Tab label="Aperçu" icon={<PaletteIcon />} />
            <Tab label="Export" icon={<DownloadIcon />} />
          </Tabs>
        </Box>

        <Box sx={{ p: 3, height: 'calc(90vh - 200px)', overflow: 'auto' }}>
          {/* Onglet Templates */}
          <TabPanel value={currentTab} index={0}>
            <Typography variant="h6" gutterBottom>
              Choisissez un template d'export
            </Typography>
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)'
              },
              gap: 2
            }}>
              {exportTemplates.map((template) => (
                <Card 
                  key={template.id}
                  sx={{ 
                    cursor: 'pointer',
                    border: selectedTemplate?.id === template.id ? 2 : 1,
                    borderColor: selectedTemplate?.id === template.id ? 'primary.main' : 'divider'
                  }}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardMedia
                    sx={{ height: 120, bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {getFormatIcon(template.format)}
                  </CardMedia>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {template.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {template.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Chip 
                        label={template.format.toUpperCase()} 
                        size="small" 
                        color="primary" 
                      />
                      <Chip 
                        label={template.category} 
                        size="small" 
                        variant="outlined" 
                      />
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </TabPanel>

          {/* Onglet Options */}
          <TabPanel value={currentTab} index={1}>
            <Typography variant="h6" gutterBottom>
              Options d'export personnalisées
            </Typography>

            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">Format et Qualité</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ 
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                  gap: 3
                }}>
                  <FormControl fullWidth>
                    <InputLabel>Format</InputLabel>
                    <Select
                      value={exportOptions.format}
                      label="Format"
                      onChange={(e) => handleOptionChange('format', e.target.value)}
                    >
                      <MenuItem value="png">PNG (Image)</MenuItem>
                      <MenuItem value="jpg">JPEG (Image compressée)</MenuItem>
                      <MenuItem value="pdf">PDF (Document)</MenuItem>
                      <MenuItem value="csv">CSV (Données tabulaires)</MenuItem>
                      <MenuItem value="json">JSON (Données structurées)</MenuItem>
                      <MenuItem value="xlsx">Excel (Tableur)</MenuItem>
                    </Select>
                  </FormControl>

                  {['png', 'jpg', 'pdf'].includes(exportOptions.format) && (
                    <Box>
                      <Typography gutterBottom>
                        Échelle de rendu: {exportOptions.scale}x
                      </Typography>
                      <Slider
                        value={exportOptions.scale || 2}
                        onChange={(_, value) => handleOptionChange('scale', value)}
                        min={1}
                        max={4}
                        step={0.5}
                        marks={[
                          { value: 1, label: '1x' },
                          { value: 2, label: '2x' },
                          { value: 3, label: '3x' },
                          { value: 4, label: '4x' }
                        ]}
                      />
                    </Box>
                  )}

                  {exportOptions.format === 'jpg' && (
                    <Box>
                      <Typography gutterBottom>
                        Qualité JPEG: {Math.round((exportOptions.quality || 0.9) * 100)}%
                      </Typography>
                      <Slider
                        value={exportOptions.quality || 0.9}
                        onChange={(_, value) => handleOptionChange('quality', value)}
                        min={0.1}
                        max={1}
                        step={0.1}
                        marks={[
                          { value: 0.3, label: '30%' },
                          { value: 0.6, label: '60%' },
                          { value: 0.9, label: '90%' }
                        ]}
                      />
                    </Box>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">Mise en Page</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ 
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                  gap: 3
                }}>
                  <TextField
                    fullWidth
                    label="Couleur de fond"
                    type="color"
                    value={exportOptions.backgroundColor || '#ffffff'}
                    onChange={(e) => handleOptionChange('backgroundColor', e.target.value)}
                    InputProps={{
                      startAdornment: <PaletteIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />

                  {exportOptions.format === 'pdf' && (
                    <FormControl fullWidth>
                      <InputLabel>Orientation</InputLabel>
                      <Select
                        value={exportOptions.orientation || 'portrait'}
                        label="Orientation"
                        onChange={(e) => handleOptionChange('orientation', e.target.value)}
                      >
                        <MenuItem value="portrait">Portrait</MenuItem>
                        <MenuItem value="landscape">Paysage</MenuItem>
                      </Select>
                    </FormControl>
                  )}

                  <TextField
                    fullWidth
                    label="Largeur personnalisée (px)"
                    type="number"
                    value={exportOptions.dimensions?.width || ''}
                    onChange={(e) => handleOptionChange('dimensions', {
                      ...exportOptions.dimensions,
                      width: parseInt(e.target.value) || undefined
                    })}
                  />

                  <TextField
                    fullWidth
                    label="Hauteur personnalisée (px)"
                    type="number"
                    value={exportOptions.dimensions?.height || ''}
                    onChange={(e) => handleOptionChange('dimensions', {
                      ...exportOptions.dimensions,
                      height: parseInt(e.target.value) || undefined
                    })}
                  />
                </Box>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">Métadonnées et Sécurité</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ 
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: 3
                }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={exportOptions.includeMetadata || false}
                        onChange={(e) => handleOptionChange('includeMetadata', e.target.checked)}
                      />
                    }
                    label="Inclure les métadonnées"
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={exportOptions.includeWatermark || false}
                        onChange={(e) => handleOptionChange('includeWatermark', e.target.checked)}
                      />
                    }
                    label="Filigrane AgoraFlux"
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={exportOptions.timestamp || false}
                        onChange={(e) => handleOptionChange('timestamp', e.target.checked)}
                      />
                    }
                    label="Horodatage"
                  />

                  <Box sx={{ 
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                    gap: 2
                  }}>
                    <TextField
                      fullWidth
                      label="Titre personnalisé"
                      value={exportOptions.customTitle || ''}
                      onChange={(e) => handleOptionChange('customTitle', e.target.value)}
                      placeholder={title}
                    />

                    <TextField
                      fullWidth
                      label="Auteur"
                      value={exportOptions.author || ''}
                      onChange={(e) => handleOptionChange('author', e.target.value)}
                    />
                  </Box>

                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Description"
                    value={exportOptions.customDescription || ''}
                    onChange={(e) => handleOptionChange('customDescription', e.target.value)}
                    placeholder="Description de cette visualisation..."
                  />
                </Box>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">Aperçu Configuration</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ 
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                  gap: 2
                }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Format</Typography>
                    <Typography variant="body1">{exportOptions.format?.toUpperCase()}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Échelle</Typography>
                    <Typography variant="body1">{exportOptions.scale}x</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Dimensions</Typography>
                    <Typography variant="body1">
                      {exportOptions.dimensions ? 
                        `${exportOptions.dimensions.width}×${exportOptions.dimensions.height}` : 
                        'Auto'
                      }
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Taille estimée</Typography>
                    <Typography variant="body1">~2-5 MB</Typography>
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          </TabPanel>

          {/* Onglet Aperçu */}
          <TabPanel value={currentTab} index={2}>
            <Typography variant="h6" gutterBottom>
              Aperçu de l'export
            </Typography>
            
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Configuration actuelle
                </Typography>
                <Box sx={{ 
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                  gap: 2
                }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Format</Typography>
                    <Typography variant="body1">{exportOptions.format?.toUpperCase()}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Échelle</Typography>
                    <Typography variant="body1">{exportOptions.scale}x</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Dimensions</Typography>
                    <Typography variant="body1">
                      {exportOptions.dimensions ? 
                        `${exportOptions.dimensions.width}×${exportOptions.dimensions.height}` : 
                        'Auto'
                      }
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Taille estimée</Typography>
                    <Typography variant="body1">~2-5 MB</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {element && (
              <Box 
                sx={{ 
                  border: 1, 
                  borderColor: 'divider', 
                  borderRadius: 1,
                  p: 2,
                  bgcolor: exportOptions.backgroundColor || '#ffffff',
                  textAlign: 'center'
                }}
              >
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Aperçu du contenu à exporter
                </Typography>
                <Box 
                  sx={{ 
                    display: 'inline-block',
                    border: 1,
                    borderColor: 'primary.main',
                    borderStyle: 'dashed',
                    p: 1,
                    borderRadius: 1
                  }}
                >
                  <Typography variant="caption">
                    Élément: {title}
                  </Typography>
                </Box>
              </Box>
            )}
          </TabPanel>

          {/* Onglet Export */}
          <TabPanel value={currentTab} index={3}>
            <Typography variant="h6" gutterBottom>
              Lancement de l'export
            </Typography>

            {/* Notifications */}
            {notifications.length > 0 && (
              <Box sx={{ mb: 3 }}>
                {notifications.slice(0, 3).map((notification) => (
                  <Alert 
                    key={notification.id}
                    severity={notification.type}
                    sx={{ mb: 1 }}
                    icon={
                      notification.type === 'success' ? <CheckIcon /> :
                      notification.type === 'error' ? <ErrorIcon /> :
                      <InfoIcon />
                    }
                  >
                    <Typography variant="subtitle2">{notification.title}</Typography>
                    <Typography variant="body2">{notification.message}</Typography>
                  </Alert>
                ))}
              </Box>
            )}

            {/* Barre de progression */}
            {isExporting && exportProgress && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" gutterBottom>
                  {exportProgress.message}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={exportProgress.progress} 
                  sx={{ mb: 1 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {exportProgress.progress}% - Étape: {exportProgress.step}
                </Typography>
              </Box>
            )}

            {/* Résultats d'export */}
            {exportResults.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Résultats d'export
                </Typography>
                <List>
                  {exportResults.map((result, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        {result.success ? <CheckIcon color="success" /> : <ErrorIcon color="error" />}
                      </ListItemIcon>
                      <ListItemText
                        primary={result.fileName}
                        secondary={
                          result.success ? 
                            `Taille: ${result.fileSize ? formatFileSize(result.fileSize) : 'N/A'} - Durée: ${result.duration}ms` :
                            `Erreur: ${result.error}`
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            <Card sx={{ bgcolor: 'grey.50' }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Prêt pour l'export
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Vérifiez vos paramètres et lancez l'export. Le fichier sera automatiquement téléchargé.
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<DownloadIcon />}
                  onClick={handleExport}
                  disabled={isExporting || !element}
                  fullWidth
                  sx={{ mt: 2 }}
                >
                  {isExporting ? 'Export en cours...' : `Exporter en ${exportOptions.format?.toUpperCase()}`}
                </Button>
              </CardContent>
            </Card>
          </TabPanel>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>
          Annuler
        </Button>
        <Button 
          variant="contained" 
          onClick={() => setCurrentTab(3)}
          disabled={currentTab === 3}
        >
          Passer à l'export
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdvancedExportDialog; 