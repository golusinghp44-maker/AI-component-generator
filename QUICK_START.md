# Quick Start Guide

## ⚡ Setup & Run (2 minutes)

### Step 1: Install Dependencies
```bash
npm install
cd backend && npm install && cd ..
```

### Step 2: Start Frontend
```bash
npm run dev
```
Visit: `http://localhost:5173`

### Step 3: Start Backend (Optional, for advanced features)
```bash
cd backend
npm run dev
```

## 🔐 Login

Use your Supabase-authenticated account:
- Sign up with email + password
- Or sign in with an existing Supabase user

## ✨ Features Now Available

### 1. **Authentication System**
    - ✅ Login/Sign Up
    - ✅ Supabase authentication
    - ✅ Protected routes
    - ✅ Auto-logout
    - ✅ Logout button

### 2. **Gemini API Integrated**
   - ✅ Direct client-side API calls
   - ✅ Code generation
   - ✅ Code explanation
   - ✅ AI chat assistant
   - ✅ Free tier (no credit card needed)

### 3. **User Session**
   - ✅ User info in navbar
   - ✅ Persistent login
   - ✅ Session timeout safe

## 📁 What Changed

**New Files Created:**
- `src/context/AuthContext.jsx` - Authentication context
- `src/pages/Login.jsx` - Login page
- `src/components/ProtectedRoute.jsx` - Route protection
- `src/components/LogoutButton.jsx` - Logout button
- `src/components/AIChat.jsx` - AI chat interface
- `src/utils/aiService.js` - Gemini API service
- `src/utils/authUtils.js` - Auth utilities
- `backend/.env` - Environment configuration

**Updated Files:**
- `src/App.jsx` - Added auth routing
- `src/components/Navbar.jsx` - Added logout button
- `backend/index.js` - Added auth endpoints
- `backend/package.json` - Added dependencies

## 🎯 Key Endpoints

### Frontend Routes
- `/login` - Login/Sign up page
- `/` - Home page (protected)
- `*` - 404 page

### Backend API (Optional)
- `GET /auth/me` - Current authenticated user
- `GET /auth/verify` - Verify Supabase access token
- `POST /generate` - Generate code with Gemini

## 🔑 Environment Keys

Configure env keys before running:
- Frontend: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (or `VITE_SUPABASE_ANON_KEY`)
- Backend: `SUPABASE_URL`, `SUPABASE_SECRET_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`), plus AI key(s)

## 📝 Next Steps

1. Sign up/sign in with your Supabase account
2. Explore the AI chat feature
3. Integrate with backend if needed
4. Deploy to production

## 🆘 Quick Help

**Forgot password?** → Sign up with new email  
**Can't login?** → Confirm Supabase env keys and restart frontend/backend  
**API errors?** → Check internet connection  
**Backend not responding?** → Start it with `cd backend && npm run dev`

---

**Everything is ready! Start coding! 🚀**
