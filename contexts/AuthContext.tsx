import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile } from '../types';
import { mockGoogleLogin, setCurrentUserId, getUserProfile, getCurrentUserId } from '../services/storageService';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate user on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedId = getCurrentUserId();
      if (storedId) {
        try {
          const profile = await getUserProfile(storedId);
          if (profile) setUser(profile);
        } catch (e) {
          console.error("Failed to restore session", e);
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async () => {
    setIsLoading(true);
    try {
      const profile = await mockGoogleLogin();
      setUser(profile);
      setCurrentUserId(profile.id);
    } catch (e) {
      console.error("Login failed", e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setCurrentUserId(null);
    window.location.reload(); // Hard reset state for demo purposes
  };

  const updateUser = (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    // Persist to storage
    import('../services/storageService').then(service => {
        service.saveUserProfile(updated);
    });
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
