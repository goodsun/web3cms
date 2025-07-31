import { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { generateId } from '../utils/id-generator';
import { NotFoundError } from '../utils/errors';

export interface BaseEntity {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

export abstract class BaseRepository<T extends BaseEntity> {
  constructor(
    protected tableName: string,
    protected docClient: DynamoDBDocumentClient
  ) {}

  protected abstract getEntityType(): string;
  protected abstract getIdPrefix(): string;

  async findById(id: string): Promise<T | null> {
    const result = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { id },
      })
    );
    return result.Item as T || null;
  }

  async findByIdOrThrow(id: string): Promise<T> {
    const item = await this.findById(id);
    if (!item) {
      throw new NotFoundError(`${this.getEntityType()} not found`);
    }
    return item;
  }

  async create(item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const timestamp = new Date().toISOString();
    const newItem = {
      ...item,
      id: generateId(this.getIdPrefix()),
      createdAt: timestamp,
      updatedAt: timestamp,
    } as T;

    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: newItem,
      })
    );

    return newItem;
  }

  async update(id: string, updates: Partial<Omit<T, 'id' | 'createdAt'>>): Promise<T> {
    const existingItem = await this.findByIdOrThrow(id);
    
    const updatedItem = {
      ...existingItem,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: updatedItem,
      })
    );

    return updatedItem;
  }

  async delete(id: string): Promise<void> {
    await this.docClient.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: { id },
      })
    );
  }

  async findAll(): Promise<T[]> {
    const result = await this.docClient.send(
      new ScanCommand({
        TableName: this.tableName,
      })
    );
    return result.Items as T[] || [];
  }

  async findByType(type: string): Promise<T[]> {
    const result = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'type-index',
        KeyConditionExpression: '#type = :type',
        ExpressionAttributeNames: {
          '#type': 'type'
        },
        ExpressionAttributeValues: {
          ':type': type
        }
      })
    );
    return result.Items as T[] || [];
  }
}