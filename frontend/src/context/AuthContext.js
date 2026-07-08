/**
 * AuthContext — provides `user`, `loading`, `login`, `register`, `logout`.
 * Consumers use `useAuth()` to read state. Uses cookie-based JWT — no tokens
 * kept in localStorage. Session is verified via /api/auth/me on mount.
 */
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import api, { formatApiError } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch current session on mount. Uses /auth/session (always 200) instead
  // of /auth/me (401 when unauth) so DevTools stays quiet on public pages.
  // Empty dep array is correct: api/setUser/setLoading are stable references.
  const fetchMe = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/session");
      setUser(data.user || null);
    } catch {
      // Network-level failure — treat as anonymous.
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const login = useCallback(async (email, password) => {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setUser(data.user);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: formatApiError(e.response?.data?.detail) || e.message };
    }
  }, []);

  const register = useCallback(async (email, password, name) => {
    try {
      const { data } = await api.post("/auth/register", { email, password, name });
      setUser(data.user);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: formatApiError(e.response?.data?.detail) || e.message };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      // Log but don't block local sign-out — cookie may already be invalid.
      console.warn("Logout request failed:", e?.message);
    }
    setUser(null);
  }, []);

  // Memoize the context value so consumers don't re-render on every parent render.
  const value = useMemo(
    () => ({ user, loading, login, register, logout, refresh: fetchMe }),
    [user, loading, login, register, logout, fetchMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
