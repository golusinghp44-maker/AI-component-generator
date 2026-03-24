import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import "./App.css";

// Import Pages
import Login from "./pages/Login";
import Home from "./pages/Home";
import NoPages from "./pages/NoPages";
import Profile from "./pages/Profile";
import AccountSettings from "./pages/AccountSettings";
import ProtectedRoute from "./components/ProtectedRoute";

const App = () => {
  useEffect(() => {
    console.log("1. App starting...");
    
    // Initialize demo users if not exist
    const users = localStorage.getItem("users");
    if (!users) {
      const demoUsers = [
        {
          id: "1",
          email: "demo@example.com",
          name: "Demo User",
          password: btoa("password123"),
          createdAt: new Date().toISOString(),
        },
      ];
      localStorage.setItem("users", JSON.stringify(demoUsers));
    }
    
    console.log("2. Demo users initialized");
    console.log("3. React Router loaded");
    console.log("4. Theme Provider initialized");
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/account-settings"
              element={
                <ProtectedRoute>
                  <AccountSettings />
                </ProtectedRoute>
              }
            />
            
            {/* Catch all - redirect to home if authenticated, login if not */}
            <Route path="*" element={<NoPages />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
