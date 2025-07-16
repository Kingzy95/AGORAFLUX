import React, { useState, useEffect } from 'react';
import { Search, Filter, MessageSquare, Users, TrendingUp, Clock, ThumbsUp, MessageCircle, Pin, Eye } from 'lucide-react';
import apiService from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Discussion {
  id: number;
  content: string;
  type: string;
  status: string;
  project: {
    id: number;
    title: string;
    slug: string;
  };
  author: {
    id: number;
    name: string;
    avatar: string;
    role: string;
  };
  created_at: string;
  updated_at: string | null;
  likes_count: number;
  replies_count: number;
  is_edited: boolean;
  is_pinned: boolean;
}

interface DiscussionsData {
  discussions: Discussion[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
  stats: {
    total_discussions: number;
    active_discussions: number;
    by_type: {
      comment: number;
      question: number;
      suggestion: number;
      annotation: number;
    };
  };
}

const DiscussionsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [discussions, setDiscussions] = useState<DiscussionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtres et recherche
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);

  const typeLabels = {
    comment: 'Commentaire',
    question: 'Question', 
    suggestion: 'Suggestion',
    annotation: 'Annotation'
  };

  const typeColors = {
    comment: 'bg-blue-100 text-blue-800',
    question: 'bg-yellow-100 text-yellow-800',
    suggestion: 'bg-green-100 text-green-800',
    annotation: 'bg-purple-100 text-purple-800'
  };

  const roleColors = {
    admin: 'bg-red-100 text-red-700',
    moderator: 'bg-blue-100 text-blue-700',
    user: 'bg-gray-100 text-gray-700'
  };

  const fetchDiscussions = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        per_page: 20,
        ...(selectedType && { comment_type: selectedType }),
        ...(searchTerm && { search: searchTerm }),
        sort_by: sortBy,
        sort_order: sortOrder
      };
      
      const data = await apiService.getAllDiscussions(params);
      setDiscussions(data);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des discussions');
      console.error('Erreur lors du chargement des discussions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscussions();
  }, [currentPage, selectedType, sortBy, sortOrder]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (currentPage === 1) {
        fetchDiscussions();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)} h`;
    if (diffInMinutes < 10080) return `Il y a ${Math.floor(diffInMinutes / 1440)} j`;
    
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPage === 1) {
      fetchDiscussions();
    } else {
      setCurrentPage(1);
    }
  };

  if (loading && !discussions) {
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
              onClick={fetchDiscussions}
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
                <MessageSquare className="h-8 w-8 text-blue-600" />
                Dashboard Discussions
              </h1>
              <p className="text-gray-600 mt-2">
                Centralisez et gérez toutes les conversations de la plateforme
              </p>
            </div>
            
            {user?.role === 'admin' && (
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Modération
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Statistiques */}
        {discussions?.stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Discussions</p>
                  <p className="text-3xl font-bold text-gray-900">{discussions.stats.total_discussions}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Discussions Actives</p>
                  <p className="text-3xl font-bold text-green-600">{discussions.stats.active_discussions}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Questions</p>
                  <p className="text-3xl font-bold text-yellow-600">{discussions.stats.by_type.question}</p>
                </div>
                <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 font-bold">?</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Suggestions</p>
                  <p className="text-3xl font-bold text-purple-600">{discussions.stats.by_type.suggestion}</p>
                </div>
                <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-bold">!</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtres et recherche */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <form onSubmit={handleSearch} className="flex-1 w-full lg:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Rechercher dans les discussions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </form>

            <div className="flex gap-4 w-full lg:w-auto">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tous les types</option>
                <option value="comment">Commentaires</option>
                <option value="question">Questions</option>
                <option value="suggestion">Suggestions</option>
                <option value="annotation">Annotations</option>
              </select>

              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('-');
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="created_at-desc">Plus récent</option>
                <option value="created_at-asc">Plus ancien</option>
                <option value="likes_count-desc">Plus de likes</option>
                <option value="replies_count-desc">Plus de réponses</option>
              </select>
            </div>
          </div>
        </div>

        {/* Liste des discussions */}
        <div className="space-y-4">
          {discussions?.discussions.map((discussion) => (
            <div key={discussion.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors[discussion.type as keyof typeof typeColors] || 'bg-gray-100 text-gray-800'}`}>
                        {typeLabels[discussion.type as keyof typeof typeLabels] || discussion.type}
                      </span>
                      
                      {discussion.is_pinned && (
                        <Pin className="h-4 w-4 text-amber-500" />
                      )}
                      
                      <span className="text-sm text-gray-500">
                        dans{' '}
                        <span className="font-medium text-blue-600 hover:text-blue-700 cursor-pointer">
                          {discussion.project.title}
                        </span>
                      </span>
                    </div>

                    <p className="text-gray-900 mb-4 line-clamp-3">
                      {discussion.content}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {discussion.author.avatar}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{discussion.author.name}</p>
                            <p className="text-xs text-gray-500">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[discussion.author.role as keyof typeof roleColors] || 'bg-gray-100 text-gray-700'}`}>
                                {discussion.author.role}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="h-4 w-4" />
                          <span>{discussion.likes_count}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-4 w-4" />
                          <span>{discussion.replies_count}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatDate(discussion.created_at)}</span>
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
        {discussions && discussions.pages > 1 && (
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
                {Array.from({ length: Math.min(5, discussions.pages) }, (_, i) => {
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
                onClick={() => setCurrentPage(Math.min(discussions.pages, currentPage + 1))}
                disabled={currentPage === discussions.pages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
          </div>
        )}

        {/* Message si aucune discussion */}
        {discussions?.discussions.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Aucune discussion trouvée</h3>
            <p className="mt-2 text-gray-500">
              {searchTerm || selectedType 
                ? 'Essayez de modifier vos critères de recherche'
                : 'Les discussions apparaîtront ici une fois créées'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscussionsDashboard; 