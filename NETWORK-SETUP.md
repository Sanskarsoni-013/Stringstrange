# StringStrange - Multi-Device Access Guide

## Option 1: Same WiFi Network (Recommended for Testing)

### Step 1: Get Your Local IP
Open PowerShell and run:
```powershell
ipconfig | findstr "IPv4"
```
Copy the IP address (e.g., `192.168.1.5`)

### Step 2: Update Environment File
Edit `.env` file:
```
REACT_APP_BACKEND_URL=http://192.168.1.5:8001
```
Replace `192.168.1.5` with your actual IP.

### Step 3: Start the Backend Server
Navigate to your server folder and start it on port 8001:
```bash
cd server
node server.js
```
Or if you have a Python backend:
```bash
cd server
python server.py
```

### Step 4: Start the Frontend
```bash
set PORT=3000
set HOST=0.0.0.0
npm start
```

### Step 5: Access from Devices
- **This computer**: http://localhost:3000
- **Other devices on same WiFi**: http://YOUR_IP:3000
  (e.g., http://192.168.1.5:3000)

---

## Option 2: Public Internet Access (Any Device, Anywhere)

### Using Ngrok (Already included in your project)

1. **Open Terminal 1 - Start Ngrok for Frontend:**
```bash
.\ngrok.exe http 3000
```
Copy the `https://xxxx.ngrok-free.app` URL shown.

2. **Open Terminal 2 - Start Ngrok for Backend:**
```bash
.\ngrok.exe http 8001
```
Copy the `https://yyyy.ngrok-free.app` URL shown.

3. **Update `.env` file:**
```
REACT_APP_BACKEND_URL=https://yyyy.ngrok-free.app
```

4. **Start your backend server** on port 8001

5. **Start frontend:**
```bash
npm start
```

6. **Access from anywhere**: Use the ngrok frontend URL (https://xxxx.ngrok-free.app)

---

## Quick Start Scripts

### For Local Network:
Double-click `start-local.bat`

### For Public Access:
Double-click `start-ngrok.bat` (you'll still need to run ngrok separately)

---

## Troubleshooting

### "Cannot connect to backend"
- Check firewall settings - allow port 8001
- Make sure backend is running: `netstat -an | findstr 8001`
- Verify the IP address is correct

### "WebSocket connection failed"
- Backend must support WebSocket (ws:// or wss://)
- For ngrok HTTPS, backend WebSocket should use wss://

### "ICE connection failed"
- Already fixed in VideoChat.js with TURN servers
- If still failing, check browser console for errors

---

## Default Ports
- Frontend (React): 3000
- Backend (WebSocket): 8001

## Check What's Running
```powershell
netstat -an | findstr "3000 8001"
```
