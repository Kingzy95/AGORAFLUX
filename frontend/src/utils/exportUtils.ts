import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { 
  ExportOptions, 
  ExportResult, 
  BulkExportOptions, 
  ExportProgress,
  ExportNotification 
} from '../types/export';

export class ExportService {
  private static instance: ExportService;
  private progressCallbacks: Set<(progress: ExportProgress) => void> = new Set();
  private notificationCallbacks: Set<(notification: ExportNotification) => void> = new Set();

  static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  onProgress(callback: (progress: ExportProgress) => void): () => void {
    this.progressCallbacks.add(callback);
    return () => this.progressCallbacks.delete(callback);
  }

  onNotification(callback: (notification: ExportNotification) => void): () => void {
    this.notificationCallbacks.add(callback);
    return () => this.notificationCallbacks.delete(callback);
  }

  private notifyProgress(progress: ExportProgress): void {
    this.progressCallbacks.forEach(callback => callback(progress));
  }

  private notifyResult(notification: ExportNotification): void {
    this.notificationCallbacks.forEach(callback => callback(notification));
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private generateFileName(title: string, format: string): string {
    const cleanTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const timestamp = new Date().toISOString().split('T')[0];
    return `${cleanTitle}_${timestamp}.${format}`;
  }

  private addWatermark(canvas: HTMLCanvasElement, options: ExportOptions): HTMLCanvasElement {
    if (!options.includeWatermark) return canvas;

    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const watermarkText = 'AgoraFlux';
    const fontSize = Math.max(12, canvas.width * 0.02);
    
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#666666';
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    
    const margin = 10;
    ctx.fillText(watermarkText, canvas.width - margin, canvas.height - margin);
    ctx.restore();

    return canvas;
  }

  async exportImage(
    element: HTMLElement, 
    title: string, 
    options: ExportOptions
  ): Promise<ExportResult> {
    const startTime = Date.now();
    const fileName = this.generateFileName(title, options.format);

    try {
      this.notifyProgress({
        step: 'capture',
        progress: 20,
        message: 'Capture de l\'élément en cours...'
      });

      const canvas = await html2canvas(element, {
        backgroundColor: options.backgroundColor || '#ffffff',
        scale: options.scale || 2,
        useCORS: true,
        allowTaint: true,
        width: options.dimensions?.width,
        height: options.dimensions?.height,
        onclone: (clonedDoc) => {
          // Optimisations pour le clonage
          const clonedElement = clonedDoc.body.firstChild as HTMLElement;
          if (clonedElement) {
            clonedElement.style.transform = 'none';
            clonedElement.style.position = 'static';
          }
        }
      });

      this.notifyProgress({
        step: 'process',
        progress: 60,
        message: 'Traitement de l\'image...'
      });

      // Ajouter le watermark si nécessaire
      const processedCanvas = this.addWatermark(canvas, options);

      this.notifyProgress({
        step: 'export',
        progress: 80,
        message: 'Génération du fichier...'
      });

      let mimeType: string;
      let quality = 1.0;

      switch (options.format) {
        case 'png':
          mimeType = 'image/png';
          break;
        case 'jpg':
          mimeType = 'image/jpeg';
          quality = options.quality || 0.9;
          break;
        default:
          throw new Error(`Format d'image non supporté: ${options.format}`);
      }

      // Conversion en blob
      const blob = await new Promise<Blob>((resolve) => {
        processedCanvas.toBlob((blob) => {
          resolve(blob!);
        }, mimeType, quality);
      });

      // Téléchargement
      saveAs(blob, fileName);

      const result: ExportResult = {
        success: true,
        fileName,
        fileSize: blob.size,
        duration: Date.now() - startTime
      };

      this.notifyProgress({
        step: 'complete',
        progress: 100,
        message: 'Export terminé avec succès !'
      });

      this.notifyResult({
        id: Date.now().toString(),
        type: 'success',
        title: 'Export réussi',
        message: `Image ${options.format.toUpperCase()} exportée (${this.formatFileSize(blob.size)})`,
        timestamp: new Date(),
        autoHide: true,
        duration: 4000
      });

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      
      this.notifyResult({
        id: Date.now().toString(),
        type: 'error',
        title: 'Erreur d\'export',
        message: `Impossible d'exporter l'image: ${errorMessage}`,
        timestamp: new Date(),
        autoHide: false
      });

      return {
        success: false,
        fileName,
        error: errorMessage,
        duration: Date.now() - startTime
      };
    }
  }

  async exportPDF(
    element: HTMLElement, 
    title: string, 
    options: ExportOptions
  ): Promise<ExportResult> {
    const startTime = Date.now();
    const fileName = this.generateFileName(title, 'pdf');

    try {
      this.notifyProgress({
        step: 'capture',
        progress: 25,
        message: 'Capture de l\'élément...'
      });

      const canvas = await html2canvas(element, {
        backgroundColor: options.backgroundColor || '#ffffff',
        scale: options.scale || 2,
        useCORS: true
      });

      this.notifyProgress({
        step: 'process',
        progress: 50,
        message: 'Traitement du PDF...'
      });

      const processedCanvas = this.addWatermark(canvas, options);
      const imgData = processedCanvas.toDataURL('image/png');

      // Créer le PDF
      const pdf = new jsPDF({
        orientation: options.orientation || (canvas.width > canvas.height ? 'landscape' : 'portrait'),
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
        imgHeight = pdfHeight - 30;
        imgWidth = imgHeight * imgAspectRatio;
      }

      const x = (pdfWidth - imgWidth) / 2;
      const y = (pdfHeight - imgHeight) / 2;

      this.notifyProgress({
        step: 'layout',
        progress: 75,
        message: 'Mise en page du document...'
      });

      // Métadonnées
      if (options.includeMetadata) {
        pdf.setProperties({
          title: options.customTitle || title,
          subject: options.customDescription || 'Visualisation générée par AgoraFlux',
          author: options.author || 'AgoraFlux',
          creator: 'AgoraFlux Export Service',
          keywords: 'data visualization, charts, AgoraFlux'
        });
      }

      // En-tête
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text(options.customTitle || title, pdfWidth / 2, 15, { align: 'center' });

      if (options.customDescription) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        const lines = pdf.splitTextToSize(options.customDescription, pdfWidth - 20);
        pdf.text(lines, 10, 25);
      }

      // Image principale
      pdf.addImage(imgData, 'PNG', x, y + 15, imgWidth, imgHeight);

      // Pied de page
      const footerY = pdfHeight - 10;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(128, 128, 128);
      
      if (options.timestamp) {
        pdf.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 10, footerY);
      }
      
      pdf.text('AgoraFlux - Plateforme de simulation citoyenne', pdfWidth - 10, footerY, { align: 'right' });

      this.notifyProgress({
        step: 'save',
        progress: 90,
        message: 'Sauvegarde du fichier...'
      });

      // Sauvegarde
      const pdfBlob = pdf.output('blob');
      saveAs(pdfBlob, fileName);

      const result: ExportResult = {
        success: true,
        fileName,
        fileSize: pdfBlob.size,
        duration: Date.now() - startTime
      };

      this.notifyProgress({
        step: 'complete',
        progress: 100,
        message: 'PDF exporté avec succès !'
      });

      this.notifyResult({
        id: Date.now().toString(),
        type: 'success',
        title: 'PDF généré',
        message: `Document PDF créé (${this.formatFileSize(pdfBlob.size)})`,
        timestamp: new Date(),
        autoHide: true,
        duration: 4000
      });

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      
      this.notifyResult({
        id: Date.now().toString(),
        type: 'error',
        title: 'Erreur PDF',
        message: `Impossible de générer le PDF: ${errorMessage}`,
        timestamp: new Date(),
        autoHide: false
      });

      return {
        success: false,
        fileName,
        error: errorMessage,
        duration: Date.now() - startTime
      };
    }
  }

  async exportData(
    data: any, 
    title: string, 
    options: ExportOptions
  ): Promise<ExportResult> {
    const startTime = Date.now();
    const fileName = this.generateFileName(title, options.format);

    try {
      this.notifyProgress({
        step: 'process',
        progress: 50,
        message: `Préparation des données ${options.format.toUpperCase()}...`
      });

      let blob: Blob;
      let mimeType: string;

      switch (options.format) {
        case 'json':
          const jsonData = {
            title: options.customTitle || title,
            description: options.customDescription,
            data: data,
            metadata: options.includeMetadata ? {
              exportedBy: options.author || 'AgoraFlux',
              exportDate: new Date().toISOString(),
              version: '1.0'
            } : undefined
          };
          blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
          mimeType = 'application/json';
          break;

        case 'csv':
          let csvContent = '';
          if (Array.isArray(data) && data.length > 0) {
            const headers = Object.keys(data[0]);
            csvContent = headers.join(',') + '\n';
            csvContent += data.map(row => 
              headers.map(header => {
                const value = row[header];
                return typeof value === 'string' && value.includes(',') 
                  ? `"${value.replace(/"/g, '""')}"` 
                  : value;
              }).join(',')
            ).join('\n');
          }
          blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          mimeType = 'text/csv';
          break;

        case 'xlsx':
          const ws = XLSX.utils.json_to_sheet(Array.isArray(data) ? data : [data]);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Data');
          
          if (options.includeMetadata) {
            const metaWs = XLSX.utils.json_to_sheet([{
              'Titre': options.customTitle || title,
              'Description': options.customDescription || '',
              'Date d\'export': new Date().toLocaleDateString('fr-FR'),
              'Auteur': options.author || 'AgoraFlux'
            }]);
            XLSX.utils.book_append_sheet(wb, metaWs, 'Métadonnées');
          }
          
          const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
          blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;

        default:
          throw new Error(`Format de données non supporté: ${options.format}`);
      }

      this.notifyProgress({
        step: 'save',
        progress: 80,
        message: 'Sauvegarde du fichier...'
      });

      saveAs(blob, fileName);

      const result: ExportResult = {
        success: true,
        fileName,
        fileSize: blob.size,
        duration: Date.now() - startTime
      };

      this.notifyProgress({
        step: 'complete',
        progress: 100,
        message: 'Données exportées avec succès !'
      });

      this.notifyResult({
        id: Date.now().toString(),
        type: 'success',
        title: 'Données exportées',
        message: `Fichier ${options.format.toUpperCase()} généré (${this.formatFileSize(blob.size)})`,
        timestamp: new Date(),
        autoHide: true,
        duration: 4000
      });

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      
      this.notifyResult({
        id: Date.now().toString(),
        type: 'error',
        title: 'Erreur d\'export',
        message: `Impossible d'exporter les données: ${errorMessage}`,
        timestamp: new Date(),
        autoHide: false
      });

      return {
        success: false,
        fileName,
        error: errorMessage,
        duration: Date.now() - startTime
      };
    }
  }

  async exportBulk(bulkOptions: BulkExportOptions): Promise<ExportResult[]> {
    const results: ExportResult[] = [];
    const { charts, format, options, combinePdf, zipArchive } = bulkOptions;

    try {
      this.notifyProgress({
        step: 'init',
        progress: 0,
        message: `Début de l'export en lot (${charts.length} éléments)...`
      });

      if (combinePdf && format === 'pdf') {
        // Export PDF combiné
        return await this.exportCombinedPDF(charts, options);
      }

      // Export individuel
      for (let i = 0; i < charts.length; i++) {
        const chart = charts[i];
        const progress = Math.round((i / charts.length) * 80);
        
        this.notifyProgress({
          step: 'process',
          progress,
          message: `Export ${i + 1}/${charts.length}: ${chart.title}`
        });

        let result: ExportResult;
        
        switch (format) {
          case 'png':
          case 'jpg':
            result = await this.exportImage(chart.element, chart.title, { ...options, format });
            break;
          case 'pdf':
            result = await this.exportPDF(chart.element, chart.title, { ...options, format });
            break;
          case 'csv':
          case 'json':
          case 'xlsx':
            result = await this.exportData(chart.data, chart.title, { ...options, format });
            break;
          default:
            throw new Error(`Format non supporté: ${format}`);
        }
        
        results.push(result);
      }

      if (zipArchive && results.length > 1) {
        // Créer une archive ZIP
        return await this.createZipArchive(results, `export_bulk_${new Date().toISOString().split('T')[0]}.zip`);
      }

      this.notifyProgress({
        step: 'complete',
        progress: 100,
        message: 'Export en lot terminé !'
      });

      this.notifyResult({
        id: Date.now().toString(),
        type: 'success',
        title: 'Export en lot réussi',
        message: `${results.filter(r => r.success).length}/${results.length} fichiers exportés`,
        timestamp: new Date(),
        autoHide: true,
        duration: 5000
      });

      return results;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      
      this.notifyResult({
        id: Date.now().toString(),
        type: 'error',
        title: 'Erreur d\'export en lot',
        message: `Échec de l'export en lot: ${errorMessage}`,
        timestamp: new Date(),
        autoHide: false
      });

      return [{
        success: false,
        fileName: 'bulk_export_failed',
        error: errorMessage
      }];
    }
  }

  private async exportCombinedPDF(
    charts: BulkExportOptions['charts'], 
    options: Omit<ExportOptions, 'format'>
  ): Promise<ExportResult[]> {
    const fileName = this.generateFileName('rapport_combine', 'pdf');
    
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Dimensions PDF accessibles globalement
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      let pageCount = 0;

      for (let i = 0; i < charts.length; i++) {
        const chart = charts[i];
        
        this.notifyProgress({
          step: 'process',
          progress: Math.round((i / charts.length) * 80),
          message: `Ajout au PDF: ${chart.title}`
        });

        if (pageCount > 0) {
          pdf.addPage();
        }

        // Capture du graphique
        const canvas = await html2canvas(chart.element, {
          backgroundColor: options.backgroundColor || '#ffffff',
          scale: options.scale || 1.5,
          useCORS: true
        });

        const imgData = canvas.toDataURL('image/png');

        // Titre de la page
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text(chart.title, pdfWidth / 2, 20, { align: 'center' });

        // Image du graphique
        const imgAspectRatio = canvas.width / canvas.height;
        const maxWidth = pdfWidth - 20;
        const maxHeight = pdfHeight - 60;

        let imgWidth, imgHeight;
        if (maxWidth / imgAspectRatio <= maxHeight) {
          imgWidth = maxWidth;
          imgHeight = maxWidth / imgAspectRatio;
        } else {
          imgHeight = maxHeight;
          imgWidth = maxHeight * imgAspectRatio;
        }

        const x = (pdfWidth - imgWidth) / 2;
        const y = 30;

        pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);

        // Numéro de page
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Page ${pageCount + 1}`, pdfWidth - 10, pdfHeight - 10, { align: 'right' });

        pageCount++;
      }

      // Page de garde
      pdf.insertPage(1);
      pdf.setPage(1);
      
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Rapport de Visualisations', pdfWidth / 2, 60, { align: 'center' });
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Généré par AgoraFlux', pdfWidth / 2, 80, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.text(`${new Date().toLocaleDateString('fr-FR')}`, pdfWidth / 2, 100, { align: 'center' });
      
      // Table des matières
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Table des matières', 20, 140);
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      charts.forEach((chart, index) => {
        pdf.text(`${index + 1}. ${chart.title}`, 25, 160 + (index * 10));
        pdf.text(`Page ${index + 2}`, pdfWidth - 30, 160 + (index * 10));
      });

      const pdfBlob = pdf.output('blob');
      saveAs(pdfBlob, fileName);

      const result: ExportResult = {
        success: true,
        fileName,
        fileSize: pdfBlob.size
      };

      this.notifyResult({
        id: Date.now().toString(),
        type: 'success',
        title: 'PDF combiné généré',
        message: `Rapport de ${charts.length} visualisations créé (${this.formatFileSize(pdfBlob.size)})`,
        timestamp: new Date(),
        autoHide: true,
        duration: 5000
      });

      return [result];

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      return [{
        success: false,
        fileName,
        error: errorMessage
      }];
    }
  }

  private async createZipArchive(results: ExportResult[], fileName: string): Promise<ExportResult[]> {
    try {
      const zip = new JSZip();
      
      // Note: Cette implémentation nécessiterait de stocker les fichiers temporairement
      // Pour une version simplifiée, on retourne les résultats individuels
      
      this.notifyResult({
        id: Date.now().toString(),
        type: 'info',
        title: 'Archive ZIP',
        message: 'Fonction d\'archivage en développement. Fichiers exportés individuellement.',
        timestamp: new Date(),
        autoHide: true,
        duration: 3000
      });

      return results;
    } catch (error) {
      return results;
    }
  }
}

// Instance singleton
export const exportService = ExportService.getInstance(); 