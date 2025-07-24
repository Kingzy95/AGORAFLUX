import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';

export interface PersonalDashboardData {
  profile: {
    id: number;
    name: string;
    email: string;
    role: string;
    member_since: string;
    last_login: string | null;
    avatar: string;
    bio: string | null;
    stats: {
      projects_created: number;
      datasets_uploaded: number;
      comments_written: number;
      total_contributions: number;
      replies_received: number;
      likes_received: number;
      activity_rate: number;
      active_projects: number;
      completed_projects: number;
      processed_datasets: number;
    };
  };
  community: {
    ranking: number;
    total_users: number;
    community_average: number;
    percentile: number;
    favorite_tags: string[];
  };
  activity: {
    recent_projects: any[];
    recent_comments: any[];
    recent_datasets: any[];
    collaborators: any[];
    suggested_projects: any[];
  };
  charts: {
    contributions_timeline: any[];
    projects_progress: {
      draft: number;
      active: number;
      completed: number;
      archived: number;
    };
    interaction_stats: {
      comments_per_project: number;
      replies_per_comment: number;
      likes_per_comment: number;
      datasets_per_project: number;
    };
  };
  metadata: {
    generated_at: string;
    data_freshness: string;
    calculations_based_on: string;
  };
}

export interface UsePersonalDashboardHook {
  data: PersonalDashboardData | null;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

export const usePersonalDashboard = (): UsePersonalDashboardHook => {
  const [data, setData] = useState<PersonalDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Chargement du dashboard personnel...');
      const dashboardData = await apiService.getPersonalDashboard();
      setData(dashboardData);
      
      console.log('✅ Dashboard personnel chargé:', {
        contributions: dashboardData.profile.stats.total_contributions,
        projets: dashboardData.profile.stats.projects_created,
        classement: dashboardData.community.ranking,
        pourcentile: dashboardData.community.percentile
      });
      
    } catch (err: any) {
      console.error('❌ Erreur lors du chargement du dashboard personnel:', err);
      setError(err.response?.data?.detail || err.message || 'Erreur lors du chargement du dashboard');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return {
    data,
    isLoading,
    error,
    refreshData
  };
}; 