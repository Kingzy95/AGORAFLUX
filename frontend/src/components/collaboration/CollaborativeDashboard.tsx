import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCollaborationData } from '../../hooks';
import { useDataPipeline } from '../../hooks';
import { FilterOptions } from '../../types/collaboration';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Badge,
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '../ui';
import {
  CalendarDays,
  Download,
  Activity,
  Users,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  Plus,
} from 'lucide-react';

const CollaborativeDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Déterminer les permissions selon le rôle
  const isAdmin = user?.role === 'admin';
  const isModerator = user?.role === 'moderateur' || isAdmin;
  const isUser = user?.role === 'utilisateur';

  // États et hooks
  const [filters] = useState<FilterOptions>({});

  const {
    annotations: filteredAnnotations,
    onlineUsers,
    stats: apiStats,
    isLoading,
    error,
    refreshData
  } = useCollaborationData();

  const {
    sources: pipelineSources,
    status: pipelineStatus,
    isLoading: pipelineLoading,
    error: pipelineError,
    refreshData: refreshPipelineData
  } = useDataPipeline();

  const [showPipelineDialog, setShowPipelineDialog] = useState(false);
  const [useDebugData, setUseDebugData] = useState(false);

  // Calculs des statistiques basés uniquement sur les vraies données API
  const calculatedStats = {
    activeDiscussions: filteredAnnotations.filter(a => !a.isResolved).length,
    resolvedDiscussions: filteredAnnotations.filter(a => a.isResolved).length,
    totalReplies: filteredAnnotations.reduce((acc, annotation) => acc + (annotation.thread?.totalReplies || 0), 0),
    onlineUsers: onlineUsers.length,
    totalAnnotations: filteredAnnotations.length,
    myContributions: filteredAnnotations.filter(a => a.userId === user?.id?.toString()).length,
  };

  // Handlers pour les actions selon le rôle
  const handleNewDiscussion = () => {
    navigate('/projects/new');
    console.log('🚀 Création d\'une nouvelle discussion...');
  };

  const handleModerate = () => {
    navigate('/dashboard/discussions');
    console.log('🛡️ Ouverture des outils de modération...');
  };

  const handleManageUsers = () => {
    navigate('/admin/users');
    console.log('👥 Accès à la gestion des utilisateurs...');
  };

  const handleAdvancedAnalytics = () => {
    navigate('/dashboard/analytics');
    console.log('📊 Chargement des analytics avancées...');
  };

  const handleMyContributions = () => {
    navigate('/dashboard/community');
    console.log('📈 Consultation de vos contributions...');
  };

  const handleOpenProfile = () => {
    navigate('/profile');
    console.log('👤 Ouverture du profil utilisateur...');
  };

  const handleRefreshData = () => {
    refreshData();
    console.log('🔄 Actualisation des données en cours...');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Erreur de chargement</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={handleRefreshData} variant="outline">
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Tableau de Bord Collaboratif</h2>
        <div className="flex items-center space-x-2">
          <CalendarDays className="h-4 w-4" />
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Télécharger
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Rapports</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* KPI Cards Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Discussions Actives */}
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate('/dashboard/discussions')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Discussions Actives
                </CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{calculatedStats.activeDiscussions}</div>
                <p className="text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  +20.1% depuis le mois dernier
                </p>
              </CardContent>
            </Card>

            {/* Total Réponses */}
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate('/dashboard/community')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Réponses
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{calculatedStats.totalReplies}</div>
                <p className="text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  +180.1% depuis le mois dernier
                </p>
              </CardContent>
            </Card>

            {/* Utilisateurs En Ligne - Modérateurs/Admins */}
            {isModerator && (
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate('/dashboard/community')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Utilisateurs En Ligne
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{calculatedStats.onlineUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3 inline mr-1" />
                    +19% depuis la semaine dernière
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Discussions Résolues - Modérateurs/Admins */}
            {isModerator && (
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate('/dashboard/discussions?filter=resolved')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Discussions Résolues
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{calculatedStats.resolvedDiscussions}</div>
                  <p className="text-xs text-muted-foreground">
                    <TrendingDown className="h-3 w-3 inline mr-1" />
                    +201 depuis la dernière heure
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Mes Contributions - Utilisateurs */}
            {isUser && (
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={handleOpenProfile}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Mes Contributions
                  </CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{calculatedStats.myContributions}</div>
                  <p className="text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3 inline mr-1" />
                    Votre activité ce mois
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Chart Section */}
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Activité Collaborative</CardTitle>
                <CardDescription>
                  Évolution des discussions et contributions sur les 7 derniers jours
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[200px] w-full">
                  {filteredAnnotations.length > 0 ? (
                    <div className="h-full flex items-end justify-between px-4 pb-4">
                      {/* Génération de données pour les 7 derniers jours basées sur les vraies annotations */}
                      {Array.from({ length: 7 }, (_, i) => {
                        const date = new Date();
                        date.setDate(date.getDate() - (6 - i));
                        
                        // Compter les annotations de ce jour
                        const dayAnnotations = filteredAnnotations.filter(annotation => {
                          const annotationDate = new Date(annotation.timestamp);
                          return annotationDate.toDateString() === date.toDateString();
                        });
                        
                        const height = Math.max(20, (dayAnnotations.length / Math.max(1, filteredAnnotations.length)) * 160);
                        
                        return (
                          <div key={i} className="flex flex-col items-center gap-2">
                            <div 
                              className="bg-primary rounded-t-sm w-8 transition-all hover:bg-primary/80"
                              style={{ height: `${height}px` }}
                              title={`${dayAnnotations.length} annotations le ${date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}`}
                            />
                            <span className="text-xs text-muted-foreground">
                              {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Aucune activité collaborative pour le moment</p>
                        <p className="text-xs mt-1">Les graphiques apparaîtront avec les premières contributions</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Activité Récente</CardTitle>
                <CardDescription>
                  Vous avez {calculatedStats.totalReplies} nouvelles réponses ce mois.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {onlineUsers.slice(0, 5).map((userItem, index) => (
                    <div key={userItem.userId} className="flex items-center">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={`/avatars/0${index + 1}.png`} alt="Avatar" />
                        <AvatarFallback>{userItem.userName?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {userItem.userName || 'Utilisateur'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {userItem.userRole} • En ligne
                        </p>
                      </div>
                      <div className="ml-auto font-medium">
                        <Badge variant="secondary">
                          {userItem.isOnline ? 'En ligne' : 'Hors ligne'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Actions Rapides
                <Button variant="outline" size="sm" onClick={handleRefreshData}>
                  <Activity className="mr-2 h-4 w-4" />
                  Actualiser
                </Button>
              </CardTitle>
              <CardDescription>
                Actions disponibles selon votre rôle : {user?.role}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Action commune : Nouvelle Discussion */}
                <Button onClick={handleNewDiscussion} className="h-auto p-4 flex flex-col items-start">
                  <Plus className="h-5 w-5 mb-2" />
                  <div className="text-left">
                    <div className="font-medium">Nouvelle Discussion</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Créer un nouveau projet collaboratif
                    </div>
                  </div>
                </Button>

                {/* Actions Modérateur */}
                {isModerator && (
                  <Button onClick={handleModerate} variant="outline" className="h-auto p-4 flex flex-col items-start">
                    <MessageSquare className="h-5 w-5 mb-2" />
                    <div className="text-left">
                      <div className="font-medium">Modérer</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Outils de modération des discussions
                      </div>
                    </div>
                  </Button>
                )}

                {/* Actions Admin */}
                {isAdmin && (
                  <>
                    <Button onClick={handleManageUsers} variant="outline" className="h-auto p-4 flex flex-col items-start">
                      <Users className="h-5 w-5 mb-2" />
                      <div className="text-left">
                        <div className="font-medium">Gestion Utilisateurs</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Administrer les utilisateurs
                        </div>
                      </div>
                    </Button>

                    <Button onClick={handleAdvancedAnalytics} variant="outline" className="h-auto p-4 flex flex-col items-start">
                      <TrendingUp className="h-5 w-5 mb-2" />
                      <div className="text-left">
                        <div className="font-medium">Analytics Avancées</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Statistiques détaillées
                        </div>
                      </div>
                    </Button>
                  </>
                )}

                {/* Actions Utilisateur */}
                {isUser && (
                  <Button onClick={handleMyContributions} variant="outline" className="h-auto p-4 flex flex-col items-start">
                    <Activity className="h-5 w-5 mb-2" />
                    <div className="text-left">
                      <div className="font-medium">Mes Contributions</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Consulter mes contributions
                      </div>
                    </div>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Role Status Card */}
          <Card className={`border-l-4 ${
            isAdmin ? 'border-l-red-500' :
            isModerator ? 'border-l-yellow-500' :
            'border-l-blue-500'
          }`}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${
                isAdmin ? 'text-red-600' :
                isModerator ? 'text-yellow-600' :
                'text-blue-600'
              }`}>
                <Badge variant={isAdmin ? 'destructive' : isModerator ? 'secondary' : 'default'}>
                  {isAdmin ? 'Administrateur' : isModerator ? 'Modérateur' : 'Utilisateur'}
                </Badge>
                {isAdmin ? 'Accès Complet' : isModerator ? 'Accès Modération' : 'Accès Collaboration'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {isAdmin ? 'Vous avez accès à tous les outils d\'administration et de gestion de la plateforme.' :
                 isModerator ? 'Vous pouvez modérer les discussions et accéder aux outils de gestion communautaire.' :
                 'Vous participez activement à la collaboration citoyenne. Vos contributions comptent !'}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other Tab Contents */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Détaillées</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Contenu des analytics détaillées à implémenter...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rapports</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Section des rapports à implémenter...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Gestion des notifications à implémenter...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CollaborativeDashboard; 