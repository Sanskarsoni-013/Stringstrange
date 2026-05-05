# Step 6: Update Frontend with Backend URL (DETAILED)

## Overview
After deploying your backend to Render/Railway, you need to tell your frontend (on Vercel) where to find the backend.

---

## Step 6.1: Get Your Backend URL from Render

### After deploying on Render:
1. Go to https://dashboard.render.com
2. Click on your service name (e.g., `stringstrange-backend`)
3. Look at the top - you'll see a URL like:
   ```
   https://stringstrange-backend.onrender.com
   ```
4. **COPY this URL** (Ctrl+C)

![Render Dashboard showing URL]

---

## Step 6.2: Create .env.production File

### Option A: Using VS Code (IDE)
1. In your project folder `c:\Users\Victus\stringstrange`
2. Right-click in the file explorer (left sidebar)
3. Click **"New File"**
4. Name it exactly: `.env.production`
5. Add this line inside:
   ```
   REACT_APP_BACKEND_URL=https://your-backend-url.onrender.com
   ```
   Example:
   ```
   REACT_APP_BACKEND_URL=https://stringstrange-backend.onrender.com
   ```
6. Press **Ctrl+S** to save

### Option B: Using File Explorer
1. Open `c:\Users\Victus\stringstrange` in File Explorer
2. Right-click → New → Text Document
3. Name it `.env.production` (make sure it doesn't have .txt extension)
4. Open with Notepad
5. Paste:
   ```
   REACT_APP_BACKEND_URL=https://your-backend-url.onrender.com
   ```
6. Save and close

---

## Step 6.3: Commit and Push to GitHub

### Open Terminal in VS Code:
1. Press **Ctrl+`** (backtick) to open terminal
2. OR go to View → Terminal

### Run these commands one by one:

```bash
# Navigate to project (if not already there)
cd c:\Users\Victus\stringstrange

# Check git status
git status

# Add the new file
git add .env.production

# Commit with message
git commit -m "Add production backend URL"

# Push to GitHub
git push
```

---

## Step 6.4: Verify Vercel Redeployment

### After pushing to GitHub:
1. Go to https://vercel.com/dashboard
2. Click on your project (`stringstrange` or similar)
3. You'll see "Building..." automatically
4. Wait 1-2 minutes for build to complete
5. Once done, click "Visit" or open your site URL

![Vercel Dashboard showing build]

---

## Step 6.5: Test in Browser

### Open your Vercel site:
```
https://www.stringstrange.online
```

### Check Console (F12):
You should see:
```
Using network backend: https://stringstrange-backend.onrender.com
🔌 Connecting to WebSocket: wss://stringstrange-backend.onrender.com/ws/...
✅ WebSocket connected!
```

### If you see:
```
❌ WebSocket closed: 1006
```
→ Backend is still starting up (free tier takes 30-60 seconds)
→ Wait and refresh

---

## Common Mistakes to Avoid

### ❌ Wrong URL format:
```
# DON'T do this:
REACT_APP_BACKEND_URL=stringstrange-backend.onrender.com
REACT_APP_BACKEND_URL=http://stringstrange-backend.onrender.com
REACT_APP_BACKEND_URL=www.stringstrange.online

# DO this:
REACT_APP_BACKEND_URL=https://stringstrange-backend.onrender.com
```

### ❌ Wrong file name:
```
# DON'T:
.env.production.txt
.env.local
.env.production (with spaces)

# DO:
.env.production
```

### ❌ Missing REACT_APP_ prefix:
```
# DON'T:
BACKEND_URL=https://...

# DO:
REACT_APP_BACKEND_URL=https://...
```

---

## Quick Checklist

- [ ] Copied backend URL from Render (starts with https://)
- [ ] Created `.env.production` file in project root
- [ ] File contains: `REACT_APP_BACKEND_URL=https://...`
- [ ] Committed with `git commit -m "Add production backend URL"`
- [ ] Pushed with `git push`
- [ ] Vercel shows successful build
- [ ] Browser console shows `✅ WebSocket connected!`

---

## Still Not Working?

Check these in order:
1. Is backend URL correct? Open it in browser - should show JSON response
2. Did Vercel rebuild? Check vercel.com dashboard
3. Is file name exactly `.env.production`? (no extra extensions)
4. Clear browser cache: Ctrl+Shift+R
5. Check console for exact error message
