import React, { useState } from 'react';
import { MessageSquare, ThumbsUp, Reply, MoreVertical, Edit2, Trash2, Flag, Clock, User } from 'lucide-react';
import { BackendComment } from '../../services/api';

interface CommentThreadProps {
  comment: BackendComment;
  depth?: number;
  maxDepth?: number;
  onReply?: (parentId: number, content: string) => void;
  onLike?: (commentId: number) => void;
  onEdit?: (commentId: number, content: string) => void;
  onDelete?: (commentId: number) => void;
  currentUserId?: number;
}

const CommentThread: React.FC<CommentThreadProps> = ({
  comment,
  depth = 0,
  maxDepth = 5,
  onReply,
  onLike,
  onEdit,
  onDelete,
  currentUserId
}) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showActions, setShowActions] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const isOwner = currentUserId === comment.author.id;
  const canReply = depth < maxDepth;
  const hasReplies = comment.replies && comment.replies.length > 0;

  const handleReply = () => {
    if (replyContent.trim() && onReply) {
      onReply(comment.id, replyContent.trim());
      setReplyContent('');
      setIsReplying(false);
    }
  };

  const handleEdit = () => {
    if (editContent.trim() && onEdit) {
      onEdit(comment.id, editContent.trim());
      setIsEditing(false);
    }
  };

  const handleLike = () => {
    if (onLike) {
      onLike(comment.id);
    }
  };

  const getCommentTypeIcon = (type: string) => {
    switch (type) {
      case 'SUGGESTION':
        return <MessageSquare className="h-4 w-4 text-blue-600" />;
      case 'QUESTION':
        return <MessageSquare className="h-4 w-4 text-orange-600" />;
      case 'ANSWER':
        return <MessageSquare className="h-4 w-4 text-green-600" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-600" />;
    }
  };

  const getCommentTypeLabel = (type: string) => {
    switch (type) {
      case 'SUGGESTION':
        return 'Suggestion';
      case 'QUESTION':
        return 'Question';
      case 'ANSWER':
        return 'Réponse';
      default:
        return 'Commentaire';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'À l\'instant';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `Il y a ${minutes} min`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `Il y a ${hours}h`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `Il y a ${days}j`;
    }
  };

  const getIndentationStyle = (depth: number) => {
    return {
      marginLeft: `${depth * 24}px`,
      borderLeft: depth > 0 ? '2px solid #e5e7eb' : 'none',
      paddingLeft: depth > 0 ? '16px' : '0',
    };
  };

  return (
    <div className="comment-thread">
      {/* Commentaire principal */}
      <div 
        className={`bg-white rounded-lg border border-gray-200 p-4 ${depth > 0 ? 'mt-3' : 'mb-4'}`}
        style={getIndentationStyle(depth)}
      >
        {/* Header du commentaire */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {comment.author.avatar}
              </div>
            </div>
            
            {/* Informations de l'auteur */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-gray-900">{comment.author.name}</span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  comment.author.role === 'admin' ? 'bg-red-100 text-red-700' :
                  comment.author.role === 'moderator' ? 'bg-purple-100 text-purple-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {comment.author.role}
                </span>
                <span className="flex items-center gap-1 text-sm text-gray-500">
                  {getCommentTypeIcon(comment.type)}
                  {getCommentTypeLabel(comment.type)}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                <Clock className="h-3 w-3" />
                <span>{formatTimeAgo(comment.created_at)}</span>
                {comment.is_edited && (
                  <span className="text-gray-400">(modifié)</span>
                )}
                {comment.is_pinned && (
                  <span className="text-blue-600 font-medium">Épinglé</span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            
            {showActions && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10">
                {isOwner && (
                  <>
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setShowActions(false);
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                    >
                      <Edit2 className="h-4 w-4" />
                      Modifier
                    </button>
                    <button
                      onClick={() => {
                        if (onDelete) onDelete(comment.id);
                        setShowActions(false);
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                    >
                      <Trash2 className="h-4 w-4" />
                      Supprimer
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowActions(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                >
                  <Flag className="h-4 w-4" />
                  Signaler
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Contenu du commentaire */}
        <div className="mt-3">
          {isEditing ? (
            <div className="space-y-3">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
                placeholder="Modifier votre commentaire..."
              />
              <div className="flex gap-2">
                <button
                  onClick={handleEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sauvegarder
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <div className="text-gray-800 whitespace-pre-wrap">
              {comment.content}
            </div>
          )}
        </div>

        {/* Actions du commentaire */}
        {!isEditing && (
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
            <button
              onClick={handleLike}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors"
            >
              <ThumbsUp className="h-4 w-4" />
              <span>{comment.likes_count}</span>
            </button>
            
            {canReply && (
              <button
                onClick={() => setIsReplying(!isReplying)}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors"
              >
                <Reply className="h-4 w-4" />
                Répondre
              </button>
            )}
            
            {hasReplies && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                <span>{comment.replies_count} réponse{comment.replies_count > 1 ? 's' : ''}</span>
                <span className="text-xs">({isExpanded ? 'masquer' : 'afficher'})</span>
              </button>
            )}
          </div>
        )}

        {/* Formulaire de réponse */}
        {isReplying && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
              placeholder="Écrivez votre réponse..."
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleReply}
                disabled={!replyContent.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Répondre
              </button>
              <button
                onClick={() => {
                  setIsReplying(false);
                  setReplyContent('');
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Réponses (threads enfants) */}
      {isExpanded && hasReplies && (
        <div className="replies">
          {comment.replies?.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              maxDepth={maxDepth}
              onReply={onReply}
              onLike={onLike}
              onEdit={onEdit}
              onDelete={onDelete}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentThread; 