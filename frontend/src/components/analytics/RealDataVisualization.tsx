import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';

interface RealDataVisualizationProps {
  className?: string;
}

interface DatasetInfo {
  id: number;
  name: string;
  data_type: string;
  total_records: number;
  quality_score: number;
  created_at: string;
  status: string;
  sample_data?: any[];
}

const RealDataVisualization: React.FC<RealDataVisualizationProps> = ({ className = '' }) => {
  const [datasets, setDatasets] = useState<DatasetInfo[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<DatasetInfo | null>(null);
  const [datasetData, setDatasetData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    try {
      setLoading(true);
      const response = await apiService.getProcessedDatasets();
      
      // Les données de l'API correspondent maintenant à notre interface
      setDatasets(response.datasets || []);
      
      // Sélectionner automatiquement le premier dataset s'il existe
      if (response.datasets && response.datasets.length > 0) {
        loadDatasetData(response.datasets[0]);
      }
    } catch (err: any) {
      setError('Erreur lors du chargement des datasets');
      console.error('Erreur datasets:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDatasetData = async (dataset: DatasetInfo) => {
    try {
      setSelectedDataset(dataset);
      const response = await apiService.getDatasetData(dataset.id, 50);
      setDatasetData(response.data || []);
    } catch (err: any) {
      console.error('Erreur données dataset:', err);
      setDatasetData([]);
    }
  };

  const getDataTypeIcon = (type: string | undefined) => {
    if (!type) {
      return '📈';
    }
    
    switch (type.toLowerCase()) {
      case 'transport':
        return '🚲';
      case 'energy':
        return '⚡';
      case 'general':
        return '📊';
      default:
        return '📈';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderDataPreview = () => {
    if (!datasetData.length) {
      return (
        <div className="text-center py-8 text-gray-500">
          <span className="material-icons text-4xl mb-2 block">database</span>
          <p>Aucune donnée disponible</p>
        </div>
      );
    }

    // Prendre les premières colonnes significatives
    const sampleRow = datasetData[0];
    const keys = Object.keys(sampleRow).slice(0, 5); // Première 5 colonnes

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {keys.map((key, idx) => (
                <th
                  key={idx}
                  className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {key.length > 15 ? key.substring(0, 15) + '...' : key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {datasetData.slice(0, 10).map((row, rowIdx) => (
              <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {keys.map((key, colIdx) => (
                  <td key={colIdx} className="px-3 py-2 text-sm text-gray-900">
                    {String(row[key] || '').length > 20 
                      ? String(row[key]).substring(0, 20) + '...' 
                      : String(row[key] || '-')
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        
        {datasetData.length > 10 && (
          <div className="text-center py-2 text-sm text-gray-500 bg-gray-50">
            ... et {datasetData.length - 10} autres enregistrements
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="text-center py-8">
          <span className="material-icons text-red-500 text-4xl mb-2 block">error</span>
          <p className="text-red-600">{error}</p>
          <button
            onClick={loadDatasets}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* En-tête */}
      <div className="border-b p-6">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <span className="material-icons text-green-500">verified_user</span>
          Données Réelles du Pipeline
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {datasets.length} dataset{datasets.length > 1 ? 's' : ''} traité{datasets.length > 1 ? 's' : ''} 
          {datasets.length > 0 && ` • ${datasets.reduce((sum, d) => sum + d.total_records, 0)} enregistrements total`}
        </p>
      </div>

      {/* Sélecteur de datasets */}
      {datasets.length > 0 && (
        <div className="p-4 border-b bg-gray-50">
          <div className="flex flex-wrap gap-2">
            {datasets.map((dataset) => (
              <button
                key={dataset.id}
                onClick={() => loadDatasetData(dataset)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedDataset?.id === dataset.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 border hover:bg-gray-100'
                }`}
              >
                <span className="mr-1">{getDataTypeIcon(dataset.data_type)}</span>
                {dataset.name}
                <span className="ml-2 text-xs opacity-75">
                  ({dataset.total_records} lignes)
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Informations sur le dataset sélectionné */}
      {selectedDataset && (
        <div className="p-4 border-b">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {selectedDataset.total_records}
              </div>
              <div className="text-xs text-gray-500">Enregistrements</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(selectedDataset.quality_score)}%
              </div>
              <div className="text-xs text-gray-500">Qualité</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {selectedDataset.data_type}
              </div>
              <div className="text-xs text-gray-500">Type</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-gray-600">
                {formatDate(selectedDataset.created_at)}
              </div>
              <div className="text-xs text-gray-500">Dernière MAJ</div>
            </div>
          </div>
        </div>
      )}

      {/* Prévisualisation des données */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900">
            Aperçu des données{selectedDataset && ` - ${selectedDataset.name}`}
          </h4>
          {datasetData.length > 0 && (
            <span className="text-sm text-gray-500">
              {datasetData.length} lignes affichées
            </span>
          )}
        </div>
        
        {renderDataPreview()}
      </div>

      {/* Indicateur de données réelles */}
      <div className="p-4 bg-green-50 border-t">
        <div className="flex items-center gap-2 text-green-800">
          <span className="material-icons text-sm">check_circle</span>
          <span className="text-sm font-medium">
            ✅ Ces données proviennent directement des APIs publiques françaises (OpenData Paris)
          </span>
        </div>
      </div>
    </div>
  );
};

export default RealDataVisualization; 