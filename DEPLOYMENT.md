# Deployment Guide for GitCompass

## 🚀 Deployment Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Vercel      │     │    Railway/     │     │  MongoDB Atlas  │
│   (Frontend)    │────▶│    Render       │────▶│   (Database)    │
│   React/Vite    │     │ (Backend + AI)  │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## 1️⃣ MongoDB Atlas Setup (Free)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster (M0 Sandbox)
3. Create a database user
4. Whitelist IP: `0.0.0.0/0` (allow all for cloud deployment)
5. Get your connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/gitcompass?retryWrites=true&w=majority
   ```

---

## 2️⃣ Backend Deployment (Railway - Recommended)

### Option A: Railway (Free tier available)

1. Go to [Railway](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select `rohitkatore/gitCompass`
4. Set root directory to `backend`
5. Add environment variables:

```env
PORT=8080
NODE_ENV=production
MONGODB_URI=mongodb+srv://...your-atlas-uri...
SESSION_SECRET=your-secret-key-here
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=https://your-backend.railway.app/api/auth/github/callback
CLIENT_URL=https://your-frontend.vercel.app
AI_SERVICE_URL=https://your-ai-engine.railway.app
```

6. Deploy and note your backend URL (e.g., `https://gitcompass-backend.railway.app`)

### Option B: Render (Free tier available)

1. Go to [Render](https://render.com)
2. New → Web Service → Connect GitHub repo
3. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
4. Add same environment variables as above

---

## 3️⃣ AI Engine Deployment (Railway/Render)

### Railway

1. New Project → Deploy from GitHub
2. Set root directory to `ai-engine`
3. Add environment variables:

```env
PORT=8000
GEMINI_API_KEY=your-gemini-api-key
GITHUB_TOKEN=your-github-token
```

4. Note your AI Engine URL

### Render

1. New → Web Service
2. Settings:
   - **Root Directory**: `ai-engine`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

---

## 4️⃣ Frontend Deployment (Vercel)

1. Go to [Vercel](https://vercel.com)
2. Click "Add New Project"
3. Import `rohitkatore/gitCompass` from GitHub
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. Add environment variable:
```env
VITE_API_URL=https://your-backend.railway.app
```

6. Deploy!

---

## 5️⃣ Update GitHub OAuth App

After deployment, update your GitHub OAuth App settings:

1. Go to https://github.com/settings/developers
2. Edit your OAuth App
3. Update:
   - **Homepage URL**: `https://your-frontend.vercel.app`
   - **Authorization callback URL**: `https://your-backend.railway.app/api/auth/github/callback`

---

## 📋 Environment Variables Summary

### Backend (Railway/Render)
| Variable | Value |
|----------|-------|
| PORT | 8080 |
| NODE_ENV | production |
| MONGODB_URI | mongodb+srv://... |
| SESSION_SECRET | random-secret-key |
| GITHUB_CLIENT_ID | From GitHub OAuth |
| GITHUB_CLIENT_SECRET | From GitHub OAuth |
| GITHUB_CALLBACK_URL | https://backend-url/api/auth/github/callback |
| CLIENT_URL | https://frontend.vercel.app |
| AI_SERVICE_URL | https://ai-engine-url |

### AI Engine (Railway/Render)
| Variable | Value |
|----------|-------|
| PORT | 8000 |
| GEMINI_API_KEY | From Google AI Studio |
| GITHUB_TOKEN | From GitHub (optional) |

### Frontend (Vercel)
| Variable | Value |
|----------|-------|
| VITE_API_URL | https://backend-url |

---

## 🔧 Troubleshooting

### CORS Issues
Make sure backend `CLIENT_URL` matches your Vercel frontend URL exactly.

### Auth Not Working
1. Check GitHub OAuth callback URL matches backend URL
2. Ensure cookies are set with `secure: true` and `sameSite: 'none'` for cross-domain

### AI Recommendations Not Loading
1. Check AI_SERVICE_URL in backend
2. Verify GEMINI_API_KEY is set in AI engine

---

## 🌐 Final URLs

After deployment, you'll have:
- **Frontend**: `https://gitcompass.vercel.app`
- **Backend**: `https://gitcompass-backend.railway.app`
- **AI Engine**: `https://gitcompass-ai.railway.app`
