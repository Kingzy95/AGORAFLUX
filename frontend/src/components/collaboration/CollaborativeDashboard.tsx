import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Fab,
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Chip,
  Avatar,
  Alert,
  Snackbar,
  Paper,
  Button,
  Tooltip
} from '@mui/material';
import {
  Chat as ChatIcon,
  Close as CloseIcon,
  Forum as ForumIcon,
  People as PeopleIcon,
  Notifications as NotificationsIcon,
  FilterList as FilterIcon,
  Share as ShareIcon,
  Settings as SettingsIcon,
  CheckCircle as ResolvedIcon,
  Schedule as PendingIcon,
  TrendingUp as TrendingIcon,
  Insights as InsightsIcon
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import Dashboard from '../visualizations/Dashboard';
import ThreadDiscussion from './ThreadDiscussion';
import AdvancedFilters from '../filters/AdvancedFilters';
import ShareExportPanel from '../sharing/ShareExportPanel';
import { 
  mockAnnotationsWithThreads, 
  mockUsers, 
  mockCollaborationStats,
  generateRandomReply,
  generateRandomReaction 
} from '../../utils/data/mockCollaborationData';
import { 
  AnnotationWithThread, 
  Reply, 
  Reaction, 
  Thread, 
  MentionSuggestion 
} from '../../types/collaboration';
import { FilterOptions } from '../../types/visualization';

const CollaborativeDashboard: React.FC = () => {
  const { user } = useAuth();
  const [annotations, setAnnotations] = useState<AnnotationWithThread[]>(mockAnnotationsWithThreads);
  const [showDiscussions, setShowDiscussions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [notification, setNotification] = useState<{ message: string; severity: 'success' | 'info' | 'warning' | 'error' } | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<MentionSuggestion[]>(mockUsers.filter(u => u.isOnline));

  // Statistiques en temps réel
  const [stats, setStats] = useState(mockCollaborationStats);

  // Simuler les mises à jour en temps réel
  useEffect(() => {
    const interval = setInterval(() => {
      // Simuler l'arrivée de nouvelles réactions
      if (Math.random() > 0.8) {
        const randomAnnotation = annotations[Math.floor(Math.random() * annotations.length)];
        const newReaction = generateRandomReaction();
        
        setAnnotations(prev => prev.map(annotation => 
          annotation.id === randomAnnotation.id 
            ? { ...annotation, reactions: [...(annotation.reactions || []), newReaction] }
            : annotation
        ));
        
        setNotification({
          message: `${newReaction.userName} a ajouté une réaction ${newReaction.emoji}`,
          severity: 'info'
        });
      }
    }, 10000); // Toutes les 10 secondes

    return () => clearInterval(interval);
  }, [annotations]);

  // Gestionnaires d'événements pour les threads
  const handleAddReply = (annotationId: string, reply: Omit<Reply, 'id' | 'timestamp'>) => {
    const newReply: Reply = {
      ...reply,
      id: `reply-${Date.now()}-${Math.random()}`,
      timestamp: new Date()
    };

    setAnnotations(prev => prev.map(annotation => {
      if (annotation.id === annotationId) {
        const updatedThread = annotation.thread || {
          id: `thread-${Date.now()}`,
          annotationId,
          replies: [],
          totalReplies: 0,
          lastActivity: new Date(),
          participants: [],
          isResolved: false
        };

        return {
          ...annotation,
          thread: {
            ...updatedThread,
            replies: [...updatedThread.replies, newReply],
            totalReplies: updatedThread.totalReplies + 1,
            lastActivity: new Date(),
            participants: updatedThread.participants.some(p => String(p.userId) === String(reply.userId))
              ? updatedThread.participants
              : [...updatedThread.participants, {
                  userId: reply.userId,
                  userName: reply.userName,
                  userRole: reply.userRole,
                  joinedAt: new Date()
                }]
          }
        };
      }
      return annotation;
    }));

    setNotification({
      message: `${reply.userName} a ajouté une réponse`,
      severity: 'success'
    });
  };

  const handleUpdateReply = (replyId: string, updates: Partial<Reply>) => {
    setAnnotations(prev => prev.map(annotation => ({
      ...annotation,
      thread: annotation.thread ? {
        ...annotation.thread,
        replies: annotation.thread.replies.map(reply => 
          reply.id === replyId ? { ...reply, ...updates } : reply
        )
      } : annotation.thread
    })));
  };

  const handleDeleteReply = (replyId: string) => {
    setAnnotations(prev => prev.map(annotation => ({
      ...annotation,
      thread: annotation.thread ? {
        ...annotation.thread,
        replies: annotation.thread.replies.filter(reply => reply.id !== replyId),
        totalReplies: Math.max(0, annotation.thread.totalReplies - 1)
      } : annotation.thread
    })));

    setNotification({
      message: 'Réponse supprimée',
      severity: 'info'
    });
  };

  const handleAddReaction = (targetId: string, targetType: 'annotation' | 'reply', emoji: string) => {
    if (!user) return;

    const newReaction: Reaction = {
      id: `reaction-${Date.now()}-${Math.random()}`,
      userId: user.id,
      userName: `${user.first_name} ${user.last_name}`,
      emoji,
      timestamp: new Date()
    };

    setAnnotations(prev => prev.map(annotation => {
      if (targetType === 'annotation' && annotation.id === targetId) {
        return {
          ...annotation,
          reactions: [...(annotation.reactions || []), newReaction]
        };
      } else if (targetType === 'reply' && annotation.thread) {
        return {
          ...annotation,
          thread: {
            ...annotation.thread,
            replies: annotation.thread.replies.map(reply => 
              reply.id === targetId 
                ? { ...reply, reactions: [...(reply.reactions || []), newReaction] }
                : reply
            )
          }
        };
      }
      return annotation;
    }));
  };

  const handleResolveThread = (annotationId: string) => {
    if (!user) return;

    setAnnotations(prev => prev.map(annotation => 
      annotation.id === annotationId 
        ? { 
            ...annotation, 
            isResolved: true,
            thread: annotation.thread ? {
              ...annotation.thread,
              isResolved: true,
              resolvedBy: `${user.first_name} ${user.last_name}`,
              resolvedAt: new Date()
            } : annotation.thread
          }
        : annotation
    ));

    setNotification({
      message: 'Discussion marquée comme résolue',
      severity: 'success'
    });
  };

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

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* En-tête avec statistiques de collaboration */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Tableau de Bord Collaboratif
        </Typography>
        
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
          gap: 2,
          mb: 3
        }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <ForumIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6">{activeDiscussions}</Typography>
              <Typography variant="body2" color="text.secondary">
                Discussions actives
              </Typography>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <ResolvedIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6">{resolvedDiscussions}</Typography>
              <Typography variant="body2" color="text.secondary">
                Discussions résolues
              </Typography>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <ChatIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6">{totalReplies}</Typography>
              <Typography variant="body2" color="text.secondary">
                Total réponses
              </Typography>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <PeopleIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6">{onlineUsers.length}</Typography>
              <Typography variant="body2" color="text.secondary">
                Utilisateurs en ligne
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Utilisateurs en ligne */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Utilisateurs en ligne
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {onlineUsers.map(user => (
                <Tooltip key={user.id} title={`${user.name} - ${user.role}`}>
                  <Chip
                    avatar={<Avatar sx={{ width: 24, height: 24 }}>{user.name.charAt(0)}</Avatar>}
                    label={user.name}
                    variant="outlined"
                    size="small"
                    sx={{ 
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: 'success.main'
                      }
                    }}
                  />
                </Tooltip>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Tableau de bord principal */}
      <Dashboard />

      {/* Boutons d'action flottants */}
      <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Tooltip title="Discussions" placement="left">
            <Fab
              color="primary"
              onClick={() => setShowDiscussions(true)}
              sx={{ mb: 1 }}
            >
              <Badge badgeContent={activeDiscussions} color="error">
                <ChatIcon />
              </Badge>
            </Fab>
          </Tooltip>
          
          <Tooltip title="Filtres" placement="left">
            <Fab
              color="secondary"
              onClick={() => setShowFilters(true)}
              size="medium"
            >
              <FilterIcon />
            </Fab>
          </Tooltip>
          
          <Tooltip title="Partager" placement="left">
            <Fab
              color="info"
              onClick={() => setShowShare(true)}
              size="medium"
            >
              <ShareIcon />
            </Fab>
          </Tooltip>
        </Box>
      </Box>

      {/* Drawer des discussions */}
      <Drawer
        anchor="right"
        open={showDiscussions}
        onClose={() => setShowDiscussions(false)}
        PaperProps={{
          sx: { width: { xs: '100%', sm: 500, md: 600 } }
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              Discussions ({filteredAnnotations.length})
            </Typography>
            <IconButton onClick={() => setShowDiscussions(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          
          {/* Filtres rapides */}
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Chip
              label="Toutes"
              onClick={() => setFilters({})}
              color={Object.keys(filters).length === 0 ? 'primary' : 'default'}
              size="small"
            />
            <Chip
              label="Actives"
              onClick={() => setFilters({ status: ['active'] })}
              color={filters.status?.includes('active') ? 'primary' : 'default'}
              size="small"
            />
            <Chip
              label="Résolues"
              onClick={() => setFilters({ status: ['resolved'] })}
              color={filters.status?.includes('resolved') ? 'primary' : 'default'}
              size="small"
            />
          </Box>
        </Box>
        
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {filteredAnnotations.length === 0 ? (
            <Alert severity="info">
              Aucune discussion ne correspond aux filtres sélectionnés.
            </Alert>
          ) : (
            filteredAnnotations.map(annotation => (
              <ThreadDiscussion
                key={annotation.id}
                annotation={annotation}
                onAddReply={handleAddReply}
                onUpdateReply={handleUpdateReply}
                onDeleteReply={handleDeleteReply}
                onAddReaction={handleAddReaction}
                onResolveThread={handleResolveThread}
                availableUsers={mockUsers}
                compact
              />
            ))
          )}
        </Box>
      </Drawer>

      {/* Drawer des filtres */}
      <Drawer
        anchor="left"
        open={showFilters}
        onClose={() => setShowFilters(false)}
        PaperProps={{
          sx: { width: { xs: '100%', sm: 350 } }
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Filtres</Typography>
            <IconButton onClick={() => setShowFilters(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
        
        <Box sx={{ p: 2 }}>
          <AdvancedFilters
            defaultFilters={filters}
            onFiltersChange={setFilters}
            compact
          />
        </Box>
      </Drawer>

      {/* Drawer de partage */}
      <Drawer
        anchor="bottom"
        open={showShare}
        onClose={() => setShowShare(false)}
        PaperProps={{
          sx: { maxHeight: '50vh' }
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Partager et Exporter</Typography>
            <IconButton onClick={() => setShowShare(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
        
        <Box sx={{ p: 2 }}>
          <ShareExportPanel
            chartId="collaborative-dashboard"
            chartTitle="Tableau de Bord Collaboratif"
            chartData={{
              annotations: filteredAnnotations,
              stats: stats,
              filters: filters
            }}
          />
        </Box>
      </Drawer>

      {/* Notifications */}
      <Snackbar
        open={!!notification}
        autoHideDuration={4000}
        onClose={() => setNotification(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setNotification(null)}
          severity={notification?.severity}
          sx={{ width: '100%' }}
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CollaborativeDashboard; 