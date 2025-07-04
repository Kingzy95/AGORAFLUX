import React, { useState, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Switch,
  FormControlLabel,
  Tooltip
} from '@mui/material';
import {
  Share as ShareIcon,
  Download as DownloadIcon,
  Link as LinkIcon,
  Email as EmailIcon,
  ContentCopy as CopyIcon,
  Print as PrintIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Code as JsonIcon,
  TableChart as CsvIcon,
  Close as CloseIcon,
  Settings as SettingsIcon,
  Public as PublicIcon,
  Lock as PrivateIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import { DataExportOptions } from '../../types/visualization';
import { useAuth } from '../../context/AuthContext';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ShareExportPanelProps {
  chartId: string;
  chartTitle: string;
  chartData: any;
  chartElement?: HTMLElement | null;
  onShare?: (shareData: ShareData) => void;
  onExport?: (options: DataExportOptions) => void;
}

interface ShareData {
  type: 'link' | 'email' | 'social';
  visibility: 'public' | 'private' | 'team';
  message?: string;
  recipients?: string[];
  includeData?: boolean;
  expiresAt?: Date;
}

const ShareExportPanel: React.FC<ShareExportPanelProps> = ({
  chartId,
  chartTitle,
  chartData,
  chartElement,
  onShare,
  onExport
}) => {
  const { user } = useAuth();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [exportMenuAnchor, setExportMenuAnchor] = useState<HTMLElement | null>(null);
  const [shareData, setShareData] = useState<ShareData>({
    type: 'link',
    visibility: 'public',
    includeData: false
  });
  const [exportLoading, setExportLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{open: boolean; message: string; severity: 'success' | 'error'}>({
    open: false,
    message: '',
    severity: 'success'
  });

  const shareUrl = `${window.location.origin}/shared/chart/${chartId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setSnackbar({
        open: true,
        message: 'Lien copié dans le presse-papiers !',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erreur lors de la copie du lien',
        severity: 'error'
      });
    }
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Partage de visualisation : ${chartTitle}`);
    const body = encodeURIComponent(
      `Bonjour,\n\nJe partage avec vous cette visualisation intéressante d'AgoraFlux :\n\n${shareUrl}\n\n` +
      (shareData.message ? `Message : ${shareData.message}\n\n` : '') +
      'Cordialement'
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleExportImage = async (format: 'png' | 'jpg') => {
    if (!chartElement) return;
    
    setExportLoading(true);
    try {
      const canvas = await html2canvas(chartElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true
      });
      
      const link = document.createElement('a');
      link.download = `${chartTitle}_${new Date().toISOString().split('T')[0]}.${format}`;
      link.href = canvas.toDataURL(`image/${format}`);
      link.click();
      
      setSnackbar({
        open: true,
        message: `Image ${format.toUpperCase()} exportée avec succès !`,
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erreur lors de l\'export de l\'image',
        severity: 'error'
      });
    } finally {
      setExportLoading(false);
      setExportMenuAnchor(null);
    }
  };

  const handleExportPDF = async () => {
    if (!chartElement) return;
    
    setExportLoading(true);
    try {
      const canvas = await html2canvas(chartElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgAspectRatio = canvas.width / canvas.height;
      const pdfAspectRatio = pdfWidth / pdfHeight;
      
      let imgWidth, imgHeight;
      if (imgAspectRatio > pdfAspectRatio) {
        imgWidth = pdfWidth - 20;
        imgHeight = imgWidth / imgAspectRatio;
      } else {
        imgHeight = pdfHeight - 20;
        imgWidth = imgHeight * imgAspectRatio;
      }
      
      const x = (pdfWidth - imgWidth) / 2;
      const y = (pdfHeight - imgHeight) / 2;
      
      // Ajouter le titre
      pdf.setFontSize(16);
      pdf.text(chartTitle, pdfWidth / 2, 15, { align: 'center' });
      
      // Ajouter l'image
      pdf.addImage(imgData, 'PNG', x, y + 10, imgWidth, imgHeight - 10);
      
      // Ajouter les métadonnées
      pdf.setFontSize(10);
      pdf.text(`Généré par AgoraFlux le ${new Date().toLocaleDateString('fr-FR')}`, 10, pdfHeight - 10);
      pdf.text(shareUrl, pdfWidth - 10, pdfHeight - 10, { align: 'right' });
      
      pdf.save(`${chartTitle}_${new Date().toISOString().split('T')[0]}.pdf`);
      
      setSnackbar({
        open: true,
        message: 'PDF exporté avec succès !',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erreur lors de l\'export PDF',
        severity: 'error'
      });
    } finally {
      setExportLoading(false);
      setExportMenuAnchor(null);
    }
  };

  const handleExportData = (format: 'csv' | 'json') => {
    try {
      let content: string;
      let mimeType: string;
      let extension: string;

      if (format === 'json') {
        content = JSON.stringify(chartData, null, 2);
        mimeType = 'application/json';
        extension = 'json';
      } else {
        // CSV export
        const headers = Object.keys(chartData[0] || {});
        const csvRows = [
          headers.join(','),
          ...chartData.map((row: any) => 
            headers.map(header => {
              const value = row[header];
              return typeof value === 'string' && value.includes(',') 
                ? `"${value}"` 
                : value;
            }).join(',')
          )
        ];
        content = csvRows.join('\n');
        mimeType = 'text/csv;charset=utf-8;';
        extension = 'csv';
      }

      const blob = new Blob([content], { type: mimeType });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${chartTitle}_data_${new Date().toISOString().split('T')[0]}.${extension}`;
      link.click();
      
      setSnackbar({
        open: true,
        message: `Données ${format.toUpperCase()} exportées avec succès !`,
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erreur lors de l\'export des données',
        severity: 'error'
      });
    } finally {
      setExportMenuAnchor(null);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && chartElement) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${chartTitle} - AgoraFlux</title>
            <style>
              body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
              .header { text-align: center; margin-bottom: 20px; }
              .chart { text-align: center; }
              .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${chartTitle}</h1>
              <p>Généré par AgoraFlux - ${new Date().toLocaleDateString('fr-FR')}</p>
            </div>
            <div class="chart">
              ${chartElement.outerHTML}
            </div>
            <div class="footer">
              <p>${shareUrl}</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
    setExportMenuAnchor(null);
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public': return <PublicIcon />;
      case 'private': return <PrivateIcon />;
      case 'team': return <GroupIcon />;
      default: return <PublicIcon />;
    }
  };

  return (
    <Box>
      {/* Boutons principaux */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          startIcon={<ShareIcon />}
          onClick={() => setShareDialogOpen(true)}
          variant="outlined"
          size="small"
        >
          Partager
        </Button>
        
        <Button
          startIcon={<DownloadIcon />}
          onClick={(e) => setExportMenuAnchor(e.currentTarget)}
          variant="outlined"
          size="small"
          disabled={exportLoading}
        >
          Exporter
        </Button>
      </Box>

      {/* Menu d'export */}
      <Menu
        anchorEl={exportMenuAnchor}
        open={Boolean(exportMenuAnchor)}
        onClose={() => setExportMenuAnchor(null)}
      >
        <MenuItem onClick={() => handleExportImage('png')}>
          <ListItemIcon><ImageIcon /></ListItemIcon>
          <ListItemText primary="Image PNG" secondary="Haute qualité" />
        </MenuItem>
        
        <MenuItem onClick={() => handleExportImage('jpg')}>
          <ListItemIcon><ImageIcon /></ListItemIcon>
          <ListItemText primary="Image JPEG" secondary="Taille réduite" />
        </MenuItem>
        
        <MenuItem onClick={handleExportPDF}>
          <ListItemIcon><PdfIcon /></ListItemIcon>
          <ListItemText primary="Document PDF" secondary="Avec métadonnées" />
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={() => handleExportData('csv')}>
          <ListItemIcon><CsvIcon /></ListItemIcon>
          <ListItemText primary="Données CSV" secondary="Format tableur" />
        </MenuItem>
        
        <MenuItem onClick={() => handleExportData('json')}>
          <ListItemIcon><JsonIcon /></ListItemIcon>
          <ListItemText primary="Données JSON" secondary="Format développeur" />
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={handlePrint}>
          <ListItemIcon><PrintIcon /></ListItemIcon>
          <ListItemText primary="Imprimer" secondary="Version papier" />
        </MenuItem>
      </Menu>

      {/* Dialog de partage */}
      <Dialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Partager la visualisation</Typography>
            <IconButton onClick={() => setShareDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              {chartTitle}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Partagez cette visualisation avec vos collègues ou le public
            </Typography>
          </Box>

          {/* Options de visibilité */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Visibilité</InputLabel>
            <Select
              value={shareData.visibility}
              label="Visibilité"
              onChange={(e: SelectChangeEvent) => 
                setShareData(prev => ({ ...prev, visibility: e.target.value as any }))
              }
            >
              <MenuItem value="public">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PublicIcon />
                  <Box>
                    <Typography variant="body2">Public</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Accessible à tous
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
              <MenuItem value="team">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <GroupIcon />
                  <Box>
                    <Typography variant="body2">Équipe</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Utilisateurs connectés uniquement
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
              <MenuItem value="private">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PrivateIcon />
                  <Box>
                    <Typography variant="body2">Privé</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Lien direct uniquement
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          {/* Lien de partage */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Lien de partage
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                value={shareUrl}
                InputProps={{ readOnly: true }}
              />
              <Tooltip title="Copier le lien">
                <IconButton onClick={handleCopyLink}>
                  <CopyIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Options avancées */}
          <Box sx={{ mb: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={shareData.includeData}
                  onChange={(e) => 
                    setShareData(prev => ({ ...prev, includeData: e.target.checked }))
                  }
                />
              }
              label="Inclure les données brutes"
            />
          </Box>

          {/* Message personnalisé */}
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Message personnalisé (optionnel)"
            value={shareData.message || ''}
            onChange={(e) => 
              setShareData(prev => ({ ...prev, message: e.target.value }))
            }
            placeholder="Ajoutez un message pour expliquer le contexte de cette visualisation..."
            sx={{ mb: 3 }}
          />

          {/* Actions rapides */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              startIcon={<EmailIcon />}
              onClick={handleEmailShare}
              variant="outlined"
              size="small"
            >
              Envoyer par email
            </Button>
            
            <Button
              startIcon={<LinkIcon />}
              onClick={handleCopyLink}
              variant="outlined"
              size="small"
            >
              Copier le lien
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Snackbar pour les notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ShareExportPanel; 