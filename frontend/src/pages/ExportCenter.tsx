import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import { Project } from '../types/project';

const ExportCenter: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleExport = (project: Project, format: string) => {
    // Export simple
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
    link.download = `${project.slug}.${format === 'json' ? 'json' : 'txt'}`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Centre d'Export</h1>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Centre d'Export</h1>
        
        <div className="bg-white rounded-lg border border-border shadow-sm">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold">Exporter vos projets</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Exportez les données de vos projets au format JSON ou texte
            </p>
          </div>

          <div className="divide-y divide-border">
            {projects.map((project) => (
              <div key={project.id} className="p-4 hover:bg-muted/50">
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
                      onClick={() => handleExport(project, 'json')}
                      className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      JSON
                    </button>
                    <button
                      onClick={() => handleExport(project, 'txt')}
                      className="px-3 py-1.5 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      TXT
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {projects.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <p>Aucun projet à exporter</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportCenter; 