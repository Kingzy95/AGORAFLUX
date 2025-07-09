import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import { Project } from '../types/project';
import { Button } from '../components/ui';
import { Plus, Search, Filter, FolderOpen, Users, Eye, Database, MoreVertical } from 'lucide-react';

const Projects: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  // États
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'active'>('recent');

  // Charger les projets depuis l'API
  useEffect(() => {
    const loadProjects = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await apiService.getProjects({
          page: 1,
          per_page: 50,
          status: selectedStatus !== 'all' ? selectedStatus : undefined,
          search: searchTerm || undefined
        });
        
        setProjects(response.projects);
      } catch (err: any) {
        console.error('Erreur lors du chargement des projets:', err);
        setError(err.response?.data?.detail || 'Erreur lors du chargement des projets');
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, [selectedStatus, searchTerm]);

  // Filtrage et tri des projets côté frontend
  const filteredProjects = projects
    .filter(project => {
      const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (project.tags && project.tags.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Extraction de catégorie depuis les tags (approximation)
      const projectCategory = project.tags ? project.tags.split(',')[0].trim() : 'Général';
      const matchesCategory = selectedCategory === 'all' || projectCategory.toLowerCase().includes(selectedCategory.toLowerCase());
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.view_count - a.view_count;
        case 'active':
          return b.contributor_count - a.contributor_count;
        case 'recent':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  // Extraction des catégories depuis les tags des projets
  const categories = ['all', ...Array.from(new Set(
    projects
      .filter(p => p.tags)
      .map(p => p.tags!.split(',')[0].trim())
      .filter(Boolean)
  ))];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'Actif';
      case 'draft': return 'Brouillon';
      case 'completed': return 'Terminé';
      case 'archived': return 'Archivé';
      default: return status;
    }
  };

  const getCategoryIcon = (category: string) => {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory.includes('budget')) return 'account_balance';
    if (lowerCategory.includes('transport')) return 'directions_transit';
    if (lowerCategory.includes('environnement')) return 'eco';
    if (lowerCategory.includes('éducation') || lowerCategory.includes('education')) return 'school';
    if (lowerCategory.includes('social')) return 'people';
    if (lowerCategory.includes('économie') || lowerCategory.includes('economie')) return 'trending_up';
    return 'folder';
  };

  if (isLoading) {
    return (
      <div className="h-full bg-background">
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div>
              <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card rounded-lg border p-6 space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-full"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                  <div className="flex items-center gap-2">
                    <div className="h-6 bg-muted rounded w-16"></div>
                    <div className="h-6 bg-muted rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-destructive">
            <Search className="w-16 h-16" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Erreur de chargement</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background">
      <div className="p-6 space-y-6">
        {/* En-tête de page */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Projets Collaboratifs</h1>
            <p className="text-muted-foreground mt-1">
              Explorez et participez aux projets de collaboration citoyenne
            </p>
          </div>
          {isAuthenticated && (
            <Button 
              onClick={() => navigate('/projects/new')}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Créer un projet
            </Button>
          )}
        </div>

        {/* Barre de recherche et filtres */}
        <div className="space-y-4">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher des projets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-input rounded-lg bg-background focus:ring-2 focus:ring-ring focus:border-ring"
            />
          </div>

          {/* Filtres */}
          <div className="flex flex-wrap gap-4">
            {/* Catégories */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-input rounded-lg bg-background focus:ring-2 focus:ring-ring focus:border-ring"
            >
              <option value="all">Toutes les catégories</option>
              {categories.slice(1).map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            {/* Statuts */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-input rounded-lg bg-background focus:ring-2 focus:ring-ring focus:border-ring"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="draft">Brouillon</option>
              <option value="completed">Terminé</option>
              <option value="archived">Archivé</option>
            </select>

            {/* Tri */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-input rounded-lg bg-background focus:ring-2 focus:ring-ring focus:border-ring"
            >
              <option value="recent">Plus récents</option>
              <option value="popular">Plus populaires</option>
              <option value="active">Plus actifs</option>
            </select>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FolderOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{projects.length}</div>
                <div className="text-sm text-muted-foreground">Projets disponibles</div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {projects.reduce((sum, p) => sum + (p.contributor_count || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground">Contributeurs actifs</div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Database className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {projects.reduce((sum, p) => sum + (p.datasets_count || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground">Datasets partagés</div>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des projets */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 text-muted-foreground">
              <Search className="w-16 h-16" />
            </div>
            <h3 className="text-lg font-medium mb-2">Aucun projet trouvé</h3>
            <p className="text-muted-foreground">Essayez de modifier vos critères de recherche</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map(project => {
              const projectCategory = project.tags ? project.tags.split(',')[0].trim() : 'Général';
              
              return (
                <div
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="bg-card rounded-lg border p-6 hover:shadow-lg transition-all duration-200 cursor-pointer hover:-translate-y-1"
                >
                  {/* Header de la carte */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <FolderOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                          {getStatusText(project.status)}
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Contenu */}
                  <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                    {project.title}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                    {project.description}
                  </p>

                  {/* Tags */}
                  {project.tags && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {project.tags.split(',').slice(0, 3).map((tag, index) => (
                        <span 
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                      {project.tags.split(',').length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">
                          +{project.tags.split(',').length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Métadonnées */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{project.contributor_count || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span>{project.view_count || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Database className="h-3 w-3" />
                        <span>{project.datasets_count || 0}</span>
                      </div>
                    </div>
                    <div className="text-xs">
                      {new Date(project.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>

                  {/* Propriétaire */}
                  {project.owner && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-medium">
                        {project.owner.first_name[0]}{project.owner.last_name[0]}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {project.owner.first_name} {project.owner.last_name}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects; 