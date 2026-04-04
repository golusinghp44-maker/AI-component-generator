/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { sanitizeUserData } from "../utils/authUtils";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authToken, setAuthToken] = useState(null);

  const syncSession = useCallback((session) => {
    if (!session?.user || !session?.access_token) {
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
    setUser(userData);
    setAuthToken(token);
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn("Supabase sign out failed, clearing local auth state", error);
    }

    setUser(null);
    setAuthToken(null);
  };

  const isAuthenticated = () => {
    return !!user && !!authToken;
  };

  const getAuthToken = () => {
    return authToken;
  };

  const updateUserProfile = async (updates) => {
    if (!user) return;

    const safeName = typeof updates?.name === "string" ? updates.name.trim() : "";

    if (safeName) {
      try {
        await supabase.auth.updateUser({
          data: { full_name: safeName },
        });
      } catch (error) {
        console.warn("Failed to update Supabase user metadata", error);
      }
    }

    setUser((current) => (current ? { ...current, ...updates } : current));
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
