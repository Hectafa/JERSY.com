import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { login as loginService } from "../services/authService";
import {
  clearToken,
  decodeToken,
  getToken,
  isTokenExpired,
  saveToken,
} from "../utils/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();

    if (!token) {
      setLoading(false);
      return;
    }

    if (isTokenExpired(token)) {
      clearToken();
      setLoading(false);
      return;
    }

    const payload = decodeToken(token);
    if (payload) {
      setUser({ id: payload.userId, name: payload.name, role: payload.role });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === "authToken" && !event.newValue) {
        setUser(null);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = useCallback(async (credentials) => {
    const { token } = await loginService(credentials);
    saveToken(token);

    const payload = decodeToken(token);
    if (!payload) throw new Error("Token inválido del backend");
    setUser({ id: payload.userId, name: payload.name, role: payload.role });
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const updateUser = useCallback((patch) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const value = useMemo(
    () => ({ user, isAuthenticated: !!user, loading, login, logout, updateUser }),
    [user, loading, login, logout, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  }
  return ctx;
}