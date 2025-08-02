# DRY原則違反分析とリファクタリング計画

## 概要
このドキュメントは、web3cmsコードベースにおけるDRY（Don't Repeat Yourself）原則違反のパターンを分析し、リファクタリング計画を提示します。

## 1. 主要なアンチパターン

### 1.1 バックエンドハンドラーの重複

#### 問題箇所
- `backend/crud.ts`
- `backend/settings.ts`
- `backend/columns.ts`

#### 重複内容
```typescript
// 全てのハンドラーで同一のCORSヘッダー定義
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// 同一のレスポンス生成関数
const createResponse = (statusCode: number, body: any): APIGatewayProxyResult => ({
  statusCode,
  headers: CORS_HEADERS,
  body: JSON.stringify(body),
});
```

### 1.2 APIサービスの重複実装

#### 問題箇所
- `frontend/src/services/api.js`
- `frontend-vanilla-backup/js/api.js`

#### 重複内容
- 同一のCRUDメソッドパターン
- エラーハンドリングロジックの重複
- APIエンドポイント定義の分散

### 1.3 フォームコンポーネントの重複

#### 問題箇所
- `frontend/src/components/FolderForm.jsx`
- `frontend/src/components/ContentForm.jsx`
- `frontend/src/components/ItemForm.jsx`

#### 重複内容
- フォーム状態管理の同一パターン
- イベントハンドラーの重複実装
- バリデーションロジックの散在

### 1.4 DynamoDBクエリパターンの重複

#### 問題箇所
- `backend/columns.ts`内の複数の関数

#### 重複内容
```typescript
// フォルダーとコンテンツで同一のクエリパターン
const result = await docClient.send(
  new QueryCommand({
    TableName: tableName,
    IndexName: 'type-index',
    KeyConditionExpression: '#type = :type',
    // ... 同様の構造
  })
);
```

### 1.5 バリデーションロジックの重複

#### 問題箇所
- 全てのバックエンドハンドラー

#### 重複内容
- ID存在チェック
- リクエストボディ検証
- アイテム存在確認

### 1.6 ID生成ロジックの重複

#### 重複内容
```typescript
// 3箇所で同一パターンのID生成
`${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
```

## 2. リファクタリング計画

### フェーズ1: 基盤整備（優先度: 最高）

#### 2.1 共通ユーティリティモジュールの作成

**実装内容:**
```typescript
// backend/utils/response.ts
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const createResponse = (statusCode: number, body: any): APIGatewayProxyResult => ({
  statusCode,
  headers: CORS_HEADERS,
  body: JSON.stringify(body),
});

// backend/utils/validation.ts
export class ValidationError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}

export const validateRequired = (value: any, fieldName: string): void => {
  if (!value) {
    throw new ValidationError(400, `${fieldName} is required`);
  }
};

// backend/utils/id-generator.ts
export const generateId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
```

#### 2.2 エラーハンドリング統一

**実装内容:**
```typescript
// backend/utils/error-handler.ts
export const handleError = (error: unknown): APIGatewayProxyResult => {
  console.error('Error:', error);
  
  if (error instanceof ValidationError) {
    return createResponse(error.statusCode, {
      message: error.message,
    });
  }
  
  const statusCode = 500;
  const message = 'Internal server error';
  
  return createResponse(statusCode, {
    message,
    ...(process.env.ENV !== 'prod' && { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  });
};
```

### フェーズ2: データアクセス層の抽象化（優先度: 高）

#### 2.3 リポジトリパターンの実装

**実装内容:**
```typescript
// backend/repositories/base.repository.ts
export abstract class BaseRepository<T> {
  constructor(
    protected tableName: string,
    protected docClient: DynamoDBDocumentClient
  ) {}

  async findById(id: string): Promise<T | null> {
    const result = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { id },
      })
    );
    return result.Item as T || null;
  }

  async create(item: Omit<T, 'id'>): Promise<T> {
    const id = generateId(this.getPrefix());
    const newItem = { ...item, id };
    
    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: newItem,
      })
    );
    
    return newItem as T;
  }

  async update(id: string, updates: Partial<T>): Promise<T> {
    // 実装
  }

  async delete(id: string): Promise<void> {
    // 実装
  }

  protected abstract getPrefix(): string;
}

// backend/repositories/folder.repository.ts
export class FolderRepository extends BaseRepository<Folder> {
  protected getPrefix(): string {
    return 'folder';
  }

  async findByType(type: string): Promise<Folder[]> {
    // type-indexを使用したクエリ
  }
}
```

### フェーズ3: フロントエンド共通化（優先度: 中）

#### 2.4 汎用フォームコンポーネントの作成

**実装内容:**
```typescript
// frontend/src/components/common/GenericForm.tsx
interface FormConfig<T> {
  fields: FormFieldConfig[];
  initialData?: T;
  onSubmit: (data: T) => void;
  validation?: ValidationSchema;
}

export const GenericForm = <T extends Record<string, any>>({
  fields,
  initialData,
  onSubmit,
  validation
}: FormConfig<T>) => {
  const [formData, setFormData] = useState<T>(initialData || {} as T);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  // 共通のフォームロジック実装
};
```

#### 2.5 APIサービスの統一

**実装内容:**
```typescript
// frontend/src/services/api/base.service.ts
export class BaseApiService<T> {
  constructor(protected endpoint: string) {}

  async getAll(): Promise<T[]> {
    const response = await fetch(`${API_BASE_URL}${this.endpoint}`);
    if (!response.ok) throw new Error(`Failed to fetch ${this.endpoint}`);
    return response.json();
  }

  async getById(id: string): Promise<T> {
    // 実装
  }

  async create(data: Omit<T, 'id'>): Promise<T> {
    // 実装
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    // 実装
  }

  async delete(id: string): Promise<void> {
    // 実装
  }
}

// frontend/src/services/api/folder.service.ts
export class FolderService extends BaseApiService<Folder> {
  constructor() {
    super('/folders');
  }
}
```

### フェーズ4: 設定とconstantsの統一（優先度: 低）

#### 2.6 定数の集約

**実装内容:**
```typescript
// shared/constants/http-status.ts
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// shared/constants/messages.ts
export const ERROR_MESSAGES = {
  REQUIRED_FIELD: (field: string) => `${field} is required`,
  NOT_FOUND: (resource: string) => `${resource} not found`,
  NO_PERMISSION: 'You do not have permission to perform this action',
} as const;
```

## 3. 実装優先順位

1. **即座に実装すべき項目**
   - 共通ユーティリティモジュールの作成
   - エラーハンドリングの統一
   - ID生成ロジックの共通化

2. **短期的に実装すべき項目**
   - リポジトリパターンの導入
   - バリデーションロジックの統一

3. **中期的に実装すべき項目**
   - フロントエンド共通コンポーネントの作成
   - APIサービスの抽象化

4. **長期的に実装すべき項目**
   - 定数とメッセージの完全統一
   - テストコードの共通化

## 4. 期待される効果

1. **コード量の削減**: 約30-40%のコード削減が見込まれる
2. **保守性の向上**: 変更箇所の一元化により、バグ修正や機能追加が容易に
3. **開発速度の向上**: 共通パターンの再利用により、新機能開発が高速化
4. **品質の向上**: 統一されたエラーハンドリングとバリデーションによる一貫性

## 5. 移行戦略

1. **段階的移行**: 新機能開発時に共通モジュールを使用
2. **既存コードの漸進的リファクタリング**: 修正が必要な箇所から順次移行
3. **テストカバレッジの確保**: リファクタリング前にテストを追加
4. **ドキュメントの整備**: 共通モジュールの使用方法を文書化

## 6. リスクと対策

### リスク
- 大規模な変更による既存機能への影響
- 開発チームの学習コスト

### 対策
- 十分なテストカバレッジの確保
- 段階的な移行による影響範囲の限定
- チーム向けの共通モジュール利用ガイドの作成

## まとめ

現在のコードベースには多くのDRY原則違反が存在しますが、計画的なリファクタリングにより、保守性と拡張性の高いシステムに改善できます。優先順位に従って段階的に実装を進めることで、リスクを最小限に抑えながら品質向上を実現します。