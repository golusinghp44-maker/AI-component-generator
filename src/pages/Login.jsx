import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";
import {
  isValidEmail,
  isStrongPassword,
  generateToken,
  sanitizeUserData,
} from "../utils/authUtils";

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
    if (!isValidEmail(formData.email)) {
      toast.error("Please enter a valid email address");
      return false;
    }

    if (!isStrongPassword(formData.password)) {
      toast.error("Password must be at least 6 characters long");
      return false;
    }

    if (!isLogin && formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }

    if (!isLogin && !formData.name.trim()) {
      toast.error("Please enter your name");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      let users = JSON.parse(localStorage.getItem("users")) || [];

      if (isLogin) {
        // Login flow
        const user = users.find((u) => u.email === formData.email);

        if (!user) {
          toast.error("User not found. Please sign up first.");
          setLoading(false);
          return;
        }

        if (btoa(formData.password) !== user.password) {
          toast.error("Invalid password");
          setLoading(false);
          return;
        }

        const token = generateToken(user.id);
        login(user, token);
        toast.success("Login successful!");
        navigate("/");
      } else {
        // Sign up flow
        const userExists = users.find((u) => u.email === formData.email);

        if (userExists) {
          toast.error("Email already registered. Please login.");
          setLoading(false);
          return;
        }

        const newUser = sanitizeUserData({
          id: Date.now().toString(),
          email: formData.email,
          name: formData.name,
        });

        newUser.password = btoa(formData.password); // Store hashed password
        users.push(newUser);
        localStorage.setItem("users", JSON.stringify(users));

        const token = generateToken(newUser.id);
        login(newUser, token);
        toast.success("Account created successfully!");
        navigate("/");
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
              placeholder="Enter your password (min 6 characters)"
              className="input-field w-full px-4 py-3 rounded-lg border focus:outline-none transition duration-200"
              disabled={loading}
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
          Demo Credentials:<br className="mt-1" />
          Email: demo@example.com<br />
          Password: password123
        </p>
      </div>
    </div>
  );
};

export default Login;
