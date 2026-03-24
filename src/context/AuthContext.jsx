/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState } from "react";

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
  const loading = false;

  const login = (userData, token) => {
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("authToken", token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
    setUser(null);
  };

  const isAuthenticated = () => {
    return !!user && !!localStorage.getItem("authToken");
  };

  const getAuthToken = () => {
    return localStorage.getItem("authToken");
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
