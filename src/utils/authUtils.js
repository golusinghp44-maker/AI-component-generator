// Utility functions for authentication

export const isValidEmail = (email) => {
  if (typeof email !== "string") return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim().toLowerCase());
};

export const isStrongPassword = (password) => {
  if (typeof password !== "string") return false;
  if (password.length < 8 || password.length > 128) return false;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  return hasUppercase && hasLowercase && hasNumber;
};

export const normalizeEmail = (email) => {
  if (typeof email !== "string") return "";
  return email.trim().toLowerCase();
};

export const isValidDisplayName = (name) => {
  if (typeof name !== "string") return false;
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 60) return false;
  return /^[a-zA-Z\s.'-]+$/.test(trimmed);
};

export const sanitizeUserData = (user) => {
  return {
    id: user.id || user.user_id || user.sub || Date.now().toString(),
    email: normalizeEmail(user.email || ""),
    name: (user.name || user.full_name || user.email?.split("@")[0] || "User").trim(),
    createdAt: user.createdAt || new Date().toISOString(),
  };
};
