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

      // Add request interceptor for debugging and auth
      this.client.interceptors.request.use(
        (config) => {
          console.log('API Request:', config.method.toUpperCase(), config.url);
          // Add auth header if we have an account
          const account = localStorage.getItem('walletAddress');
          if (account) {
            config.headers.Authorization = `Bearer ${account}`;
          }
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

  async updateItem(id, item) {
    await this.ensureInitialized();
    const response = await this.client.put(`/items/${id}`, item);
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

  // Columns API - Folders
  async getFolders() {
    await this.ensureInitialized();
    const response = await this.client.get('/columns/folders');
    return response.data;
  }

  // Public API - Get public folders (no auth required)
  async getPublicFolders() {
    await this.ensureInitialized();
    // Create a new axios instance without auth interceptor for public endpoints
    const publicClient = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const response = await publicClient.get('/columns/public/folders');
    return response.data;
  }

  // Public API - Get public contents (no auth required)
  async getPublicContents() {
    await this.ensureInitialized();
    const publicClient = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const response = await publicClient.get('/columns/public/contents');
    return response.data;
  }

  // Public API - Get single public content (no auth required)
  async getPublicContent(id) {
    await this.ensureInitialized();
    const publicClient = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const response = await publicClient.get(`/columns/public/contents/${id}`);
    return response.data;
  }

  async createFolder(data) {
    await this.ensureInitialized();
    const response = await this.client.post('/columns/folders', data);
    return response.data;
  }

  async getFolder(id) {
    await this.ensureInitialized();
    const response = await this.client.get(`/columns/folders/${id}`);
    return response.data;
  }

  async updateFolder(id, data) {
    await this.ensureInitialized();
    const response = await this.client.put(`/columns/folders/${id}`, data);
    return response.data;
  }

  async deleteFolder(id, cascade = false) {
    await this.ensureInitialized();
    const url = cascade ? `/columns/folders/${id}?cascade=true` : `/columns/folders/${id}`;
    const response = await this.client.delete(url);
    return response.data;
  }

  // Columns API - Contents
  async getContents() {
    await this.ensureInitialized();
    const response = await this.client.get('/columns/contents');
    return response.data;
  }

  async createContent(data) {
    await this.ensureInitialized();
    const response = await this.client.post('/columns/contents', data);
    return response.data;
  }

  async getContent(id) {
    await this.ensureInitialized();
    const response = await this.client.get(`/columns/contents/${id}`);
    return response.data;
  }

  async updateContent(id, data) {
    await this.ensureInitialized();
    const response = await this.client.put(`/columns/contents/${id}`, data);
    return response.data;
  }

  async deleteContent(id) {
    await this.ensureInitialized();
    const response = await this.client.delete(`/columns/contents/${id}`);
    return response.data;
  }
}

export default new ApiService();