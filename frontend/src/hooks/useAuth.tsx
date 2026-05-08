import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import i18n, { normalizeLanguage, type SupportedLanguage } from "../i18n";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updatePreferredLanguage: (language: SupportedLanguage) => Promise<void>;
  can: (...roles: User["role"][]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get<User>("/auth/me/")
      .then((response) => {
        setUser(response.data);
        i18n.changeLanguage(normalizeLanguage(response.data.preferred_language));
      })
      .catch(() => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const response = await api.post("/auth/login/", { email, password });
    localStorage.setItem("accessToken", response.data.access);
    localStorage.setItem("refreshToken", response.data.refresh);
    setUser(response.data.user);
    i18n.changeLanguage(normalizeLanguage(response.data.user.preferred_language));
  }

  async function logout() {
    const refresh = localStorage.getItem("refreshToken");
    if (refresh) {
      await api.post("/auth/logout/", { refresh }).catch(() => undefined);
    }
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
  }

  async function updatePreferredLanguage(language: SupportedLanguage) {
    setUser((current) => (current ? { ...current, preferred_language: language } : current));
    const response = await api.patch<User>("/auth/me/", { preferred_language: language });
    setUser(response.data);
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      updatePreferredLanguage,
      can: (...roles: User["role"][]) => Boolean(user && (user.role === "ADMIN" || roles.includes(user.role)))
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
