import React, { useState, useEffect } from 'react';
import { Search, Filter, MessageSquare, Users, TrendingUp, Clock, ThumbsUp, MessageCircle, Pin, Eye, EyeOff, Trash2, CheckCircle, MoreVertical, Shield } from 'lucide-react';
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

  // États pour les confirmations
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [showHideConfirm, setShowHideConfirm] = useState<number | null>(null);

  // Vérifier les permissions d'accès
  const isAdmin = user?.role === 'admin';
  const isModerator = user?.role === 'moderateur';
  const hasAccess = isAdmin || isModerator;

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

  // Fonctions de modération
  const handlePinDiscussion = async (discussionId: number, isPinned: boolean) => {
    try {
      const projectId = discussions?.discussions.find(d => d.id === discussionId)?.project.id;
      if (!projectId) return;

      const action = isPinned ? 'unpin' : 'pin';
      await apiService.moderateComment(projectId, discussionId, action);
      
      // Mise à jour locale immédiate
      setDiscussions(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          discussions: prev.discussions.map(d => 
            d.id === discussionId ? { ...d, is_pinned: !isPinned } : d
          )
        };
      });

      // Recharger pour obtenir la dernière version
      await fetchDiscussions();
    } catch (error) {
      console.error('Erreur lors de l\'épinglage:', error);
      alert('Erreur lors de l\'épinglage du commentaire');
    }
  };

  const handleHideDiscussion = async (discussionId: number) => {
    try {
      const discussion = discussions?.discussions.find(d => d.id === discussionId);
      if (!discussion) return;

      const reason = prompt('Raison du masquage (optionnel):') || '';
      await apiService.hideComment(discussion.project.id, discussionId, reason);
      
      // Retirer de la liste locale immédiatement
      setDiscussions(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          discussions: prev.discussions.filter(d => d.id !== discussionId),
          total: prev.total - 1
        };
      });

      setShowHideConfirm(null);
    } catch (error) {
      console.error('Erreur lors du masquage:', error);
      alert('Erreur lors du masquage du commentaire');
    }
  };

  const handleDeleteDiscussion = async (discussionId: number) => {
    try {
      const discussion = discussions?.discussions.find(d => d.id === discussionId);
      if (!discussion) return;

      const reason = prompt('Raison de la suppression (obligatoire):');
      if (!reason?.trim()) {
        alert('Une raison est requise pour la suppression définitive');
        return;
      }

      await apiService.deleteCommentPermanently(discussion.project.id, discussionId, reason);
      
      // Retirer de la liste locale immédiatement
      setDiscussions(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          discussions: prev.discussions.filter(d => d.id !== discussionId),
          total: prev.total - 1
        };
      });

      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression du commentaire');
    }
  };

  const handleResolveDiscussion = async (discussionId: number) => {
    try {
      const discussion = discussions?.discussions.find(d => d.id === discussionId);
      if (!discussion) return;

      const reason = prompt('Raison de la résolution (optionnel):') || '';
      await apiService.resolveComment(discussion.project.id, discussionId, reason);
      
      // Mise à jour locale pour marquer comme résolu
      setDiscussions(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          discussions: prev.discussions.map(d => 
            d.id === discussionId ? { ...d, status: 'resolved' } : d
          )
        };
      });

      // Recharger pour obtenir la dernière version
      await fetchDiscussions();
    } catch (error) {
      console.error('Erreur lors de la résolution:', error);
      alert('Erreur lors de la résolution de la discussion');
    }
  };

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

  // Vérification d'accès après tous les hooks
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-red-500">
            <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2 text-gray-900">Accès Restreint</h2>
          <p className="text-gray-600 mb-4">
            Cette page est réservée aux modérateurs et administrateurs.
          </p>
          <p className="text-sm text-gray-500">
            Votre rôle actuel : <span className="font-medium">{user?.role || 'Non connecté'}</span>
          </p>
        </div>
      </div>
    );
  }

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

                    {/* Actions de modération */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handlePinDiscussion(discussion.id, discussion.is_pinned)}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                              discussion.is_pinned 
                                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' 
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <Pin className="h-3 w-3" />
                            {discussion.is_pinned ? 'Désépingler' : 'Épingler'}
                          </button>

                          <button
                            onClick={() => handleResolveDiscussion(discussion.id)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-green-300 text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Résoudre
                          </button>

                          {isAdmin && (
                            <>
                              <button
                                onClick={() => setShowHideConfirm(discussion.id)}
                                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-yellow-300 text-yellow-700 bg-yellow-50 hover:bg-yellow-100 transition-colors"
                              >
                                <EyeOff className="h-3 w-3" />
                                Masquer
                              </button>

                              <button
                                onClick={() => setShowDeleteConfirm(discussion.id)}
                                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                              >
                                <Trash2 className="h-3 w-3" />
                                Supprimer
                              </button>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            discussion.status === 'resolved' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {discussion.status === 'resolved' ? 'Résolu' : 'Actif'}
                          </span>
                          
                          {(isAdmin || isModerator) && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              <Shield className="h-3 w-3 mr-1" />
                              {isAdmin ? 'Admin' : 'Modérateur'}
                            </span>
                          )}
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

      {/* Modales de confirmation */}
      {showHideConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirmer le masquage</h3>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir masquer cette discussion ? Elle ne sera plus visible dans le projet mais restera accessible via le dashboard de modération.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowHideConfirm(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleHideDiscussion(showHideConfirm)}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Masquer
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-red-600">Confirmer la suppression</h3>
            <p className="text-gray-600 mb-6">
              <strong>Attention :</strong> Cette action est irréversible. La discussion sera définitivement supprimée et ne pourra pas être restaurée.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDeleteDiscussion(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscussionsDashboard; 