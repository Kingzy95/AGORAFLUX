import React from 'react';
import { usePersonalDashboard } from '../../hooks/usePersonalDashboard';
import { useAuth } from '../../context/AuthContext';
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
  Progress,
} from '../ui';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import {
  User,
  Trophy,
  TrendingUp,
  Activity,
  MessageSquare,
  Database,
  FolderOpen,
  Users,
  Star,
  Calendar,
  Target,
  Award,
  RefreshCw,
  ExternalLink,
  Tag
} from 'lucide-react';

const PersonalDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading, error, refreshData } = usePersonalDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-gray-600">Chargement de votre dashboard...</span>
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
            <Button onClick={refreshData} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">Aucune donnée disponible</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { profile, community, activity, charts } = data;

  // Données pour les graphiques
  const statusData = [
    { name: 'Brouillons', value: charts.projects_progress.draft, color: '#94a3b8' },
    { name: 'Actifs', value: charts.projects_progress.active, color: '#10b981' },
    { name: 'Terminés', value: charts.projects_progress.completed, color: '#3b82f6' },
    { name: 'Archivés', value: charts.projects_progress.archived, color: '#6b7280' }
  ];

  const getRankingColor = (percentile: number) => {
    if (percentile >= 90) return 'text-yellow-600 bg-yellow-50';
    if (percentile >= 75) return 'text-blue-600 bg-blue-50';
    if (percentile >= 50) return 'text-green-600 bg-green-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getRankingIcon = (percentile: number) => {
    if (percentile >= 90) return <Trophy className="h-4 w-4" />;
    if (percentile >= 75) return <Award className="h-4 w-4" />;
    if (percentile >= 50) return <Star className="h-4 w-4" />;
    return <Target className="h-4 w-4" />;
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header avec profil */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-lg font-semibold bg-blue-500 text-white">
              {profile.avatar}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Bonjour, {profile.name.split(' ')[0]} ! 👋
            </h1>
            <p className="text-gray-600">
              Voici votre activité sur AgoraFlux
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={getRankingColor(community.percentile)}>
                {getRankingIcon(community.percentile)}
                <span className="ml-1">
                  Top {community.percentile}% des contributeurs
                </span>
              </Badge>
              <Badge variant="outline">
                {profile.role === 'admin' ? 'Administrateur' : 
                 profile.role === 'moderateur' ? 'Modérateur' : 'Contributeur'}
              </Badge>
            </div>
          </div>
        </div>
        <Button onClick={refreshData} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualiser
        </Button>
      </div>

      {/* Statistiques principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/projects')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projets Créés</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.stats.projects_created}</div>
            <p className="text-xs text-muted-foreground">
              {profile.stats.active_projects} actifs • {profile.stats.completed_projects} terminés
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/datasets')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Datasets Uploadés</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.stats.datasets_uploaded}</div>
            <p className="text-xs text-muted-foreground">
              {profile.stats.processed_datasets} traités avec succès
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commentaires</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.stats.comments_written}</div>
            <p className="text-xs text-muted-foreground">
              {profile.stats.replies_received} réponses • {profile.stats.likes_received} likes
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activité</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.stats.activity_rate}</div>
            <p className="text-xs text-muted-foreground">
              contributions par jour en moyenne
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Contenu principal */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Graphique d'activité */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Vos Contributions</CardTitle>
            <CardDescription>
              Évolution de votre activité sur les 30 derniers jours
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.contributions_timeline}>
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString('fr-FR')}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="projects" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Projets"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="datasets" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Datasets"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="comments" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    name="Commentaires"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Position communautaire */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Position Communautaire</CardTitle>
            <CardDescription>
              Votre rang dans la communauté
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Classement</span>
              <Badge className={getRankingColor(community.percentile)}>
                #{community.ranking} / {community.total_users}
              </Badge>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Percentile</span>
                <span className="text-sm text-gray-600">{community.percentile}%</span>
              </div>
              <Progress value={community.percentile} className="h-2" />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Contributions</span>
              <div className="text-right">
                <div className="font-semibold">{profile.stats.total_contributions}</div>
                <div className="text-xs text-gray-500">
                  Moy. communauté: {community.community_average}
                </div>
              </div>
            </div>

            {community.favorite_tags.length > 0 && (
              <div>
                <span className="text-sm font-medium">Vos tags favoris</span>
                <div className="flex flex-wrap gap-1 mt-2">
                  {community.favorite_tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Répartition des projets et activité récente */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Répartition des projets */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Statut de vos Projets</CardTitle>
            <CardDescription>
              Répartition par statut
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Activité récente */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Activité Récente</CardTitle>
            <CardDescription>
              Vos dernières actions sur la plateforme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {/* Projets récents */}
              {activity.recent_projects.slice(0, 3).map((project) => (
                <div key={`project-${project.id}`} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                     onClick={() => navigate(`/projects/${project.id}`)}>
                  <FolderOpen className="h-4 w-4 text-blue-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{project.title}</p>
                    <p className="text-xs text-gray-500">
                      {project.is_owner ? 'Votre projet' : 'Contribution'} • 
                      {new Date(project.updated_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {project.status}
                  </Badge>
                </div>
              ))}

              {/* Commentaires récents */}
              {activity.recent_comments.slice(0, 2).map((comment) => (
                <div key={`comment-${comment.id}`} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                     onClick={() => navigate(`/projects/${comment.project_id}`)}>
                  <MessageSquare className="h-4 w-4 text-green-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{comment.content}</p>
                    <p className="text-xs text-gray-500">
                      sur {comment.project_title} • {new Date(comment.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="text-xs text-gray-400">
                    {comment.likes_count} ❤️
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projets suggérés */}
      {activity.suggested_projects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Projets Recommandés</CardTitle>
            <CardDescription>
              Basés sur vos centres d'intérêt
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activity.suggested_projects.slice(0, 6).map((project) => (
                <Card key={project.id} className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/projects/${project.id}`)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm">{project.title}</h4>
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                      {project.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        {project.matching_tag}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Users className="h-3 w-3" />
                        {project.contributor_count}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Collaborateurs fréquents */}
      {activity.collaborators.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vos Collaborateurs</CardTitle>
            <CardDescription>
              Utilisateurs qui participent à vos projets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {activity.collaborators.map((collaborator) => (
                <div key={collaborator.id} className="flex items-center gap-2 p-2 rounded border">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">{collaborator.avatar}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{collaborator.name}</p>
                    <p className="text-xs text-gray-500">{collaborator.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PersonalDashboard; 