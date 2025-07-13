import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCollaborationData } from '../../hooks';
import { useDataPipeline } from '../../hooks';
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

  // Hook pour le pipeline de données
  const { 
    status: pipelineStatus, 
    sources: pipelineSources,
    datasets: pipelineDatasets,
    lastRun,
    isLoading: pipelineLoading,
    error: pipelineError,
    runPipeline,
    refreshData: refreshPipelineData
  } = useDataPipeline();

  const [filters, setFilters] = useState<FilterOptions>({});
  const [showPipelineDialog, setShowPipelineDialog] = useState(false);
  const [useDebugData, setUseDebugData] = useState(true);
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);

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

  const handleRunPipeline = async () => {
    setIsRunningPipeline(true);
    try {
      await runPipeline(useDebugData);
      alert('Pipeline lancé avec succès ! Les données vont être mises à jour.');
      setShowPipelineDialog(false);
      // Actualiser les données après un délai
      setTimeout(() => {
        refreshData();
      }, 2000);
    } catch (error) {
      alert('Erreur lors du lancement du pipeline');
      console.error('Erreur pipeline:', error);
    } finally {
      setIsRunningPipeline(false);
    }
  };

  const getPipelineStatusColor = () => {
    if (pipelineStatus?.is_running || isRunningPipeline) return 'bg-blue-100 text-blue-800';
    if (pipelineError) return 'bg-red-100 text-red-800';
    if (pipelineStatus?.last_run?.status === 'success') return 'bg-green-100 text-green-800';
    if (pipelineStatus?.last_run?.status === 'error') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getPipelineStatusText = () => {
    if (pipelineStatus?.is_running || isRunningPipeline) return 'En cours d\'exécution';
    if (pipelineError) return 'Erreur';
    if (lastRun?.status === 'completed') return 'Dernière exécution réussie';
    if (lastRun?.status === 'error') return 'Dernière exécution échouée';
    if (pipelineDatasets && pipelineDatasets.length > 0) return 'Données disponibles';
    return 'Aucune exécution';
  };

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
      <div className="p-6">
        <div className="border border-red-200 rounded-lg p-4 bg-red-50">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Erreur de chargement</h2>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={refreshData}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Tableau de Bord Collaboratif</h1>
        <p className="text-muted-foreground mt-2">
          Explorez les discussions en cours, suivez l'engagement communautaire et participez aux débats citoyens.
        </p>
      </div>

      {/* Pipeline Control Panel - Version Tailwind */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="material-icons text-blue-500 text-2xl">storage</span>
            <h2 className="text-xl font-bold text-foreground">Pipeline de Données</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPipelineStatusColor()}`}>
              {getPipelineStatusText()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshPipelineData}
              disabled={pipelineLoading}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              title="Actualiser"
            >
              <span className="material-icons">refresh</span>
            </button>
            <button
              onClick={() => setShowPipelineDialog(true)}
              disabled={pipelineStatus?.is_running || isRunningPipeline || pipelineLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span className="material-icons text-lg">play_arrow</span>
              Lancer Pipeline
            </button>
          </div>
        </div>

        {pipelineError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{pipelineError}</p>
          </div>
        )}

        {(pipelineStatus?.is_running || isRunningPipeline) && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm mb-2">Pipeline en cours d'exécution...</p>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
            </div>
          </div>
        )}

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <span className="material-icons text-blue-500 text-3xl mb-2 block">folder</span>
            <p className="text-2xl font-bold text-foreground">{pipelineSources?.length || 0}</p>
            <p className="text-sm text-muted-foreground">Sources configurées</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <span className="material-icons text-green-500 text-3xl mb-2 block">assessment</span>
            <p className="text-2xl font-bold text-foreground">{pipelineDatasets?.length || 0}</p>
            <p className="text-sm text-muted-foreground">Datasets traités</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <span className="material-icons text-purple-500 text-3xl mb-2 block">schedule</span>
            <p className="text-2xl font-bold text-foreground">
              {lastRun?.started_at ? new Date(lastRun.started_at).toLocaleDateString() : 'N/A'}
            </p>
            <p className="text-sm text-muted-foreground">Dernière exécution</p>
          </div>
        </div>

        {/* Sources disponibles */}
        {pipelineSources && pipelineSources.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Sources de Données Disponibles</h3>
            <div className="space-y-2">
              {pipelineSources.slice(0, 3).map((source: any, index: number) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="material-icons text-blue-500">data_usage</span>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{source.name}</p>
                    <p className="text-sm text-muted-foreground">{source.description}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">{source.format}</span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">{source.update_frequency}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dialog de configuration du pipeline */}
      {showPipelineDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-icons text-blue-500">settings</span>
              <h3 className="text-xl font-bold text-foreground">Lancer le Pipeline de Données</h3>
            </div>
            
            <div className="mb-6">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                <p className="text-blue-800 text-sm">
                  Le pipeline va traiter toutes les sources configurées et générer les données fusionnées.
                  Cette opération peut prendre quelques minutes.
                </p>
              </div>

              <div className="flex items-start gap-3 mb-4">
                <input
                  type="checkbox"
                  id="debugData"
                  checked={useDebugData}
                  onChange={(e) => setUseDebugData(e.target.checked)}
                  className="mt-1"
                />
                <div>
                  <label htmlFor="debugData" className="font-medium text-foreground">
                    Utiliser les données de démonstration
                  </label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {useDebugData 
                      ? 'Le pipeline utilisera des données de test prédéfinies (recommandé pour les démonstrations)'
                      : 'Le pipeline tentera de récupérer les vraies données depuis les APIs externes'
                    }
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium text-foreground mb-3">Ce qui va être traité :</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="material-icons text-green-500 text-sm">check_circle</span>
                    <span>Données de participation citoyenne</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-icons text-green-500 text-sm">check_circle</span>
                    <span>Budget municipal par secteur</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-icons text-green-500 text-sm">check_circle</span>
                    <span>Fusion géographique par arrondissement</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-icons text-green-500 text-sm">check_circle</span>
                    <span>Évaluation de la qualité des données</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-icons text-green-500 text-sm">check_circle</span>
                    <span>Documentation automatique des champs</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowPipelineDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleRunPipeline}
                disabled={isRunningPipeline}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <span className="material-icons text-lg">play_arrow</span>
                {isRunningPipeline ? 'Lancement...' : 'Lancer le Pipeline'}
              </button>
            </div>
          </div>
        </div>
      )}

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