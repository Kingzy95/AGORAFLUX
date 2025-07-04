export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  bio?: string;
  avatar_url?: string;
  role: 'admin' | 'moderateur' | 'utilisateur';
  is_active: boolean;
  is_verified: boolean;
  is_locked: boolean;
  created_at: string;
  updated_at?: string;
  last_login?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  bio?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  register: (data: RegisterRequest) => Promise<void>;
  refreshToken: () => Promise<void>;
}

export interface AuthStatus {
  status: string;
  features: {
    jwt_authentication: boolean;
    role_based_access: boolean;
    rate_limiting: boolean;
    account_locking: boolean;
    email_verification: boolean;
  };
} 