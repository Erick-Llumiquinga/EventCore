export type RoleSlug = "admin" | "client" | "organizer" | "attendee" | string;

export interface AuthUser {
  id: number;
  email: string;
  is_active: boolean;
  created_at?: string;
}

export interface Person {
  id: number;
  identification: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone?: string | null;
}

export interface Role {
  id: number;
  slug: RoleSlug;
  name: string;
  description?: string | null;
}

export interface ProfileData {
  user: AuthUser;
  person: Person;
  role: Role;
}

/**
 * Unified user model used across the frontend components,
 * preserving direct access to `user`, `person`, and `role` objects
 * as well as convenience top-level fields.
 */
export interface User {
  id: number;
  email: string;
  name: string;
  is_active: boolean;
  created_at?: string;
  role: RoleSlug;
  role_name: string;
  user: AuthUser;
  person: Person;
  role_detail: Role;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  identification: string;
  first_name: string;
  last_name: string;
  phone?: string;
  email: string;
  password: string;
  password_confirmation: string;
  role?: string;
  role_id?: number;
}

export interface LoginResponsePayload extends ProfileData {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface ApiResponse<T = unknown> {
  code: number;
  data: T | null;
  message: string;
  errors?: Record<string, string[]>;
}
