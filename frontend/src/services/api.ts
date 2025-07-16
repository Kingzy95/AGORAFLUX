import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest, 
  ChangePasswordRequest,
  UpdateProfileRequest,
  User,
  AuthStatus 
} from '../types/auth';
import { 
  Project, 
  Dataset, 
  Comment, 
  CreateProjectRequest, 
  UpdateProjectRequest, 
  CreateCommentRequest 
} from '../types/project';

// Interface temporaire pour les commentaires tels que retournés par le backend
export interface BackendComment {
  id: number;
  content: string;
  type: string;
  status: string;
  parent_id?: number;
  thread_depth: number;
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
  replies?: BackendComment[];
}

class ApiService {
  private api: AxiosInstance;
  private baseURL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api/v1';

  constructor() {
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Intercepteur pour ajouter automatiquement le token d'authentification
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Intercepteur pour gérer les erreurs de réponse
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expiré, essayer de le rafraîchir
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            try {
              const response = await this.refreshToken(refreshToken);
              localStorage.setItem('access_token', response.data.access_token);
              // Réessayer la requête originale
              return this.api.request(error.config);
            } catch (refreshError) {
              // Échec du rafraîchissement, déconnecter l'utilisateur
              this.logout();
              window.location.href = '/login';
            }
          } else {
            this.logout();
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // === AUTHENTIFICATION ===

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response: AxiosResponse<LoginResponse> = await this.api.post('/auth/login', credentials);
    return response.data;
  }

  async register(data: RegisterRequest): Promise<User> {
    const response: AxiosResponse<User> = await this.api.post('/auth/register', data);
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response: AxiosResponse<User> = await this.api.get('/auth/me');
    return response.data;
  }

  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    const response: AxiosResponse<User> = await this.api.put('/auth/me', data);
    return response.data;
  }

  async refreshToken(refreshToken: string): Promise<AxiosResponse<LoginResponse>> {
    return this.api.post('/auth/refresh', { refresh_token: refreshToken });
  }

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await this.api.post('/auth/change-password', data);
  }

  async logout(): Promise<void> {
    try {
      await this.api.post('/auth/logout');
    } catch (error) {
      // Ignorer les erreurs de déconnexion
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }

  async getAuthStatus(): Promise<AuthStatus> {
    const response: AxiosResponse<AuthStatus> = await this.api.get('/auth/status');
    return response.data;
  }

  // === GESTION DES UTILISATEURS (Admin) ===

  async getAllUsers(): Promise<User[]> {
    const response: AxiosResponse<User[]> = await this.api.get('/auth/users');
    return response.data;
  }

  async getCommunityStats(params: {
    page?: number;
    per_page?: number;
    sort_by?: string;
    sort_order?: string;
  } = {}): Promise<{
    community_stats: {
      total_users: number;
      active_users_30d: number;
      new_users_7d: number;
      online_users: number;
      by_role: { [role: string]: number };
      avg_contributions: number;
    };
    members: Array<{
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
    }>;
    top_contributors: Array<any>;
    online_users: Array<any>;
    pagination: {
      total: number;
      page: number;
      per_page: number;
      pages: number;
    };
  }> {
    const response = await this.api.get('/auth/community/stats', { params });
    return response.data;
  }

  async updateUserRole(userId: number, role: string): Promise<void> {
    await this.api.put(`/auth/users/${userId}/role`, { role });
  }

  async activateUser(userId: number): Promise<void> {
    await this.api.put(`/auth/users/${userId}/activate`);
  }

  async deactivateUser(userId: number): Promise<void> {
    await this.api.put(`/auth/users/${userId}/deactivate`);
  }

  // === PROJETS ===

  async getProjects(params?: {
    page?: number;
    per_page?: number;
    status?: string;
    search?: string;
  }): Promise<{ projects: Project[]; total: number; page: number; per_page: number }> {
    const response = await this.api.get('/projects', { params });
    return response.data;
  }

  async getProject(id: number): Promise<Project> {
    const response: AxiosResponse<Project> = await this.api.get(`/projects/${id}`);
    return response.data;
  }

  async createProject(data: CreateProjectRequest): Promise<Project> {
    const response: AxiosResponse<Project> = await this.api.post('/projects', data);
    return response.data;
  }

  async updateProject(id: number, data: UpdateProjectRequest): Promise<Project> {
    const response: AxiosResponse<Project> = await this.api.put(`/projects/${id}`, data);
    return response.data;
  }

  async deleteProject(id: number): Promise<void> {
    await this.api.delete(`/projects/${id}`);
  }

  async likeProject(id: number): Promise<void> {
    await this.api.post(`/projects/${id}/like`);
  }

  async unlikeProject(id: number): Promise<void> {
    await this.api.delete(`/projects/${id}/like`);
  }

  // === DATASETS ===

  async getDatasets(projectId?: number): Promise<Dataset[]> {
    const params = projectId ? { project_id: projectId } : {};
    const response: AxiosResponse<{ datasets: Dataset[]; total: number }> = await this.api.get('/datasets', { params });
    return response.data.datasets;
  }

  async getDataset(id: number): Promise<Dataset> {
    const response: AxiosResponse<Dataset> = await this.api.get(`/datasets/${id}`);
    return response.data;
  }

  async uploadDataset(file: File, projectId: number, metadata: any): Promise<Dataset> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('project_id', projectId.toString());
    formData.append('metadata', JSON.stringify(metadata));

    const response: AxiosResponse<Dataset> = await this.api.post('/datasets', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async deleteDataset(id: number): Promise<void> {
    await this.api.delete(`/datasets/${id}`);
  }

  // === COMMENTAIRES ===

  async getComments(projectId: number): Promise<{comments: BackendComment[], stats: any}> {
    const response: AxiosResponse<{comments: BackendComment[], stats: any}> = await this.api.get(`/projects/${projectId}/comments`);
    return response.data;
  }

  async getAllDiscussions(params: {
    page?: number;
    per_page?: number;
    comment_type?: string;
    search?: string;
    sort_by?: string;
    sort_order?: string;
  } = {}): Promise<{
    discussions: Array<BackendComment & {
      project: {
        id: number;
        title: string;
        slug: string;
      };
    }>;
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
  }> {
    const response = await this.api.get('/projects/discussions', { params });
    return response.data;
  }

  async createComment(projectId: number, data: CreateCommentRequest): Promise<BackendComment> {
    const response: AxiosResponse<BackendComment> = await this.api.post(`/projects/${projectId}/comments`, data);
    return response.data;
  }

  async updateComment(projectId: number, commentId: number, data: { content: string }): Promise<BackendComment> {
    const response: AxiosResponse<BackendComment> = await this.api.put(`/projects/${projectId}/comments/${commentId}`, data);
    return response.data;
  }

  async deleteComment(projectId: number, commentId: number): Promise<void> {
    await this.api.delete(`/projects/${projectId}/comments/${commentId}`);
  }

  async likeComment(projectId: number, commentId: number): Promise<void> {
    await this.api.post(`/projects/${projectId}/comments/${commentId}/like`);
  }

  async unlikeComment(projectId: number, commentId: number): Promise<void> {
    await this.api.delete(`/projects/${projectId}/comments/${commentId}/like`);
  }

  // === UTILITAIRES ===

  async healthCheck(): Promise<{ status: string; version: string }> {
    const response = await this.api.get('/health');
    return response.data;
  }

  // Méthode pour définir les tokens d'authentification
  setAuthTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  // Méthode pour vérifier si l'utilisateur est authentifié
  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  // === PIPELINE DE DONNÉES ===

  async getDataSources(): Promise<{
    sources: Array<{
      key: string;
      name: string;
      url: string;
      format: string;
      description: string;
      update_frequency: string;
      last_updated: string | null;
    }>;
    total_sources: number;
  }> {
    const response = await this.api.get('/data/sources');
    return response.data;
  }

  async getPipelineStatus(): Promise<{
    is_running: boolean;
    sources_configured: number;
    last_run: any;
  }> {
    const response = await this.api.get('/data/status');
    return response.data;
  }

  async runPipeline(useDebugData: boolean = true, sourceKeys?: string[]): Promise<any> {
    const response = await this.api.post('/data/run', {
      use_mock_data: useDebugData,
      source_keys: sourceKeys
    });
    return response.data;
  }

  async runPipelineSync(useDebugData: boolean = true, sourceKeys?: string[]): Promise<any> {
    const response = await this.api.post('/data/run-sync', {
      use_mock_data: useDebugData,
      source_keys: sourceKeys
    });
    return response.data;
  }

  async getLastPipelineRun(): Promise<any> {
    const response = await this.api.get('/data/last-run');
    return response.data;
  }

  async getProcessedDatasets(): Promise<{
    datasets: Array<{
      id: number;
      name: string;
      data_type: string;
      status: string;
      total_records: number;
      quality_score: number;
      created_at: string;
      processed_at: string | null;
      sample_data?: any[];
    }>;
    total: number;
    retrieved_at: string;
  }> {
    const response = await this.api.get('/data/datasets');
    return response.data;
  }

  async getDatasetDetails(datasetId: number): Promise<{
    id: number;
    name: string;
    description: string;
    type: string;
    status: string;
    rows_count: number;
    columns_count: number;
    quality_scores: {
      completeness: number;
      consistency: number;
      validity: number;
      overall: number;
    };
    sample_data: any[];
    total_records: number;
    created_at: string;
    project_id: number;
  }> {
    const response = await this.api.get(`/data/datasets/${datasetId}`);
    return response.data;
  }

  async getDatasetData(datasetId: number, limit: number = 100): Promise<{
    dataset_id: number;
    dataset_name: string;
    data_type: string;
    total_records: number;
    data: any[];
  }> {
    const response = await this.api.get(`/data/datasets/${datasetId}/data`, {
      params: { limit }
    });
    return response.data;
  }

  async getDebugData(dataType: 'budget' | 'participation'): Promise<{
    data_type: string;
    data: any[];
    description: string;
  }> {
    const response = await this.api.get(`/data/mock-data/${dataType}`);
    return response.data;
  }

  // === COLLABORATION ===

  async getAnnotations(projectId?: number): Promise<any[]> {
    const params = projectId ? { project_id: projectId } : {};
    const response = await this.api.get('/collaboration/annotations', { params });
    return response.data;
  }

  async createAnnotation(annotation: {
    x: number;
    y: number;
    content: string;
    category: string;
    is_private?: boolean;
  }): Promise<any> {
    const response = await this.api.post('/collaboration/annotations', annotation);
    return response.data;
  }

  async updateAnnotation(id: string, updates: {
    content?: string;
    category?: string;
    is_private?: boolean;
    is_resolved?: boolean;
  }): Promise<any> {
    const response = await this.api.put(`/collaboration/annotations/${id}`, updates);
    return response.data;
  }

  async deleteAnnotation(id: string): Promise<void> {
    await this.api.delete(`/collaboration/annotations/${id}`);
  }

  async getOnlineUsers(): Promise<any[]> {
    const response = await this.api.get('/collaboration/users/online');
    return response.data;
  }

  async getCollaborationStats(projectId?: number): Promise<any> {
    const params = projectId ? { project_id: projectId } : {};
    const response = await this.api.get('/collaboration/stats', { params });
    return response.data;
  }

  async createReply(reply: {
    content: string;
    parent_id: string;
    mentions?: string[];
  }): Promise<any> {
    const response = await this.api.post('/collaboration/replies', reply);
    return response.data;
  }

  async addReaction(reaction: {
    emoji: string;
    target_id: string;
    target_type: string;
  }): Promise<any> {
    const response = await this.api.post('/collaboration/reactions', reaction);
    return response.data;
  }

  // === EXPORTS ===

  async getExportHistory(params: { limit?: number; offset?: number; format_filter?: string } = {}): Promise<any[]> {
    const response = await this.api.get('/exports/history', { params });
    return response.data;
  }

  async createExport(exportData: {
    chart_id: string;
    chart_title: string;
    format: string;
    file_name: string;
    file_size: number;
  }): Promise<any> {
    const response = await this.api.post('/exports', exportData);
    return response.data;
  }

  async deleteExport(id: string): Promise<void> {
    await this.api.delete(`/exports/${id}`);
  }

  async getExportStatistics(): Promise<any> {
    const response = await this.api.get('/exports/statistics');
    return response.data;
  }

  async getExportNotifications(limit: number = 10): Promise<any[]> {
    const response = await this.api.get('/exports/notifications', { params: { limit } });
    return response.data;
  }

  // === RAPPORTS PDF ===

  async getReportTemplates(): Promise<Array<{
    id: string;
    name: string;
    description: string;
    template_type: string;
    sections: string[];
    charts_included: string[];
    default_params: any;
  }>> {
    const response = await this.api.get('/exports/reports/templates');
    return response.data;
  }

  async generateReport(reportRequest: {
    template_id: string;
    title: string;
    period_start: string;
    period_end: string;
    sections: string[];
    include_charts: string[];
    custom_params?: any;
  }): Promise<{
    id: string;
    title: string;
    template_id: string;
    template_name: string;
    period_start: string;
    period_end: string;
    file_name: string;
    file_size: number;
    generated_at: string;
    download_url: string;
    user_id: string;
    user_name: string;
    status: string;
  }> {
    const response = await this.api.post('/exports/reports/generate', reportRequest);
    return response.data;
  }

  async getReportsHistory(params: { limit?: number; offset?: number; template_filter?: string } = {}): Promise<Array<{
    id: string;
    title: string;
    template_id: string;
    template_name: string;
    period_start: string;
    period_end: string;
    file_name: string;
    file_size: number;
    generated_at: string;
    download_url: string;
    user_id: string;
    user_name: string;
    status: string;
  }>> {
    const response = await this.api.get('/exports/reports/history', { params });
    return response.data;
  }

  async clearExportHistory(): Promise<void> {
    await this.api.delete('/exports/history/clear');
  }

  async downloadReport(fileName: string): Promise<Blob> {
    const response = await this.api.get(`/exports/reports/${fileName}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Méthodes pour les notifications
  async createTestNotification(): Promise<void> {
    await this.api.post('/notifications/test');
  }

  async getNotifications(limit: number = 50, offset: number = 0, unreadOnly: boolean = false): Promise<any[]> {
    const response = await this.api.get('/notifications', {
      params: { limit, offset, unread_only: unreadOnly }
    });
    return response.data;
  }

  async getUnreadCount(): Promise<{ unread_count: number }> {
    const response = await this.api.get('/notifications/unread-count');
    return response.data;
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    await this.api.put(`/notifications/${notificationId}/read`);
  }

  async markAllNotificationsRead(): Promise<void> {
    await this.api.put('/notifications/mark-all-read');
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await this.api.delete(`/notifications/${notificationId}`);
  }
}

const apiService = new ApiService();
export default apiService; 