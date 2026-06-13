# Deploy StringStrange Backend to Production

To run the application independently ("without your PC being on"), you need to deploy the Python backend server to a cloud hosting service, and then update your Vercel frontend to point to the new backend URL.

This repository now contains root-level deployment files (`requirements.txt`, `Procfile`, `Dockerfile`) that make it compatible with all major free hosting services.

---

## Option A: Deploy to Koyeb (RECOMMENDED - Free, Runs 24/7)

Koyeb is a modern, fast hosting provider. Its free tier does not automatically put services to sleep, meaning there are no 60-second "cold starts" for users.

### Step 1: Create a Koyeb Account
1. Go to [https://www.koyeb.com](https://www.koyeb.com) and sign up for a free account.

### Step 2: Deploy the Repository
1. In the Koyeb Control Panel, click **"Create App"** or **"Deploy"**.
2. Select **GitHub** as the deployment method and connect your GitHub account.
3. Select your repository: `Sanskarsoni-013/Stringstrange`.
4. Koyeb will automatically detect the root-level `Dockerfile`.
5. Under **Service Settings**, check that:
   - **Builder:** Docker (using the `Dockerfile` in the root)
   - **Port:** Set to `8001` (Koyeb will route public HTTPS traffic to this port).
6. Click **"Deploy"**.

### Step 3: Get Your Koyeb Backend URL
1. Once the deployment finishes (takes ~1 minute), Koyeb will give you a public URL like:
   ```
   https://stringstrange-backend-xxxx.koyeb.app
   ```
2. Copy this URL (ensure it starts with `https://`).

---

## Option B: Deploy to Hugging Face Spaces (100% Free & Unlimited)

Hugging Face Spaces provides free hosting for Docker containers, which is excellent for WebSockets.

### Step 1: Create a Space
1. Sign up/Login to [https://huggingface.co](https://huggingface.co).
2. Go to **Spaces** (top navigation bar) and click **"Create new Space"**.
3. Configure your Space:
   - **Space Name:** `stringstrange-backend`
   - **License:** `mit` (or leave blank)
   - **SDK:** Select **Docker** (very important!)
   - **Template:** Select **Blank**
   - **Space Hardware:** Free (CPU Basic)
   - **Visibility:** **Public** (required for the frontend to connect)
4. Click **"Create Space"**.

### Step 2: Upload the Code
You can sync your GitHub repository directly or push files via Git:
1. In the Space settings, you can connect your GitHub repository `Sanskarsoni-013/Stringstrange` to auto-deploy.
2. Alternatively, clone the space locally, copy `server/`, `requirements.txt`, and `Dockerfile` into the space repository, commit, and push.

### Step 3: Get the URL
1. Once built, click on the **three dots** in the top right of your Space.
2. Click **"Embed this Space"**.
3. Copy the **Direct URL** (it looks like `https://username-stringstrange-backend.hf.space`).

---

## Option C: Deploy to Render (Free Tier, Wakes Up on Request)

Render is popular but puts services to sleep after 15 minutes of inactivity. When a user first opens the app, they must wait 30–60 seconds for the backend to wake up.

### Step 1: Configure Render
1. Login to [https://dashboard.render.com](https://dashboard.render.com).
2. Click **"New +"** → **"Web Service"**.
3. Connect your GitHub repository `Sanskarsoni-013/Stringstrange`.
4. Set the following settings:
   - **Name:** `stringstrange-backend`
   - **Environment/Runtime:** `Python`
   - **Root Directory:** Leave empty (run from root `/`)
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn server.server:app --host 0.0.0.0 --port $PORT`
   - **Plan:** Free
5. Click **"Create Web Service"**.

---

## Step 2: Link Frontend to Your New Backend URL

Once you have your backend URL (from Koyeb, Hugging Face, or Render), you need to tell your Vercel frontend where to connect.

### 2.1 Update `.env.production`
In your project directory, open `.env.production` and replace the URL with your new backend URL:
```env
REACT_APP_BACKEND_URL=https://your-new-backend-url
```
*(Make sure there is no trailing slash `/` at the end of the URL)*

### 2.2 Push to GitHub
Open your terminal and run:
```bash
git add .env.production
git commit -m "Update production backend URL to new host"
git push origin main
```

### 2.3 Verify
1. Vercel will automatically rebuild your site (takes ~1-2 minutes).
2. Open your website: [https://www.stringstrange.online](https://www.stringstrange.online).
3. Open Developer Tools (F12) and go to the Console tab.
4. You should see:
   ```
   Using env BACKEND_URL: https://your-new-backend-url
   🔌 Connecting to WebSocket: wss://your-new-backend-url/ws/...
   ✅ WebSocket connected!
   ```

---

## Troubleshooting Deployed Backend

### 1. Connection Timeout or 502 Bad Gateway
- **Render:** If you are using Render free tier, the first connection will time out if the server is sleeping. Wait 60 seconds and refresh.
- **Logs:** Go to your hosting dashboard (Koyeb/Render/Hugging Face) and check the runtime logs to see if there is any Python/Uvicorn error.

### 2. WebSocket Connection Closed Immediately
- Make sure your backend URL in `.env.production` starts with `https://` (the React frontend will automatically convert it to secure `wss://`).
- Double-check that your hosting provider allows websocket connections on the public port (Koyeb and Hugging Face do this automatically).
