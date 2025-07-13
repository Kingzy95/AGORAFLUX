import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useVisualizationData, useDataPipeline } from '../../hooks';
import RealDataVisualization from './RealDataVisualization';
import BarChart from '../charts/BarChart';
import PieChart from '../charts/PieChart';
import LineChart from '../charts/LineChart';
import InteractiveMap from '../maps/InteractiveMap';

const AnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  
  // Hooks pour les données
  const { 
    budgetData, 
    participationData, 
    participationStats,
    generalStats,
    demographicsData,
    satisfactionData,
    additionalStats,
    isLoading: dataLoading, 
    error: dataError,
    refreshData,
    useMockData,
    setUseMockData
  } = useVisualizationData();
  
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

  // États pour les interactions
  const [showPipelineDialog, setShowPipelineDialog] = useState(false);
  const [useDebugData, setUseDebugData] = useState(false); // Vraies données par défaut
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshData();
      alert('Données mises à jour avec succès !');
    } catch (error) {
      alert('Erreur lors de la mise à jour des données');
    } finally {
      setRefreshing(false);
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

  if (dataLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="border-b pb-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Analytics et Visualisations</h1>
          <div className="mt-4 h-2 w-full rounded-full bg-muted">
            <div className="h-full w-1/3 rounded-full bg-primary animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Analytics et Visualisations</h1>
        <p className="text-muted-foreground mt-2">
          Explorez les données avec des graphiques interactifs, cartes et métriques en temps réel.
        </p>
        <div className="flex items-center gap-4 mt-4">
          <select 
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            defaultValue="6months"
          >
            <option value="1month">1 mois</option>
            <option value="3months">3 mois</option>
            <option value="6months">6 mois</option>
            <option value="1year">1 an</option>
          </select>
          
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
            title="Actualiser les données"
          >
            <span className="material-icons">refresh</span>
          </button>

          <div className="flex gap-2">
            <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">
              Dernière MAJ: Aujourd'hui 14h30
            </span>
            {useMockData && (
              <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full">
                Mode démonstration
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Pipeline Control Panel */}
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

        {/* Statistiques du pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      </div>

      {/* Erreurs de données */}
      {dataError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="material-icons text-red-500">error</span>
            <div>
              <h3 className="font-medium text-red-800">Erreur de chargement des données</h3>
              <p className="text-red-600 text-sm mt-1">{dataError}</p>
              <button 
                onClick={() => setUseMockData(!useMockData)}
                className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
              >
                {useMockData ? "Essayer vraies données" : "Mode démonstration"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Métriques principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Participants Totaux</p>
              <p className="text-3xl font-bold text-foreground mt-1">{generalStats.total}</p>
              <div className="flex items-center gap-1 mt-2">
                <span className={`material-icons text-sm ${
                  generalStats.changeType === 'increase' ? 'text-green-500' :
                  generalStats.changeType === 'decrease' ? 'text-red-500' : 'text-gray-500'
                }`}>
                  {generalStats.changeType === 'increase' ? 'trending_up' :
                   generalStats.changeType === 'decrease' ? 'trending_down' : 'remove'}
                </span>
                <span className="text-sm text-muted-foreground">
                  {generalStats.change}% {generalStats.period}
                </span>
              </div>
            </div>
            <span className="material-icons text-blue-500 text-3xl">people</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Projets Actifs</p>
              <p className="text-3xl font-bold text-foreground mt-1">{additionalStats.activeProjects}</p>
              <div className="flex items-center gap-1 mt-2">
                <span className="material-icons text-sm text-green-500">trending_up</span>
                <span className="text-sm text-muted-foreground">
                  +{additionalStats.projectsChange}% ce mois
                </span>
              </div>
            </div>
            <span className="material-icons text-green-500 text-3xl">assignment</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Commentaires</p>
              <p className="text-3xl font-bold text-foreground mt-1">{additionalStats.totalComments}</p>
              <div className="flex items-center gap-1 mt-2">
                <span className="material-icons text-sm text-green-500">trending_up</span>
                <span className="text-sm text-muted-foreground">
                  +{additionalStats.commentsChange}% ce mois
                </span>
              </div>
            </div>
            <span className="material-icons text-orange-500 text-3xl">comment</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Arrondissements</p>
              <p className="text-3xl font-bold text-foreground mt-1">{additionalStats.activeDistricts}</p>
              <div className="flex items-center gap-1 mt-2">
                <span className="material-icons text-sm text-gray-500">remove</span>
                <span className="text-sm text-muted-foreground">
                  Stable ce mois
                </span>
              </div>
            </div>
            <span className="material-icons text-purple-500 text-3xl">location_on</span>
          </div>
        </div>
      </div>

      {/* Graphiques principaux */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évolution de la participation */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Évolution de la Participation</h3>
          <div className="h-64">
            {participationStats.length > 0 ? (
              <LineChart 
                data={participationStats}
                config={{
                  type: 'line',
                  title: '',
                  height: 240,
                  showLegend: true,
                  showTooltip: true
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <span className="material-icons text-4xl text-gray-400 mb-2 block">trending_up</span>
                  <p className="text-gray-600">Graphique de participation</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {participationStats.length} points de données
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Répartition par âge */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Répartition Démographique</h3>
          <div className="h-64">
            {demographicsData.length > 0 ? (
              <PieChart 
                data={demographicsData}
                config={{
                  type: 'pie',
                  title: '',
                  height: 240,
                  showLegend: true,
                  showTooltip: true
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <span className="material-icons text-4xl text-gray-400 mb-2 block">pie_chart</span>
                  <p className="text-gray-600">Graphique démographique</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {demographicsData.length} catégories
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Budget municipal */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Budget Municipal par Secteur</h3>
          <div className="h-64">
            {budgetData.length > 0 ? (
              <BarChart 
                data={budgetData.map(item => ({
                  name: item.category,
                  value: item.amount,
                  label: item.category,
                  color: item.color
                }))}
                config={{
                  type: 'bar',
                  title: '',
                  height: 240,
                  showLegend: true,
                  showTooltip: true
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <span className="material-icons text-4xl text-gray-400 mb-2 block">bar_chart</span>
                  <p className="text-gray-600">Graphique budget</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {budgetData.length} secteurs
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Satisfaction */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Satisfaction Utilisateurs</h3>
          <div className="h-64">
            {satisfactionData.length > 0 ? (
              <BarChart 
                data={satisfactionData}
                config={{
                  type: 'bar',
                  title: '',
                  height: 240,
                  showLegend: true,
                  showTooltip: true
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <span className="material-icons text-4xl text-gray-400 mb-2 block">sentiment_satisfied</span>
                  <p className="text-gray-600">Graphique satisfaction</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {satisfactionData.length} évaluations
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Carte interactive */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Carte de Participation par Arrondissement</h3>
        <div className="h-96">
          {participationData.length > 0 ? (
            <InteractiveMap
              data={participationData}
              center={[48.8566, 2.3522]}
              zoom={11}
              height={384}
              onMarkerClick={(data) => {
                console.log('Arrondissement sélectionné:', data);
                // Vous pouvez ajouter ici une action comme ouvrir un modal avec plus de détails
              }}
              showClusters={false}
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <span className="material-icons text-5xl text-gray-400 mb-3 block">map</span>
                <p className="text-gray-600 text-lg">Carte Interactive de Paris</p>
                <p className="text-sm text-gray-500 mt-2">
                  {participationData.length} arrondissements avec données
                </p>
                <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                  Voir la carte complète
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Visualisation des données réelles du pipeline */}
      <RealDataVisualization className="mt-6" />

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
                      ? 'Le pipeline utilisera des données de test prédéfinies (uniquement pour les démonstrations)'
                      : 'Le pipeline récupérera les vraies données depuis les APIs publiques françaises (recommandé)'
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
    </div>
  );
};

export default AnalyticsDashboard; 