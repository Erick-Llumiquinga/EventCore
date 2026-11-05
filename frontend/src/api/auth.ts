import { apiClient } from "./client";
import type {
  ApiResponse,
  LoginCredentials,
  LoginResponsePayload,
  ProfileData,
  RegisterData,
  User,
} from "../types/auth";

export const mapProfileToUser = (payload: ProfileData): User => {
  const fullName =
    payload.person?.full_name ||
    [payload.person?.first_name, payload.person?.last_name]
      .filter(Boolean)
      .join(" ") ||
    payload.user.email;

  return {
    id: payload.user.id,
    email: payload.user.email,
    name: fullName,
    is_active: Boolean(payload.user.is_active),
    created_at: payload.user.created_at,
    role: payload.role?.slug || "client",
    role_name: payload.role?.name || payload.role?.slug || "Cliente",
    user: payload.user,
    person: payload.person,
    role_detail: payload.role,
  };
};

export const authApi = {
  login: async (
    credentials: LoginCredentials,
  ): Promise<{ access_token: string; token_type: string; expires_in: number; user: User }> => {
    const response = await apiClient.post<ApiResponse<LoginResponsePayload>>(
      "/auth/login",
      credentials,
    );

    if (response.data.code !== 200 || !response.data.data) {
      throw new Error(response.data.message || "Error al iniciar sesión");
    }

    const payload = response.data.data;
    return {
      access_token: payload.access_token,
      token_type: payload.token_type,
      expires_in: payload.expires_in,
      user: mapProfileToUser(payload),
    };
  },

  register: async (data: RegisterData): Promise<User> => {
    const response = await apiClient.post<ApiResponse<ProfileData>>(
      "/auth/register",
      data,
    );

    if (response.data.code !== 200 || !response.data.data) {
      throw new Error(response.data.message || "Error al registrar usuario");
    }

    return mapProfileToUser(response.data.data);
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<ApiResponse<ProfileData>>("/auth/me");

    if (response.data.code !== 200 || !response.data.data) {
      throw new Error(response.data.message || "No se pudo obtener el perfil");
    }

    return mapProfileToUser(response.data.data);
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post("/auth/logout");
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  },
};
