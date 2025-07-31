import { BaseRepository, BaseEntity } from './base.repository';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';

export interface Folder extends BaseEntity {
  type: 'folder';
  parentId?: string;
  eoa: string;
  name: string;
  description?: string;
  status: 'public' | 'limited' | 'hidden';
  priority?: number;
}

export class FolderRepository extends BaseRepository<Folder> {
  protected getEntityType(): string {
    return 'Folder';
  }

  protected getIdPrefix(): string {
    return 'folder';
  }

  async findPublicFolders(): Promise<Folder[]> {
    const result = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'type-index',
        KeyConditionExpression: '#type = :type',
        FilterExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#type': 'type',
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':type': 'folder',
          ':status': 'public'
        }
      })
    );
    return result.Items as Folder[] || [];
  }

  async findByEoa(eoa: string): Promise<Folder[]> {
    const result = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'type-index',
        KeyConditionExpression: '#type = :type',
        FilterExpression: '#eoa = :eoa',
        ExpressionAttributeNames: {
          '#type': 'type',
          '#eoa': 'eoa'
        },
        ExpressionAttributeValues: {
          ':type': 'folder',
          ':eoa': eoa
        }
      })
    );
    return result.Items as Folder[] || [];
  }
}