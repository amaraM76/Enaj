// API Service for Enaj Web App
const API_BASE_URL = 'http://localhost:3001';

class ApiService {
  constructor() {
    this.token = null;
    this.init();
  }

  init() {
    // Load token from localStorage
    try {
      this.token = localStorage.getItem('enaj_auth_token');
    } catch (e) {
      console.error('Failed to load token:', e);
    }
  }

  setToken(token) {
    this.token = token;
    try {
      localStorage.setItem('enaj_auth_token', token);
    } catch (e) {
      console.error('Failed to save token:', e);
    }
  }

  clearToken() {
    this.token = null;
    try {
      localStorage.removeItem('enaj_auth_token');
    } catch (e) {
      console.error('Failed to clear token:', e);
    }
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth
  async register(email, password, name) {
    const data = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  async login(email, password) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  async guestLogin(name) {
    const data = await this.request('/api/auth/guest', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  async logout() {
    this.clearToken();
  }

  // Profile
  async getProfile() {
    return this.request('/api/user/profile');
  }

  async updateName(name) {
    return this.request('/api/user/name', {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });
  }

  // Ailments
  async getAilmentsData() {
    return this.request('/api/ailments');
  }

  async getUserAilments() {
    return this.request('/api/user/ailments');
  }

  async setUserAilments(ailments) {
    return this.request('/api/user/ailments', {
      method: 'PUT',
      body: JSON.stringify({ ailments }),
    });
  }

  async addCustomAilment(ailmentText) {
    return this.request('/api/user/custom-ailment', {
      method: 'POST',
      body: JSON.stringify({ ailmentText }),
    });
  }

  // Preferences
  async getPreferencesData() {
    return this.request('/api/preferences');
  }

  async getUserPreferences() {
    return this.request('/api/user/preferences');
  }

  async setUserPreferences(preferences) {
    return this.request('/api/user/preferences', {
      method: 'PUT',
      body: JSON.stringify({ preferences }),
    });
  }

  // Ingredient management
  async removeIngredient(ailmentName, ingredientName) {
    return this.request('/api/user/remove-ingredient', {
      method: 'POST',
      body: JSON.stringify({ ailmentName, ingredientName }),
    });
  }

  async restoreIngredient(ailmentName, ingredientName) {
    return this.request('/api/user/restore-ingredient', {
      method: 'POST',
      body: JSON.stringify({ ailmentName, ingredientName }),
    });
  }

  async getRemovedIngredients() {
    return this.request('/api/user/removed-ingredients');
  }

  // Avoid list
  async getAvoidList() {
    return this.request('/api/user/avoid-list');
  }

  // Scan
  async analyzeProduct(productName, productBrand, productPrice, ingredients) {
    return this.request('/api/scan/analyze', {
      method: 'POST',
      body: JSON.stringify({ productName, productBrand, productPrice, ingredients }),
    });
  }

  async getScanHistory() {
    return this.request('/api/user/scan-history');
  }

  // Health check
  async healthCheck() {
    return this.request('/api/health');
  }
}

// Create singleton instance
const api = new ApiService();
window.enajApi = api; // Make available globally
