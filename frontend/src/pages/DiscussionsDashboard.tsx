import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
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
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui';
import apiService from '../services/api';
import {
  MessageSquare,
  Search,
  Filter,
  ChevronDown,
  Pin,
  Eye,
  EyeOff,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Clock,
  ThumbsUp,
  Reply,
  TrendingUp,
  Activity,
  Users,
  Flag,
  RefreshCw,
  ExternalLink,
  MoreHorizontal,
  Calendar,
  Tag
} from 'lucide-react';

interface Discussion {
  id: number;
  content: string;
  author: {
    id: number;
    name: string;
    role: string;
    avatar: string;
  };
  project: {
    id: number;
    title: string;
  };
  created_at: string;
  updated_at: string;
  status: 'ACTIVE' | 'HIDDEN' | 'FLAGGED' | 'DELETED';
  likes_count: number;
  replies_count: number;
  flags_count: number;
  is_pinned: boolean;
  is_edited: boolean;
}

interface DiscussionStats {
  total_discussions: number;
  active_discussions: number;
  flagged_discussions: number;
  hidden_discussions: number;
  total_flags: number;
  resolved_today: number;
  pending_moderation: number;
  by_type: {
    question: number;
    suggestion: number;
  };
}

const DiscussionsDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // États
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [stats, setStats] = useState<DiscussionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAction, setIsLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<string>('desc');
  const [activeTab, setActiveTab] = useState('all');

  // Vérification des permissions
  const hasModeratorAccess = user?.role === 'admin' || user?.role === 'moderateur';

  // Chargement des données
  const fetchDiscussions = useCallback(async () => {
    try {
      setError(null);
      console.log('🔄 Chargement des discussions...');
      
      const response = await apiService.getAllDiscussions({
        page: currentPage,
        per_page: 20,
        search: searchTerm,
        comment_type: statusFilter !== 'all' ? statusFilter : undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      // Transformer les données pour correspondre à l'interface Discussion
      const transformedDiscussions: Discussion[] = (response.discussions || []).map((comment: any) => ({
        id: comment.id,
        content: comment.content,
        author: {
          id: comment.author.id,
          name: comment.author.name,
          role: comment.author.role,
          avatar: comment.author.avatar || `${comment.author.name.split(' ')[0]?.[0] || ''}${comment.author.name.split(' ')[1]?.[0] || ''}`,
        },
        project: {
          id: comment.project.id,
          title: comment.project.title,
        },
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        status: comment.status.toUpperCase() as 'ACTIVE' | 'HIDDEN' | 'FLAGGED' | 'DELETED',
        likes_count: comment.likes_count || 0,
        replies_count: comment.replies_count || 0,
        flags_count: comment.flags_count || 0,
        is_pinned: comment.is_pinned || false,
        is_edited: comment.is_edited || false,
      }));

      setDiscussions(transformedDiscussions);
      setTotalPages(Math.ceil((response.total || 0) / 20));
      
      // Calculer les stats
      const calculatedStats: DiscussionStats = {
        total_discussions: response.total || 0,
        active_discussions: transformedDiscussions.filter(d => d.status === 'ACTIVE').length,
        flagged_discussions: transformedDiscussions.filter(d => d.status === 'FLAGGED').length,
        hidden_discussions: transformedDiscussions.filter(d => d.status === 'HIDDEN').length,
        total_flags: transformedDiscussions.reduce((sum, d) => sum + d.flags_count, 0),
        resolved_today: transformedDiscussions.filter(d => {
          const today = new Date().toDateString();
          return new Date(d.updated_at).toDateString() === today && d.status !== 'FLAGGED';
        }).length,
        pending_moderation: transformedDiscussions.filter(d => d.status === 'FLAGGED').length,
        by_type: {
          question: 0,
          suggestion: 0,
        },
      };
      
      setStats(calculatedStats);
      
      console.log('✅ Discussions chargées:', {
        total: response.total,
        discussions: transformedDiscussions.length,
        flagged: calculatedStats.flagged_discussions
      });
      
    } catch (err: any) {
      console.error('❌ Erreur lors du chargement des discussions:', err);
      setError(err.response?.data?.detail || err.message || 'Erreur lors du chargement des discussions');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchDiscussions();
  }, [fetchDiscussions]);

  // Actions de modération
  const handleModerationAction = async (action: string, discussionId: number) => {
    const discussion = discussions.find(d => d.id === discussionId);
    if (!discussion) return;
    
    setIsLoadingAction(`${action}-${discussionId}`);
    
    try {
      switch (action) {
        case 'pin':
          await apiService.pinComment(discussion.project.id, discussionId);
          break;
        case 'unpin':
          await apiService.unpinComment(discussion.project.id, discussionId);
          break;
        case 'flag':
          await apiService.flagComment(discussion.project.id, discussionId);
          break;
        case 'hide':
          await apiService.hideComment(discussion.project.id, discussionId);
          break;
        case 'show':
          await apiService.showComment(discussion.project.id, discussionId);
          break;
        case 'resolve':
          await apiService.resolveComment(discussion.project.id, discussionId);
          break;
        case 'delete':
          if (window.confirm('Êtes-vous sûr de vouloir supprimer définitivement cette discussion ?')) {
            await apiService.deleteCommentPermanently(discussion.project.id, discussionId);
          } else {
            return;
          }
          break;
      }
      
      // Actualiser les données
      await fetchDiscussions();
      
    } catch (err: any) {
      console.error(`❌ Erreur lors de l'action ${action}:`, err);
      setError(err.response?.data?.detail || err.message || `Erreur lors de l'action ${action}`);
    } finally {
      setIsLoadingAction(null);
    }
  };

  const getStatusBadge = (discussion: Discussion) => {
    const { status, flags_count, is_pinned } = discussion;
    
    if (is_pinned) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300"><Pin className="h-3 w-3 mr-1" />Épinglé</Badge>;
    }
    
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Actif</Badge>;
      case 'HIDDEN':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Masqué</Badge>;
      case 'FLAGGED':
        return <Badge variant="destructive"><Flag className="h-3 w-3 mr-1" />Signalé ({flags_count})</Badge>;
      case 'DELETED':
        return <Badge variant="destructive" className="bg-red-100 text-red-800">Supprimé</Badge>;
      default:
        return null;
    }
  };

  const getTabCounts = () => {
    if (!discussions.length) return {};
    
    return {
      all: discussions.length,
      flagged: discussions.filter(d => d.status === 'FLAGGED').length,
      hidden: discussions.filter(d => d.status === 'HIDDEN').length,
      active: discussions.filter(d => d.status === 'ACTIVE').length,
    };
  };

  const filteredDiscussions = discussions.filter(discussion => {
    if (activeTab === 'flagged' && discussion.status !== 'FLAGGED') return false;
    if (activeTab === 'hidden' && discussion.status !== 'HIDDEN') return false;
    if (activeTab === 'active' && discussion.status !== 'ACTIVE') return false;
    return true;
  });

  if (!hasModeratorAccess) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Accès Refusé</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Seuls les administrateurs et modérateurs peuvent accéder au tableau de bord des discussions.
            </p>
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              Retour au Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-gray-600">Chargement des discussions...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {hasModeratorAccess ? 'Dashboard Modération' : 'Discussions'}
          </h1>
          <p className="text-gray-600">
            {hasModeratorAccess 
              ? 'Gérez les discussions et modérez le contenu de la communauté'
              : 'Découvrez et participez aux conversations de la communauté'
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchDiscussions} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className={`grid gap-4 ${hasModeratorAccess ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-2'}`}>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Discussions</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_discussions}</div>
              <p className="text-xs text-muted-foreground">
                {stats.active_discussions} actives
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Par Type</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.values(stats.by_type).reduce((a, b) => a + b, 0)}</div>
              <p className="text-xs text-muted-foreground">
                {stats.by_type.question} questions, {stats.by_type.suggestion} suggestions
              </p>
            </CardContent>
          </Card>

          {hasModeratorAccess && (
            <>
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">En Attente</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{stats.pending_moderation}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.flagged_discussions} signalées
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Actions Récentes</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {discussions.filter(d => new Date(d.created_at) > new Date(Date.now() - 24*60*60*1000)).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    dernières 24h
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Filtres et Recherche */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres et Recherche</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher dans les discussions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="ACTIVE">Actives</SelectItem>
                <SelectItem value="FLAGGED">Signalées</SelectItem>
                <SelectItem value="HIDDEN">Masquées</SelectItem>
                <SelectItem value="DELETED">Supprimées</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Plus récentes</SelectItem>
                <SelectItem value="likes_count">Plus aimées</SelectItem>
                <SelectItem value="replies_count">Plus de réponses</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Ordre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Descendant</SelectItem>
                <SelectItem value="asc">Ascendant</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Onglets et Liste des Discussions */}
      <Card>
        <CardHeader>
          <CardTitle>Discussions</CardTitle>
          <CardDescription>
            Gérez et modérez les discussions de la communauté
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">
                Toutes ({getTabCounts().all || 0})
              </TabsTrigger>
              <TabsTrigger value="flagged" className="text-red-600">
                Signalées ({getTabCounts().flagged || 0})
              </TabsTrigger>
              <TabsTrigger value="hidden" className="text-gray-600">
                Masquées ({getTabCounts().hidden || 0})
              </TabsTrigger>
              <TabsTrigger value="active" className="text-green-600">
                Actives ({getTabCounts().active || 0})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="mt-6">
              <div className="space-y-4">
                {filteredDiscussions.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Aucune discussion trouvée</p>
                  </div>
                ) : (
                  filteredDiscussions.map((discussion) => (
                    <Card key={discussion.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          {/* Contenu principal */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>{discussion.author.avatar}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{discussion.author.name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {discussion.author.role}
                                  </Badge>
                                  {getStatusBadge(discussion)}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <span>dans</span>
                                  <Button
                                    variant="link"
                                    className="p-0 h-auto text-sm text-blue-600 hover:text-blue-800"
                                    onClick={() => navigate(`/projects/${discussion.project.id}`)}
                                  >
                                    {discussion.project.title}
                                    <ExternalLink className="h-3 w-3 ml-1" />
                                  </Button>
                                  <span>•</span>
                                  <Calendar className="h-3 w-3" />
                                  <span>{new Date(discussion.created_at).toLocaleDateString('fr-FR')}</span>
                                  {discussion.is_edited && (
                                    <>
                                      <span>•</span>
                                      <span className="text-gray-400">modifié</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <p className="text-gray-700 mb-4 line-clamp-3">
                              {discussion.content}
                            </p>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <ThumbsUp className="h-4 w-4" />
                                <span>{discussion.likes_count}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Reply className="h-4 w-4" />
                                <span>{discussion.replies_count}</span>
                              </div>
                              {discussion.flags_count > 0 && (
                                <div className="flex items-center gap-1 text-red-500">
                                  <Flag className="h-4 w-4" />
                                  <span>{discussion.flags_count} signalement(s)</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Actions de modération */}
                          <div className="ml-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => navigate(`/projects/${discussion.project.id}#comment-${discussion.id}`)}
                                >
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Voir sur le projet
                                </DropdownMenuItem>
                                
                                {/* Action Signaler - disponible pour tous les utilisateurs */}
                                {user?.id !== discussion.author.id && discussion.status !== 'FLAGGED' && (
                                  <>
                                    <Separator />
                                    <DropdownMenuItem
                                      onClick={() => handleModerationAction('flag', discussion.id)}
                                      disabled={isLoadingAction === `flag-${discussion.id}`}
                                      className="text-orange-600"
                                    >
                                      <Flag className="h-4 w-4 mr-2" />
                                      Signaler
                                    </DropdownMenuItem>
                                  </>
                                )}
                                
                                {hasModeratorAccess && (
                                  <>
                                    <Separator />
                                    
                                    {!discussion.is_pinned ? (
                                      <DropdownMenuItem
                                        onClick={() => handleModerationAction('pin', discussion.id)}
                                        disabled={isLoadingAction === `pin-${discussion.id}`}
                                      >
                                        <Pin className="h-4 w-4 mr-2" />
                                        Épingler
                                      </DropdownMenuItem>
                                    ) : (
                                      <DropdownMenuItem
                                        onClick={() => handleModerationAction('unpin', discussion.id)}
                                        disabled={isLoadingAction === `unpin-${discussion.id}`}
                                      >
                                        <Pin className="h-4 w-4 mr-2" />
                                        Désépingler
                                      </DropdownMenuItem>
                                    )}

                                    {discussion.status === 'ACTIVE' ? (
                                      <DropdownMenuItem
                                        onClick={() => handleModerationAction('hide', discussion.id)}
                                        disabled={isLoadingAction === `hide-${discussion.id}`}
                                        className="text-orange-600"
                                      >
                                        <EyeOff className="h-4 w-4 mr-2" />
                                        Masquer
                                      </DropdownMenuItem>
                                    ) : (
                                      <DropdownMenuItem
                                        onClick={() => handleModerationAction('show', discussion.id)}
                                        disabled={isLoadingAction === `show-${discussion.id}`}
                                        className="text-green-600"
                                      >
                                        <Eye className="h-4 w-4 mr-2" />
                                        Afficher
                                      </DropdownMenuItem>
                                    )}

                                    <DropdownMenuItem
                                      onClick={() => handleModerationAction('resolve', discussion.id)}
                                      disabled={isLoadingAction === `resolve-${discussion.id}`}
                                      className="text-blue-600"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Résoudre
                                    </DropdownMenuItem>

                                    <Separator />

                                    <DropdownMenuItem
                                      onClick={() => handleModerationAction('delete', discussion.id)}
                                      disabled={isLoadingAction === `delete-${discussion.id}`}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Supprimer définitivement
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Page {currentPage} sur {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Suivant
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Affichage des erreurs */}
      {error && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Erreur</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => setError(null)} variant="outline">
              Fermer
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DiscussionsDashboard; 