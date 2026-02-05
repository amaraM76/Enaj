import AsyncStorage from '@react-native-async-storage/async-storage';

// Change this to your backend URL
// For local development with Expo Go, use your computer's local IP address
// e.g., 'http://192.168.1.100:3000'
const API_BASE_URL = 'http://localhost:3000';

class ApiService {
  constructor() {
    this.token = null;
  }

  async init() {
    try {
      this.token = await AsyncStorage.getItem('authToken');
    } catch (e) {
      console.error('Failed to load token:', e);
    }
  }

  async setToken(token) {
    this.token = token;
    await AsyncStorage.setItem('authToken', token);
  }

  async clearToken() {
    this.token = null;
    await AsyncStorage.removeItem('authToken');
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

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }

  // Auth
  async register(email, password, name) {
    const data = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    await this.setToken(data.token);
    return data;
  }

  async login(email, password) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    await this.setToken(data.token);
    return data;
  }

  async guestLogin(name) {
    const data = await this.request('/api/auth/guest', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    await this.setToken(data.token);
    return data;
  }

  async logout() {
    await this.clearToken();
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

  // Saved alternatives
  async saveAlternative(product) {
    return this.request('/api/user/save-alternative', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  async getSavedAlternatives() {
    return this.request('/api/user/saved-alternatives');
  }

  async deleteSavedAlternative(id) {
    return this.request(`/api/user/saved-alternatives/${id}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiService();
export default api;
