// Improved renderResult function for popup.js
// This version shows ingredients more clearly with better formatting

function renderResult() {
  if (!scanResult) {
    currentScreen = "home";
    render();
    return;
  }

  const { product, flagged, isRecommended } = scanResult;

  let html = `<div class="screen">
    <div class="header-row">
      <button class="btn-back" id="result-back">←</button>
      <div class="logo-circle logo-sm"><span>e</span></div>
    </div>

    <div class="product-info">
      <div class="product-icon">🛍️</div>
      <div>
        <div class="product-name">${esc(product.name || "Unknown Product")}</div>
        <div class="product-brand">${esc(product.brand || "")}${product.price ? " · " + esc(product.price) : ""}</div>
      </div>
    </div>`;

  if (isRecommended) {
    html += `
      <div class="result-banner safe">
        <div class="icon">✅</div>
        <div class="title">Looks Good!</div>
        <div class="count">No flagged ingredients found based on your profile.</div>
      </div>`;
  } else {
    html += `
      <div class="result-banner danger">
        <div class="icon">⚠️</div>
        <div class="title">${flagged.length} Ingredient${flagged.length !== 1 ? "s" : ""} Flagged</div>
        <div class="count">Based on your health conditions & preferences</div>
      </div>

      <div class="card" style="margin-top:0;">
        <h2 style="font-size:14px;margin-bottom:12px;color:#d32f2f;">⚠️ Flagged Ingredients</h2>`;

    for (const f of flagged) {
      const reasons = f.reasons;

      // Build reason badges
      let reasonBadges = [];

      if (reasons.ailments && reasons.ailments.length > 0) {
        for (const a of reasons.ailments) {
          reasonBadges.push(`<span style="display:inline-block;background:#e3f2fd;padding:4px 10px;border-radius:12px;font-size:11px;font-weight:600;margin:2px;">${a.icon} ${esc(a.name)}</span>`);
        }
      }

      if (reasons.preferences && reasons.preferences.length > 0) {
        for (const p of reasons.preferences) {
          reasonBadges.push(`<span style="display:inline-block;background:#fff3cd;padding:4px 10px;border-radius:12px;font-size:11px;font-weight:600;margin:2px;">🚫 ${esc(p)}</span>`);
        }
      }

      html += `
        <div class="flagged-item" style="background:#fff3cd;border-left:4px solid #ff6b6b;padding:12px;margin:8px 0;border-radius:6px;">
          <div style="margin-bottom:6px;">
            <div class="flagged-name" style="font-size:15px;font-weight:700;color:#d32f2f;margin-bottom:4px;">
              ${esc(capitalize(f.ingredient))}
            </div>
            ${f.matchedAvoid && f.matchedAvoid !== f.ingredient ?
              `<div style="font-size:12px;color:#666;font-style:italic;margin-bottom:6px;">
                Matches: "${esc(f.matchedAvoid)}"
              </div>` : ''}
          </div>
          ${reasonBadges.length > 0 ?
            `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:8px;">
              <span style="font-size:12px;color:#555;font-weight:600;margin-right:4px;">Why flagged:</span>
              ${reasonBadges.join('')}
            </div>` : ''}
        </div>`;
    }

    html += `
      </div>

      <div style="background:#f9f9f9;padding:12px;border-radius:6px;margin-top:12px;border-left:3px solid #2196F3;">
        <p style="margin:0;font-size:12px;color:#555;line-height:1.5;">
          <strong>💡 What this means:</strong> These ingredients were found in the product and match items you want to avoid based on your health conditions or personal preferences.
        </p>
      </div>
    `;
  }

  html += `
    <div style="margin-top:16px;">
      <button class="btn-primary" id="scan-again">Scan Another Product</button>
    </div>
    <div style="margin-top:8px;">
      <button class="btn-secondary" id="go-home">Back to Dashboard</button>
    </div>
  </div>`;

  app.innerHTML = html;

  document.getElementById("result-back").addEventListener("click", () => {
    currentScreen = "home";
    render();
  });
  document.getElementById("scan-again").addEventListener("click", triggerScan);
  document.getElementById("go-home").addEventListener("click", () => {
    currentScreen = "home";
    render();
  });
}

// Instructions to apply this improvement:
// 1. Open /workspaces/Enaj/enaj-project/enaj-extension/popup/popup.js
// 2. Find the renderResult() function (around line 517)
// 3. Replace it with this improved version
// 4. The changes include:
//    - Better visual hierarchy for flagged ingredients
//    - Shows the matched avoid term ("Matches: Parabens")
//    - Displays reasons as colored badges
//    - Adds helpful explanation at the bottom
//    - Improved styling with background colors and borders
