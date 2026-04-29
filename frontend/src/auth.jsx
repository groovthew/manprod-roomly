import { createContext, useContext, useState, useEffect } from "react";
import { api } from "./api.js";

const AuthContext = createContext(null);
const STORAGE_KEY = "roomly:user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        api.getUser(parsed.id)
          .then((fresh) => persist(fresh))
          .catch(() => clear())
          .finally(() => setLoading(false));
        return;
      } catch { /* fall through */ }
    }
    setLoading(false);
  }, []);

  const persist = (u) => {
    setUser(u);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
  };

  const clear = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const login = async (username, password) => {
    const u = await api.login(username, password);
    persist(u);
    return u;
  };

  const register = async (data) => {
    const u = await api.register(data);
    persist(u);
    return u;
  };

  const updateProfile = async (data) => {
    const u = await api.updateUser(user.id, data);
    persist(u);
    return u;
  };

  const logout = () => clear();

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
