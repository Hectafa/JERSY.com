import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { login as loginService, refresh as refreshService } from "../services/authService";
import { getUserProfile } from "../services/userService";
import {
  clearRefreshToken,
  clearToken,
  decodeToken,
  getRefreshToken,
  getToken,
  isTokenExpired,
  saveRefreshToken,
  saveToken,
} from "../utils/auth";

const AuthContext = createContext(null);

// El JWT solo trae userId/name/role; avatar y email viven en el perfil del
// backend, así que hay que pedirlos aparte para que sobrevivan un reload.
function hydrateProfile(userId, setUser) {
  getUserProfile(userId)
    .then((profile) => {
      setUser((prev) =>
        prev ? { ...prev, avatar: profile.avatar, email: profile.email } : prev,
      );
    })
    .catch(() => {});
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      let token = getToken();

      if (token && isTokenExpired(token)) {
        const refreshToken = getRefreshToken();

        if (refreshToken && !isTokenExpired(refreshToken)) {
          try {
            const { token: newToken } = await refreshService(refreshToken);
            saveToken(newToken);
            token = newToken;
          } catch {
            token = null;
          }
        } else {
          token = null;
        }

        if (!token) {
          clearToken();
          clearRefreshToken();
        }
      }

      if (!token) {
        setLoading(false);
        return;
      }

      const payload = decodeToken(token);
      if (payload) {
        setUser({ id: payload.userId, name: payload.name, role: payload.role });
        hydrateProfile(payload.userId, setUser);
      }
      setLoading(false);
    }

    initAuth();
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
    const { token, refreshToken } = await loginService(credentials);
    saveToken(token);
    saveRefreshToken(refreshToken);

    const payload = decodeToken(token);
    if (!payload) throw new Error("Token inválido del backend");
    setUser({ id: payload.userId, name: payload.name, role: payload.role });
    hydrateProfile(payload.userId, setUser);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    clearRefreshToken();
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