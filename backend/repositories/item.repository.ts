import { BaseRepository, BaseEntity } from './base.repository';

export interface Item extends BaseEntity {
  type?: string;
  name?: string;
  description?: string;
  [key: string]: any;
}

export class ItemRepository extends BaseRepository<Item> {
  protected getEntityType(): string {
    return 'Item';
  }

  protected getIdPrefix(): string {
    return 'item';
  }
}