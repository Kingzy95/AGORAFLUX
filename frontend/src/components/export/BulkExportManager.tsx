import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  LinearProgress,
  Alert,
  Chip,
  Divider,
  Card,
  CardContent,
  Grid,
  TextField
} from '@mui/material';
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  SelectAll as SelectAllIcon,
  Clear as ClearIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  TableChart as ExcelIcon,
  Archive as ArchiveIcon,
  Merge as MergeIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import { exportService } from '../../utils/exportUtils';
import { BulkExportOptions, ExportOptions, ExportResult, ExportProgress } from '../../types/export';

interface ChartForExport {
  id: string;
  title: string;
  element: HTMLElement;
  data: any;
  selected: boolean;
  type: 'chart' | 'map' | 'table';
  estimatedSize?: string;
}

interface BulkExportManagerProps {
  open: boolean;
  onClose: () => void;
  charts: Omit<ChartForExport, 'selected'>[];
}

const BulkExportManager: React.FC<BulkExportManagerProps> = ({
  open,
  onClose,
  charts: initialCharts
}) => {
  const [charts, setCharts] = useState<ChartForExport[]>(
    initialCharts.map(chart => ({ ...chart, selected: true }))
  );
  const [format, setFormat] = useState<ExportOptions['format']>('png');
  const [combinePdf, setCombinePdf] = useState(false);
  const [zipArchive, setZipArchive] = useState(false);
  const [exportOptions, setExportOptions] = useState<Omit<ExportOptions, 'format'>>({
    scale: 2,
    quality: 0.9,
    includeMetadata: true,
    includeWatermark: false,
    backgroundColor: '#ffffff',
    timestamp: true
  });
  
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [exportResults, setExportResults] = useState<ExportResult[]>([]);
  const [currentExportIndex, setCurrentExportIndex] = useState(0);

  const selectedCharts = charts.filter(chart => chart.selected);
  const totalEstimatedSize = selectedCharts.length * 2.5; // Estimation: 2.5MB par graphique

  React.useEffect(() => {
    if (!open) return;

    const unsubscribeProgress = exportService.onProgress((progress) => {
      setExportProgress(progress);
    });

    return () => {
      unsubscribeProgress();
    };
  }, [open]);

  const handleSelectAll = () => {
    const allSelected = charts.every(chart => chart.selected);
    setCharts(charts.map(chart => ({ ...chart, selected: !allSelected })));
  };

  const handleSelectChart = (chartId: string) => {
    setCharts(charts.map(chart => 
      chart.id === chartId ? { ...chart, selected: !chart.selected } : chart
    ));
  };

  const handleRemoveChart = (chartId: string) => {
    setCharts(charts.filter(chart => chart.id !== chartId));
  };

  const formatFileSize = (mb: number): string => {
    if (mb < 1) return `${Math.round(mb * 1024)} KB`;
    return `${mb.toFixed(1)} MB`;
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
      default:
        return <DownloadIcon />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'chart': return 'primary';
      case 'map': return 'success';
      case 'table': return 'warning';
      default: return 'default';
    }
  };

  const handleBulkExport = async () => {
    if (selectedCharts.length === 0) return;

    setIsExporting(true);
    setExportProgress(null);
    setExportResults([]);
    setCurrentExportIndex(0);

    try {
      const bulkOptions: BulkExportOptions = {
        charts: selectedCharts.map(chart => ({
          id: chart.id,
          title: chart.title,
          element: chart.element,
          data: chart.data
        })),
        format,
        options: exportOptions,
        combinePdf: combinePdf && format === 'pdf',
        zipArchive,
        naming: 'title'
      };

      const results = await exportService.exportBulk(bulkOptions);
      setExportResults(results);

      // Fermer la dialog après succès
      if (results.every(r => r.success)) {
        setTimeout(() => {
          onClose();
        }, 2000);
      }

    } catch (error) {
      console.error('Erreur d\'export en lot:', error);
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  const handleReset = () => {
    setCharts(initialCharts.map(chart => ({ ...chart, selected: true })));
    setExportResults([]);
    setExportProgress(null);
    setCurrentExportIndex(0);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '80vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Export en Lot</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Résumé de la sélection */}
        <Card sx={{ mb: 3, bgcolor: 'primary.50' }}>
          <CardContent>
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              gap: 2,
              alignItems: 'center'
            }}>
              <Box>
                <Typography variant="h6" color="primary">
                  {selectedCharts.length} élément(s) sélectionné(s)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Taille estimée: {formatFileSize(totalEstimatedSize)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
                <Button
                  startIcon={<SelectAllIcon />}
                  onClick={handleSelectAll}
                  size="small"
                >
                  {charts.every(c => c.selected) ? 'Désélectionner' : 'Tout sélectionner'}
                </Button>
                <Button
                  startIcon={<ClearIcon />}
                  onClick={handleReset}
                  size="small"
                  variant="outlined"
                >
                  Réinitialiser
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Options d'export */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Options d'export
            </Typography>
            
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
              gap: 3
            }}>
              <FormControl fullWidth>
                <InputLabel>Format</InputLabel>
                <Select
                  value={format}
                  label="Format"
                  onChange={(e) => setFormat(e.target.value as any)}
                >
                  <MenuItem value="png">PNG (Images)</MenuItem>
                  <MenuItem value="jpg">JPEG (Images compressées)</MenuItem>
                  <MenuItem value="pdf">PDF (Documents)</MenuItem>
                  <MenuItem value="xlsx">Excel (Données)</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Échelle"
                type="number"
                value={exportOptions.scale}
                onChange={(e) => setExportOptions(prev => ({ 
                  ...prev, 
                  scale: parseFloat(e.target.value) || 2 
                }))}
                inputProps={{ min: 1, max: 4, step: 0.5 }}
              />

              <TextField
                fullWidth
                label="Qualité (%)"
                type="number"
                value={Math.round((exportOptions.quality || 0.9) * 100)}
                onChange={(e) => setExportOptions(prev => ({ 
                  ...prev, 
                  quality: parseInt(e.target.value) / 100 || 0.9 
                }))}
                inputProps={{ min: 10, max: 100, step: 10 }}
              />

              <Box sx={{ gridColumn: { xs: '1 / -1', md: '1 / -1' } }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={exportOptions.includeMetadata || false}
                        onChange={(e) => setExportOptions(prev => ({ 
                          ...prev, 
                          includeMetadata: e.target.checked 
                        }))}
                      />
                    }
                    label="Métadonnées"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={exportOptions.includeWatermark || false}
                        onChange={(e) => setExportOptions(prev => ({ 
                          ...prev, 
                          includeWatermark: e.target.checked 
                        }))}
                      />
                    }
                    label="Filigrane"
                  />

                  {format === 'pdf' && (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={combinePdf}
                          onChange={(e) => setCombinePdf(e.target.checked)}
                        />
                      }
                      label="PDF combiné"
                    />
                  )}

                  <FormControlLabel
                    control={
                      <Switch
                        checked={zipArchive}
                        onChange={(e) => setZipArchive(e.target.checked)}
                      />
                    }
                    label="Archive ZIP"
                  />
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Barre de progression */}
        {isExporting && exportProgress && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2" gutterBottom>
              {exportProgress.message}
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={exportProgress.progress} 
              sx={{ mt: 1 }}
            />
            <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
              Étape: {exportProgress.step} - {exportProgress.progress}%
            </Typography>
          </Alert>
        )}

        {/* Résultats d'export */}
        {exportResults.length > 0 && (
          <Alert 
            severity={exportResults.every(r => r.success) ? "success" : "warning"} 
            sx={{ mb: 3 }}
          >
            <Typography variant="subtitle2">
              Export terminé: {exportResults.filter(r => r.success).length}/{exportResults.length} fichiers générés
            </Typography>
            {exportResults.some(r => !r.success) && (
              <Typography variant="body2">
                Certains exports ont échoué. Vérifiez les paramètres et réessayez.
              </Typography>
            )}
          </Alert>
        )}

        {/* Liste des graphiques */}
        <Typography variant="h6" gutterBottom>
          Éléments à exporter
        </Typography>
        
        <List sx={{ maxHeight: 300, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
          {charts.map((chart, index) => (
            <React.Fragment key={chart.id}>
              <ListItem>
                <ListItemIcon>
                  <Checkbox
                    checked={chart.selected}
                    onChange={() => handleSelectChart(chart.id)}
                  />
                </ListItemIcon>
                
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getFormatIcon(format)}
                      <Typography variant="body1">{chart.title}</Typography>
                      <Chip 
                        label={chart.type} 
                        size="small" 
                        color={getTypeColor(chart.type) as any}
                      />
                    </Box>
                  }
                  secondary={`Taille estimée: ${chart.estimatedSize || '~2.5 MB'}`}
                />
                
                <ListItemSecondaryAction>
                  <IconButton 
                    edge="end" 
                    onClick={() => handleRemoveChart(chart.id)}
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
              
              {index < charts.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>

        {charts.length === 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Aucun élément disponible pour l'export.
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, bgcolor: 'grey.50' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
          <Box sx={{ flexGrow: 1 }}>
            {selectedCharts.length > 0 && (
              <Typography variant="body2" color="text.secondary">
                {selectedCharts.length} élément(s) • {formatFileSize(totalEstimatedSize)} estimé
                {combinePdf && format === 'pdf' && ' • PDF combiné'}
                {zipArchive && ' • Archive ZIP'}
              </Typography>
            )}
          </Box>
          
          <Button onClick={onClose}>
            Annuler
          </Button>
          
          <Button
            variant="contained"
            startIcon={isExporting ? <SpeedIcon /> : <DownloadIcon />}
            onClick={handleBulkExport}
            disabled={selectedCharts.length === 0 || isExporting}
            size="large"
          >
            {isExporting ? 'Export en cours...' : `Exporter ${selectedCharts.length} élément(s)`}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default BulkExportManager; 