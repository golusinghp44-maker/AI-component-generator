/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { sanitizeUserData } from "../utils/authUtils";

export const AuthContext = createContext();

const getStoredUser = () => {
  try {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("authToken");

    if (storedUser && token) {
      return JSON.parse(storedUser);
    }
  } catch (error) {
    console.error("Error parsing stored user:", error);
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
  }

  return null;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser);
  const [loading, setLoading] = useState(true);
  const [authToken, setAuthToken] = useState(() => localStorage.getItem("authToken"));

  const syncSession = useCallback((session) => {
    if (!session?.user || !session?.access_token) {
      localStorage.removeItem("user");
      localStorage.removeItem("authToken");
      setUser(null);
      setAuthToken(null);
      return;
    }

    const normalizedUser = sanitizeUserData({
      id: session.user.id,
      email: session.user.email,
      name:
        session.user.user_metadata?.full_name ||
        session.user.user_metadata?.name ||
        session.user.email?.split("@")[0],
      createdAt: session.user.created_at,
    });

    localStorage.setItem("user", JSON.stringify(normalizedUser));
    localStorage.setItem("authToken", session.access_token);
    setUser(normalizedUser);
    setAuthToken(session.access_token);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (isMounted) {
          syncSession(data?.session ?? null);
        }
      } catch (error) {
        console.error("Error initializing auth session:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      syncSession(session);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [syncSession]);

  const login = (userData, token) => {
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("authToken", token);
    setUser(userData);
    setAuthToken(token);
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn("Supabase sign out failed, clearing local auth state", error);
    }

    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
    setUser(null);
    setAuthToken(null);
  };

  const isAuthenticated = () => {
    return !!user && !!authToken;
  };

  const getAuthToken = () => {
    return authToken || localStorage.getItem("authToken");
  };

  const updateUserProfile = (updates) => {
    if (!user) return;

    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));

    try {
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const updatedUsers = users.map((item) =>
        item.id === user.id ? { ...item, ...updates } : item
      );
      localStorage.setItem("users", JSON.stringify(updatedUsers));
    } catch (error) {
      console.warn("Failed to sync updated user in users list", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        login,
        logout,
        isAuthenticated,
        loading,
        getAuthToken,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
