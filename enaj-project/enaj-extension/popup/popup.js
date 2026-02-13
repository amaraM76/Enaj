// ============================================================
// Enaj Browser Extension – Popup Logic
// ============================================================

const app = document.getElementById("app");

// ---- State ----
let currentScreen = "loading";
let profile = null; // { ailments: [], preferences: [], removedIngredients: {} }
let scanResult = null;
let scanning = false;
let backendLinked = false;
let backendError = null;

// ---- Storage helpers ----
function saveProfile(cb) {
  chrome.storage.local.set({ enajProfile: profile }, cb || (() => {}));
}

function loadProfile(cb) {
  chrome.storage.local.get("enajProfile", (data) => {
    profile = data.enajProfile || null;
    cb(profile);
  });
}

// ---- Avoid list computation (mirrors backend logic) ----
function getAvoidList() {
  if (!profile) return [];
  const avoidSet = new Set();

  for (const ailmentName of profile.ailments) {
    for (const cat of AILMENTS_DATA) {
      const item = cat.items.find((i) => i.name === ailmentName);
      if (item) {
        const removed = (profile.removedIngredients || {})[ailmentName] || [];
        for (const ing of item.avoid) {
          if (!removed.includes(ing)) avoidSet.add(ing);
        }
      }
    }
  }

  for (const pref of profile.preferences) {
    avoidSet.add(pref);
  }

  return Array.from(avoidSet);
}

function getIngredientReasons(flaggedIngredient) {
  const reasons = { ailments: [], preferences: [] };
  const fL = flaggedIngredient.toLowerCase();

  for (const ailmentName of profile.ailments) {
    for (const cat of AILMENTS_DATA) {
      const item = cat.items.find((i) => i.name === ailmentName);
      if (item) {
        const removed = (profile.removedIngredients || {})[ailmentName] || [];
        const active = item.avoid.filter((a) => !removed.includes(a));
        if (active.some((a) => a.toLowerCase().includes(fL) || fL.includes(a.toLowerCase()))) {
          reasons.ailments.push({ name: ailmentName, icon: item.icon });
        }
      }
    }
  }

  const matchedPref = profile.preferences.find(
    (p) => p.toLowerCase().includes(fL) || fL.includes(p.toLowerCase())
  );
  if (matchedPref) reasons.preferences.push(matchedPref);

  return reasons;
}

function analyzeIngredients(ingredientsStr) {
  const avoidList = getAvoidList();
  const ingredientsList = ingredientsStr
    .split(",")
    .map((i) => i.trim().toLowerCase())
    .filter(Boolean);

  const flagged = [];
  for (const ing of ingredientsList) {
    for (const avoid of avoidList) {
      const avoidL = avoid.toLowerCase();
      if (ing.includes(avoidL) || avoidL.includes(ing)) {
        flagged.push({
          ingredient: ing,
          matchedAvoid: avoid,
          reasons: getIngredientReasons(avoid),
        });
        break;
      }
    }
  }

  return { flagged, isRecommended: flagged.length === 0 };
}

// ---- Rendering ----
function render() {
  switch (currentScreen) {
    case "loading":
      renderLoading();
      break;
    case "link":
      renderLink();
      break;
    case "onboard-ailments":
      renderOnboardAilments();
      break;
    case "onboard-prefs":
      renderOnboardPrefs();
      break;
    case "home":
      renderHome();
      break;
    case "scanning":
      renderScanning();
      break;
    case "result":
      renderResult();
      break;
    case "edit-profile":
      renderEditProfile();
      break;
    case "error":
      renderError();
      break;
  }
}

// ---- Loading ----
function renderLoading() {
  app.innerHTML = `
    <div class="screen" style="display:flex;align-items:center;justify-content:center;min-height:480px;flex-direction:column;">
      <div class="logo-circle"><span>e</span></div>
      <p style="color:var(--text-light);margin-top:16px;font-size:14px;">Loading...</p>
    </div>
  `;
}

// ---- Link to Enaj (backend) ----
function renderLink() {
  EnajApi.getStoredConfig().then((config) => {
    const apiUrl = config.apiUrl || EnajApi.DEFAULT_API_URL;
    const token = config.token || "";
    app.innerHTML = `
      <div class="screen">
        <div class="header-row">
          <button class="btn-back" id="link-back">←</button>
          <div class="logo-circle logo-sm"><span>e</span></div>
        </div>
        <h2>Link to Enaj</h2>
        <p class="subtitle" style="text-align:left;margin-bottom:16px;">Connect this extension to your Enaj account to use your profile and save scan history.</p>
        ${backendError ? `<p class="msg" style="color:var(--danger);margin-bottom:12px;font-size:13px;">${esc(backendError)}</p>` : ""}
        <label class="field-label">Enaj API URL</label>
        <input type="text" id="link-api-url" value="${esc(apiUrl)}" placeholder="http://localhost:3001" class="field-input" />
        <label class="field-label" style="margin-top:12px;">Connection token</label>
        <input type="password" id="link-token" value="${esc(token)}" placeholder="Paste token from Enaj web app" class="field-input" />
        <p style="font-size:11px;color:var(--text-light);margin-top:6px;">Get your token from the Enaj web app: open the app → click "Copy connection token" in the Extension section.</p>
        <div style="margin-top:20px;display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn-primary" id="link-save">Save & connect</button>
          ${config.token ? `<button class="btn-secondary" id="link-unlink">Unlink</button>` : ""}
        </div>
      </div>
    `;

    document.getElementById("link-back").addEventListener("click", () => {
      backendError = null;
      currentScreen = "home";
      render();
    });

    document.getElementById("link-save").addEventListener("click", async () => {
      const urlInput = document.getElementById("link-api-url").value.trim() || EnajApi.DEFAULT_API_URL;
      const tokenInput = document.getElementById("link-token").value.trim();
      if (!tokenInput) {
        backendError = "Please enter your connection token.";
        render();
        return;
      }
      backendError = null;
      try {
        await EnajApi.checkHealth(urlInput);
        const profileData = await EnajApi.getProfile(urlInput, tokenInput);
        chrome.storage.local.set({
          enajApiUrl: urlInput.replace(/\/$/, ""),
          enajToken: tokenInput,
        });
        profile = {
          ailments: profileData.ailments || [],
          preferences: profileData.preferences || [],
          removedIngredients: profileData.removedIngredients || {},
        };
        saveProfile();
        backendLinked = true;
        currentScreen = "home";
        render();
      } catch (err) {
        backendError = err.message || "Could not connect. Check URL and token.";
        render();
      }
    });

    if (config.token) {
      const unlinkBtn = document.getElementById("link-unlink");
      if (unlinkBtn) {
        unlinkBtn.addEventListener("click", () => {
          chrome.storage.local.remove(["enajApiUrl", "enajToken"], () => {
            backendLinked = false;
            backendError = null;
            currentScreen = "home";
            render();
          });
        });
      }
    }
  });
}

// ---- Onboarding: Ailments ----
let tempAilments = [];

function renderOnboardAilments() {
  tempAilments = profile ? [...profile.ailments] : [];

  let html = `<div class="screen">
    <div class="logo-circle"><span>e</span></div>
    <h1>What should Enaj watch for?</h1>
    <p class="subtitle">Select any health conditions. Enaj will flag ingredients linked to them.</p>`;

  for (const cat of AILMENTS_DATA) {
    html += `<div class="category-label">${cat.category}</div><div class="chips-wrap">`;
    for (const item of cat.items) {
      const isActive = tempAilments.includes(item.name);
      html += `<div class="chip ${isActive ? "active" : ""}" data-ailment="${esc(item.name)}">${item.icon} ${esc(item.name)}</div>`;
    }
    html += `</div>`;
  }

  html += `
    <div style="margin-top:24px;">
      <button class="btn-primary" id="ailments-next">Continue — Set Preferences →</button>
    </div>
    <p style="text-align:center;margin-top:8px;"><button class="btn-text" id="ailments-skip">Skip for now</button></p>
  </div>`;

  app.innerHTML = html;

  // Bind chip clicks
  app.querySelectorAll(".chip[data-ailment]").forEach((el) => {
    el.addEventListener("click", () => {
      const name = el.dataset.ailment;
      if (tempAilments.includes(name)) {
        tempAilments = tempAilments.filter((a) => a !== name);
        el.classList.remove("active");
      } else {
        tempAilments.push(name);
        el.classList.add("active");
      }
    });
  });

  document.getElementById("ailments-next").addEventListener("click", () => {
    if (!profile) profile = { ailments: [], preferences: [], removedIngredients: {} };
    profile.ailments = tempAilments;
    currentScreen = "onboard-prefs";
    render();
  });

  document.getElementById("ailments-skip").addEventListener("click", () => {
    if (!profile) profile = { ailments: [], preferences: [], removedIngredients: {} };
    profile.ailments = tempAilments;
    currentScreen = "onboard-prefs";
    render();
  });
}

// ---- Onboarding: Preferences ----
let tempPrefs = [];

function renderOnboardPrefs() {
  tempPrefs = profile ? [...profile.preferences] : [];

  let html = `<div class="screen">
    <div class="header-row">
      <button class="btn-back" id="prefs-back">←</button>
      <div class="logo-circle logo-sm"><span>e</span></div>
    </div>
    <h2>Your Preferences</h2>
    <p class="subtitle" style="text-align:left;">Beyond health conditions, select anything else you want to avoid.</p>`;

  for (const cat of PERSONAL_PREFERENCES) {
    html += `<div class="category-label">${cat.category}</div><div class="chips-wrap">`;
    for (const item of cat.items) {
      const isActive = tempPrefs.includes(item);
      html += `<div class="chip ${isActive ? "active" : ""}" data-pref="${esc(item)}">${isActive ? "✓ " : ""}${esc(item)}</div>`;
    }
    html += `</div>`;
  }

  html += `
    <div style="margin-top:24px;">
      <button class="btn-primary" id="prefs-save">Save & Start Scanning →</button>
    </div>
    <p style="text-align:center;margin-top:8px;"><button class="btn-text" id="prefs-skip">Skip for now</button></p>
  </div>`;

  app.innerHTML = html;

  app.querySelectorAll(".chip[data-pref]").forEach((el) => {
    el.addEventListener("click", () => {
      const name = el.dataset.pref;
      if (tempPrefs.includes(name)) {
        tempPrefs = tempPrefs.filter((p) => p !== name);
        el.classList.remove("active");
        el.textContent = name;
      } else {
        tempPrefs.push(name);
        el.classList.add("active");
        el.textContent = "✓ " + name;
      }
    });
  });

  document.getElementById("prefs-back").addEventListener("click", () => {
    currentScreen = "onboard-ailments";
    render();
  });

  const handleSave = async () => {
    profile.preferences = tempPrefs;
    if (backendLinked) {
      try {
        const config = await EnajApi.getStoredConfig();
        if (config.token && config.apiUrl) {
          await EnajApi.setUserAilments(config.apiUrl, config.token, profile.ailments);
          await EnajApi.setUserPreferences(config.apiUrl, config.token, profile.preferences);
        }
      } catch (err) {
        console.warn("Could not sync to Enaj backend:", err);
      }
    }
    saveProfile(() => {
      chrome.runtime.sendMessage({ action: "profileComplete" });
      currentScreen = "home";
      render();
    });
  };

  document.getElementById("prefs-save").addEventListener("click", handleSave);
  document.getElementById("prefs-skip").addEventListener("click", handleSave);
}

// ---- Home ----
function renderHome() {
  const avoidList = getAvoidList();

  let conditionChips = "";
  if (profile.ailments.length > 0) {
    conditionChips = profile.ailments
      .map((a) => {
        const item = AILMENTS_DATA.flatMap((c) => c.items).find((i) => i.name === a);
        return `<span class="chip active" style="cursor:default;font-size:11px;padding:6px 10px;">${item?.icon || "🩺"} ${esc(a)}</span>`;
      })
      .join("");
  } else {
    conditionChips = `<span style="color:var(--text-light);font-size:12px;font-style:italic;">No conditions set</span>`;
  }

  app.innerHTML = `
    <div class="screen" style="padding-bottom:16px;">
      <div class="shield-bar">
        <h3>🛡️ Your Shield is Active</h3>
        <p>Enaj is monitoring <strong>${avoidList.length} ingredient${avoidList.length !== 1 ? "s" : ""}</strong> based on your profile.</p>
      </div>

      <button class="btn-primary" id="scan-btn" style="font-size:15px;padding:16px;">
        🔍 &nbsp;Scan This Product
      </button>

      <div class="card" style="margin-top:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:13px;font-weight:700;color:var(--text);">My Conditions</span>
          <button class="btn-text" id="edit-ailments" style="font-size:11px;color:var(--tiffany-dark);">Edit</button>
        </div>
        <div class="chips-wrap" style="margin-top:8px;">${conditionChips}</div>
      </div>

      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:13px;font-weight:700;color:var(--text);">Preferences</span>
          <button class="btn-text" id="edit-prefs" style="font-size:11px;color:var(--tiffany-dark);">Edit</button>
        </div>
        <p style="font-size:12px;color:var(--text-light);margin-top:6px;">
          ${profile.preferences.length > 0 ? profile.preferences.length + " personal preference" + (profile.preferences.length !== 1 ? "s" : "") + " active" : "None set"}
        </p>
      </div>

      <div class="card" style="margin-top:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:13px;font-weight:700;color:var(--text);">Enaj account</span>
          <button class="btn-text" id="link-account" style="font-size:11px;color:var(--tiffany-dark);">${backendLinked ? "Linked ✓" : "Link"}</button>
        </div>
        <p style="font-size:12px;color:var(--text-light);margin-top:6px;">
          ${backendLinked ? "Profile and scan history sync with the Enaj web app." : "Link to sync with the Enaj web app and save scans."}
        </p>
      </div>
    </div>
  `;

  document.getElementById("scan-btn").addEventListener("click", triggerScan);
  document.getElementById("link-account").addEventListener("click", () => {
    currentScreen = "link";
    backendError = null;
    render();
  });

  document.getElementById("edit-ailments").addEventListener("click", () => {
    currentScreen = "onboard-ailments";
    render();
  });

  document.getElementById("edit-prefs").addEventListener("click", () => {
    currentScreen = "onboard-prefs";
    render();
  });
}

// ---- Scan ----
function triggerScan() {
  currentScreen = "scanning";
  scanning = true;
  render();

  chrome.runtime.sendMessage({ action: "scanCurrentTab" }, async (response) => {
    scanning = false;

    if (!response || response.error) {
      scanResult = { error: response?.error || "Could not scan this page." };
      currentScreen = "error";
      render();
      return;
    }

    const product = response.product;

    if (!product.ingredients || product.ingredients.trim().length < 5) {
      scanResult = {
        error: "No ingredients found on this page. Try navigating to a product page that lists ingredients.",
        product: product,
      };
      currentScreen = "error";
      render();
      return;
    }

    const config = await EnajApi.getStoredConfig();
    if (config.token && config.apiUrl) {
      try {
        const result = await EnajApi.analyzeProduct(
          config.apiUrl,
          config.token,
          product.name,
          product.brand,
          product.price,
          product.ingredients
        );
        const flagged = (result.flaggedIngredients || []).map((f) => ({
          ingredient: f.ingredient,
          matchedAvoid: f.matchedAvoid || f.ingredient,
          reasons: f.reasons || { ailments: [], preferences: [] },
        }));
        scanResult = {
          product: product,
          flagged,
          isRecommended: result.isRecommended === true,
        };
        currentScreen = "result";
        render();
      } catch (err) {
        const analysis = analyzeIngredients(product.ingredients);
        scanResult = {
          product,
          flagged: analysis.flagged,
          isRecommended: analysis.isRecommended,
        };
        currentScreen = "result";
        render();
      }
    } else {
      const analysis = analyzeIngredients(product.ingredients);
      scanResult = {
        product: product,
        flagged: analysis.flagged,
        isRecommended: analysis.isRecommended,
      };
      currentScreen = "result";
      render();
    }
  });
}

// ---- Scanning Overlay ----
function renderScanning() {
  app.innerHTML = `
    <div class="scanning-overlay">
      <div class="scanning-circle">🔍</div>
      <p class="scanning-text">Scanning ingredients...</p>
      <div class="scanning-bar"><div class="scanning-bar-fill"></div></div>
    </div>
  `;
}

// ---- Result ----
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
        <div class="flagged-item" style="background:#fff9e6;border-left:4px solid #ff6b6b;padding:12px;margin:8px 0;border-radius:6px;">
          <div style="margin-bottom:6px;">
            <div class="flagged-name" style="font-size:15px;font-weight:700;color:#d32f2f;margin-bottom:4px;">
              ${esc(capitalize(f.ingredient))}
            </div>
            ${f.matchedAvoid && f.matchedAvoid !== f.ingredient ?
              `<div style="font-size:12px;color:#666;font-style:italic;margin-bottom:6px;">
                Matches avoid list: "${esc(f.matchedAvoid)}"
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

      <div style="background:#e8f5e9;padding:12px;border-radius:6px;margin-top:12px;border-left:3px solid #4caf50;">
        <p style="margin:0;font-size:12px;color:#2e7d32;line-height:1.5;">
          <strong>💡 Tip:</strong> These ingredients match items you want to avoid based on your profile. You can adjust your preferences in settings.
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

// ---- Error ----
function renderError() {
  const msg = scanResult?.error || "Something went wrong.";
  const hasProduct = scanResult?.product?.name;

  app.innerHTML = `
    <div class="screen">
      <div class="header-row">
        <button class="btn-back" id="err-back">←</button>
        <div class="logo-circle logo-sm"><span>e</span></div>
      </div>

      <div class="empty-state">
        <div class="icon">😕</div>
        ${hasProduct ? `<p style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:8px;">${esc(scanResult.product.name)}</p>` : ""}
        <p class="msg">${esc(msg)}</p>
      </div>

      <div style="margin-top:16px;">
        <button class="btn-primary" id="try-again">Try Again</button>
      </div>
      <div style="margin-top:8px;">
        <button class="btn-secondary" id="err-home">Back to Dashboard</button>
      </div>
    </div>
  `;

  document.getElementById("err-back").addEventListener("click", () => {
    currentScreen = "home";
    render();
  });
  document.getElementById("try-again").addEventListener("click", triggerScan);
  document.getElementById("err-home").addEventListener("click", () => {
    currentScreen = "home";
    render();
  });
}

// ---- Helpers ----
function esc(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

function capitalize(str) {
  if (!str) return "";
  return str
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ---- Init ----
(async function init() {
  const config = await EnajApi.getStoredConfig();
  if (config.token && config.apiUrl) {
    try {
      const profileData = await EnajApi.getProfile(config.apiUrl, config.token);
      profile = {
        ailments: profileData.ailments || [],
        preferences: profileData.preferences || [],
        removedIngredients: profileData.removedIngredients || {},
      };
      saveProfile();
      backendLinked = true;
    } catch (err) {
      backendLinked = false;
      loadProfile((p) => {
        profile = p;
      });
    }
  } else {
    loadProfile((p) => {
      profile = p;
    });
  }
  if (!profile) profile = { ailments: [], preferences: [], removedIngredients: {} };
  if (profile.ailments.length > 0 || profile.preferences.length > 0) {
    currentScreen = "home";
  } else {
    currentScreen = "onboard-ailments";
  }
  render();
})();
