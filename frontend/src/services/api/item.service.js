import { BaseApiService } from './base.service';

export class ItemService extends BaseApiService {
  constructor() {
    super('/items');
  }

  async getItems() {
    const result = await this.getAll();
    return result.items || [];
  }
}

export const itemService = new ItemService();