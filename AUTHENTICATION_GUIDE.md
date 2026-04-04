# AI Code Generator - Authentication & Gemini API Setup

## Overview
This project includes a Supabase-based authentication system and Gemini/Groq integration for AI-powered code generation.

## Features

### ✅ Authentication System
- **Login/Sign Up Page**: Beautiful, responsive authentication interface
- **Supabase Auth**: Real email/password authentication through Supabase
- **Protected Routes**: Home page is protected and requires authentication
- **Auto-login**: Session restored from Supabase on refresh
- **Logout Functionality**: Secure logout from navbar

### ✅ Gemini API Integration
- **Free API Key**: Using Google's free Gemini API (no credit card required)
- **Client-side AI**: Direct API calls from frontend (no backend required for chat)
- **Multi-feature AI**:
  - Code generation
  - Code explanation
  - Code improvement
  - General chat assistance

## Getting Started

### 1. Setup Frontend
```bash
cd d:\ai-com-gen
npm install
npm run dev
```

### 2. Setup Backend (Optional - for advanced features)
```bash
cd d:\ai-com-gen\backend
npm install
npm run dev
```

The backend listens on `http://localhost:5000`

## Authentication Flow

### Register New Account
1. Click "Sign Up" on the login page
2. Enter name, email, and password
3. Confirm password
4. Click "Create Account"
5. If email confirmation is required, verify email and then sign in

### Login
1. Enter your email
2. Enter your password
3. Click "Sign In"
4. You'll be redirected to the home page

### Logout
Click the "Logout" button in the top-right corner of the navbar

## File Structure

```
src/
├── context/
│   └── AuthContext.jsx          # Auth provider & context
├── pages/
│   ├── Login.jsx               # Login/Sign up page
│   ├── Home.jsx                # Protected home page
│   └── NoPages.jsx             # 404 page
├── components/
│   ├── ProtectedRoute.jsx       # Route protection wrapper
│   ├── LogoutButton.jsx         # Logout button component
│   ├── AIChat.jsx              # AI chat interface
│   └── Navbar.jsx              # Navigation with logout
├── utils/
│   ├── authUtils.js            # Auth helper functions
│   ├── aiService.js            # Gemini API service
│   └── (other utilities)
└── App.jsx                      # Main app with auth routing
```

## Key Components

### AuthContext.jsx
Provides authentication state globally to all components:
```jsx
const { user, login, logout, isAuthenticated, getAuthToken } = useContext(AuthContext);
```

### ProtectedRoute.jsx
Wraps routes that require authentication:
```jsx
<ProtectedRoute>
  <Home />
</ProtectedRoute>
```

### aiService.js
Functions for Gemini API:
```javascript
generateContent(prompt)          // General content generation
streamContent(prompt, onChunk)   // Stream responses
generateCode(description)         // Generate code
improveCode(code, instruction)   // Improve existing code
explainCode(code)                // Explain code functionality
```

## API Endpoints (Backend)

### Authentication
```
GET    /auth/me            - Get authenticated user profile
GET    /auth/verify        - Verify authentication token
```

### AI Generation
```
POST   /generate           - Generate code (requires auth token)
       Body: { framework, prompt }
```

## Security Notes

🔐 **Current Implementation**:
- Passwords are managed by Supabase Auth
- Access tokens are verified server-side via Supabase (`auth.getUser(token)`)
- Frontend uses Supabase session management and protected routes

🔒 **Recommended Hardening**:
- Add API rate limiting for sensitive endpoints
- Enforce strict CORS origins in backend
- Enable/verify HTTPS in deployed environments

## Gemini API Details

### Model Used
- **Model**: `gemini-1.5-flash` (latest free model)
- **API Key**: Configure via backend env (`GOOGLE_API_KEY` or `GROQ_API_KEY`)
- **Pricing**: Free with generous rate limits

### Rate Limits
- 60 calls per minute (free tier)
- 30,000 calls per day (free tier)

### Capabilities
- Code generation & explanation
- Text generation
- Problem solving
- Chat conversations
- And much more!

## Troubleshooting

### "Invalid login credentials"
→ Check Supabase email/password and confirm email if required

### "Passwords do not match" on sign up
→ Verify both password fields contain identical values

### API call failed
→ Check internet connection and Gemini API key in `src/utils/aiService.js`

### Can't access home page
→ You're not logged in; go to `/login` first

### Backend not running
```bash
cd backend
npm install
npm run dev
```

## Customization

### Change API Model
Edit `src/utils/aiService.js`:
```javascript
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-pro"  // or another model
});
```

### Modify Login Page Styling
Edit `src/pages/Login.jsx` - it's built with Tailwind CSS

## Next Steps

1. ✅ Authentication working
2. ✅ Gemini API integrated
3. 📝 Create user dashboard
4. 🗄️ Add database backend
5. 🔒 Add auth hardening (rate limits, stricter CORS, audit logging)
6. 📊 Add usage analytics
7. 💾 Implement user history/saved items

## Support

For issues or questions:
1. Check the browser console for errors
2. Verify frontend/backend .env files for Supabase and AI keys
3. Ensure all dependencies are installed
4. If session appears stale, sign out and sign in again

---

Happy coding! 🚀
