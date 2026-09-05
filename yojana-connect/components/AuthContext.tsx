"use client";

import React, { createContext, useContext, useState, useSyncExternalStore, ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  getStoredToken,
  getStoredUser,
  subscribeAuth,
  loginApi,
  registerApi,
  logoutApi,
} from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  register: (credentials: RegisterCredentials) => Promise<AuthResponse>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isActionPending, setIsActionPending] = useState<boolean>(false);

  // Sync token and user reactively without cascading effect renders
  const token = useSyncExternalStore(
    subscribeAuth,
    () => getStoredToken(),
    () => null
  );

  const user = useSyncExternalStore(
    subscribeAuth,
    () => getStoredUser(),
    () => null
  );

  // Hydration state check
  const isHydrated = useSyncExternalStore(
    subscribeAuth,
    () => true,
    () => false
  );

  const isLoading = !isHydrated || isActionPending;

  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    setIsActionPending(true);
    try {
      return await loginApi(credentials);
    } finally {
      setIsActionPending(false);
    }
  };

  const register = async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    setIsActionPending(true);
    try {
      return await registerApi(credentials);
    } finally {
      setIsActionPending(false);
    }
  };

  const logout = async () => {
    setIsActionPending(true);
    try {
      await logoutApi();
      router.push("/login");
    } finally {
      setIsActionPending(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

