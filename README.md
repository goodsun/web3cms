# Web3CMS

Web3ウォレット認証を備えた、AWS インフラストラクチャ上に構築されたモダンなサーバーレスコンテンツ管理システム。

## 概要

Web3CMS は、従来の CMS 機能と Web3 機能を組み合わせたフルスタックアプリケーションです。Ethereum ウォレットベースの認証と NFT 統合により、安全でスケーラブルなコンテンツ管理プラットフォームを提供します。

### 主な機能

- 🔐 **Web3 認証**: 安全なログインのための MetaMask ウォレット統合
- 📝 **コンテンツ管理**: リッチコンテンツサポートを備えた階層フォルダ構造
- 🚀 **サーバーレスアーキテクチャ**: AWS Lambda、API Gateway、DynamoDB 上に構築
- 🌐 **パブリック＆プライベートコンテンツ**: コンテンツ可視性の柔軟なアクセス制御
- 📱 **モバイル最適化**: モバイルウォレットサポートを備えたレスポンシブデザイン
- ⚡ **高パフォーマンス**: CloudFront CDN と最適化された API 設計
- 🔧 **Infrastructure as Code**: 完全な AWS CDK セットアップ

## 技術スタック

### バックエンド
- AWS Lambda (Node.js 20.x)
- AWS API Gateway
- DynamoDB
- AWS CDK (TypeScript)
- S3 + CloudFront

### フロントエンド
- React 19.1.0
- Vite
- MetaMask SDK
- ethers.js
- React Router

## クイックスタート

### 前提条件

- Node.js 20.x 以上
- 適切な認証情報で設定された AWS CLI
- AWS CDK CLI (`npm install -g aws-cdk`)
- Git

### インストール

1. リポジトリをクローン:
```bash
git clone https://github.com/yourusername/web3cms.git
cd web3cms
```

2. 依存関係をインストール:
```bash
# ルート依存関係をインストール
npm install

# フロントエンド依存関係をインストール
cd frontend
npm install
cd ..

# バックエンド依存関係をインストール
cd backend
npm install
cd ..
```

3. AWS にデプロイ:
```bash
# 開発環境にデプロイ
npm run deploy:dev

# ステージング環境にデプロイ
npm run deploy:staging

# 本番環境にデプロイ
npm run deploy:prod
```

4. ローカル開発を開始:
```bash
# ターミナル 1: バックエンドのウォッチモードを開始
npm run watch

# ターミナル 2: フロントエンド開発サーバーを開始
cd frontend
npm run dev
```

## プロジェクト構造

```
web3cms/
├── backend/                    # Lambda 関数とバックエンドコード
│   ├── src/
│   │   ├── handlers/          # Lambda 関数ハンドラー
│   │   │   ├── crud.ts       # 基本的な CRUD 操作
│   │   │   ├── settings.ts   # 設定管理
│   │   │   └── columns.ts    # CMS コンテンツ操作
│   │   └── constants.ts      # 共有定数
│   ├── repositories/          # データアクセスレイヤー
│   ├── utils/                 # ユーティリティ関数
│   └── tsconfig.json
├── frontend/                   # React フロントエンドアプリケーション
│   ├── src/
│   │   ├── components/        # React コンポーネント
│   │   ├── pages/            # ページコンポーネント
│   │   ├── services/         # API サービス
│   │   ├── contexts/         # React コンテキスト
│   │   ├── hooks/            # カスタムフック
│   │   └── utils/            # ユーティリティ関数
│   └── vite.config.js
├── lib/                       # CDK インフラストラクチャコード
│   └── fullstack-serverless-cdk-stack.ts
├── scripts/                   # デプロイメントとユーティリティスクリプト
├── shared/                    # フロントエンドとバックエンド間の共有コード
│   └── constants/            # 共有定数
└── docs/                     # ドキュメント

```

## API ドキュメント

詳細な API ドキュメントは [API.md](docs/API.md) を参照してください。

### クイック API リファレンス

- `GET /items` - すべてのアイテムを一覧表示
- `POST /items` - 新しいアイテムを作成
- `GET /items/{id}` - 特定のアイテムを取得
- `PUT /items/{id}` - アイテムを更新
- `DELETE /items/{id}` - アイテムを削除
- `GET /columns/folders` - フォルダを一覧表示
- `POST /columns/folders` - フォルダを作成
- `GET /columns/contents` - コンテンツを一覧表示
- `POST /columns/contents` - コンテンツを作成

## 設定

### 環境変数

#### バックエンド (Lambda)
- `TABLE_NAME` - アイテム用の DynamoDB テーブル
- `SETTINGS_TABLE_NAME` - 設定用の DynamoDB テーブル
- `REGION` - AWS リージョン
- `ENV` - 環境 (dev/staging/prod)

#### フロントエンド
- `VITE_API_ENDPOINT` - API Gateway エンドポイント URL

### AWS リソース

CDK スタックは以下のリソースを作成します：
- API Gateway REST API
- Lambda 関数
- DynamoDB テーブル (3つ)
- フロントエンド用 S3 バケット
- CloudFront ディストリビューション
- IAM ロールとポリシー

## 開発

### ローカル開発

1. バックエンドをウォッチモードで開始:
```bash
npm run watch
```

2. フロントエンド開発サーバーを開始:
```bash
cd frontend
npm run dev
```

3. `http://localhost:5173` でアプリケーションにアクセス

### 設定ファイル

`frontend/public/api-config.json` ファイルはデプロイ時に自動生成され、git にコミットすべきではありません。ローカル開発では：
- ファイルが存在しない場合、`api-config.json.template` から生成されます
- デプロイ時に正しい API エンドポイントで更新されます
- このファイルは環境固有の URL がコミットされないよう git により無視されます

### テスト

```bash
# バックエンドテストを実行
npm test

# フロントエンドテストを実行
cd frontend
npm test
```

### コード品質

```bash
# TypeScript をビルド
npm run build

# 型チェック
npm run typecheck
```

## デプロイメント

### 自動デプロイメント

提供された npm スクリプトを使用してデプロイ：

```bash
# 特定の環境にデプロイ
npm run deploy:dev
npm run deploy:staging
npm run deploy:prod

# フロントエンド設定の自動更新でデプロイ
./scripts/deploy-with-config.sh dev
```

### 手動デプロイメント

1. プロジェクトをビルド:
```bash
npm run build
```

2. CDK を使用してデプロイ:
```bash
cdk deploy --context env=dev
```

3. フロントエンド設定を更新:
```bash
./scripts/update-frontend-config.sh dev
```

## アーキテクチャ

詳細なアーキテクチャドキュメントは [ARCHITECTURE.md](docs/ARCHITECTURE.md) を参照してください。

### ハイレベル概要

- **フロントエンド**: S3/CloudFront でホストされる React SPA
- **API**: API Gateway 経由の REST API
- **バックエンド**: ビジネスロジック用の Lambda 関数
- **データベース**: データストレージ用の DynamoDB
- **認証**: MetaMask ウォレットベース認証

## コントリビューション

コントリビューションガイドラインは [CONTRIBUTING.md](docs/CONTRIBUTING.md) を参照してください。

## ライセンス

このプロジェクトは MIT ライセンスのもとでライセンスされています - 詳細は [LICENSE](LICENSE) ファイルを参照してください。

## サポート

- ドキュメント: [docs/](docs/)
- Issues: [GitHub Issues](https://github.com/yourusername/web3cms/issues)
- ディスカッション: [GitHub Discussions](https://github.com/yourusername/web3cms/discussions)

## ロードマップ

- [ ] 署名検証を使用した強化された Web3 認証
- [ ] NFT ゲートコンテンツ
- [ ] マルチチェーンサポート
- [ ] WebSocket によるリアルタイム更新
- [ ] OpenSearch による高度な検索
- [ ] 国際化 (i18n)
- [ ] プラグインシステム
- [ ] GraphQL API オプション

## 謝辞

モダンな Web 技術と AWS サーバーレスサービスで構築されています。