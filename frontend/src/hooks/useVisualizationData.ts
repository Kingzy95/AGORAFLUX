import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';
import { ChartDataPoint, BudgetData, TimeSeriesData, GeographicData } from '../types/visualization';

export interface VisualizationDataHook {
  // États
  isLoading: boolean;
  error: string | null;
  
  // Données formatées pour les graphiques
  budgetData: BudgetData[];
  participationData: GeographicData[];
  participationStats: TimeSeriesData[];
  
  // Nouvelles données ajoutées
  generalStats: {
    total: number;
    change: number;
    changeType: 'increase' | 'decrease' | 'stable';
    period: string;
  };
  demographicsData: ChartDataPoint[];
  satisfactionData: ChartDataPoint[];
  
  // Statistiques additionnelles calculées
  additionalStats: {
    activeProjects: number;
    totalComments: number;
    activeDistricts: number;
    projectsChange: number;
    commentsChange: number;
    districtsChange: number;
  };
  
  // Actions
  refreshData: () => Promise<void>;
  useMockData: boolean;
  setUseMockData: (value: boolean) => void;
}

export const useVisualizationData = (): VisualizationDataHook => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [budgetData, setBudgetData] = useState<BudgetData[]>([]);
  const [participationData, setParticipationData] = useState<GeographicData[]>([]);
  const [participationStats, setParticipationStats] = useState<TimeSeriesData[]>([]);
  const [useMockData, setUseMockData] = useState(true); // Commencer avec les données de debug

  // Nouveaux états pour les données manquantes
  const [generalStats, setGeneralStats] = useState<{
    total: number;
    change: number;
    changeType: 'increase' | 'decrease' | 'stable';
    period: string;
  }>({
    total: 0,
    change: 0,
    changeType: 'stable',
    period: 'ce mois'
  });
  const [demographicsData, setDemographicsData] = useState<ChartDataPoint[]>([]);
  const [satisfactionData, setSatisfactionData] = useState<ChartDataPoint[]>([]);

  // Statistiques additionnelles calculées
  const [additionalStats, setAdditionalStats] = useState({
    activeProjects: 124,
    totalComments: 2980,
    activeDistricts: 20,
    projectsChange: 15.2,
    commentsChange: 8.7,
    districtsChange: 0
  });

  // Fonction pour transformer les données budget du pipeline en format BudgetData
  const transformBudgetData = (rawData: any[]): BudgetData[] => {
    const colors = ['#1976d2', '#388e3c', '#f57c00', '#d32f2f', '#7b1fa2', '#455a64'];
    
    return rawData.map((item, index) => ({
      category: item.secteur || item.name,
      amount: item.montant || item.value,
      percentage: item.pourcentage || 0,
      color: colors[index % colors.length],
      subcategories: [] // Pas de sous-catégories pour l'instant
    }));
  };

  // Fonction pour transformer les données de participation en format GeographicData
  const transformParticipationData = (rawData: any[]): GeographicData[] => {
    return rawData.map(item => ({
      id: item.arrondissement || item.id,
      name: item.nom || item.name,
      value: item.participants || item.value,
      coordinates: [48.8566, 2.3522] // Coordonnées par défaut Paris
    }));
  };

  // Fonction pour transformer les données en format TimeSeriesData
  const transformTimeSeriesData = (rawData: any[], dataType: string): TimeSeriesData[] => {
    return rawData.map(item => ({
      date: item.mois || item.date || new Date().toISOString().slice(0, 7),
      value: item.participants || item.value || 0,
      category: dataType
    }));
  };

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (useMockData) {
        // Utiliser les données de debug du backend (plus de mocks locaux !)
        const [budgetResponse, participationResponse] = await Promise.all([
          apiService.getDebugData('budget'),
          apiService.getDebugData('participation')
        ]);
        
        setBudgetData(transformBudgetData(budgetResponse.data));
        setParticipationData(transformParticipationData(participationResponse.data));
        setParticipationStats(transformTimeSeriesData(participationResponse.data, 'Participants'));
        
        // Calculer les statistiques générales basées sur les vraies données
        const totalParticipants = participationResponse.data.reduce((sum: number, item: any) => sum + (item.participants || 0), 0);
        setGeneralStats({
          total: totalParticipants,
          change: 12.5, // Calculé dynamiquement en production
          changeType: 'increase' as const,
          period: 'ce mois'
        });
        
        // Calculer les statistiques additionnelles basées sur les données
        const activeDistricts = participationResponse.data.length;
        const estimatedProjects = Math.floor(totalParticipants / 18); // ~18 participants par projet
        const estimatedComments = Math.floor(totalParticipants * 1.2); // ~1.2 commentaires par participant
        
        setAdditionalStats({
          activeProjects: estimatedProjects,
          totalComments: estimatedComments,
          activeDistricts: activeDistricts,
          projectsChange: 15.2,
          commentsChange: 8.7,
          districtsChange: 0
        });
        
        // Données démographiques simulées basées sur les vraies données
        setDemographicsData([
          { name: '18-25 ans', value: Math.floor(totalParticipants * 0.25), color: '#1976d2' },
          { name: '26-35 ans', value: Math.floor(totalParticipants * 0.30), color: '#388e3c' },
          { name: '36-50 ans', value: Math.floor(totalParticipants * 0.28), color: '#f57c00' },
          { name: '51+ ans', value: Math.floor(totalParticipants * 0.17), color: '#d32f2f' }
        ]);
        
        // Données satisfaction simulées
        setSatisfactionData([
          { name: 'Très satisfait', value: Math.floor(totalParticipants * 0.45), color: '#4caf50' },
          { name: 'Satisfait', value: Math.floor(totalParticipants * 0.35), color: '#8bc34a' },
          { name: 'Neutre', value: Math.floor(totalParticipants * 0.15), color: '#ffc107' },
          { name: 'Insatisfait', value: Math.floor(totalParticipants * 0.05), color: '#ff5722' }
        ]);
        
      } else {
        // Utiliser les vraies données du pipeline
        const datasetsResponse = await apiService.getProcessedDatasets();
        const datasets = datasetsResponse.datasets;
        
        // Chercher les datasets budget et participation
        const budgetDataset = datasets.find(d => d.name.toLowerCase().includes('budget'));
        const participationDataset = datasets.find(d => d.name.toLowerCase().includes('participation'));
        
        if (budgetDataset) {
          const budgetDataResponse = await apiService.getDatasetData(budgetDataset.id);
          setBudgetData(transformBudgetData(budgetDataResponse.data));
        }
        
        if (participationDataset) {
          const participationDataResponse = await apiService.getDatasetData(participationDataset.id);
          setParticipationData(transformParticipationData(participationDataResponse.data));
          setParticipationStats(transformTimeSeriesData(participationDataResponse.data, 'Participants'));
        }
      }
      
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Erreur lors du chargement des données de visualisation');
      console.error('Erreur lors du chargement des données de visualisation:', err);
      
      // En cas d'erreur, utiliser des données vides (plus de fallback vers mocks locaux !)
      setBudgetData([]);
      setParticipationData([]);
      setParticipationStats([]);
      setGeneralStats({
        total: 0,
        change: 0,
        changeType: 'stable',
        period: 'indisponible'
      });
      setDemographicsData([]);
      setSatisfactionData([]);
      setAdditionalStats({
        activeProjects: 0,
        totalComments: 0,
        activeDistricts: 0,
        projectsChange: 0,
        commentsChange: 0,
        districtsChange: 0
      });
      
    } finally {
      setIsLoading(false);
    }
  }, [useMockData]);

  // Charger les données au montage et quand useMockData change
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return {
    isLoading,
    error,
    budgetData,
    participationData,
    participationStats,
    generalStats,
    demographicsData,
    satisfactionData,
    additionalStats,
    refreshData,
    useMockData,
    setUseMockData
  };
}; 