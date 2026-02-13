# 🛡️ Enaj Browser Extension Setup Guide

This guide will help you install and configure the Enaj browser extension.

## Quick Setup (Recommended)

### Option 1: Automated Token Generator (Fastest) ⚡

```bash
cd enaj-project
node get-token.js
```

This interactive script will:
- Check if your backend is running
- Create a guest account OR login with existing credentials
- Display your connection token
- Provide step-by-step installation instructions

### Option 2: Web App with Visual Interface 🌐

```bash
cd enaj-project
./get-extension-token.sh
```

This script will:
- Start the backend (if not running)
- Start a web server for the web app
- Open the web app in your browser
- Provide instructions to copy your token

---

## Manual Setup

### Step 1: Start the Backend

```bash
cd enaj-project/backend
npm install  # First time only
npm start    # Runs on http://localhost:3001
```

### Step 2: Get Your Connection Token

#### Method A: Using the Web App

1. Open `enaj-project/web-app/enaj-app.html` in your browser
   - You can use any local server: `python3 -m http.server 8000`
   - Or open the file directly: `file:///path/to/enaj-app.html`

2. Complete onboarding or sign in

3. On the Home screen, find "Connect browser extension" section

4. Click "Copy connection token"

#### Method B: Using the CLI Script

```bash
cd enaj-project
node get-token.js
```

Follow the prompts to create a guest account or login.

### Step 3: Install the Extension in Chrome

1. Open Chrome/Edge browser

2. Navigate to `chrome://extensions/`

3. Enable **Developer mode** (toggle in top-right corner)

4. Click **"Load unpacked"**

5. Browse to and select: `enaj-project/enaj-extension/`

6. The Enaj icon (🛡️) should appear in your browser toolbar

### Step 4: Link the Extension to Your Account

1. Click the Enaj extension icon in your toolbar

2. You'll see the onboarding screen

3. Click **"Link"** under "Enaj account" (or complete local onboarding first)

4. Enter connection details:
   - **API URL:** `http://localhost:3001`
   - **Connection Token:** (paste the token you copied)

5. Click **"Save & connect"**

6. Your profile will sync, and you're ready to scan!

---

## Troubleshooting

### Extension doesn't appear after installation

- Make sure you're in Developer mode
- Check that you selected the correct folder (`enaj-extension`)
- Look for error messages in the Extensions page

### "Could not connect" error when linking

- Verify backend is running: `curl http://localhost:3001/api/health`
- Check the API URL is correct: `http://localhost:3001` (no trailing slash)
- Verify your token is correct (no extra spaces)

### Extension icon shows but doesn't scan

- The extension only auto-scans on supported sites:
  - Amazon, Sephora, Target, Ulta, Walmart, CVS, Walgreens, iHerb
- You must click the extension icon to open the popup
- Click "Scan This Product" button in the popup

### Backend not running

```bash
cd enaj-project/backend
npm install
npm start
```

Check for errors in the terminal output.

---

## Testing the Extension

1. Navigate to a supported product page (e.g., Amazon beauty product)

2. Click the Enaj extension icon

3. Click "🔍 Scan This Product"

4. The extension will:
   - Extract ingredients from the page
   - Check against your profile (ailments + preferences)
   - Show results with flagged ingredients

---

## Extension Features

- ✅ **Standalone mode**: Profile stored locally in browser
- ✅ **Linked mode**: Profile syncs with backend + scan history saved
- ✅ **Auto-scraping**: Works on major shopping sites
- ✅ **Real-time analysis**: Instant ingredient checking
- ✅ **Personalized**: Based on your health conditions and preferences

---

## Need Help?

- Backend not starting? Check `backend/README.md`
- Extension issues? Check `enaj-extension/README.md`
- API documentation? See `backend/server.js` for all endpoints

---

## Helper Scripts Reference

### `get-token.js` - Quick Token Generator
```bash
node get-token.js
```
Interactive CLI to create account and get token.

### `get-extension-token.sh` - Full Web App Launcher
```bash
./get-extension-token.sh
```
Starts backend + web app, opens browser with full UI.

---

**Pro Tip:** Keep your backend running while using the extension for the best experience (synced profile + saved scan history).
