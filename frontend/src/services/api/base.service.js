const API_BASE_URL = import.meta.env.VITE_API_ENDPOINT || 'http://localhost:3001';

export class BaseApiService {
  constructor(endpoint) {
    this.endpoint = endpoint;
    this.baseUrl = API_BASE_URL;
  }

  getHeaders() {
    return {
      'Content-Type': 'application/json',
    };
  }

  async handleResponse(response) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
    if (response.status === 204) {
      return null;
    }
    return response.json();
  }

  async getAuthToken() {
    const account = localStorage.getItem('account');
    return account || '';
  }

  async request(url, options = {}) {
    const authToken = await this.getAuthToken();
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        ...options.headers,
      },
    };

    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  async getAll(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `${this.baseUrl}${this.endpoint}${queryString ? `?${queryString}` : ''}`;
    return this.request(url);
  }

  async getById(id) {
    const url = `${this.baseUrl}${this.endpoint}/${id}`;
    return this.request(url);
  }

  async create(data) {
    const url = `${this.baseUrl}${this.endpoint}`;
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async update(id, data) {
    const url = `${this.baseUrl}${this.endpoint}/${id}`;
    return this.request(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(id) {
    const url = `${this.baseUrl}${this.endpoint}/${id}`;
    return this.request(url, {
      method: 'DELETE',
    });
  }
}