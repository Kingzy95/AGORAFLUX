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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Progress,
  Separator,
} from '../components/ui';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import apiService from '../services/api';
import {
  Users,
  UserCheck,
  Crown,
  Award,
  TrendingUp,
  Activity,
  MessageSquare,
  FolderOpen,
  Database,
  Star,
  Calendar,
  Trophy,
  Target,
  RefreshCw,
  Search,
  Filter,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  Zap,
  BarChart3,
  Globe
} from 'lucide-react';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  projects_count: number;
  datasets_count: number;
  comments_count: number;
  total_contributions: number;
  is_online: boolean;
}

interface CommunityStats {
  total_members: number;
  active_users: number;
  new_users_this_month: number;
  online_users: number;
  average_contributions: number;
  top_contributors: User[];
  members: User[];
  role_distribution: {
    admin: number;
    moderateur: number;
    utilisateur: number;
  };
}

const CommunityDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // États
  const [communityData, setCommunityData] = useState<CommunityStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  
  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('contributions');
  const [sortOrder, setSortOrder] = useState<string>('desc');
  const [activeTab, setActiveTab] = useState('overview');

  // Chargement des données
  const fetchCommunityData = useCallback(async () => {
    try {
      setError(null);
      console.log('🔄 Chargement des données communautaires...');
      
      const response = await apiService.getCommunityStats({
        page: currentPage,
        per_page: itemsPerPage,
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      // Transformer la réponse API pour correspondre à notre interface
      const transformedData: CommunityStats = {
        total_members: response.community_stats.total_users,
        active_users: response.community_stats.active_users_30d,
        new_users_this_month: response.community_stats.new_users_7d,
        online_users: response.community_stats.online_users,
        average_contributions: response.community_stats.avg_contributions,
        top_contributors: (response.top_contributors || []).map((member: any) => ({
          id: member.id,
          first_name: member.name.split(' ')[0] || '',
          last_name: member.name.split(' ').slice(1).join(' ') || '',
          role: member.role,
          is_active: true,
          last_login: member.last_login,
          created_at: member.created_at,
          projects_count: member.stats.projects_count,
          datasets_count: member.stats.datasets_count,
          comments_count: member.stats.comments_count,
          total_contributions: member.stats.total_contributions,
          is_online: member.is_online,
        })),
        members: (response.members || []).map((member: any) => ({
          id: member.id,
          first_name: member.name.split(' ')[0] || '',
          last_name: member.name.split(' ').slice(1).join(' ') || '',
          role: member.role,
          is_active: true,
          last_login: member.last_login,
          created_at: member.created_at,
          projects_count: member.stats.projects_count,
          datasets_count: member.stats.datasets_count,
          comments_count: member.stats.comments_count,
          total_contributions: member.stats.total_contributions,
          is_online: member.is_online,
        })),
        role_distribution: {
          admin: response.community_stats.by_role.admin || 0,
          moderateur: response.community_stats.by_role.moderateur || 0,
          utilisateur: response.community_stats.by_role.utilisateur || 0,
        }
      };

      setCommunityData(transformedData);
      setTotalPages(Math.ceil((transformedData.total_members || 0) / itemsPerPage));
      
      console.log('✅ Données communautaires chargées:', {
        total_members: transformedData.total_members,
        active_users: transformedData.active_users,
        top_contributors: transformedData.top_contributors?.length || 0
      });
      
    } catch (err: any) {
      console.error('❌ Erreur lors du chargement des données communautaires:', err);
      setError(err.response?.data?.detail || err.message || 'Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, roleFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchCommunityData();
  }, [fetchCommunityData]);

  // Fonction d'aide
  const getUserDisplayName = (user: User) => `${user.first_name} ${user.last_name}`;
  
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'moderateur': return 'Modérateur';
      case 'utilisateur': return 'Contributeur';
      default: return role;
    }
  };
  
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default';
      case 'moderateur': return 'secondary';
      default: return 'outline';
    }
  };

  const getContributionLevel = (contributions: number) => {
    if (contributions >= 50) return { label: 'Expert', color: 'text-purple-600', bgColor: 'bg-purple-100' };
    if (contributions >= 20) return { label: 'Avancé', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    if (contributions >= 10) return { label: 'Intermédiaire', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (contributions >= 5) return { label: 'Débutant', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { label: 'Nouveau', color: 'text-gray-600', bgColor: 'bg-gray-100' };
  };

  const filteredMembers = communityData?.members?.filter(member => {
    const matchesSearch = searchTerm === '' || 
      getUserDisplayName(member).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'online' && member.is_online) ||
      (statusFilter === 'active' && member.is_active);
    
    return matchesSearch && matchesRole && matchesStatus;
  }) || [];

  // Données pour les graphiques
  const roleDistributionData = communityData ? [
    { name: 'Administrateurs', value: communityData.role_distribution.admin, color: '#8b5cf6' },
    { name: 'Modérateurs', value: communityData.role_distribution.moderateur, color: '#3b82f6' },
    { name: 'Contributeurs', value: communityData.role_distribution.utilisateur, color: '#10b981' }
  ] : [];

  const contributionDistributionData = communityData?.members ? 
    [
      { level: 'Nouveaux (0-4)', count: communityData.members.filter(m => m.total_contributions < 5).length },
      { level: 'Débutants (5-9)', count: communityData.members.filter(m => m.total_contributions >= 5 && m.total_contributions < 10).length },
      { level: 'Intermédiaires (10-19)', count: communityData.members.filter(m => m.total_contributions >= 10 && m.total_contributions < 20).length },
      { level: 'Avancés (20-49)', count: communityData.members.filter(m => m.total_contributions >= 20 && m.total_contributions < 50).length },
      { level: 'Experts (50+)', count: communityData.members.filter(m => m.total_contributions >= 50).length }
    ] : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-gray-600">Chargement de la communauté...</span>
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
            <Button onClick={fetchCommunityData} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!communityData) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">Aucune donnée communautaire disponible</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Communauté AgoraFlux</h1>
          <p className="text-gray-600">
            Découvrez les membres actifs et les statistiques de notre communauté
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchCommunityData} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Statistiques principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Membres</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{communityData.total_members}</div>
            <p className="text-xs text-muted-foreground">
              {communityData.new_users_this_month} nouveaux ce mois
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs Actifs</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{communityData.active_users}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((communityData.active_users / communityData.total_members) * 100)}% de la communauté
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Ligne</CardTitle>
            <Zap className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{communityData.online_users}</div>
            <p className="text-xs text-muted-foreground">
              connectés maintenant
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moy. Contributions</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {communityData.average_contributions.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              contributions par membre
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Onglets principaux */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="members">Membres ({communityData.total_members})</TabsTrigger>
          <TabsTrigger value="top">Top Contributors</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Répartition par rôles */}
            <Card>
              <CardHeader>
                <CardTitle>Répartition par Rôles</CardTitle>
                <CardDescription>Distribution des membres par niveau d'accès</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={roleDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {roleDistributionData.map((entry, index) => (
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

            {/* Niveau de contributions */}
            <Card>
              <CardHeader>
                <CardTitle>Niveaux de Contribution</CardTitle>
                <CardDescription>Répartition des membres par activité</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={contributionDistributionData}>
                      <XAxis 
                        dataKey="level" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Résumé des rôles */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-purple-800 flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  Administrateurs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600 mb-2">
                  {communityData.role_distribution.admin}
                </div>
                <p className="text-sm text-purple-700">
                  Gestion complète de la plateforme
                </p>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-blue-800 flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Modérateurs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {communityData.role_distribution.moderateur}
                </div>
                <p className="text-sm text-blue-700">
                  Modération des discussions
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-green-800 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Contributeurs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 mb-2">
                  {communityData.role_distribution.utilisateur}
                </div>
                <p className="text-sm text-green-700">
                  Membres actifs de la communauté
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Liste des membres */}
        <TabsContent value="members" className="space-y-6">
          {/* Filtres et recherche */}
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
                      placeholder="Rechercher un membre..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les rôles</SelectItem>
                    <SelectItem value="admin">Administrateurs</SelectItem>
                    <SelectItem value="moderateur">Modérateurs</SelectItem>
                    <SelectItem value="utilisateur">Contributeurs</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="online">En ligne</SelectItem>
                    <SelectItem value="active">Actifs</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(value) => {
                  if (value.endsWith('_desc')) {
                    setSortBy(value.replace('_desc', ''));
                    setSortOrder('desc');
                  } else if (value.endsWith('_asc')) {
                    setSortBy(value.replace('_asc', ''));
                    setSortOrder('asc');
                  } else {
                    setSortBy(value);
                    setSortOrder('desc');
                  }
                }}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Trier par" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contributions">Plus de contributions</SelectItem>
                    <SelectItem value="projects">Plus de projets</SelectItem>
                    <SelectItem value="comments">Plus de commentaires</SelectItem>
                    <SelectItem value="datasets">Plus de datasets</SelectItem>
                    <SelectItem value="created_at">Récemment rejoint</SelectItem>
                    <SelectItem value="last_login">Dernière connexion</SelectItem>
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

          {/* Grille des membres */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredMembers.map((member) => {
              const contributionLevel = getContributionLevel(member.total_contributions);
              return (
                <Card key={member.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="text-lg font-semibold">
                              {member.first_name[0]}{member.last_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          {member.is_online && (
                            <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 border-2 border-white rounded-full"></div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold">{getUserDisplayName(member)}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={getRoleBadgeVariant(member.role)} className="text-xs">
                              {getRoleDisplayName(member.role)}
                            </Badge>
                            {member.role === 'admin' && <Crown className="h-3 w-3 text-yellow-500" />}
                            {member.role === 'moderateur' && <Award className="h-3 w-3 text-blue-500" />}
                          </div>
                        </div>
                      </div>
                      <Badge className={`${contributionLevel.bgColor} ${contributionLevel.color} text-xs`}>
                        {contributionLevel.label}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-lg font-bold text-blue-600">{member.projects_count}</div>
                          <div className="text-xs text-gray-500">Projets</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-green-600">{member.datasets_count}</div>
                          <div className="text-xs text-gray-500">Datasets</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-purple-600">{member.comments_count}</div>
                          <div className="text-xs text-gray-500">Comments</div>
                        </div>
                      </div>

                      {/* Assuming Separator is imported or defined elsewhere */}
                      {/* <Separator /> */}

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Total contributions</span>
                        <span className="font-semibold">{member.total_contributions}</span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Membre depuis</span>
                        <span>{new Date(member.created_at).toLocaleDateString('fr-FR', { 
                          month: 'short', 
                          year: 'numeric' 
                        })}</span>
                      </div>

                      {member.last_login && (
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Dernière connexion</span>
                          <span>{new Date(member.last_login).toLocaleDateString('fr-FR')}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredMembers.length === 0 && (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Aucun membre trouvé avec ces filtres</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Top contributors */}
        <TabsContent value="top" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Top Contributors
              </CardTitle>
              <CardDescription>
                Les membres les plus actifs de notre communauté
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {communityData.top_contributors?.map((contributor, index) => {
                  const contributionLevel = getContributionLevel(contributor.total_contributions);
                  return (
                    <div key={contributor.id} className="flex items-center gap-4 p-4 rounded-lg border hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            index === 0 ? 'bg-yellow-100 text-yellow-800' :
                            index === 1 ? 'bg-gray-100 text-gray-800' :
                            index === 2 ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {index + 1}
                          </div>
                        </div>
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="text-lg font-semibold">
                            {contributor.first_name[0]}{contributor.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{getUserDisplayName(contributor)}</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant={getRoleBadgeVariant(contributor.role)} className="text-xs">
                              {getRoleDisplayName(contributor.role)}
                            </Badge>
                            <Badge className={`${contributionLevel.bgColor} ${contributionLevel.color} text-xs`}>
                              {contributionLevel.label}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 grid grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-lg font-bold text-blue-600">{contributor.projects_count}</div>
                          <div className="text-xs text-gray-500">Projets</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-green-600">{contributor.datasets_count}</div>
                          <div className="text-xs text-gray-500">Datasets</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-purple-600">{contributor.comments_count}</div>
                          <div className="text-xs text-gray-500">Comments</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-orange-600">{contributor.total_contributions}</div>
                          <div className="text-xs text-gray-500">Total</div>
                        </div>
                      </div>

                      {index < 3 && (
                        <div className="flex items-center">
                          {index === 0 && <Trophy className="h-6 w-6 text-yellow-500" />}
                          {index === 1 && <Award className="h-6 w-6 text-gray-500" />}
                          {index === 2 && <Star className="h-6 w-6 text-orange-500" />}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Activité de la Communauté</CardTitle>
                <CardDescription>Indicateurs clés de performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Taux d'activité</span>
                  <span className="text-sm text-gray-600">
                    {Math.round((communityData.active_users / communityData.total_members) * 100)}%
                  </span>
                </div>
                <Progress value={(communityData.active_users / communityData.total_members) * 100} className="h-2" />

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Utilisateurs en ligne</span>
                  <span className="text-sm text-gray-600">
                    {Math.round((communityData.online_users / communityData.total_members) * 100)}%
                  </span>
                </div>
                <Progress value={(communityData.online_users / communityData.total_members) * 100} className="h-2" />

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Contributions moyennes</span>
                  <span className="text-sm text-gray-600">
                    {communityData.average_contributions.toFixed(1)} par membre
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Nouveaux membres (ce mois)</span>
                  <span className="text-sm text-gray-600">
                    {communityData.new_users_this_month}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Répartition des Contributions</CardTitle>
                <CardDescription>Distribution de l'activité par niveau</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {contributionDistributionData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{item.level}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ 
                              width: `${(item.count / Math.max(...contributionDistributionData.map(d => d.count))) * 100}%` 
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium w-8 text-right">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CommunityDashboard; 