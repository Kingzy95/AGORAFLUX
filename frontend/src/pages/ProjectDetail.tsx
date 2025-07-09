import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import { Project } from '../types/project';

// Interface pour les commentaires (à conserver temporairement pour l'UI)
interface Comment {
  id: string;
  content: string;
  author: {
    name: string;
    avatar: string;
  };
  timestamp: Date;
  replies: Comment[];
  category: 'question' | 'suggestion' | 'réponse' | 'préoccupation';
  likes: number;
  isLiked: boolean;
}

// Interface pour les datasets
interface Dataset {
  id: number;
  name: string;
  description?: string;
  type: string;
  status: string;
  file_size?: number;
  rows_count?: number;
  columns_count?: number;
  overall_quality_score?: number;
  created_at: string;
  uploaded_by?: {
    first_name: string;
    last_name: string;
  };
}

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  // États
  const [project, setProject] = useState<Project | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'data' | 'team'>('overview');

  // Charger les données du projet depuis l'API
  useEffect(() => {
    const loadProjectData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Charger le projet
        const projectResponse = await apiService.getProject(parseInt(id));
        setProject(projectResponse);
        
        // Charger les datasets du projet
        const datasetsResponse = await apiService.getDatasets(parseInt(id));
        setDatasets(datasetsResponse || []);
        
        // Charger les commentaires du projet (API à implémenter)
        // Pour l'instant, liste vide en attendant l'implémentation de l'API des commentaires
        setComments([]);
        
      } catch (err: any) {
        console.error('Erreur lors du chargement du projet:', err);
        setError(err.response?.data?.detail || 'Erreur lors du chargement du projet');
      } finally {
        setIsLoading(false);
      }
    };

    loadProjectData();
  }, [id]);

  // Fonctions utilitaires
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Inconnue';
    
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  };

  const getQualityColor = (score?: number) => {
    if (!score) return 'bg-gray-100 text-gray-800';
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // Gestion des commentaires (temporaire)
  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      content: newComment,
      author: {
        name: user ? `${user.first_name} ${user.last_name}` : 'Utilisateur',
        avatar: user ? `${user.first_name[0]}${user.last_name[0]}` : 'U'
      },
      timestamp: new Date(),
      replies: [],
      category: 'question',
      likes: 0,
      isLiked: false
    };

    setComments([comment, ...comments]);
    setNewComment('');
  };

  const toggleLike = (commentId: string) => {
    setComments(comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          isLiked: !comment.isLiked,
          likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1
        };
      }
      return comment;
    }));
  };

  if (isLoading) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement du projet...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-destructive">
            <span className="material-icons text-6xl">error_outline</span>
          </div>
          <h2 className="text-xl font-semibold mb-2">Erreur de chargement</h2>
          <p className="text-muted-foreground mb-4">{error || 'Projet introuvable'}</p>
          <button 
            onClick={() => navigate('/projects')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Retour aux projets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background">
      <div className="p-6 space-y-6">{/* En-tête du projet */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <span className="material-icons text-primary">folder_open</span>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                  {getStatusText(project.status)}
                </span>
              </div>
              
              <h1 className="text-3xl font-bold tracking-tight mb-2">{project.title}</h1>
              <p className="text-muted-foreground text-lg">{project.description}</p>
              
              {/* Tags */}
              {project.tags && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {project.tags.split(',').map((tag, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground"
                    >
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-card border rounded-lg hover:shadow-md transition-all">
                <span className="material-icons text-sm">favorite_border</span>
                Suivre le projet
              </button>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all">
                <span className="material-icons text-sm">group_add</span>
                Participer
              </button>
            </div>
          </div>

          {/* Informations du propriétaire et métadonnées */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            {project.owner && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-medium">
                  {project.owner.first_name[0]}{project.owner.last_name[0]}
                </div>
                <span>Créé par {project.owner.first_name} {project.owner.last_name}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <span className="material-icons text-xs">schedule</span>
              <span>Créé le {new Date(project.created_at).toLocaleDateString('fr-FR')}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="material-icons text-xs">visibility</span>
              <span>{project.view_count} vues</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="material-icons text-xs">people</span>
              <span>{project.contributor_count} contributeurs</span>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Navigation des onglets */}
          <div className="border-b border-slate-200 mb-8">
            <nav className="flex space-x-8">
              {[
                { id: 'overview', label: 'Aperçu', icon: 'info' },
                { id: 'data', label: 'Données', icon: 'dataset' },
                { id: 'team', label: 'Équipe', icon: 'people' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="material-icons text-sm">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Contenu des onglets */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contenu principal */}
            <div className="lg:col-span-2">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Objectifs */}
                  {project.objectives && (
                    <div className="bg-white rounded-lg border border-slate-200 p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-3">Objectifs</h3>
                      <p className="text-slate-700 whitespace-pre-wrap">{project.objectives}</p>
                    </div>
                  )}

                  {/* Méthodologie */}
                  {project.methodology && (
                    <div className="bg-white rounded-lg border border-slate-200 p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-3">Méthodologie</h3>
                      <p className="text-slate-700 whitespace-pre-wrap">{project.methodology}</p>
                    </div>
                  )}

                  {/* Résultats attendus */}
                  {project.expected_outcomes && (
                    <div className="bg-white rounded-lg border border-slate-200 p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-3">Résultats attendus</h3>
                      <p className="text-slate-700 whitespace-pre-wrap">{project.expected_outcomes}</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'data' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-900">Datasets du projet</h3>
                      <span className="text-sm text-slate-500">{datasets.length} dataset{datasets.length !== 1 ? 's' : ''}</span>
                    </div>

                    {datasets.length === 0 ? (
                      <div className="text-center py-8">
                        <span className="material-icons text-4xl text-slate-300 mb-2">dataset</span>
                        <p className="text-slate-500">Aucun dataset disponible pour ce projet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {datasets.map(dataset => (
                          <div key={dataset.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-slate-900 mb-1">{dataset.name}</h4>
                                {dataset.description && (
                                  <p className="text-sm text-slate-600 mb-2">{dataset.description}</p>
                                )}
                                
                                <div className="flex items-center gap-4 text-xs text-slate-500">
                                  <span className="capitalize">{dataset.type}</span>
                                  <span>{formatFileSize(dataset.file_size)}</span>
                                  {dataset.rows_count && (
                                    <span>{dataset.rows_count.toLocaleString()} lignes</span>
                                  )}
                                  {dataset.columns_count && (
                                    <span>{dataset.columns_count} colonnes</span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {dataset.overall_quality_score && (
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getQualityColor(dataset.overall_quality_score)}`}>
                                    {Math.round(dataset.overall_quality_score)}% qualité
                                  </span>
                                )}
                                
                                <button className="p-1 hover:bg-slate-200 rounded">
                                  <span className="material-icons text-sm text-slate-600">download</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'team' && (
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Équipe du projet</h3>
                  
                  {/* Propriétaire */}
                  {project.owner && (
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg mb-4">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                        {project.owner.first_name[0]}{project.owner.last_name[0]}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">
                          {project.owner.first_name} {project.owner.last_name}
                        </div>
                        <div className="text-sm text-blue-600">Propriétaire du projet</div>
                      </div>
                    </div>
                  )}

                  <div className="text-center py-4">
                    <span className="material-icons text-3xl text-slate-300 mb-2">people</span>
                    <p className="text-slate-500">Liste des contributeurs en cours de développement</p>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Tags */}
              {project.tags && (
                <div className="bg-white rounded-lg border border-slate-200 p-4">
                  <h4 className="font-medium text-slate-900 mb-3">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.split(',').map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Commentaires */}
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <h4 className="font-medium text-slate-900 mb-4">Discussion</h4>
                
                {/* Formulaire d'ajout de commentaire */}
                {isAuthenticated && (
                  <div className="mb-4">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Ajoutez votre commentaire..."
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      rows={3}
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={handleAddComment}
                        disabled={!newComment.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Publier
                      </button>
                    </div>
                  </div>
                )}

                {/* Liste des commentaires */}
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {comments.map(comment => (
                    <div key={comment.id} className="border-b border-slate-100 pb-4 last:border-b-0">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                          {comment.author.avatar}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-slate-900">{comment.author.name}</span>
                            <span className="text-xs text-slate-500">
                              {comment.timestamp.toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 mb-2">{comment.content}</p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleLike(comment.id)}
                              className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
                                comment.isLiked ? 'text-blue-600 bg-blue-50' : 'text-slate-500 hover:bg-slate-100'
                              }`}
                            >
                              <span className="material-icons text-xs">thumb_up</span>
                              {comment.likes}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail; 