import { BaseApiService } from './base.service';

export class FolderService extends BaseApiService {
  constructor() {
    super('/columns/folders');
  }

  async getFolders() {
    const result = await this.getAll();
    return result.folders || [];
  }

  async getPublicFolders() {
    const url = `${this.baseUrl}/columns/public/folders`;
    const result = await this.request(url);
    return result.folders || [];
  }

  async deleteFolder(id, cascade = false) {
    const url = `${this.baseUrl}${this.endpoint}/${id}${cascade ? '?cascade=true' : ''}`;
    return this.request(url, {
      method: 'DELETE',
    });
  }
}

export const folderService = new FolderService();