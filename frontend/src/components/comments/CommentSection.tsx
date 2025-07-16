import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Filter, Search, SortAsc, SortDesc } from 'lucide-react';
import CommentThread from './CommentThread';
import { BackendComment } from '../../services/api';
import apiService from '../../services/api';

interface CommentSectionProps {
  projectId: number;
  currentUserId?: number;
  allowComments?: boolean;
}

interface NewCommentData {
  content: string;
  type: 'COMMENT' | 'SUGGESTION' | 'QUESTION' | 'ANSWER';
  parent_id?: number;
}

const CommentSection: React.FC<CommentSectionProps> = ({
  projectId,
  currentUserId,
  allowComments = true
}) => {
  const [comments, setComments] = useState<BackendComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // État pour nouveau commentaire
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState<'COMMENT' | 'SUGGESTION' | 'QUESTION' | 'ANSWER'>('COMMENT');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // États pour filtres et tri
  const [filter, setFilter] = useState<'all' | 'comments' | 'suggestions' | 'questions'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'most_liked'>('newest');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Charger les commentaires
  useEffect(() => {
    loadComments();
  }, [projectId]);

  const loadComments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getComments(projectId);
      setComments(response.comments || []);
    } catch (err: any) {
      console.error('Erreur lors du chargement des commentaires:', err);
      setError('Erreur lors du chargement des commentaires');
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (parentId?: number) => {
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    try {
      const commentData: NewCommentData = {
        content: newComment.trim(),
        type: commentType,
        ...(parentId && { parent_id: parentId })
      };
      
      const response = await apiService.createComment(projectId, commentData);
      
      // Recharger les commentaires pour avoir la structure complète
      await loadComments();
      
      // Réinitialiser le formulaire
      setNewComment('');
      setCommentType('COMMENT');
      
    } catch (err: any) {
      console.error('Erreur lors de la création du commentaire:', err);
      setError('Erreur lors de la création du commentaire');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (parentId: number, content: string) => {
    setIsSubmitting(true);
    try {
      const commentData: NewCommentData = {
        content: content.trim(),
        type: 'COMMENT',
        parent_id: parentId
      };
      
      await apiService.createComment(projectId, commentData);
      await loadComments();
      
    } catch (err: any) {
      console.error('Erreur lors de la réponse:', err);
      setError('Erreur lors de la réponse');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (commentId: number) => {
    try {
      await apiService.likeComment(projectId, commentId);
      await loadComments(); // Recharger pour mettre à jour les compteurs
    } catch (err: any) {
      console.error('Erreur lors du like:', err);
    }
  };

  const handleEdit = async (commentId: number, content: string) => {
    try {
      await apiService.updateComment(projectId, commentId, { content });
      await loadComments();
    } catch (err: any) {
      console.error('Erreur lors de la modification:', err);
      setError('Erreur lors de la modification');
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) {
      return;
    }
    
    try {
      await apiService.deleteComment(projectId, commentId);
      await loadComments();
    } catch (err: any) {
      console.error('Erreur lors de la suppression:', err);
      setError('Erreur lors de la suppression');
    }
  };

  // Filtrer et trier les commentaires
  const filteredComments = comments.filter(comment => {
    const matchesFilter = filter === 'all' || 
      (filter === 'comments' && comment.type === 'COMMENT') ||
      (filter === 'suggestions' && comment.type === 'SUGGESTION') ||
      (filter === 'questions' && comment.type === 'QUESTION');
    
    const matchesSearch = searchTerm === '' || 
      comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.author.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const sortedComments = [...filteredComments].sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'most_liked':
        return b.likes_count - a.likes_count;
      case 'newest':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const totalComments = comments.reduce((total, comment) => {
    return total + 1 + (comment.replies?.length || 0);
  }, 0);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-6 w-6 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900">
              Commentaires ({totalComments})
            </h3>
          </div>
          
          {/* Filtres et tri */}
          <div className="flex items-center gap-3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous les types</option>
              <option value="comments">Commentaires</option>
              <option value="suggestions">Suggestions</option>
              <option value="questions">Questions</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="newest">Plus récents</option>
              <option value="oldest">Plus anciens</option>
              <option value="most_liked">Plus aimés</option>
            </select>
          </div>
        </div>
        
        {/* Barre de recherche */}
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher dans les commentaires..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Formulaire de nouveau commentaire */}
      {allowComments && currentUserId && (
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <select
                value={commentType}
                onChange={(e) => setCommentType(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="COMMENT">Commentaire</option>
                <option value="SUGGESTION">Suggestion</option>
                <option value="QUESTION">Question</option>
              </select>
            </div>
            
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Écrivez votre commentaire..."
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={4}
            />
            
            <div className="flex justify-end">
              <button
                onClick={() => handleSubmitComment()}
                disabled={!newComment.trim() || isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {isSubmitting ? 'Publication...' : 'Publier'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages d'erreur */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
          {error}
        </div>
      )}

      {/* Liste des commentaires */}
      <div className="p-6">
        {sortedComments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">Aucun commentaire</h3>
            <p>
              {searchTerm || filter !== 'all' 
                ? 'Aucun commentaire ne correspond à vos critères.'
                : 'Soyez le premier à commenter ce projet !'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedComments.map((comment) => (
              <CommentThread
                key={comment.id}
                comment={comment}
                onReply={handleReply}
                onLike={handleLike}
                onEdit={handleEdit}
                onDelete={handleDelete}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSection; 