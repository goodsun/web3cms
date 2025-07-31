import { BaseRepository, BaseEntity } from './base.repository';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';

export interface Content extends BaseEntity {
  type: 'content';
  folderId: string;
  eoa: string;
  status: 'draft' | 'review' | 'standby' | 'published';
  title: string;
  description?: string;
  content: string;
  contentType?: 'text' | 'html' | 'image' | 'video' | 'iframe' | 'link';
  priority?: number;
}

export class ContentRepository extends BaseRepository<Content> {
  protected getEntityType(): string {
    return 'Content';
  }

  protected getIdPrefix(): string {
    return 'content';
  }

  async findByFolder(folderId: string): Promise<Content[]> {
    const result = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'type-index',
        KeyConditionExpression: '#type = :type',
        FilterExpression: '#folderId = :folderId',
        ExpressionAttributeNames: {
          '#type': 'type',
          '#folderId': 'folderId'
        },
        ExpressionAttributeValues: {
          ':type': 'content',
          ':folderId': folderId
        }
      })
    );
    return result.Items as Content[] || [];
  }

  async findPublishedByFolder(folderId: string): Promise<Content[]> {
    const result = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'type-index',
        KeyConditionExpression: '#type = :type',
        FilterExpression: '#folderId = :folderId AND #status = :status',
        ExpressionAttributeNames: {
          '#type': 'type',
          '#folderId': 'folderId',
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':type': 'content',
          ':folderId': folderId,
          ':status': 'published'
        }
      })
    );
    return result.Items as Content[] || [];
  }
}