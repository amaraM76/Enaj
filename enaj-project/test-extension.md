# 🧪 Testing Your Enaj Extension

## Quick Test Checklist

### ✅ Prerequisites
- [ ] Backend running on http://localhost:3001
- [ ] Extension installed in Chrome
- [ ] Extension linked with your token

### 🔬 Test 1: Extension Opens
1. Click the Enaj icon in Chrome toolbar
2. Extension popup should open
3. Should show your profile or onboarding

**Expected:** Popup opens without errors

### 🔬 Test 2: Profile Loaded
1. After linking, check the home screen
2. Should show:
   - "Your Shield is Active"
   - Number of ingredients being monitored
   - Your conditions and preferences

**Expected:** Your profile data from database is displayed

### 🔬 Test 3: Scan on Supported Site

#### Option A: Amazon Product (Real)
1. Go to: https://www.amazon.com/dp/B00A2B8VS4
   (CeraVe Moisturizing Cream - has ingredients)
2. Click Enaj extension icon
3. Click "🔍 Scan This Product"
4. Wait for scan to complete

**Expected:** Shows product name, ingredients analysis

#### Option B: Local Test Page (Create One)
1. Create a test HTML file with mock product data
2. Open in browser
3. Scan with extension

**Expected:** Extension scrapes and analyzes data

### 🔬 Test 4: Check Flagged Ingredients
1. In web app, set preference to avoid "Parabens"
2. Scan a product containing parabens
3. Extension should flag it

**Expected:**
- Red warning banner
- Shows "⚠️ 1 Ingredient Flagged"
- Lists "Parabens" with reason

### 🔬 Test 5: Sync Check
1. Change preferences in web app
2. Close and reopen extension
3. Extension should fetch new preferences

**Expected:** Extension shows updated profile

## 🐛 Troubleshooting

### Extension won't open
- Check Chrome console: Right-click extension icon → "Inspect popup"
- Look for JavaScript errors

### "Could not scan this page"
- Extension only works on supported sites (Amazon, Sephora, etc.)
- Check if you're on a product page (not search results)

### No ingredients found
- Some products don't list ingredients
- Try a different product (beauty/skincare products usually have ingredients)

### Token not working
- Verify backend is running: curl http://localhost:3001/api/health
- Check token has no extra spaces
- Generate a fresh token

## 📝 Test Results Template

```
Date: ___________
Backend Status: [ ] Running [ ] Not Running
Extension Version: 1.0.0

Test Results:
- Extension Opens: [ ] Pass [ ] Fail
- Profile Loaded: [ ] Pass [ ] Fail
- Scan Product: [ ] Pass [ ] Fail
- Flags Ingredients: [ ] Pass [ ] Fail
- Sync Works: [ ] Pass [ ] Fail

Notes:
_________________________________
_________________________________
```
