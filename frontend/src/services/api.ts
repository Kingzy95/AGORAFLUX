import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest, 
  ChangePasswordRequest,
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
    const response: AxiosResponse<Dataset[]> = await this.api.get('/datasets', { params });
    return response.data;
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

  async getComments(projectId: number): Promise<Comment[]> {
    const response: AxiosResponse<Comment[]> = await this.api.get(`/projects/${projectId}/comments`);
    return response.data;
  }

  async createComment(projectId: number, data: CreateCommentRequest): Promise<Comment> {
    const response: AxiosResponse<Comment> = await this.api.post(`/projects/${projectId}/comments`, data);
    return response.data;
  }

  async updateComment(id: number, content: string): Promise<Comment> {
    const response: AxiosResponse<Comment> = await this.api.put(`/comments/${id}`, { content });
    return response.data;
  }

  async deleteComment(id: number): Promise<void> {
    await this.api.delete(`/comments/${id}`);
  }

  async likeComment(id: number): Promise<void> {
    await this.api.post(`/comments/${id}/like`);
  }

  async unlikeComment(id: number): Promise<void> {
    await this.api.delete(`/comments/${id}/like`);
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
}

const apiService = new ApiService();
export default apiService; 