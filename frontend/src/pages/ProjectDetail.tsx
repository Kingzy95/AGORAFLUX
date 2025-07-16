import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService, { BackendComment } from '../services/api';
import { Project, Dataset, CreateCommentRequest } from '../types/project';
import { CommentSection } from '../components/comments';

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const [project, setProject] = useState<Project | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [comments, setComments] = useState<BackendComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // États pour les commentaires
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState<'COMMENT' | 'SUGGESTION' | 'QUESTION' | 'ANSWER'>('COMMENT');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'data' | 'team'>('overview');

  // Chargement des données du projet
  useEffect(() => {
    const loadProject = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const [projectData, datasetsData] = await Promise.all([
          apiService.getProject(parseInt(id)),
          apiService.getDatasets(parseInt(id))
        ]);
        
        setProject(projectData);
        setDatasets(datasetsData);
        
        // Charger les commentaires
        await loadComments();
      } catch (err: any) {
        console.error('Erreur lors du chargement:', err);
        setError(err.response?.data?.detail || 'Erreur lors du chargement du projet');
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [id]);

  const loadComments = async () => {
    if (!id) return;
    
    try {
      const response = await apiService.getComments(parseInt(id));
      setComments(response.comments);
    } catch (err: any) {
      console.error('Erreur lors du chargement des commentaires:', err);
      // Ne pas bloquer l'interface si les commentaires ne se chargent pas
      setComments([]);
    }
  };

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

  const getCommentTypeColor = (type: string) => {
    switch (type) {
      case 'question': return 'bg-blue-100 text-blue-800';
      case 'suggestion': return 'bg-green-100 text-green-800';
      case 'comment': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCommentTypeLabel = (type: string) => {
    switch (type) {
      case 'question': return 'Question';
      case 'suggestion': return 'Suggestion';
      case 'comment': return 'Commentaire';
      default: return 'Commentaire';
    }
  };

  // Gestion des commentaires avec API
  const handleAddComment = async () => {
    if (!newComment.trim() || !user || !id) return;

    setIsSubmittingComment(true);
    
    try {
      const commentData: CreateCommentRequest = {
        content: newComment.trim(),
        type: commentType
      };

      const createdComment = await apiService.createComment(parseInt(id), commentData);
      
      // Ajouter le nouveau commentaire en haut de la liste
      setComments([createdComment, ...comments]);
      setNewComment('');
      setCommentType('COMMENT');
      
      // Mettre à jour le compteur de commentaires du projet
      if (project) {
        setProject({
          ...project,
          comments_count: project.comments_count + 1
        });
      }
      
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout du commentaire:', error);
      alert('Erreur lors de l\'ajout du commentaire');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const toggleLike = async (commentId: number) => {
    if (!user) return;
    
    try {
      const comment = comments.find(c => c.id === commentId);
      if (!comment) return;
      
      // Optimistic update
      setComments(comments.map(c => {
        if (c.id === commentId) {
          return {
            ...c,
            likes_count: c.likes_count + 1 // Simplification : toujours +1 pour l'instant
          };
        }
        return c;
      }));
      
      // Appel API
      await apiService.likeComment(parseInt(id!), commentId);
      
    } catch (error: any) {
      console.error('Erreur lors du like:', error);
      // Rollback en cas d'erreur
      await loadComments();
    }
  };

  if (loading) {
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
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* En-tête du projet */}
        <div className="bg-card rounded-lg border shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-foreground">{project.title}</h1>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                  {getStatusText(project.status)}
                </span>
              </div>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {project.description}
              </p>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contenu principal */}
          <div className="lg:col-span-2">
            {/* Navigation par onglets */}
            <div className="bg-card rounded-lg border shadow-sm mb-6">
              <div className="border-b border-border">
                <nav className="flex space-x-8 px-6">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'overview'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                    }`}
                  >
                    Vue d'ensemble
                  </button>
                  <button
                    onClick={() => setActiveTab('data')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'data'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                    }`}
                  >
                    Données ({datasets.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('team')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'team'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                    }`}
                  >
                    Équipe
                  </button>
                </nav>
              </div>

              {/* Contenu des onglets */}
              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Objectifs */}
                    {project.objectives && (
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-3">Objectifs</h3>
                        <p className="text-muted-foreground leading-relaxed">{project.objectives}</p>
                      </div>
                    )}

                    {/* Méthodologie */}
                    {project.methodology && (
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-3">Méthodologie</h3>
                        <p className="text-muted-foreground leading-relaxed">{project.methodology}</p>
                      </div>
                    )}

                    {/* Résultats attendus */}
                    {project.expected_outcomes && (
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-3">Résultats attendus</h3>
                        <p className="text-muted-foreground leading-relaxed">{project.expected_outcomes}</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'data' && (
                  <div className="space-y-4">
                    {datasets.length > 0 ? (
                      datasets.map((dataset) => (
                        <div key={dataset.id} className="border border-border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-medium text-foreground">{dataset.name}</h4>
                              {dataset.description && (
                                <p className="text-sm text-muted-foreground mt-1">{dataset.description}</p>
                              )}
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getQualityColor(dataset.overall_quality_score)}`}>
                              {Math.round(dataset.overall_quality_score || 0)}% qualité
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <span className="material-icons text-xs">description</span>
                              {dataset.type}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <span className="material-icons text-xs">table_rows</span>
                              {dataset.rows_count || 0} lignes
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <span className="material-icons text-xs">view_column</span>
                              {dataset.columns_count || 0} colonnes
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <span className="material-icons text-xs">storage</span>
                              {formatFileSize(dataset.file_size)}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <span className="material-icons text-4xl mb-2 block">folder_open</span>
                        <p>Aucun dataset disponible</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'team' && (
                  <div className="text-center py-8 text-muted-foreground">
                    <span className="material-icons text-4xl mb-2 block">group</span>
                    <p>Fonctionnalité équipe à venir</p>
                  </div>
                )}
              </div>
            </div>
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

            {/* Commentaires avec threads */}
            <CommentSection
              projectId={parseInt(id!)}
              currentUserId={user?.id}
              allowComments={project.allow_comments}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail; 