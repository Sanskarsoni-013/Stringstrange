# Deploy StringStrange to Production

## Problem
Frontend (Vercel) is deployed but backend (Python) is NOT.
You need to deploy BOTH for the app to work.

---

## Step 1: Deploy Backend to Render (FREE)

### 1.1 Go to https://render.com and Sign Up/Login

### 1.2 Create New Web Service
- Click "New +" → "Web Service"
- Connect your GitHub repo: `Sanskarsoni-013/Stringstrange`
- Or use "Public Git repository" and paste your repo URL

### 1.3 Configure the Service
- **Name**: `stringstrange-backend`
- **Region**: Choose closest to your users (e.g., Singapore for India)
- **Branch**: `main`
- **Root Directory**: `server`
- **Runtime**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`
- **Plan**: Free

### 1.4 Click "Create Web Service"
Wait for deployment (2-3 minutes).

### 1.5 Get Your Backend URL
After deployment, you'll get a URL like:
```
https://stringstrange-backend.onrender.com
```

---

## Step 2: Update Frontend to Use Deployed Backend

### 2.1 Create/Update `.env.production` file:
```
REACT_APP_BACKEND_URL=https://stringstrange-backend.onrender.com
```
Replace with your actual Render URL.

### 2.2 Commit and Push
```bash
git add .
git commit -m "Add production backend URL"
git push
```

### 2.3 Redeploy Frontend on Vercel
Vercel will auto-deploy when you push to GitHub.

---

## Alternative: Deploy Backend to Railway (FREE)

### Railway Steps:
1. Go to https://railway.app
2. New Project → Deploy from GitHub repo
3. Add variable: `PORT=8001`
4. Deploy
5. Get public URL
6. Update `.env.production` with Railway URL

---

## Alternative: Deploy Backend to Fly.io (FREE)

### Fly.io Steps:
```bash
# Install flyctl (one time)
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"

# Login
fly auth login

# Launch
cd server
fly launch --name stringstrange-backend

# Deploy
fly deploy
```

---

## Checklist

- [ ] Backend deployed on Render/Railway/Fly.io
- [ ] Got backend URL (e.g., `https://xxx.onrender.com`)
- [ ] Updated `.env.production` with backend URL
- [ ] Pushed to GitHub
- [ ] Frontend redeployed on Vercel
- [ ] Test: Open Vercel URL, check console for successful WebSocket connection

---

## Troubleshooting

### "WebSocket connection failed"
- Check if backend is running: Open backend URL in browser
- Should show: `{"message":"StringStrange signaling server is running"}`
- If not, backend isn't deployed properly

### "CORS error"
- Backend already has `allow_origins=["*"]` - should work
- If not, add your Vercel domain specifically

### "Connection timed out"
- Free tier services "sleep" after inactivity (30 min)
- First connection may take 30-60 seconds to wake up
- This is normal for free tiers
