import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import { Project, Dataset } from '../types/project';

const ExportCenter: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await apiService.getProjects({});
      setProjects(response.projects || []);
    } catch (error) {
      console.error('Erreur lors du chargement des projets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDatasets = async (project: Project) => {
    try {
      setSelectedProject(project);
      const response = await apiService.getDatasets(project.id);
      setDatasets(response || []);
    } catch (error) {
      console.error('Erreur lors du chargement des datasets:', error);
      setDatasets([]);
    }
  };

  const handleExportProject = (project: Project, format: string) => {
    // Export des métadonnées du projet
    const data = {
      id: project.id,
      title: project.title,
      description: project.description,
      tags: project.tags,
      created_at: project.created_at,
      view_count: project.view_count,
      datasets_count: project.datasets_count
    };

    const dataStr = format === 'json' 
      ? JSON.stringify(data, null, 2)
      : `Projet: ${project.title}\nDescription: ${project.description}\nTags: ${project.tags}\nCréé le: ${project.created_at}`;
    
    const dataBlob = new Blob([dataStr], { type: format === 'json' ? 'application/json' : 'text/plain' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.slug}-metadata.${format === 'json' ? 'json' : 'txt'}`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  const handleExportDataset = async (dataset: Dataset, format: string) => {
    setExportLoading(`${dataset.id}-${format}`);
    
    try {
      // Récupérer les vraies données du dataset
      const response = await apiService.getDatasetData(dataset.id, 10000); // Limite haute pour export complet
      const realData = response.data || [];
      
      let dataStr: string;
      let mimeType: string;
      let fileExtension: string;
      
      switch (format) {
        case 'json':
          dataStr = JSON.stringify({
            dataset_info: {
              id: dataset.id,
              name: dataset.name,
              type: dataset.type,
              total_records: response.total_records || realData.length,
              quality_score: dataset.overall_quality_score,
              exported_at: new Date().toISOString()
            },
            data: realData
          }, null, 2);
          mimeType = 'application/json';
          fileExtension = 'json';
          break;
          
        case 'csv':
          if (realData.length === 0) {
            dataStr = 'Aucune donnée disponible';
          } else {
            // Convertir en CSV
            const headers = Object.keys(realData[0]);
            const csvRows = [
              headers.join(','),
              ...realData.map(row => 
                headers.map(header => {
                  const value = row[header];
                  // Échapper les valeurs contenant des virgules ou des guillemets
                  if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                  }
                  return value || '';
                }).join(',')
              )
            ];
            dataStr = csvRows.join('\n');
          }
          mimeType = 'text/csv';
          fileExtension = 'csv';
          break;
          
        case 'txt':
          dataStr = `Dataset: ${dataset.name}\n`;
          dataStr += `Type: ${dataset.type}\n`;
          dataStr += `Nombre d'enregistrements: ${response.total_records || realData.length}\n`;
          dataStr += `Qualité: ${dataset.overall_quality_score || 0}%\n`;
          dataStr += `Exporté le: ${new Date().toLocaleString('fr-FR')}\n\n`;
          dataStr += `=== DONNÉES ===\n\n`;
          
          if (realData.length === 0) {
            dataStr += 'Aucune donnée disponible';
          } else {
            realData.forEach((row, index) => {
              dataStr += `--- Enregistrement ${index + 1} ---\n`;
              Object.entries(row).forEach(([key, value]) => {
                dataStr += `${key}: ${value}\n`;
              });
              dataStr += '\n';
            });
          }
          mimeType = 'text/plain';
          fileExtension = 'txt';
          break;
          
        default:
          throw new Error(`Format non supporté: ${format}`);
      }
      
      const dataBlob = new Blob([dataStr], { type: mimeType });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${dataset.name.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExtension}`;
      link.click();
      
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      alert('Erreur lors de l\'export des données');
    } finally {
      setExportLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Centre d'Export</h1>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Centre d'Export</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Liste des projets */}
          <div className="bg-white rounded-lg border border-border shadow-sm">
            <div className="p-4 border-b border-border">
              <h2 className="text-lg font-semibold">Projets Disponibles</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Cliquez sur un projet pour voir ses datasets
              </p>
            </div>

            <div className="divide-y divide-border max-h-96 overflow-y-auto">
              {projects.map((project) => (
                <div 
                  key={project.id} 
                  className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                    selectedProject?.id === project.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => loadDatasets(project)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{project.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {project.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{project.datasets_count} datasets</span>
                        <span>{project.view_count} vues</span>
                        <span>{new Date(project.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportProject(project, 'json');
                        }}
                        className="px-3 py-1.5 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                        title="Exporter les métadonnées du projet"
                      >
                        Métadonnées JSON
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {projects.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  <p>Aucun projet disponible</p>
                </div>
              )}
            </div>
          </div>

          {/* Datasets du projet sélectionné */}
          <div className="bg-white rounded-lg border border-border shadow-sm">
            <div className="p-4 border-b border-border">
              <h2 className="text-lg font-semibold">
                {selectedProject ? `Datasets - ${selectedProject.title}` : 'Datasets'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedProject 
                  ? 'Exportez les données complètes de chaque dataset'
                  : 'Sélectionnez un projet pour voir ses datasets'
                }
              </p>
            </div>

            <div className="divide-y divide-border max-h-96 overflow-y-auto">
              {datasets.map((dataset) => (
                <div key={dataset.id} className="p-4 hover:bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{dataset.name}</h3>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                          {dataset.type}
                        </span>
                        <span>{dataset.rows_count || 0} lignes</span>
                        <span>{dataset.columns_count || 0} colonnes</span>
                        <span>{Math.round(dataset.overall_quality_score || 0)}% qualité</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleExportDataset(dataset, 'json')}
                        disabled={exportLoading === `${dataset.id}-json`}
                        className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        title="Exporter les données en JSON"
                      >
                        {exportLoading === `${dataset.id}-json` ? '...' : 'JSON'}
                      </button>
                      <button
                        onClick={() => handleExportDataset(dataset, 'csv')}
                        disabled={exportLoading === `${dataset.id}-csv`}
                        className="px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                        title="Exporter les données en CSV"
                      >
                        {exportLoading === `${dataset.id}-csv` ? '...' : 'CSV'}
                      </button>
                      <button
                        onClick={() => handleExportDataset(dataset, 'txt')}
                        disabled={exportLoading === `${dataset.id}-txt`}
                        className="px-3 py-1.5 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                        title="Exporter les données en texte"
                      >
                        {exportLoading === `${dataset.id}-txt` ? '...' : 'TXT'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {selectedProject && datasets.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  <p>Aucun dataset dans ce projet</p>
                </div>
              )}
              
              {!selectedProject && (
                <div className="p-8 text-center text-muted-foreground">
                  <p>Sélectionnez un projet à gauche pour voir ses datasets</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Légende */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Comment ça marche ?</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• <strong>Métadonnées JSON</strong> : Informations sur le projet (titre, description, etc.)</p>
            <p>• <strong>JSON</strong> : Données complètes du dataset avec métadonnées</p>
            <p>• <strong>CSV</strong> : Données tabulaires pour Excel/LibreOffice</p>
            <p>• <strong>TXT</strong> : Données lisibles en texte brut</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportCenter; 