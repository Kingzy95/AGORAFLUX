import React, { useState, useEffect } from 'react';
import { Users, UserCheck, Star, Clock, Activity, Award, TrendingUp, UserPlus, Eye, Search, Filter } from 'lucide-react';
import apiService from '../services/api';
import { useAuth } from '../context/AuthContext';

interface CommunityMember {
  id: number;
  name: string;
  avatar: string;
  role: string;
  bio?: string;
  created_at: string;
  last_login?: string;
  days_since_creation: number;
  days_since_last_login?: number;
  is_online: boolean;
  stats: {
    projects_count: number;
    datasets_count: number;
    comments_count: number;
    total_contributions: number;
  };
}

interface CommunityData {
  community_stats: {
    total_users: number;
    active_users_30d: number;
    new_users_7d: number;
    online_users: number;
    by_role: { [role: string]: number };
    avg_contributions: number;
  };
  members: CommunityMember[];
  top_contributors: CommunityMember[];
  online_users: CommunityMember[];
  pagination: {
    total: number;
    page: number;
    per_page: number;
    pages: number;
  };
}

const CommunityDashboard: React.FC = () => {
  const { user } = useAuth();
  const [communityData, setCommunityData] = useState<CommunityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtres et tri
  const [sortBy, setSortBy] = useState('contributions');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);

  const roleLabels = {
    admin: 'Administrateur',
    moderator: 'Modérateur',
    user: 'Utilisateur'
  };

  const roleColors = {
    admin: 'bg-red-100 text-red-800 border-red-200',
    moderator: 'bg-blue-100 text-blue-800 border-blue-200',
    user: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  const fetchCommunityData = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        per_page: 20,
        sort_by: sortBy,
        sort_order: sortOrder
      };
      
      const data = await apiService.getCommunityStats(params);
      setCommunityData(data);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des données de la communauté');
      console.error('Erreur lors du chargement de la communauté:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunityData();
  }, [currentPage, sortBy, sortOrder]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatLastSeen = (days?: number) => {
    if (days === undefined || days === null) return 'Jamais connecté';
    if (days === 0) return 'En ligne';
    if (days === 1) return 'Il y a 1 jour';
    if (days < 7) return `Il y a ${days} jours`;
    if (days < 30) return `Il y a ${Math.floor(days / 7)} semaine${Math.floor(days / 7) > 1 ? 's' : ''}`;
    return `Il y a ${Math.floor(days / 30)} mois`;
  };

  if (loading && !communityData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={fetchCommunityData}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-600" />
                Dashboard Community
              </h1>
              <p className="text-gray-600 mt-2">
                Découvrez les membres actifs de la communauté AgoraFlux
              </p>
            </div>
            
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Inviter
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Statistiques générales */}
        {communityData?.community_stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Membres Total</p>
                  <p className="text-3xl font-bold text-gray-900">{communityData.community_stats.total_users}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Actifs (30j)</p>
                  <p className="text-3xl font-bold text-green-600">{communityData.community_stats.active_users_30d}</p>
                </div>
                <Activity className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Nouveaux (7j)</p>
                  <p className="text-3xl font-bold text-purple-600">{communityData.community_stats.new_users_7d}</p>
                </div>
                <UserPlus className="h-8 w-8 text-purple-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">En ligne</p>
                  <p className="text-3xl font-bold text-emerald-600">{communityData.community_stats.online_users}</p>
                </div>
                <div className="h-8 w-8 bg-emerald-100 rounded-full flex items-center justify-center">
                  <div className="h-4 w-4 bg-emerald-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne principale - Liste des membres */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filtres et tri */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Membres de la communauté</h2>
                
                <div className="flex gap-3">
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [newSortBy, newSortOrder] = e.target.value.split('-');
                      setSortBy(newSortBy);
                      setSortOrder(newSortOrder);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="contributions-desc">Plus de contributions</option>
                    <option value="contributions-asc">Moins de contributions</option>
                    <option value="projects-desc">Plus de projets</option>
                    <option value="comments-desc">Plus de commentaires</option>
                    <option value="created_at-desc">Plus récents</option>
                    <option value="created_at-asc">Plus anciens</option>
                    <option value="last_login-desc">Dernière connexion</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Liste des membres */}
            <div className="space-y-4">
              {communityData?.members.map((member) => (
                <div key={member.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white text-lg font-semibold">
                            {member.avatar}
                          </div>
                          {member.is_online && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">{member.name}</h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${roleColors[member.role as keyof typeof roleColors] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                              {roleLabels[member.role as keyof typeof roleLabels] || member.role}
                            </span>
                          </div>
                          
                          {member.bio && (
                            <p className="text-gray-600 mb-3 line-clamp-2">{member.bio}</p>
                          )}
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4" />
                              <span>{member.stats.total_contributions} contributions</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              <span>{member.stats.projects_count} projets</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>{member.stats.comments_count} commentaires</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{formatLastSeen(member.days_since_last_login)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {communityData && communityData.pagination.pages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Précédent
                  </button>
                  
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, communityData.pagination.pages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-2 text-sm font-medium ${
                            currentPage === pageNum
                              ? 'text-blue-600 bg-blue-50 border-blue-500'
                              : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50'
                          } border`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(communityData.pagination.pages, currentPage + 1))}
                    disabled={currentPage === communityData.pagination.pages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar droite */}
          <div className="space-y-6">
            {/* Top contributeurs */}
            {communityData?.top_contributors && communityData.top_contributors.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  Top Contributeurs
                </h3>
                <div className="space-y-3">
                  {communityData.top_contributors.slice(0, 5).map((contributor, index) => (
                    <div key={contributor.id} className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                          index === 0 ? 'bg-yellow-500' : 
                          index === 1 ? 'bg-gray-400' : 
                          index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                        }`}>
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{contributor.name}</p>
                        <p className="text-xs text-gray-500">{contributor.stats.total_contributions} contributions</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Utilisateurs en ligne */}
            {communityData?.online_users && communityData.online_users.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                  En ligne maintenant
                </h3>
                <div className="space-y-3">
                  {communityData.online_users.slice(0, 8).map((user) => (
                    <div key={user.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {user.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                        <p className="text-xs text-gray-500">{roleLabels[user.role as keyof typeof roleLabels] || user.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Statistiques par rôle */}
            {communityData?.community_stats.by_role && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-blue-500" />
                  Répartition par rôle
                </h3>
                <div className="space-y-3">
                  {Object.entries(communityData.community_stats.by_role).map(([role, count]) => (
                    <div key={role} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{roleLabels[role as keyof typeof roleLabels] || role}</span>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Contributions moyennes</span>
                    <span className="text-sm font-medium text-gray-900">
                      {Math.round(communityData.community_stats.avg_contributions)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Message si aucun membre */}
        {communityData?.members.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Aucun membre trouvé</h3>
            <p className="mt-2 text-gray-500">
              La communauté grandit chaque jour. Revenez bientôt !
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityDashboard; 