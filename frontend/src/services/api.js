import axios from 'axios';

class ApiService {
  constructor() {
    this.baseURL = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    try {
      // First try to get config from local storage
      const storedApiUrl = localStorage.getItem('apiUrl');
      if (storedApiUrl) {
        this.baseURL = storedApiUrl;
      } else {
        // Otherwise fetch from config
        const response = await fetch('/api-config.json');
        const config = await response.json();
        this.baseURL = config.apiEndpoint || config.apiUrl;
        if (this.baseURL) {
          localStorage.setItem('apiUrl', this.baseURL);
        }
      }

      if (!this.baseURL) {
        console.warn('No API URL configured. Please set it in Settings page.');
        throw new Error('API URL not configured');
      }

      console.log('API initialized with URL:', this.baseURL);

      this.client = axios.create({
        baseURL: this.baseURL,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Add request interceptor for debugging
      this.client.interceptors.request.use(
        (config) => {
          console.log('API Request:', config.method.toUpperCase(), config.url);
          return config;
        },
        (error) => {
          console.error('API Request Error:', error);
          return Promise.reject(error);
        }
      );

      // Add response interceptor for debugging
      this.client.interceptors.response.use(
        (response) => {
          console.log('API Response:', response.status, response.data);
          return response;
        },
        (error) => {
          console.error('API Response Error:', error.response?.status, error.response?.data);
          return Promise.reject(error);
        }
      );

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize API:', error);
      throw error;
    }
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await this.init();
    }
  }

  // Items API
  async getItems() {
    await this.ensureInitialized();
    const response = await this.client.get('/items');
    return response.data;
  }

  async createItem(item) {
    await this.ensureInitialized();
    const response = await this.client.post('/items', item);
    return response.data;
  }

  async deleteItem(id) {
    await this.ensureInitialized();
    const response = await this.client.delete(`/items/${id}`);
    return response.data;
  }

  // Settings API
  async getSettings() {
    await this.ensureInitialized();
    const response = await this.client.get('/settings/app_config');
    console.log('Raw settings response:', response.data);
    return response.data;
  }

  async updateSettings(settings) {
    await this.ensureInitialized();
    const response = await this.client.put('/settings/app_config', settings);
    return response.data;
  }

  // Update API URL
  updateApiUrl(newUrl) {
    this.baseURL = newUrl;
    localStorage.setItem('apiUrl', newUrl);
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

export default new ApiService();