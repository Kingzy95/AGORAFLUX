import { useState, useEffect, useCallback } from 'react';
import { AnnotationWithThread, CollaborationStats, MentionSuggestion } from '../types/collaboration';
import apiService from '../services/api';

export interface UseCollaborationDataHook {
  // États
  isLoading: boolean;
  error: string | null;
  
  // Données
  annotations: AnnotationWithThread[];
  onlineUsers: MentionSuggestion[];
  stats: CollaborationStats;
  
  // Actions
  addAnnotation: (annotation: Omit<AnnotationWithThread, 'id' | 'timestamp'>) => Promise<void>;
  updateAnnotation: (id: string, updates: Partial<AnnotationWithThread>) => Promise<void>;
  deleteAnnotation: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

export const useCollaborationData = (): UseCollaborationDataHook => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<AnnotationWithThread[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<MentionSuggestion[]>([]);
  const [stats, setStats] = useState<CollaborationStats>({
    totalAnnotations: 0,
    activeDiscussions: 0,
    resolvedDiscussions: 0,
    totalParticipants: 0,
    totalReplies: 0,
    avgResponseTime: '0m',
    participationRate: 0,
    topContributors: []
  });

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Récupérer toutes les données en parallèle depuis les vrais endpoints
      const [annotationsData, onlineUsersData, statsData] = await Promise.all([
        apiService.getAnnotations(),
        apiService.getOnlineUsers(),
        apiService.getCollaborationStats()
      ]);

      // Transformer les données backend en format frontend attendu
      const transformedAnnotations: AnnotationWithThread[] = annotationsData.map(annotation => ({
        id: annotation.id,
        userId: annotation.user_id,
        userName: annotation.user_name,
        userRole: annotation.user_role,
        x: annotation.x,
        y: annotation.y,
        content: annotation.content,
        category: annotation.category,
        timestamp: new Date(annotation.timestamp),
        isPrivate: annotation.is_private,
        isResolved: annotation.is_resolved,
        thread: {
          id: `thread-${annotation.id}`,
          annotationId: annotation.id,
          replies: [], // Les réponses seraient récupérées séparément si nécessaire
          totalReplies: annotation.replies_count || 0,
          lastActivity: new Date(annotation.timestamp),
          participants: [{
            userId: annotation.user_id,
            userName: annotation.user_name,
            userRole: annotation.user_role,
            joinedAt: new Date(annotation.timestamp)
          }],
          isResolved: annotation.is_resolved
        },
        reactions: [] // Les réactions seraient récupérées séparément si nécessaire
      }));

      // Transformer les utilisateurs en ligne
      const transformedUsers: MentionSuggestion[] = onlineUsersData.map(user => ({
        userId: user.user_id,
        userName: user.user_name,
        userRole: user.user_role,
        isOnline: user.is_online,
        lastSeen: user.last_seen ? new Date(user.last_seen) : undefined
      }));

      // Les statistiques sont déjà dans le bon format
      const transformedStats: CollaborationStats = {
        totalAnnotations: statsData.total_annotations,
        activeDiscussions: statsData.active_discussions,
        resolvedDiscussions: statsData.resolved_discussions,
        totalParticipants: statsData.total_participants,
        totalReplies: statsData.total_replies,
        avgResponseTime: statsData.avg_response_time,
        participationRate: statsData.participation_rate,
        topContributors: statsData.top_contributors
      };

      // Mettre à jour les états
      setAnnotations(transformedAnnotations);
      setOnlineUsers(transformedUsers);
      setStats(transformedStats);
      
    } catch (err: any) {
      console.error('Erreur lors du chargement des données de collaboration:', err);
      setError(err.response?.data?.detail || err.message || 'Erreur lors du chargement des données de collaboration');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addAnnotation = useCallback(async (annotation: Omit<AnnotationWithThread, 'id' | 'timestamp'>) => {
    try {
      // Appeler l'API pour créer l'annotation
      const newAnnotation = await apiService.createAnnotation({
        x: annotation.x,
        y: annotation.y,
        content: annotation.content,
        category: annotation.category,
        is_private: annotation.isPrivate
      });

      // Transformer et ajouter l'annotation localement
      const transformedAnnotation: AnnotationWithThread = {
        id: newAnnotation.id,
        userId: newAnnotation.user_id,
        userName: newAnnotation.user_name,
        userRole: newAnnotation.user_role,
        x: newAnnotation.x,
        y: newAnnotation.y,
        content: newAnnotation.content,
        category: newAnnotation.category,
        timestamp: new Date(newAnnotation.timestamp),
        isPrivate: newAnnotation.is_private,
        isResolved: newAnnotation.is_resolved,
        thread: {
          id: `thread-${newAnnotation.id}`,
          annotationId: newAnnotation.id,
          replies: [],
          totalReplies: 0,
          lastActivity: new Date(newAnnotation.timestamp),
          participants: [{
            userId: newAnnotation.user_id,
            userName: newAnnotation.user_name,
            userRole: newAnnotation.user_role,
            joinedAt: new Date(newAnnotation.timestamp)
          }],
          isResolved: false
        },
        reactions: []
      };

      setAnnotations(prev => [...prev, transformedAnnotation]);
      
      // Mettre à jour les stats
      setStats(prev => ({
        ...prev,
        totalAnnotations: prev.totalAnnotations + 1,
        activeDiscussions: prev.activeDiscussions + 1
      }));

    } catch (err: any) {
      console.error('Erreur lors de la création de l\'annotation:', err);
      setError(err.response?.data?.detail || err.message || 'Erreur lors de la création de l\'annotation');
      throw err;
    }
  }, []);

  const updateAnnotation = useCallback(async (id: string, updates: Partial<AnnotationWithThread>) => {
    try {
      // Préparer les mises à jour pour l'API
      const apiUpdates: any = {};
      if (updates.content !== undefined) apiUpdates.content = updates.content;
      if (updates.category !== undefined) apiUpdates.category = updates.category;
      if (updates.isPrivate !== undefined) apiUpdates.is_private = updates.isPrivate;
      if (updates.isResolved !== undefined) apiUpdates.is_resolved = updates.isResolved;

      // Appeler l'API pour mettre à jour
      const updatedAnnotation = await apiService.updateAnnotation(id, apiUpdates);

      // Mettre à jour localement
      setAnnotations(prev => prev.map(annotation => 
        annotation.id === id ? {
          ...annotation,
          content: updatedAnnotation.content,
          category: updatedAnnotation.category,
          isPrivate: updatedAnnotation.is_private,
          isResolved: updatedAnnotation.is_resolved
        } : annotation
      ));

      // Mettre à jour les stats si nécessaire
      if (updates.isResolved !== undefined) {
        setStats(prev => ({
          ...prev,
          activeDiscussions: prev.activeDiscussions + (updates.isResolved ? -1 : 1),
          resolvedDiscussions: prev.resolvedDiscussions + (updates.isResolved ? 1 : -1)
        }));
      }

    } catch (err: any) {
      console.error('Erreur lors de la mise à jour de l\'annotation:', err);
      setError(err.response?.data?.detail || err.message || 'Erreur lors de la mise à jour de l\'annotation');
      throw err;
    }
  }, []);

  const deleteAnnotation = useCallback(async (id: string) => {
    try {
      // Trouver l'annotation avant suppression pour les stats
      const annotation = annotations.find(a => a.id === id);
      
      // Appeler l'API pour supprimer
      await apiService.deleteAnnotation(id);

      // Supprimer localement
      setAnnotations(prev => prev.filter(a => a.id !== id));

      // Mettre à jour les stats
      if (annotation) {
        setStats(prev => ({
          ...prev,
          totalAnnotations: prev.totalAnnotations - 1,
          activeDiscussions: annotation.isResolved ? prev.activeDiscussions : prev.activeDiscussions - 1,
          resolvedDiscussions: annotation.isResolved ? prev.resolvedDiscussions - 1 : prev.resolvedDiscussions
        }));
      }

    } catch (err: any) {
      console.error('Erreur lors de la suppression de l\'annotation:', err);
      setError(err.response?.data?.detail || err.message || 'Erreur lors de la suppression de l\'annotation');
      throw err;
    }
  }, [annotations]);

  // Charger les données au montage
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return {
    isLoading,
    error,
    annotations,
    onlineUsers,
    stats,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    refreshData
  };
}; 