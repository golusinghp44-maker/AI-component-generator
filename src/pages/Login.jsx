import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";
import {
  isValidEmail,
  isStrongPassword,
  isValidDisplayName,
  normalizeEmail,
  sanitizeUserData,
} from "../utils/authUtils";
import { supabase } from "../utils/supabaseClient";

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const normalizedEmail = normalizeEmail(formData.email);

    if (!isValidEmail(normalizedEmail)) {
      toast.error("Please enter a valid email address");
      return false;
    }

    if (!isLogin && !isStrongPassword(formData.password)) {
      toast.error(
        "Password must be 8-128 chars and include uppercase, lowercase, and number"
      );
      return false;
    }

    if (isLogin && (!formData.password || formData.password.length > 128)) {
      toast.error("Please enter a valid password");
      return false;
    }

    if (!isLogin && formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }

    if (!isLogin && !isValidDisplayName(formData.name)) {
      toast.error("Please enter a valid full name (2-60 letters)");
      return false;
    }

    if (normalizedEmail.length > 254) {
      toast.error("Email is too long");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const email = normalizeEmail(formData.email);
      const password = formData.password;

      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error || !data?.session || !data?.user) {
          toast.error(error?.message || "Invalid login credentials");
          return;
        }

        const user = sanitizeUserData({
          id: data.user.id,
          email: data.user.email,
          name:
            data.user.user_metadata?.full_name ||
            data.user.user_metadata?.name ||
            data.user.email?.split("@")[0],
          createdAt: data.user.created_at,
        });

        login(user, data.session.access_token);
        toast.success("Login successful!");
        navigate("/");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: formData.name.trim(),
            },
          },
        });

        if (error) {
          toast.error(error.message || "Failed to create account");
          return;
        }

        if (data?.session && data?.user) {
          const newUser = sanitizeUserData({
            id: data.user.id,
            email: data.user.email,
            name:
              data.user.user_metadata?.full_name ||
              data.user.user_metadata?.name ||
              formData.name.trim(),
            createdAt: data.user.created_at,
          });

          login(newUser, data.session.access_token);
          toast.success("Account created successfully!");
          navigate("/");
        } else {
          toast.success("Account created. Please verify your email and sign in.");
          setIsLogin(true);
        }
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
    });
  };

  return (
    <div className="min-h-screen app-surface flex items-center justify-center p-4 app-text-primary">
      <div className="login-container rounded-2xl shadow-2xl w-full max-w-md p-8 border app-border app-panel">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold sp-text mb-2">
            {isLogin ? "Welcome Back" : "Join Us"}
          </h1>
          <p className="app-text-secondary text-sm">
            {isLogin
              ? "Sign in to your account to continue"
              : "Create an account to get started"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div>
              <label className="block app-text-primary font-semibold mb-2 text-sm">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                className="input-field w-full px-4 py-3 rounded-lg border focus:outline-none transition duration-200"
                disabled={loading}
                maxLength={60}
                autoComplete="name"
              />
            </div>
          )}

          <div>
            <label className="block app-text-primary font-semibold mb-2 text-sm">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              className="input-field w-full px-4 py-3 rounded-lg border focus:outline-none transition duration-200"
              disabled={loading}
              maxLength={254}
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block app-text-primary font-semibold mb-2 text-sm">
              Password
            </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder={
                  isLogin
                    ? "Enter your password"
                    : "Enter password (8-128 chars, A-Z, a-z, 0-9)"
                }
                className="input-field w-full px-4 py-3 rounded-lg border focus:outline-none transition duration-200"
                disabled={loading}
                minLength={isLogin ? 1 : 8}
                maxLength={128}
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
          </div>

          {!isLogin && (
            <div>
              <label className="block app-text-primary font-semibold mb-2 text-sm">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your password"
                className="input-field w-full px-4 py-3 rounded-lg border focus:outline-none transition duration-200"
                disabled={loading}
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="sp-gradient-btn w-full text-white font-semibold py-3 rounded-lg hover:opacity-90 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading
              ? isLogin
                ? "Signing In..."
                : "Creating Account..."
              : isLogin
              ? "Sign In"
              : "Create Account"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t app-border">
          <p className="text-center app-text-secondary text-sm mb-4">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
          </p>
          <button
            onClick={toggleMode}
            disabled={loading}
            className="w-full app-tertiary app-hover app-text-primary font-semibold py-2 rounded-lg border app-border transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </div>

        <p className="text-center text-xs app-text-secondary mt-6">
          Authentication is powered by Supabase.
        </p>
      </div>
    </div>
  );
};

export default Login;
