import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';

export interface DataPipelineHook {
  // États
  isLoading: boolean;
  error: string | null;
  
  // Données
  sources: any[];
  status: any;
  datasets: any[];
  lastRun: any;
  
  // Actions
  refreshData: () => Promise<void>;
  runPipeline: (useDebugData?: boolean) => Promise<void>;
  getDatasetData: (datasetId: number) => Promise<any>;
}

export const useDataPipeline = (): DataPipelineHook => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sources, setSources] = useState<any[]>([]);
  const [status, setStatus] = useState<any>(null);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [lastRun, setLastRun] = useState<any>(null);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Charger toutes les données en parallèle
      const [sourcesData, statusData, datasetsData] = await Promise.all([
        apiService.getDataSources(),
        apiService.getPipelineStatus(),
        apiService.getProcessedDatasets()
      ]);
      
      setSources(sourcesData.sources || []);
      setStatus(statusData);
      setDatasets(datasetsData.datasets || []);
      
      // Charger la dernière exécution si disponible
      if (statusData.last_run) {
        setLastRun(statusData.last_run);
      } else {
        try {
          const lastRunData = await apiService.getLastPipelineRun();
          setLastRun(lastRunData);
        } catch (err) {
          // Ignorer l'erreur si aucune exécution précédente
          console.log('Aucune exécution précédente trouvée');
        }
      }
      
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Erreur lors du chargement des données');
      console.error('Erreur lors du chargement des données:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const runPipeline = useCallback(async (useDebugData: boolean = true) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await apiService.runPipelineSync(useDebugData);
      console.log('Pipeline exécuté avec succès:', result);
      
      // Actualiser les données après l'exécution
      await refreshData();
      
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Erreur lors de l\'exécution du pipeline');
      console.error('Erreur lors de l\'exécution du pipeline:', err);
    } finally {
      setIsLoading(false);
    }
  }, [refreshData]);

  const getDatasetData = useCallback(async (datasetId: number) => {
    try {
      const data = await apiService.getDatasetData(datasetId);
      return data;
    } catch (err: any) {
      throw new Error(err.response?.data?.detail || err.message || 'Erreur lors du chargement du dataset');
    }
  }, []);

  // Charger les données au montage du composant
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return {
    isLoading,
    error,
    sources,
    status,
    datasets,
    lastRun,
    refreshData,
    runPipeline,
    getDatasetData
  };
}; 