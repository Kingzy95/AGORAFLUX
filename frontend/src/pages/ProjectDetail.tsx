import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService, { BackendComment } from '../services/api';
import { Project, Dataset, CreateCommentRequest } from '../types/project';
import { CommentSection } from '../components/comments';
import { ProjectStatusManager } from '../components/projects/ProjectStatusManager';
import { ProjectTeam } from '../components/projects/ProjectTeam';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Avatar,
  AvatarFallback,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Separator,
  Alert,
  AlertDescription,
} from '../components/ui';
import {
  Heart,
  UserPlus,
  Eye,
  Users,
  Calendar,
  Clock,
  MessageSquare,
  Database,
  FileText,
  Activity,
  Share,
  Bookmark,
  Download,
  Star,
} from 'lucide-react';

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

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'overview' | 'data' | 'team');
  };

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
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* En-tête modernisé du projet */}
        <Card className="mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-bold tracking-tight">{project.title}</h1>
                  <Badge variant={project.status === 'active' ? 'default' : 'secondary'} className="text-sm">
                    {getStatusText(project.status)}
                  </Badge>
                </div>
                <p className="text-lg text-muted-foreground max-w-3xl">
                  {project.description}
                </p>
              </div>
            </div>

            {/* Métadonnées avec design moderne */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {project.owner && (
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {project.owner.first_name[0]}{project.owner.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Créé par</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {project.owner.first_name} {project.owner.last_name}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Créé le</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(project.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{project.view_count}</p>
                  <p className="text-sm text-muted-foreground">vues</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{project.contributor_count}</p>
                  <p className="text-sm text-muted-foreground">contributeurs</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Contenu principal avec layout moderne */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contenu principal */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Vue d'ensemble
                </TabsTrigger>
                <TabsTrigger value="data" className="gap-2">
                  <Database className="h-4 w-4" />
                  Données ({datasets.length})
                </TabsTrigger>
                <TabsTrigger value="team" className="gap-2">
                  <Users className="h-4 w-4" />
                  Équipe
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Informations du projet
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Objectifs */}
                    {project.objectives && (
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          Objectifs
                        </h3>
                        <p className="text-muted-foreground leading-relaxed pl-6">
                          {project.objectives}
                        </p>
                      </div>
                    )}

                    {project.methodology && (
                      <>
                        <Separator />
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Activity className="h-4 w-4 text-blue-500" />
                            Méthodologie
                          </h3>
                          <p className="text-muted-foreground leading-relaxed pl-6">
                            {project.methodology}
                          </p>
                        </div>
                      </>
                    )}

                    {project.expected_outcomes && (
                      <>
                        <Separator />
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Download className="h-4 w-4 text-green-500" />
                            Résultats attendus
                          </h3>
                          <p className="text-muted-foreground leading-relaxed pl-6">
                            {project.expected_outcomes}
                          </p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="data" className="space-y-4">
                {datasets.length > 0 ? (
                  <div className="grid gap-4">
                    {datasets.map((dataset) => (
                      <Card key={dataset.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="space-y-2">
                              <h4 className="font-semibold text-lg">{dataset.name}</h4>
                              {dataset.description && (
                                <p className="text-muted-foreground">{dataset.description}</p>
                              )}
                            </div>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              {Math.round(dataset.overall_quality_score || 0)}% qualité
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span>{dataset.type}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Database className="h-4 w-4" />
                              <span>{dataset.rows_count || 0} lignes</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Activity className="h-4 w-4" />
                              <span>{dataset.columns_count || 0} colonnes</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Download className="h-4 w-4" />
                              <span>{formatFileSize(dataset.file_size)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Database className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-lg font-medium mb-2">Aucun dataset disponible</p>
                      <p className="text-muted-foreground text-center">
                        Ce projet n'a pas encore de données uploadées.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="team">
                <ProjectTeam 
                  project={project} 
                  onProjectUpdate={(updatedProject) => setProject(updatedProject)}
                />
              </TabsContent>
            </Tabs>

              {/* Section commentaires - Masquée si projet terminé */}
              {project.status !== 'completed' && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Discussions
                    </CardTitle>
                    <CardDescription>
                      Participez aux discussions du projet
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CommentSection
                      projectId={parseInt(id!)}
                      currentUserId={user?.id}
                      allowComments={project.allow_comments}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Message informatif pour projets terminés */}
              {project.status === 'completed' && (
                <Card className="mt-6 border-muted bg-muted/20">
                  <CardContent className="p-6 text-center">
                    <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    <h3 className="font-medium text-muted-foreground mb-2">Discussions fermées</h3>
                    <p className="text-sm text-muted-foreground">
                      Ce projet est terminé. Les discussions sont désormais fermées.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

          {/* Sidebar modernisée */}
          <div className="space-y-6">
            {/* Actions rapides */}

            {/* Gestion du statut */}
            {user && project.owner_id === user.id && (
              <ProjectStatusManager
                project={project}
                onStatusUpdate={(updatedProject) => setProject(updatedProject)}
                canManage={true}
              />
            )}

            {/* Statut pour les non-propriétaires */}
            {user && project.owner_id !== user.id && (
              <ProjectStatusManager
                project={project}
                onStatusUpdate={() => {}}
                canManage={false}
              />
            )}

            {/* Tags avec design moderne */}
            {project.tags && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tags</CardTitle>
                  <CardDescription>
                    Sujets et catégories du projet
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.split(',').map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Statistiques détaillées */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Statistiques</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary">{project.view_count}</div>
                    <div className="text-xs text-muted-foreground">Vues</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary">{project.contributor_count}</div>
                    <div className="text-xs text-muted-foreground">Contributeurs</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary">{project.comments_count}</div>
                    <div className="text-xs text-muted-foreground">Commentaires</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary">{project.datasets_count}</div>
                    <div className="text-xs text-muted-foreground">Datasets</div>
                  </div>
                </div>
              </CardContent>
            </Card>


          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail; 