import { apiClient } from './client';
import type {
  ApiResponse,
  AuthResponseData,
  LoginCredentials,
  RegisterData,
  User,
} from '../types/auth';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponseData> => {
    const response = await apiClient.post<ApiResponse<AuthResponseData>>(
      '/auth/login',
      credentials
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Error al iniciar sesión');
    }
    return response.data.data;
  },

  register: async (data: RegisterData): Promise<AuthResponseData> => {
    const response = await apiClient.post<ApiResponse<AuthResponseData>>(
      '/auth/register',
      data
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Error al registrar usuario');
    }
    return response.data.data;
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>('/auth/me');
    if (!response.data.data) {
      throw new Error('No se pudo obtener el perfil');
    }
    return response.data.data;
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },
};
