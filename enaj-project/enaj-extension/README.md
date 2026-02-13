# Enaj Browser Extension – Ingredient Shield 🛡️

A Chrome extension that scans product pages for ingredients you want to avoid based on your health conditions and personal preferences.

## How It Works

1. **Install the extension** → set up your profile (select health conditions + preferences), or link to your Enaj account.
2. **Browse any supported shopping site** → navigate to a product page.
3. **Click the Enaj icon** → tap "Scan This Product".
4. **Instantly see results** → flagged ingredients with reasons, or a green "Looks Good!" badge.

You can use the extension **standalone** (profile stored locally) or **linked to the Enaj backend** (profile and scan history sync with the Enaj web app).

## Link to Enaj (backend + web app)

1. **Start the backend** (from the repo root): `cd backend && npm start` (runs on `http://localhost:3001`).
2. **Open the Enaj web app** (e.g. `http://localhost:8000/enaj-app.html`), complete onboarding, and sign in (guest or account).
3. On the **web app Home** screen, under **"Connect browser extension"**, click **"Copy connection token"**.
4. **Open the extension popup** → click **"Enaj account"** → **"Link"**.
5. Enter **Enaj API URL** (e.g. `http://localhost:3001`) and paste the **Connection token** → **Save & connect**.

After linking, the extension uses your backend profile for scans and saves each scan to your account.

---

## Load as Unpacked Extension (for development / testing)

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **"Load unpacked"**
4. Select the `enaj-extension` folder
5. The Enaj icon appears in your toolbar — click it to set up your profile!

**Icons:** The manifest references `icons/icon16.png`, `icon48.png`, and `icon128.png`. If the `icons/` folder is missing, create it and add 16×16, 48×48, and 128×128 PNGs, or Chrome will use a default icon.

## Supported Shopping Sites

The content script auto-scrapes ingredients from:

- **Amazon** (amazon.com)
- **Sephora** (sephora.com)
- **Target** (target.com)
- **Ulta** (ulta.com)
- **Walmart** (walmart.com)
- **CVS** (cvs.com)
- **Walgreens** (walgreens.com)
- **iHerb** (iherb.com)

On any other site, the extension will attempt a generic scrape by looking for ingredient lists on the page.

## File Structure

```
enaj-extension/
├── manifest.json           # Chrome Extension Manifest V3
├── background.js           # Service worker (handles tab injection)
├── content-script.js       # Injected into pages to scrape ingredients
├── popup/
│   ├── popup.html          # Extension popup shell
│   ├── popup.css           # Enaj-branded styles
│   ├── popup.js            # All UI logic (onboarding, scan, results)
│   └── data.js             # Ailments & preferences database
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

## Publishing to Chrome Web Store

1. Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Pay the one-time $5 developer fee
3. Zip the entire `enaj-extension/` folder
4. Click "New Item" → upload the zip
5. Fill in the listing details:
   - **Name:** Enaj – Ingredient Shield
   - **Description:** Instantly scan any product for ingredients you need to avoid based on your health conditions and preferences.
   - **Category:** Shopping
   - **Screenshots:** Take screenshots of the popup in action
6. Submit for review (typically 1–3 business days)

## Updating Scrapers

Shopping sites change their DOM frequently. To update scrapers without pushing a new extension version, you could:

- Move the scraper selectors to a remote JSON config file hosted on your backend
- Have the content script fetch fresh selectors on load
- This way you can update scraping rules server-side without republishing
