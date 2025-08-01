import api from '../api';

class UserService {
  constructor() {
    this.endpoint = '/users';
  }

  async getCurrentUser(eoa) {
    try {
      await api.ensureInitialized();
      const normalizedEoa = eoa.toLowerCase();
      const response = await api.client.get(`${this.endpoint}/${normalizedEoa}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Error fetching current user:', error);
      return null;
    }
  }

  async registerUser(eoa) {
    try {
      await api.ensureInitialized();
      const normalizedEoa = eoa.toLowerCase();
      const response = await api.client.post(this.endpoint, { eoa: normalizedEoa });
      return response.data;
    } catch (error) {
      // If user already exists, return the existing user
      if (error.response?.status === 409 && error.response?.data?.user) {
        return error.response.data.user;
      }
      console.error('Error registering user:', error);
      throw error;
    }
  }

  async checkAdminExists() {
    try {
      await api.ensureInitialized();
      const response = await api.client.get(this.endpoint);
      const users = response.data.users || [];
      
      return users.some(user => user.admin === true);
    } catch (error) {
      console.error('Error checking admin exists:', error);
      return true; // Assume admin exists on error for safety
    }
  }

  async update(eoa, data) {
    try {
      await api.ensureInitialized();
      const normalizedEoa = eoa.toLowerCase();
      const response = await api.client.put(`${this.endpoint}/${normalizedEoa}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async claimAdmin(eoa) {
    try {
      await api.ensureInitialized();
      const normalizedEoa = eoa.toLowerCase();
      const response = await api.client.put(`${this.endpoint}/${normalizedEoa}`, { admin: true });
      return response.data;
    } catch (error) {
      console.error('Error claiming admin:', error);
      throw error;
    }
  }

  async getBatchUsers(eoas) {
    try {
      await api.ensureInitialized();
      if (!eoas || eoas.length === 0) {
        return { users: [], count: 0 };
      }
      
      // Normalize all EOAs to lowercase
      const normalizedEoas = eoas.map(eoa => eoa.toLowerCase());
      
      // Join EOAs with comma for query parameter
      const eoasParam = normalizedEoas.join(',');
      
      const response = await api.client.get(`${this.endpoint}?eoas=${eoasParam}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching batch users:', error);
      return { users: [], count: 0 };
    }
  }

  async getAllUsers() {
    try {
      await api.ensureInitialized();
      const response = await api.client.get(this.endpoint);
      return response.data;
    } catch (error) {
      console.error('Error fetching all users:', error);
      return { users: [], count: 0 };
    }
  }
}

export const userService = new UserService();