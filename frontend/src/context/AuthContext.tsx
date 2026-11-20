import React, { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "../api/auth";
import type {
  AuthUser,
  LoginCredentials,
  Person,
  RegisterData,
  Role,
  User,
} from "../types/auth";

interface AuthContextType {
  user: User | null;
  authUser: AuthUser | null;
  person: Person | null;
  role: Role | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

const AUTH_VERIFIED_SESSION_KEY = "eventcore_auth_verified_v1";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? (JSON.parse(saved) as User) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("token");
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Only call /api/auth/me if token exists and hasn't been verified yet in this session
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");
      const alreadyVerified = sessionStorage.getItem(AUTH_VERIFIED_SESSION_KEY);

      if (storedToken) {
        if (savedUser && alreadyVerified === "true") {
          setIsLoading(false);
          return;
        }

        try {
          const freshUser = await authApi.getMe();
          setUser(freshUser);
          localStorage.setItem("user", JSON.stringify(freshUser));
          sessionStorage.setItem(AUTH_VERIFIED_SESSION_KEY, "true");
        } catch (error) {
          console.warn("Sesión expirada o token inválido:", error);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          sessionStorage.removeItem(AUTH_VERIFIED_SESSION_KEY);
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const result = await authApi.login(credentials);
    setToken(result.access_token);
    setUser(result.user);
    localStorage.setItem("token", result.access_token);
    localStorage.setItem("user", JSON.stringify(result.user));
    sessionStorage.setItem(AUTH_VERIFIED_SESSION_KEY, "true");
  };

  const register = async (data: RegisterData) => {
    await authApi.register(data);
    // Auto-login after successful registration
    await login({ email: data.email, password: data.password });
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.removeItem(AUTH_VERIFIED_SESSION_KEY);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authUser: user?.user ?? null,
        person: user?.person ?? null,
        role: user?.role_detail ?? null,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser utilizado dentro de un AuthProvider");
  }
  return context;
};
