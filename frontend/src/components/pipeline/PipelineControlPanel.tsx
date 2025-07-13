import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Tooltip,
  Paper
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  DataUsage as DataIcon,
  Storage as StorageIcon,
  Timeline as TimelineIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

interface PipelineControlPanelProps {
  status: any;
  sources: any[];
  datasets: any[];
  lastRun: any;
  isLoading: boolean;
  error: string | null;
  onRunPipeline: (useDebugData: boolean) => Promise<void>;
  onRefresh: () => Promise<void>;
}

const PipelineControlPanel: React.FC<PipelineControlPanelProps> = ({
  status,
  sources,
  datasets,
  lastRun,
  isLoading,
  error,
  onRunPipeline,
  onRefresh
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [useDebugData, setUseDebugData] = useState(true);
  const [isRunning, setIsRunning] = useState(false);

  const handleRunPipeline = async () => {
    setIsRunning(true);
    try {
      await onRunPipeline(useDebugData);
      setIsDialogOpen(false);
    } catch (err) {
      console.error('Erreur lors du lancement du pipeline:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const getPipelineStatusColor = () => {
    if (status?.is_running || isRunning) return 'primary';
    if (error) return 'error';
    if (lastRun?.status === 'success') return 'success';
    if (lastRun?.status === 'error') return 'error';
    return 'default';
  };

  const getPipelineStatusText = () => {
    if (status?.is_running || isRunning) return 'En cours d\'exécution';
    if (error) return 'Erreur';
    if (lastRun?.status === 'completed') return 'Dernière exécution réussie';
    if (lastRun?.status === 'error') return 'Dernière exécution échouée';
    if (datasets && datasets.length > 0) return 'Données disponibles';
    return 'Aucune exécution';
  };

  return (
    <>
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <DataIcon />
              <Typography variant="h6">Pipeline de Données</Typography>
              <Chip 
                label={getPipelineStatusText()}
                color={getPipelineStatusColor()}
                size="small"
              />
            </Box>
          }
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Actualiser">
                <IconButton onClick={onRefresh} disabled={isLoading}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={<PlayIcon />}
                onClick={() => setIsDialogOpen(true)}
                disabled={status?.is_running || isRunning || isLoading}
                color="primary"
              >
                Lancer Pipeline
              </Button>
            </Box>
          }
        />
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {(status?.is_running || isRunning) && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                Pipeline en cours d'exécution...
              </Typography>
              <LinearProgress />
            </Box>
          )}

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
            {/* Statistiques du pipeline */}
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <StorageIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h6">{sources.length}</Typography>
              <Typography variant="body2" color="text.secondary">
                Sources configurées
              </Typography>
            </Paper>
            
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <TimelineIcon color="success" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h6">{datasets.length}</Typography>
              <Typography variant="body2" color="text.secondary">
                Datasets traités
              </Typography>
            </Paper>
            
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <CheckIcon color="info" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h6">
                {lastRun?.started_at ? new Date(lastRun.started_at).toLocaleDateString() : 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Dernière exécution
              </Typography>
            </Paper>
          </Box>

          {/* Liste des sources */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Sources de Données Disponibles
            </Typography>
            <List dense>
              {sources.map((source, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <DataIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={source.name}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {source.description}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                          <Chip label={source.format} size="small" />
                          <Chip label={source.update_frequency} size="small" variant="outlined" />
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
              {sources.length === 0 && (
                <ListItem>
                  <ListItemText 
                    primary="Aucune source configurée"
                    secondary="Configurez des sources de données pour commencer"
                  />
                </ListItem>
              )}
            </List>
          </Box>

          {/* Datasets récents */}
          {datasets.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Datasets Récents
              </Typography>
              <List dense>
                {datasets.slice(0, 3).map((dataset, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <StorageIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary={dataset.name}
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            {dataset.rows_count} lignes • Qualité: {Math.round(dataset.quality_score * 100)}%
                          </Typography>
                          <Chip 
                            label={dataset.status} 
                            size="small" 
                            color={dataset.status === 'processed' ? 'success' : 'default'}
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Dialog de configuration */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <SettingsIcon />
            Lancer le Pipeline de Données
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              Le pipeline va traiter toutes les sources configurées et générer les données fusionnées.
              Cette opération peut prendre quelques minutes.
            </Alert>

            <FormControlLabel
              control={
                <Switch
                  checked={useDebugData}
                  onChange={(e) => setUseDebugData(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body1">
                    Utiliser les données de démonstration
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {useDebugData 
                      ? 'Le pipeline utilisera des données de test prédéfinies (recommandé pour les démonstrations)'
                      : 'Le pipeline tentera de récupérer les vraies données depuis les APIs externes'
                    }
                  </Typography>
                </Box>
              }
              sx={{ alignItems: 'flex-start', mb: 2 }}
            />

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>
              Ce qui va être traité :
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                <ListItemText primary="Données de participation citoyenne" />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                <ListItemText primary="Budget municipal par secteur" />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                <ListItemText primary="Fusion géographique par arrondissement" />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                <ListItemText primary="Évaluation de la qualité des données" />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                <ListItemText primary="Documentation automatique des champs" />
              </ListItem>
            </List>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleRunPipeline}
            variant="contained"
            startIcon={<PlayIcon />}
            disabled={isRunning}
          >
            {isRunning ? 'Lancement...' : 'Lancer le Pipeline'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PipelineControlPanel; 