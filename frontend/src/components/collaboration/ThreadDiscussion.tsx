import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Tooltip,
  Badge,
  Collapse,
  Alert
} from '@mui/material';
import {
  Reply as ReplyIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  EmojiEmotions as EmojiIcon,
  Send as SendIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as ResolveIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import { Thread, Reply, AnnotationWithThread, Reaction, MentionSuggestion } from '../../types/collaboration';
import MentionInput from './MentionInput';

interface ThreadDiscussionProps {
  annotation: AnnotationWithThread;
  onAddReply: (annotationId: string, reply: Omit<Reply, 'id' | 'timestamp'>) => void;
  onUpdateReply: (replyId: string, updates: Partial<Reply>) => void;
  onDeleteReply: (replyId: string) => void;
  onAddReaction: (targetId: string, targetType: 'annotation' | 'reply', emoji: string) => void;
  onResolveThread: (annotationId: string) => void;
  availableUsers?: MentionSuggestion[];
  compact?: boolean;
}

const ThreadDiscussion: React.FC<ThreadDiscussionProps> = ({
  annotation,
  onAddReply,
  onUpdateReply,
  onDeleteReply,
  onAddReaction,
  onResolveThread,
  availableUsers = [],
  compact = false
}) => {
  const { user } = useAuth();
  const [replyContent, setReplyContent] = useState('');
  const [showReplies, setShowReplies] = useState(false);
  const [editingReply, setEditingReply] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [menuAnchor, setMenuAnchor] = useState<{ element: HTMLElement; replyId: string } | null>(null);
  const [emojiMenuAnchor, setEmojiMenuAnchor] = useState<{ element: HTMLElement; targetId: string; targetType: 'annotation' | 'reply' } | null>(null);
  
  const replyInputRef = useRef<HTMLInputElement>(null);

  const thread = annotation.thread;
  const hasReplies = thread && thread.replies.length > 0;
  const canResolve = user?.role === 'admin' || user?.role === 'moderateur' || String(user?.id) === String(annotation.userId);

  // Émojis disponibles pour les réactions
  const availableEmojis = ['👍', '👎', '❤️', '😊', '😮', '😢', '🎉', '🚀'];

  const handleSubmitReply = () => {
    if (!replyContent.trim() || !user) return;

    onAddReply(annotation.id, {
      parentId: annotation.id,
      userId: user.id,
      userName: `${user.first_name} ${user.last_name}`,
      userRole: user.role,
      content: replyContent.trim()
    });

    setReplyContent('');
    setShowReplies(true);
  };

  const handleEditReply = (reply: Reply) => {
    setEditingReply(reply.id);
    setEditContent(reply.content);
    setMenuAnchor(null);
  };

  const handleSaveEdit = (replyId: string) => {
    if (editContent.trim()) {
      onUpdateReply(replyId, {
        content: editContent.trim(),
        isEdited: true,
        editedAt: new Date()
      });
    }
    setEditingReply(null);
    setEditContent('');
  };

  const handleDeleteReply = (replyId: string) => {
    onDeleteReply(replyId);
    setMenuAnchor(null);
  };

  const handleAddReaction = (emoji: string) => {
    if (emojiMenuAnchor) {
      onAddReaction(emojiMenuAnchor.targetId, emojiMenuAnchor.targetType, emoji);
      setEmojiMenuAnchor(null);
    }
  };

  const canEditReply = (reply: Reply) => {
    return String(user?.id) === String(reply.userId) || user?.role === 'admin';
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes}min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return timestamp.toLocaleDateString('fr-FR');
  };

  const ReactionBar: React.FC<{ reactions?: Reaction[]; targetId: string; targetType: 'annotation' | 'reply' }> = ({ 
    reactions = [], 
    targetId, 
    targetType 
  }) => {
    const groupedReactions = reactions.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = [];
      }
      acc[reaction.emoji].push(reaction);
      return acc;
    }, {} as Record<string, Reaction[]>);

    return (
      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mt: 1 }}>
        {Object.entries(groupedReactions).map(([emoji, reactionList]) => (
          <Chip
            key={emoji}
            label={`${emoji} ${reactionList.length}`}
            size="small"
            variant="outlined"
            onClick={() => handleAddReaction(emoji)}
            sx={{ 
              height: 24,
              fontSize: '0.75rem',
              cursor: 'pointer',
              '&:hover': { backgroundColor: 'action.hover' }
            }}
          />
        ))}
        <IconButton
          size="small"
          onClick={(e) => setEmojiMenuAnchor({ element: e.currentTarget, targetId, targetType })}
          sx={{ ml: 0.5 }}
        >
          <EmojiIcon fontSize="small" />
        </IconButton>
      </Box>
    );
  };

  return (
    <Card sx={{ mb: 2, ...(compact && { boxShadow: 1 }) }}>
      <CardContent sx={{ pb: 1 }}>
        {/* En-tête de l'annotation principale */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
            <Avatar sx={{ width: 32, height: 32, fontSize: '14px' }}>
              {annotation.userName.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight="bold">
                {annotation.userName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatTimestamp(annotation.timestamp)}
                {annotation.isResolved && (
                  <Chip
                    icon={<ResolveIcon />}
                    label="Résolu"
                    size="small"
                    color="success"
                    variant="outlined"
                    sx={{ ml: 1, height: 20 }}
                  />
                )}
              </Typography>
            </Box>
          </Box>
          
          {canResolve && !annotation.isResolved && (
            <Tooltip title="Marquer comme résolu">
              <IconButton
                size="small"
                onClick={() => onResolveThread(annotation.id)}
                color="success"
              >
                <ResolveIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Contenu de l'annotation */}
        <Typography variant="body2" sx={{ mb: 2, pl: 5 }}>
          {annotation.content}
        </Typography>

        {/* Réactions sur l'annotation */}
        <Box sx={{ pl: 5 }}>
          <ReactionBar 
            reactions={annotation.reactions} 
            targetId={annotation.id} 
            targetType="annotation" 
          />
        </Box>

        {/* Statistiques du thread */}
        {hasReplies && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2, pl: 5 }}>
            <Button
              size="small"
              startIcon={showReplies ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={() => setShowReplies(!showReplies)}
              sx={{ textTransform: 'none' }}
            >
              {thread!.totalReplies} réponse{thread!.totalReplies > 1 ? 's' : ''}
            </Button>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <PersonIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                {thread!.participants.length} participant{thread!.participants.length > 1 ? 's' : ''}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ScheduleIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                Dernière activité: {formatTimestamp(thread!.lastActivity)}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Thread de réponses */}
        <Collapse in={showReplies}>
          <Box sx={{ mt: 2, pl: 3, borderLeft: '2px solid', borderColor: 'divider' }}>
            {hasReplies && (
              <List sx={{ py: 0 }}>
                {thread!.replies.map((reply) => (
                  <ListItem key={reply.id} alignItems="flex-start" sx={{ px: 0, py: 1 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ width: 28, height: 28, fontSize: '12px' }}>
                        {reply.userName.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {reply.userName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatTimestamp(reply.timestamp)}
                              {reply.isEdited && ' (modifié)'}
                            </Typography>
                          </Box>
                          
                          {canEditReply(reply) && (
                            <IconButton
                              size="small"
                              onClick={(e) => setMenuAnchor({ element: e.currentTarget, replyId: reply.id })}
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          {editingReply === reply.id ? (
                            <Box sx={{ mt: 1 }}>
                              <TextField
                                fullWidth
                                size="small"
                                multiline
                                rows={2}
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                placeholder="Modifier votre réponse..."
                              />
                              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                <Button
                                  size="small"
                                  variant="contained"
                                  onClick={() => handleSaveEdit(reply.id)}
                                  disabled={!editContent.trim()}
                                >
                                  Sauvegarder
                                </Button>
                                <Button
                                  size="small"
                                  onClick={() => setEditingReply(null)}
                                >
                                  Annuler
                                </Button>
                              </Box>
                            </Box>
                          ) : (
                            <Box>
                              <Typography variant="body2" sx={{ mt: 0.5 }}>
                                {reply.content}
                              </Typography>
                              <ReactionBar 
                                reactions={reply.reactions} 
                                targetId={reply.id} 
                                targetType="reply" 
                              />
                            </Box>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
            
            {/* Formulaire de réponse */}
            {!annotation.isResolved && (
              <Box sx={{ mt: 2 }}>
                <MentionInput
                  value={replyContent}
                  onChange={setReplyContent}
                  onSubmit={handleSubmitReply}
                  placeholder="Écrire une réponse..."
                  availableUsers={availableUsers}
                  multiline
                  rows={2}
                  endAdornment={
                    <IconButton
                      onClick={handleSubmitReply}
                      disabled={!replyContent.trim()}
                      color="primary"
                    >
                      <SendIcon />
                    </IconButton>
                  }
                />
              </Box>
            )}
          </Box>
        </Collapse>

        {/* Bouton pour démarrer une discussion */}
        {!hasReplies && !showReplies && !annotation.isResolved && (
          <Box sx={{ mt: 2, pl: 5 }}>
            <Button
              size="small"
              startIcon={<ReplyIcon />}
              onClick={() => {
                setShowReplies(true);
                setTimeout(() => replyInputRef.current?.focus(), 100);
              }}
              sx={{ textTransform: 'none' }}
            >
              Répondre
            </Button>
          </Box>
        )}

        {/* Alerte pour thread résolu */}
        {annotation.isResolved && (
          <Alert 
            severity="success" 
            sx={{ mt: 2, ml: 5 }}
            icon={<ResolveIcon />}
          >
            Cette discussion a été marquée comme résolue
          </Alert>
        )}
      </CardContent>

      {/* Menu contextuel pour les réponses */}
      <Menu
        anchorEl={menuAnchor?.element}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => {
          const reply = thread?.replies.find(r => r.id === menuAnchor?.replyId);
          if (reply) handleEditReply(reply);
        }}>
          <EditIcon sx={{ mr: 1 }} />
          Modifier
        </MenuItem>
        <MenuItem onClick={() => {
          if (menuAnchor?.replyId) handleDeleteReply(menuAnchor.replyId);
        }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Supprimer
        </MenuItem>
      </Menu>

      {/* Menu des émojis */}
      <Menu
        anchorEl={emojiMenuAnchor?.element}
        open={Boolean(emojiMenuAnchor)}
        onClose={() => setEmojiMenuAnchor(null)}
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0.5, p: 1 }}>
          {availableEmojis.map((emoji) => (
            <IconButton
              key={emoji}
              onClick={() => handleAddReaction(emoji)}
              sx={{ fontSize: '1.2rem' }}
            >
              {emoji}
            </IconButton>
          ))}
        </Box>
      </Menu>
    </Card>
  );
};

export default ThreadDiscussion; 