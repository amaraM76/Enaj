# ⚡ Enaj Quick Start Guide

## 🎯 Complete Setup in 5 Minutes

### Step 1: Start Services (1 min)
```bash
cd /workspaces/Enaj/enaj-project
./start-all.sh
```
✅ Backend + Frontend now running

### Step 2: Get Your Token (1 min)
```bash
node get-token.js
```
✅ Copy the token that's displayed

### Step 3: Install Extension (2 min)
1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select: `/workspaces/Enaj/enaj-project/enaj-extension`
5. ✅ Extension installed

### Step 4: Link Extension (1 min)
1. Click Enaj icon in Chrome toolbar
2. Click "Link" under "Enaj account"
3. Enter:
   - API URL: `http://localhost:3001`
   - Token: [paste token from Step 2]
4. Click "Save & connect"
5. ✅ Extension linked!

### Step 5: Test (30 seconds)
1. Go to any Amazon beauty product
2. Click Enaj icon
3. Click "🔍 Scan This Product"
4. ✅ See results!

---

## 🔑 What Does the Token Do?

The connection token:
- ✅ Links extension to YOUR account
- ✅ Fetches YOUR preferences from database
- ✅ Saves YOUR scan history
- ✅ Keeps everything synced

**Without token:** Extension works locally only (no sync)
**With token:** Full features + cloud sync

---

## 📱 Quick Commands

```bash
# Start everything
./start-all.sh

# Get a token
node get-token.js

# Start just frontend
./start-frontend.sh

# Start just backend
cd backend && npm start
```

---

## 🆘 Common Issues

**Q: Extension not showing up?**
A: Make sure Developer mode is ON in chrome://extensions/

**Q: "Could not connect" error?**
A: Check backend is running: `curl http://localhost:3001/api/health`

**Q: No ingredients found?**
A: Extension only works on product pages (not search results)

**Q: Token expired?**
A: Generate a new one: `node get-token.js`

---

## 📚 More Help

- Full setup: `EXTENSION_SETUP.md`
- Testing guide: `test-extension.md`
- Backend docs: `backend/README.md`
- Extension docs: `enaj-extension/README.md`

---

## 🎉 You're All Set!

Your extension is now:
- 🔗 Connected to your backend
- 📊 Using your personal profile
- 🛡️ Ready to scan products
- ☁️ Syncing scan history

Happy scanning! 🎊
