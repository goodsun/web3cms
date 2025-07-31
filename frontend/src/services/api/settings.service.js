import { BaseApiService } from './base.service';

export class SettingsService extends BaseApiService {
  constructor() {
    super('/settings');
  }

  async getSettings(key = 'app_config') {
    return this.getById(key);
  }

  async updateSettings(key = 'app_config', data) {
    return this.update(key, data);
  }
}