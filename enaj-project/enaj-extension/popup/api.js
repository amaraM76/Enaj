// Enaj Extension – Backend API client
// Uses chrome.storage for apiUrl and token (set via "Link to Enaj" in popup)

const DEFAULT_API_URL = "http://localhost:3001";

async function getStoredConfig() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["enajApiUrl", "enajToken"], (data) => {
      resolve({
        apiUrl: (data.enajApiUrl || DEFAULT_API_URL).replace(/\/$/, ""),
        token: data.enajToken || null,
      });
    });
  });
}

async function request(apiUrl, endpoint, options = {}) {
  const url = `${apiUrl}${endpoint}`;
  const headers = { "Content-Type": "application/json", ...options.headers };

  const config = await getStoredConfig();
  if (config.token) {
    headers["Authorization"] = `Bearer ${config.token}`;
  }
  if (options.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }

  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return data;
}

async function checkHealth(apiUrl) {
  return request(apiUrl, "/api/health", { token: null });
}

async function getProfile(apiUrl, token) {
  return request(apiUrl, "/api/user/profile", { token, headers: { Authorization: `Bearer ${token}` } });
}

async function analyzeProduct(apiUrl, token, productName, productBrand, productPrice, ingredients) {
  return request(apiUrl, "/api/scan/analyze", {
    method: "POST",
    body: JSON.stringify({
      productName: productName || "",
      productBrand: productBrand || "",
      productPrice: productPrice || "",
      ingredients: ingredients || "",
    }),
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function getAilments(apiUrl) {
  return request(apiUrl, "/api/ailments", { token: null });
}

async function getPreferences(apiUrl) {
  return request(apiUrl, "/api/preferences", { token: null });
}

async function setUserAilments(apiUrl, token, ailments) {
  return request(apiUrl, "/api/user/ailments", {
    method: "PUT",
    body: JSON.stringify({ ailments }),
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function setUserPreferences(apiUrl, token, preferences) {
  return request(apiUrl, "/api/user/preferences", {
    method: "PUT",
    body: JSON.stringify({ preferences }),
    headers: { Authorization: `Bearer ${token}` },
  });
}

window.EnajApi = {
  getStoredConfig,
  checkHealth,
  getProfile,
  analyzeProduct,
  getAilments,
  getPreferences,
  setUserAilments,
  setUserPreferences,
  DEFAULT_API_URL,
};
