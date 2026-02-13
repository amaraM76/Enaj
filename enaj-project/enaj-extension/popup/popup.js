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
  const flagTokens = getAvoidTokens(flaggedIngredient);

  for (const ailmentName of profile.ailments) {
    for (const cat of AILMENTS_DATA) {
      const item = cat.items.find((i) => i.name === ailmentName);
      if (item) {
        const removed = (profile.removedIngredients || {})[ailmentName] || [];
        const active = item.avoid.filter((a) => !removed.includes(a));
        const matched = active.some((a) => {
          const aTokens = getAvoidTokens(a);
          return flagTokens.some((ft) =>
            aTokens.some((at) => ft === at || isMatch(ft, at) || isMatch(at, ft))
          );
        });
        if (matched) {
          reasons.ailments.push({ name: ailmentName, icon: item.icon });
        }
      }
    }
  }

  const matchedPref = profile.preferences.find((p) => {
    const pTokens = getAvoidTokens(p);
    return flagTokens.some((ft) =>
      pTokens.some((pt) => ft === pt || isMatch(ft, pt) || isMatch(pt, ft))
    );
  });
  if (matchedPref) reasons.preferences.push(matchedPref);

  return reasons;
}

/**
 * Normalize a string for fuzzy matching:
 * - lowercase
 * - strip parenthetical suffixes like "(SLS)" or "(heavy)"
 * - strip trailing punctuation
 * - collapse whitespace
 */
function normalize(str) {
  return str
    .toLowerCase()
    .replace(/\(.*?\)/g, "")       // remove parenthetical notes
    .replace(/[\/\\]/g, " ")       // slashes → spaces ("Fragrance/Parfum" → "Fragrance Parfum")
    .replace(/[^a-z0-9\s-]/g, "")  // strip special chars
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Generate all matching tokens from an avoid term.
 * e.g. "Fragrance/Parfum" → ["fragrance parfum", "fragrance", "parfum"]
 * e.g. "Sodium Lauryl Sulfate (SLS)" → ["sodium lauryl sulfate", "sls"]
 * e.g. "AHA/BHA (high %)" → ["aha bha", "aha", "bha"]
 */
function getAvoidTokens(avoid) {
  const tokens = new Set();
  const full = normalize(avoid);
  if (full) tokens.add(full);

  // Add each slash-separated part individually
  avoid.split("/").forEach((part) => {
    const n = normalize(part);
    if (n && n.length >= 3) tokens.add(n);
  });

  // Add parenthetical content as its own token (e.g. "SLS" from "(SLS)")
  const parenMatch = avoid.match(/\(([^)]+)\)/g);
  if (parenMatch) {
    parenMatch.forEach((p) => {
      const inner = normalize(p.replace(/[()]/g, ""));
      if (inner && inner.length >= 2) tokens.add(inner);
    });
  }

  return Array.from(tokens);
}

/**
 * Check if two normalized strings are a meaningful ingredient match.
 * Prevents tiny strings ("or", "di") from matching inside unrelated words.
 */
function isMatch(ingNorm, avoidToken) {
  // Exact match — always valid
  if (ingNorm === avoidToken) return true;

  // Ingredient contains the full avoid token as a substring
  // e.g. ingredient "sodium lauryl sulfate" contains avoid "lauryl sulfate"
  if (ingNorm.includes(avoidToken) && avoidToken.length >= 4) return true;

  // Avoid token contains the full ingredient as a substring
  // ONLY if the ingredient is long enough to be meaningful (not "or", "di", etc.)
  // AND the ingredient matches a whole word inside the avoid token
  if (avoidToken.includes(ingNorm) && ingNorm.length >= 5) {
    // Make sure it's a whole-word match inside the avoid token
    const wordBoundary = new RegExp("\\b" + escapeRegex(ingNorm) + "\\b");
    if (wordBoundary.test(avoidToken)) return true;
  }

  // For short tokens (abbreviations like "sls", "bht", "bha", "msg")
  // only match if the ingredient contains it as an exact whole word
  if (avoidToken.length >= 2 && avoidToken.length <= 5) {
    const ingWords = ingNorm.split(/[\s-]+/);
    if (ingWords.some((w) => w === avoidToken)) return true;
  }

  return false;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function analyzeIngredients(ingredientsStr) {
  const avoidList = getAvoidList();

  // Parse ingredients — split on commas and semicolons only.
  // Do NOT split on "and" / "or" — these are used within ingredient names
  // (e.g. "Shea Butter Or Cera Alba/Beeswax Or Copernicia Cerifera Wax")
  const ingredientsList = ingredientsStr
    .split(/[,;]+/)
    .map((i) => i.trim())
    .filter((i) => i.length > 2); // skip tiny fragments

  // Pre-compute normalized avoid tokens
  const avoidEntries = avoidList.map((avoid) => ({
    original: avoid,
    tokens: getAvoidTokens(avoid),
  }));

  const flagged = [];
  const alreadyFlagged = new Set();

  for (const rawIng of ingredientsList) {
    const ingNorm = normalize(rawIng);
    if (!ingNorm || ingNorm.length < 3) continue; // skip junk like "or", "di"

    for (const entry of avoidEntries) {
      if (alreadyFlagged.has(entry.original)) continue;

      let matched = false;
      for (const token of entry.tokens) {
        if (isMatch(ingNorm, token)) {
          matched = true;
          break;
        }
      }

      if (matched) {
        alreadyFlagged.add(entry.original);
        flagged.push({
          ingredient: rawIng.trim(),
          matchedAvoid: entry.original,
          reasons: getIngredientReasons(entry.original),
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
        <h2 style="font-size:14px;margin-bottom:8px;">Flagged Ingredients</h2>`;

    for (const f of flagged) {
      const reasons = f.reasons;
      let reasonText = "";
      if (reasons.ailments.length > 0) {
        reasonText += reasons.ailments.map((a) => a.icon + " " + a.name).join(", ");
      }
      if (reasons.preferences.length > 0) {
        if (reasonText) reasonText += " · ";
        reasonText += "🚫 " + reasons.preferences.join(", ");
      }

      html += `
        <div class="flagged-item">
          <div class="flagged-dot"></div>
          <div>
            <div class="flagged-name">${esc(capitalize(f.ingredient))}</div>
            ${f.matchedAvoid ? `<div class="flagged-reason" style="font-style:italic;color:#666;font-size:12px;">Matches: "${esc(f.matchedAvoid)}"</div>` : ""}
            ${reasonText ? `<div class="flagged-reason">${reasonText}</div>` : ""}
          </div>
        </div>`;
    }

    html += `</div>`;
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
