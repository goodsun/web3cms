# Web3CMS 開発ガイド

## はじめに

このガイドでは、Web3CMS のローカル開発環境のセットアップ方法について説明します。

## 開発環境のセットアップ

### 前提条件

1. **Node.js v20.x 以上**
   ```bash
   # nvm 経由でのインストール（推奨）
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 20
   nvm use 20
   ```

2. **Git**
   ```bash
   git --version
   ```

3. **AWS CLI**（デプロイ用）
   ```bash
   # macOS
   brew install awscli
   
   # その他
   pip install awscli
   ```

4. **VS Code**（推奨）と拡張機能：
   - ESLint
   - Prettier
   - TypeScript and JavaScript
   - AWS Toolkit
   - GitLens

### 初期セットアップ

1. **リポジトリのクローン**
   ```bash
   git clone https://github.com/yourusername/web3cms.git
   cd web3cms
   ```

2. **依存関係のインストール**
   ```bash
   # すべての依存関係をインストール
   npm run install:all
   
   # または手動で
   npm install
   cd frontend && npm install && cd ..
   cd backend && npm install && cd ..
   ```

3. **環境変数の設定**
   ```bash
   # フロントエンド (.env.development)
   cd frontend
   cp .env.example .env.development
   # .env.development を編集して値を設定
   
   # ローカル開発では以下を使用可能：
   echo "VITE_API_ENDPOINT=http://localhost:3000" > .env.development
   ```

## 開発ワークフロー

### アプリケーションの実行

#### オプション 1: フルスタック開発

```bash
# ターミナル 1: TypeScript コンパイルの監視
npm run watch

# ターミナル 2: フロントエンド開発サーバーの実行
cd frontend
npm run dev

# ターミナル 3: ローカル API の実行（SAM CLI が必要）
npm run start:api
```

#### オプション 2: フロントエンドのみの開発

```bash
cd frontend
npm run dev
```

アプリケーションには `http://localhost:5173` でアクセスできます

### コード構造

```
web3cms/
├── backend/                 # Lambda 関数
│   ├── src/
│   │   ├── handlers/       # Lambda ハンドラ
│   │   ├── constants.ts    # 共有定数
│   │   └── types.ts        # TypeScript 型
│   ├── repositories/       # データアクセスレイヤー
│   ├── utils/             # ユーティリティ関数
│   └── tests/             # バックエンドテスト
├── frontend/               # React アプリケーション
│   ├── src/
│   │   ├── components/    # React コンポーネント
│   │   ├── contexts/      # React コンテキスト
│   │   ├── hooks/         # カスタムフック
│   │   ├── pages/         # ページコンポーネント
│   │   ├── services/      # API サービス
│   │   ├── utils/         # ユーティリティ
│   │   └── App.jsx        # メインアプリコンポーネント
│   └── public/            # 静的アセット
├── lib/                    # CDK インフラストラクチャ
├── scripts/                # ユーティリティスクリプト
└── shared/                 # 共有コード
    └── constants/          # 共有定数
```

## 開発ガイドライン

### コードスタイル

#### TypeScript/JavaScript
- ESLint と Prettier を使用してコードをフォーマット
- 既存のコードパターンに従う
- 意味のある変数名と関数名を使用
- パブリック API には JSDoc コメントを追加

```typescript
/**
 * システムに新しいフォルダを作成
 * @param data - フォルダ作成データ
 * @returns 作成されたフォルダオブジェクト
 */
export async function createFolder(data: FolderInput): Promise<Folder> {
  // 実装
}
```

#### React コンポーネント
- フックを使用した関数コンポーネントを使用
- コンポーネントは小さく、焦点を絞って保つ
- 適切な prop types または TypeScript インターフェースを使用

```jsx
// 良い例
const FolderCard = ({ folder, onEdit, onDelete }) => {
  return (
    <div className="folder-card">
      <h3>{folder.name}</h3>
      <p>{folder.description}</p>
      <button onClick={() => onEdit(folder.id)}>編集</button>
      <button onClick={() => onDelete(folder.id)}>削除</button>
    </div>
  );
};
```

### Git ワークフロー

1. **機能ブランチを作成**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **変更を行う**
   ```bash
   # 変更を加える
   git add .
   git commit -m "feat: 新機能を追加"
   ```

3. **Conventional Commits に従う**
   - `feat:` 新機能
   - `fix:` バグ修正
   - `docs:` ドキュメント変更
   - `style:` コードスタイル変更
   - `refactor:` コードリファクタリング
   - `test:` テスト変更
   - `chore:` メンテナンスタスク

4. **プッシュして PR を作成**
   ```bash
   git push origin feature/your-feature-name
   ```

## テスト

### バックエンドテスト

```bash
# すべてのバックエンドテストを実行
npm test

# カバレッジ付きで実行
npm run test:coverage

# ウォッチモード
npm run test:watch
```

#### バックエンドテストの記述

```typescript
// backend/tests/handlers/crud.test.ts
import { handler } from '../../src/handlers/crud';

describe('CRUD ハンドラ', () => {
  it('すべてのアイテムを返すべき', async () => {
    const event = {
      httpMethod: 'GET',
      path: '/items',
      // ... その他のイベントプロパティ
    };
    
    const response = await handler(event);
    
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toHaveProperty('items');
  });
});
```

### フロントエンドテスト

```bash
cd frontend

# テストを実行
npm test

# カバレッジ付きで実行
npm run test:coverage
```

#### フロントエンドテストの記述

```jsx
// frontend/src/components/__tests__/FolderCard.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import FolderCard from '../FolderCard';

describe('FolderCard', () => {
  const mockFolder = {
    id: '123',
    name: 'テストフォルダ',
    description: 'テスト説明'
  };

  it('フォルダ情報をレンダリング', () => {
    render(<FolderCard folder={mockFolder} />);
    
    expect(screen.getByText('テストフォルダ')).toBeInTheDocument();
    expect(screen.getByText('テスト説明')).toBeInTheDocument();
  });
});
```

## ローカル開発ツール

### DynamoDB Local

ローカル DynamoDB 開発用：

```bash
# DynamoDB Local をインストール
npm install -g dynamodb-local

# DynamoDB Local を開始
dynamodb-local start --port 8000

# ローカルでテーブルを作成
aws dynamodb create-table \
  --table-name web3cms-items-dev \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url http://localhost:8000
```

### SAM Local

ローカル Lambda テスト用：

```bash
# SAM CLI をインストール
brew install aws-sam-cli

# ローカル API を開始
sam local start-api --template template.yaml
```

## デバッグ

### VS Code デバッグ設定

`.vscode/launch.json` を作成：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Lambda をデバッグ",
      "program": "${workspaceFolder}/backend/src/handlers/crud.ts",
      "preLaunchTask": "tsc: build - tsconfig.json",
      "outFiles": ["${workspaceFolder}/backend/dist/**/*.js"]
    },
    {
      "type": "chrome",
      "request": "launch",
      "name": "フロントエンドをデバッグ",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/frontend/src"
    }
  ]
}
```

### ブラウザ DevTools

1. **React DevTools**
   - React DevTools 拡張機能をインストール
   - コンポーネント階層と状態を調査

2. **Network タブ**
   - API 呼び出しを監視
   - リクエスト/レスポンスヘッダーを確認
   - 認証トークンを確認

3. **コンソールデバッグ**
   ```javascript
   // デバッグログを追加
   console.log('API レスポンス:', response);
   console.debug('コンポーネント状態:', state);
   ```

## 一般的な開発タスク

### 新しい API エンドポイントの追加

1. **Lambda ハンドラを作成**
   ```typescript
   // backend/src/handlers/newFeature.ts
   export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
     // 実装
   };
   ```

2. **CDK スタックを更新**
   ```typescript
   // lib/fullstack-serverless-cdk-stack.ts
   const newFeatureFunction = new NodejsFunction(this, 'NewFeatureFunction', {
     entry: path.join(__dirname, '../backend/src/handlers/newFeature.ts'),
     // ... 設定
   });
   ```

3. **API ルートを追加**
   ```typescript
   const newFeatureResource = api.root.addResource('new-feature');
   newFeatureResource.addMethod('GET', new LambdaIntegration(newFeatureFunction));
   ```

### 新しいフロントエンドページの追加

1. **ページコンポーネントを作成**
   ```jsx
   // frontend/src/pages/NewPage.jsx
   const NewPage = () => {
     return (
       <div>
         <h1>新しいページ</h1>
       </div>
     );
   };
   export default NewPage;
   ```

2. **ルートを追加**
   ```jsx
   // frontend/src/App.jsx
   import NewPage from './pages/NewPage';
   
   // ルーター内
   <Route path="/new-page" element={<NewPage />} />
   ```

3. **ナビゲーションを追加**
   ```jsx
   // frontend/src/components/Layout.jsx
   <Link to="/new-page">新しいページ</Link>
   ```

### Web3 での作業

1. **MetaMask を接続**
   ```javascript
   const connectWallet = async () => {
     if (window.ethereum) {
       const accounts = await window.ethereum.request({ 
         method: 'eth_requestAccounts' 
       });
       setAccount(accounts[0]);
     }
   };
   ```

2. **Web3 コンテキストを使用**
   ```jsx
   import { useWeb3 } from '../contexts/Web3Context';
   
   const MyComponent = () => {
     const { account, isConnected, connectWallet } = useWeb3();
     
     return (
       <div>
         {isConnected ? (
           <p>接続済み: {account}</p>
         ) : (
           <button onClick={connectWallet}>ウォレットを接続</button>
         )}
       </div>
     );
   };
   ```

## パフォーマンス最適化

### フロントエンドパフォーマンス

1. **コード分割**
   ```jsx
   // 重いコンポーネントを遅延読み込み
   const HeavyComponent = lazy(() => import('./HeavyComponent'));
   
   <Suspense fallback={<Loading />}>
     <HeavyComponent />
   </Suspense>
   ```

2. **メモ化**
   ```jsx
   const ExpensiveComponent = memo(({ data }) => {
     const processedData = useMemo(() => 
       processData(data), [data]
     );
     
     return <div>{processedData}</div>;
   });
   ```

3. **画像最適化**
   ```jsx
   // 適切な画像フォーマットと遅延読み込みを使用
   <img 
     src="image.webp" 
     loading="lazy" 
     alt="説明"
   />
   ```

### バックエンドパフォーマンス

1. **バッチ操作**
   ```typescript
   // 複数の単一操作の代わりに
   const batchWrite = {
     RequestItems: {
       [tableName]: items.map(item => ({
         PutRequest: { Item: item }
       }))
     }
   };
   await docClient.batchWrite(batchWrite);
   ```

2. **キャッシング**
   ```typescript
   // シンプルなインメモリキャッシュ
   const cache = new Map();
   
   export const getCachedData = async (key: string) => {
     if (cache.has(key)) {
       return cache.get(key);
     }
     
     const data = await fetchData(key);
     cache.set(key, data);
     return data;
   };
   ```

## トラブルシューティング

### 一般的な問題

1. **CORS エラー**
   - API Gateway の CORS 設定を確認
   - Lambda レスポンスのヘッダーを確認
   - ブラウザコンソールで特定のエラーを確認

2. **認証の問題**
   - MetaMask が接続されていることを確認
   - Authorization ヘッダーのフォーマットを確認
   - ウォレットアドレスが小文字であることを確認

3. **ビルドエラー**
   ```bash
   # キャッシュをクリアして再インストール
   rm -rf node_modules package-lock.json
   npm install
   
   # TypeScript キャッシュをクリア
   rm -rf backend/dist
   npm run build
   ```

4. **ホットリロードが動作しない**
   ```bash
   # Vite 開発サーバーを再起動
   cd frontend
   npm run dev -- --force
   ```

## リソース

### ドキュメント
- [React ドキュメント](https://react.dev/)
- [AWS CDK ドキュメント](https://docs.aws.amazon.com/cdk/)
- [Vite ドキュメント](https://vitejs.dev/)
- [TypeScript ドキュメント](https://www.typescriptlang.org/docs/)

### ツール
- [Postman](https://www.postman.com/) - API テスト
- [AWS Toolkit for VS Code](https://aws.amazon.com/visualstudiocode/)
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [MetaMask](https://metamask.io/)

### コミュニティ
- バグレポート用の GitHub Issues
- 質問用の GitHub Discussions
- リアルタイムヘルプ用の Discord/Slack