import React, { createContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';
import { historyApi } from '../api/historyApi';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load user session on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('cropshield_token');
      const savedUser = localStorage.getItem('cropshield_user');

      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {}
      }

      if (token) {
        try {
          const res = await authApi.getMe();
          if (res.user) {
            setUser(res.user);
            localStorage.setItem('cropshield_user', JSON.stringify(res.user));
          }
          // Fetch history
          try {
            const histRes = await historyApi.getHistory();
            if (histRes.history) {
              setHistory(histRes.history);
            }
          } catch (histErr) {}
        } catch (err) {
          console.warn('Session verification failed, using stored state.');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    if (res.token && res.user) {
      localStorage.setItem('cropshield_token', res.token);
      localStorage.setItem('cropshield_user', JSON.stringify(res.user));
      setUser(res.user);
      try {
        const histRes = await historyApi.getHistory();
        if (histRes.history) setHistory(histRes.history);
      } catch (e) {}
    }
    return res;
  };

  const signup = async (userData) => {
    const res = await authApi.register(userData);
    if (res.token && res.user) {
      localStorage.setItem('cropshield_token', res.token);
      localStorage.setItem('cropshield_user', JSON.stringify(res.user));
      setUser(res.user);
    }
    return res;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.warn('Logout request failed:', e.message);
    } finally {
      localStorage.removeItem('cropshield_token');
      localStorage.removeItem('cropshield_user');
      setUser(null);
      setHistory([]);
    }
  };

  const updateProfileImage = async (base64Image) => {
    if (user) {
      const updated = { ...user, profileImage: base64Image };
      setUser(updated);
      localStorage.setItem('cropshield_user', JSON.stringify(updated));
      try {
        const res = await authApi.updateProfile({ profileImage: base64Image });
        if (res.user) {
          const synced = { ...user, ...res.user };
          setUser(synced);
          localStorage.setItem('cropshield_user', JSON.stringify(synced));
        }
      } catch (err) {
        console.warn('Could not sync profile image to server:', err.message);
      }
    }
  };

  const addToHistory = async (scanItem) => {
    try {
      if (user) {
        const res = await historyApi.addScan(scanItem);
        if (res.scan) {
          setHistory(prev => [res.scan, ...prev]);
          return;
        }
      }
    } catch (err) {
      console.warn('Could not save history to server, saving locally:', err.message);
    }
    // Local fallback
    const localItem = {
      ...scanItem,
      id: `local_${Date.now()}`,
      date: new Date().toISOString(),
    };
    setHistory(prev => [localItem, ...prev]);
  };

  const deleteHistoryItem = async (id) => {
    try {
      if (user) {
        await historyApi.deleteScan(id);
      }
    } catch (e) {}
    setHistory(prev => prev.filter(item => (item._id || item.id) !== id));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        history,
        loading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        updateProfileImage,
        addToHistory,
        deleteHistoryItem,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
