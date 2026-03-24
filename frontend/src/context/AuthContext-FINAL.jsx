import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    setLoading(false);
  }, []);

  const signOut = async () => {
    setUser(null);
  };

  const login = async (email, password) => {
    // Mock login - replace with real authentication
    setUser({ email, name: 'Mountain Mate User' });
    return { success: true };
  };

  const register = async (email, password, fullName) => {
    // Mock registration - replace with real authentication
    setUser({ email, name: fullName });
    return { success: true };
  };

  const value = {
    user,
    loading,
    signOut,
    login,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
