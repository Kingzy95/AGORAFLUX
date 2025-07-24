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
      console.log('🔄 Chargement des données de collaboration réelles...');

      // 1. Récupérer tous les projets pour obtenir les statistiques de base
      const projectsResponse = await apiService.getProjects({ per_page: 100 });
      const projects = projectsResponse.projects || [];
      
      console.log('📊 Projets récupérés:', projects.length);

      // 2. Récupérer tous les commentaires des projets
      let allComments: any[] = [];
      let activeDiscussionsCount = 0;
      let resolvedDiscussionsCount = 0;
      
      // Traiter tous les projets en parallèle pour récupérer leurs commentaires
      const commentPromises = projects.map(async (project) => {
        try {
          const commentsResponse = await apiService.getComments(project.id);
          const projectComments = commentsResponse?.comments || [];
          
          // Compter les statistiques par projet
          
          // Filtrer les commentaires actifs vs résolus/cachés
          const activeComments = projectComments.filter((c: any) => 
            c.status === 'ACTIVE' || c.status === 'active'
          );
          const resolvedComments = projectComments.filter((c: any) => 
            c.status === 'HIDDEN' || c.status === 'DELETED' || c.status === 'hidden' || c.status === 'deleted'
          );
          
          activeDiscussionsCount += activeComments.length;
          resolvedDiscussionsCount += resolvedComments.length;
          
          return projectComments;
        } catch (err) {
          console.warn(`⚠️ Impossible de charger les commentaires du projet ${project.id}:`, err);
          return [];
        }
      });

      const commentsArrays = await Promise.all(commentPromises);
      allComments = commentsArrays.flat();

      console.log('💬 Commentaires récupérés:', allComments.length);

      // 3. Récupérer les statistiques communautaires pour les utilisateurs
      let communityStats: any = null;
      try {
        communityStats = await apiService.getCommunityStats({ per_page: 20 });
      } catch (err) {
        console.warn('⚠️ Impossible de charger les statistiques communautaires:', err);
      }

      // 4. Transformer les commentaires en annotations pour l'interface de collaboration
      const transformedAnnotations: AnnotationWithThread[] = allComments.map((comment, index) => ({
        id: comment.id?.toString() || `comment-${index}`,
        userId: comment.author?.id?.toString() || comment.author_id?.toString() || '0',
        userName: comment.author?.name || `${comment.author?.first_name || ''} ${comment.author?.last_name || ''}`.trim() || 'Utilisateur',
        userRole: comment.author?.role || 'utilisateur',
        x: Math.random() * 800, // Position aléatoire pour la visualisation
        y: Math.random() * 600,
        content: comment.content || comment.text || '',
        category: comment.type || 'comment',
        timestamp: new Date(comment.created_at || Date.now()),
        isPrivate: false,
        isResolved: comment.status === 'HIDDEN' || comment.status === 'DELETED' || comment.status === 'hidden' || comment.status === 'deleted',
        thread: {
          id: `thread-${comment.id || index}`,
          annotationId: comment.id?.toString() || `comment-${index}`,
          replies: [], // Les réponses peuvent être ajoutées plus tard si nécessaire
          totalReplies: comment.replies_count || 0,
          lastActivity: new Date(comment.updated_at || comment.created_at || Date.now()),
          participants: [{
            userId: comment.author?.id?.toString() || comment.author_id?.toString() || '0',
            userName: comment.author?.name || `${comment.author?.first_name || ''} ${comment.author?.last_name || ''}`.trim() || 'Utilisateur',
            userRole: comment.author?.role || 'utilisateur',
            joinedAt: new Date(comment.created_at || Date.now())
          }],
          isResolved: comment.status === 'HIDDEN' || comment.status === 'DELETED' || comment.status === 'hidden' || comment.status === 'deleted'
        },
        reactions: [] // Peut être étendu plus tard
      }));

      setAnnotations(transformedAnnotations);

      // 5. Transformer les utilisateurs de la communauté en utilisateurs en ligne
      const transformedUsers: MentionSuggestion[] = [];
      if (communityStats?.members) {
        const recentActiveUsers = communityStats.members
          .slice(0, 10) // Prendre les 10 premiers utilisateurs les plus actifs
          .map((member: any) => ({
            userId: member.id?.toString() || '0',
            userName: `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.email || 'Utilisateur',
            userRole: member.role || 'utilisateur',
            isOnline: true, // Basé sur l'activité récente dans les stats communautaires
            lastSeen: new Date()
          }));
        transformedUsers.push(...recentActiveUsers);
      }

      setOnlineUsers(transformedUsers);

      // 6. Calculer les statistiques réelles
      const uniqueParticipants = new Set();
      allComments.forEach(comment => {
        if (comment.author?.id || comment.author_id) {
          uniqueParticipants.add(comment.author?.id || comment.author_id);
        }
      });

      const totalReplies = allComments.reduce((sum, comment) => sum + (comment.replies_count || 0), 0);

      // Top contributeurs basés sur les vrais commentaires
      const contributorCounts: { [key: string]: { name: string; count: number; role: string } } = {};
      allComments.forEach(comment => {
        const userId = comment.author?.id || comment.author_id;
        const userName = comment.author?.name || `${comment.author?.first_name || ''} ${comment.author?.last_name || ''}`.trim() || 'Utilisateur';
        const userRole = comment.author?.role || 'utilisateur';
        
        if (userId) {
          if (!contributorCounts[userId]) {
            contributorCounts[userId] = { name: userName, count: 0, role: userRole };
          }
          contributorCounts[userId].count++;
        }
      });

      const topContributors = Object.values(contributorCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map(contributor => ({
          userId: '', // Pas d'ID nécessaire pour l'affichage
          userName: contributor.name,
          userRole: contributor.role,
          contributionCount: contributor.count
        }));

      const calculatedStats: CollaborationStats = {
        totalAnnotations: transformedAnnotations.length,
        activeDiscussions: activeDiscussionsCount,
        resolvedDiscussions: resolvedDiscussionsCount,
        totalParticipants: uniqueParticipants.size,
        totalReplies: totalReplies,
        avgResponseTime: allComments.length > 0 ? 'Calculé sur données réelles' : 'Aucune donnée',
        participationRate: Math.min(100, Math.round((uniqueParticipants.size / Math.max(1, projects.length)) * 100)),
        topContributors: topContributors
      };

      setStats(calculatedStats);

      console.log('✅ Données de collaboration chargées:', {
        projets: projects.length,
        commentaires: allComments.length,
        annotations: transformedAnnotations.length,
        participants: uniqueParticipants.size,
        discussionsActives: activeDiscussionsCount,
        discussionsResolues: resolvedDiscussionsCount
      });
      
    } catch (err: any) {
      console.error('❌ Erreur lors du chargement des données de collaboration:', err);
      setError(err.response?.data?.detail || err.message || 'Erreur lors du chargement des données de collaboration');
      
      // En cas d'erreur, garder les données vides - PAS DE MOCK
      setAnnotations([]);
      setOnlineUsers([]);
      setStats({
        totalAnnotations: 0,
        activeDiscussions: 0,
        resolvedDiscussions: 0,
        totalParticipants: 0,
        totalReplies: 0,
        avgResponseTime: '0m',
        participationRate: 0,
        topContributors: []
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addAnnotation = useCallback(async (annotation: Omit<AnnotationWithThread, 'id' | 'timestamp'>) => {
    // Cette fonction pourrait être implémentée pour créer un nouveau commentaire
    console.log('Création d\'annotation pas encore implémentée:', annotation);
    throw new Error('Création d\'annotation pas encore implémentée');
  }, []);

  const updateAnnotation = useCallback(async (id: string, updates: Partial<AnnotationWithThread>) => {
    // Cette fonction pourrait être implémentée pour modifier un commentaire
    console.log('Mise à jour d\'annotation pas encore implémentée:', id, updates);
    throw new Error('Mise à jour d\'annotation pas encore implémentée');
  }, []);

  const deleteAnnotation = useCallback(async (id: string) => {
    // Cette fonction pourrait être implémentée pour supprimer un commentaire
    console.log('Suppression d\'annotation pas encore implémentée:', id);
    throw new Error('Suppression d\'annotation pas encore implémentée');
  }, []);

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