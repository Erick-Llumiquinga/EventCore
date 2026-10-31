export type RoleSlug = 'admin' | 'organizer' | 'attendee' | string;

export interface User {
  id: number;
  name: string;
  email: string;
  role: RoleSlug;
  role_name?: string;
  created_at?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role?: string;
}

export interface AuthResponseData {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}
