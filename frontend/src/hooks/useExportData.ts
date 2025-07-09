import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';
import { 
  ExportHistory, 
  ExportStatistics, 
  ExportNotification 
} from '../types/export';

export interface UseExportDataHook {
  // États
  isLoading: boolean;
  error: string | null;
  
  // Données
  exportHistory: ExportHistory[];
  statistics: ExportStatistics | null;
  notifications: ExportNotification[];
  
  // Actions
  refreshData: () => Promise<void>;
  createExport: (exportData: {
    chart_id: string;
    chart_title: string;
    format: string;
    file_name: string;
    file_size: number;
  }) => Promise<void>;
  deleteExport: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
}

export const useExportData = (): UseExportDataHook => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportHistory, setExportHistory] = useState<ExportHistory[]>([]);
  const [statistics, setStatistics] = useState<ExportStatistics | null>(null);
  const [notifications, setNotifications] = useState<ExportNotification[]>([]);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Charger l'historique des exports
      const historyData = await apiService.getExportHistory({ limit: 50 });
      setExportHistory(historyData || []);
      
      // Charger les statistiques
      const statsData = await apiService.getExportStatistics();
      setStatistics(statsData || null);
      
      // Charger les notifications
      const notificationsData = await apiService.getExportNotifications(10);
      setNotifications(notificationsData || []);
      
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Erreur lors du chargement des données d\'export');
      console.error('Erreur lors du chargement des données d\'export:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createExport = useCallback(async (exportData: {
    chart_id: string;
    chart_title: string;
    format: string;
    file_name: string;
    file_size: number;
  }) => {
    try {
      await apiService.createExport(exportData);
      // Rafraîchir les données après création
      await refreshData();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Erreur lors de la création de l\'export');
      console.error('Erreur lors de la création de l\'export:', err);
      throw err;
    }
  }, [refreshData]);

  const deleteExport = useCallback(async (id: string) => {
    try {
      await apiService.deleteExport(id);
      // Rafraîchir les données après suppression
      await refreshData();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Erreur lors de la suppression de l\'export');
      console.error('Erreur lors de la suppression de l\'export:', err);
      throw err;
    }
  }, [refreshData]);

  const clearHistory = useCallback(async () => {
    try {
      await apiService.clearExportHistory();
      // Rafraîchir les données après suppression
      await refreshData();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Erreur lors de la suppression de l\'historique');
      console.error('Erreur lors de la suppression de l\'historique:', err);
      throw err;
    }
  }, [refreshData]);

  // Charger les données au montage
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return {
    isLoading,
    error,
    exportHistory,
    statistics,
    notifications,
    refreshData,
    createExport,
    deleteExport,
    clearHistory
  };
}; 