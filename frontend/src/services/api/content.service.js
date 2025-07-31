import { BaseApiService } from './base.service';

export class ContentService extends BaseApiService {
  constructor() {
    super('/columns/contents');
  }

  async getContents() {
    const result = await this.getAll();
    return result.contents || [];
  }

  async getContentsByFolder(folderId) {
    const result = await this.getAll({ folderId });
    return result.contents || [];
  }

  async getPublicContents(folderId) {
    const url = `${this.baseUrl}/columns/public/contents${folderId ? `?folderId=${folderId}` : ''}`;
    const result = await this.request(url);
    return result.contents || [];
  }
}