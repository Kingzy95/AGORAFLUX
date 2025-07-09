import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCollaborationData } from '../../hooks';
import { FilterOptions } from '../../types/collaboration';

const CollaborativeDashboard: React.FC = () => {
  const { user } = useAuth();
  
  // Utiliser le nouveau hook au lieu des données mock
  const {
    annotations,
    onlineUsers,
    stats,
    isLoading,
    error,
    refreshData
  } = useCollaborationData();

  const [filters, setFilters] = useState<FilterOptions>({});

  // Filtrer les annotations selon les filtres actifs
  const filteredAnnotations = annotations.filter(annotation => {
    if (filters.category && annotation.category !== filters.category) return false;
    if (filters.status && filters.status.length > 0) {
      const annotationStatus = annotation.isResolved ? 'resolved' : 'active';
      if (!filters.status.includes(annotationStatus)) return false;
    }
    if (filters.dateRange) {
      const annotationDate = new Date(annotation.timestamp);
      if (filters.dateRange.start && annotationDate < new Date(filters.dateRange.start)) return false;
      if (filters.dateRange.end && annotationDate > new Date(filters.dateRange.end)) return false;
    }
    return true;
  });

  // Statistiques calculées
  const activeDiscussions = filteredAnnotations.filter(a => !a.isResolved).length;
  const resolvedDiscussions = filteredAnnotations.filter(a => a.isResolved).length;
  const totalReplies = filteredAnnotations.reduce((sum, a) => sum + (a.thread?.totalReplies || 0), 0);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="border-b pb-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Tableau de Bord Collaboratif</h1>
          <div className="mt-4 h-2 w-full rounded-full bg-muted">
            <div className="h-full w-1/3 rounded-full bg-primary animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="border-b pb-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Tableau de Bord Collaboratif</h1>
          <div className="mt-4 rounded-md border border-destructive/20 bg-destructive/10 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="material-icons text-destructive">error</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-destructive">Erreur</h3>
                <div className="mt-2 text-sm text-destructive/80">
                  Erreur lors du chargement des données de collaboration : {error}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Tableau de Bord Collaboratif</h1>
        <p className="mt-2 text-muted-foreground">
          Explorez les discussions en cours, suivez l'engagement communautaire et participez aux débats citoyens.
        </p>
      </div>

      {/* Métriques clés */}
      <section>
        <h2 className="text-xl font-bold text-foreground mb-4">Métriques Clés</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="overflow-hidden rounded-lg bg-card p-5 shadow-sm border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="material-icons text-2xl text-blue-500">forum</span>
              </div>
              <div className="ml-3">
                <p className="truncate text-sm font-medium text-muted-foreground">Discussions Actives</p>
                <p className="mt-1 text-3xl font-semibold text-foreground">{stats.activeDiscussions}</p>
              </div>
            </div>
          </div>
          
          <div className="overflow-hidden rounded-lg bg-card p-5 shadow-sm border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="material-icons text-2xl text-green-500">check_circle</span>
              </div>
              <div className="ml-3">
                <p className="truncate text-sm font-medium text-muted-foreground">Discussions Résolues</p>
                <p className="mt-1 text-3xl font-semibold text-foreground">{stats.resolvedDiscussions}</p>
              </div>
            </div>
          </div>
          
          <div className="overflow-hidden rounded-lg bg-card p-5 shadow-sm border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="material-icons text-2xl text-cyan-500">chat</span>
              </div>
              <div className="ml-3">
                <p className="truncate text-sm font-medium text-muted-foreground">Total Réponses</p>
                <p className="mt-1 text-3xl font-semibold text-foreground">{stats.totalReplies}</p>
              </div>
            </div>
          </div>
          
          <div className="overflow-hidden rounded-lg bg-card p-5 shadow-sm border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="material-icons text-2xl text-orange-500">people</span>
              </div>
              <div className="ml-3">
                <p className="truncate text-sm font-medium text-muted-foreground">Utilisateurs En Ligne</p>
                <p className="mt-1 text-3xl font-semibold text-foreground">{onlineUsers.length}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Section Engagement */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">Engagement Communautaire</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Utilisateurs en ligne */}
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <h3 className="text-base font-medium text-foreground">Utilisateurs Connectés</h3>
              <p className="mt-1 text-3xl font-semibold text-foreground">{onlineUsers.length}</p>
              <p className="text-sm text-muted-foreground">actuellement en ligne</p>
              <div className="mt-4 space-y-2">
                {onlineUsers.slice(0, 5).map(userItem => (
                  <div key={userItem.userId} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {userItem.userName.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {userItem.userName}
                      </p>
                      <p className="text-xs text-muted-foreground">{userItem.userRole}</p>
                    </div>
                    <div className={`h-2 w-2 rounded-full ${userItem.isOnline ? 'bg-green-400' : 'bg-muted'}`}></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activité récente */}
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <h3 className="text-base font-medium text-foreground">Activité Récente</h3>
              <p className="mt-1 text-3xl font-semibold text-foreground">+{activeDiscussions}</p>
              <p className="text-sm text-muted-foreground">nouvelles discussions</p>
              <div className="mt-4 h-40">
                <div className="grid h-full grid-flow-col gap-4 items-end px-2">
                  <div className="bg-blue-200 rounded-t-sm w-full" style={{height: '20%'}}></div>
                  <div className="bg-blue-200 rounded-t-sm w-full" style={{height: '50%'}}></div>
                  <div className="bg-blue-400 rounded-t-sm w-full" style={{height: '80%'}}></div>
                  <div className="bg-blue-200 rounded-t-sm w-full" style={{height: '30%'}}></div>
                  <div className="bg-blue-500 rounded-t-sm w-full" style={{height: '90%'}}></div>
                  <div className="bg-blue-200 rounded-t-sm w-full" style={{height: '40%'}}></div>
                </div>
                <div className="grid grid-flow-col gap-4 text-center mt-2">
                  <span className="text-xs text-muted-foreground">Lun</span>
                  <span className="text-xs text-muted-foreground">Mar</span>
                  <span className="text-xs text-muted-foreground">Mer</span>
                  <span className="text-xs text-muted-foreground">Jeu</span>
                  <span className="text-xs text-muted-foreground">Ven</span>
                  <span className="text-xs text-muted-foreground">Sam</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section Insights */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-4">Insights Collaboration</h2>
          <div className="space-y-6">
            {/* Top discussions */}
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <h3 className="text-base font-medium text-foreground mb-4">Discussions les Plus Actives</h3>
              <div className="space-y-3">
                {filteredAnnotations.slice(0, 3).map(annotation => (
                  <div key={annotation.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-blue-600">
                        {annotation.userName.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {annotation.content.substring(0, 50)}...
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{annotation.userName}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          annotation.category === 'question' ? 'bg-blue-100 text-blue-700' :
                          annotation.category === 'suggestion' ? 'bg-green-100 text-green-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {annotation.category}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">{annotation.thread?.totalReplies || 0}</p>
                      <p className="text-xs text-muted-foreground">réponses</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tendances */}
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <h3 className="text-base font-medium text-foreground mb-4">Tendances</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-foreground">Questions techniques</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-muted rounded-full">
                      <div className="w-3/4 h-full bg-blue-500 rounded-full"></div>
                    </div>
                    <span className="text-sm font-medium text-foreground">75%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-foreground">Suggestions d'amélioration</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-muted rounded-full">
                      <div className="w-3/5 h-full bg-green-500 rounded-full"></div>
                    </div>
                    <span className="text-sm font-medium text-foreground">60%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-foreground">Signalements</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-muted rounded-full">
                      <div className="w-1/5 h-full bg-orange-500 rounded-full"></div>
                    </div>
                    <span className="text-sm font-medium text-foreground">20%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Actions de collaboration */}
      <section>
        <h2 className="text-xl font-bold text-foreground mb-4">Actions Collaboratives</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <button 
            onClick={() => console.log('Nouvelle discussion')}
            className="p-4 rounded-lg border bg-card shadow-sm hover:bg-accent transition-colors text-left"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="material-icons text-blue-500">add_comment</span>
              <span className="font-medium text-foreground">Nouvelle Discussion</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Lancez une nouvelle conversation avec la communauté
            </p>
          </button>

          <button 
            onClick={() => console.log('Modérer discussions')}
            className="p-4 rounded-lg border bg-card shadow-sm hover:bg-accent transition-colors text-left"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="material-icons text-green-500">verified_user</span>
              <span className="font-medium text-foreground">Modérer</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Gérez et modérez les discussions actives
            </p>
          </button>

          <button 
            onClick={refreshData}
            className="p-4 rounded-lg border bg-card shadow-sm hover:bg-accent transition-colors text-left"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="material-icons text-purple-500">refresh</span>
              <span className="font-medium text-foreground">Actualiser</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Rechargez les dernières données de collaboration
            </p>
          </button>
        </div>
      </section>
    </div>
  );
};

export default CollaborativeDashboard; 