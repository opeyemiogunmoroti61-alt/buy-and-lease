"use client";
// context/AuthContext.tsx
// Replaces: Supabase's built-in session listener (supabase.auth.onAuthStateChange)
// Wrap your layout with <AuthProvider> to access auth state anywhere.

import React, { createContext, useContext, useEffect, useState } from "react";
import { getUser, getAccessToken, clearTokens } from "../utils/django/client";

interface AuthUser {
  email: string;
  username?: string;
  role?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  logout: () => {},
  refreshUser: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = () => {
    const token = getAccessToken();
    const stored = getUser();
    if (token && stored) {
      setUser(stored);
    } else {
      setUser(null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadUser();
  }, []);

  const logout = () => {
    clearTokens();
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        logout,
        refreshUser: loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
