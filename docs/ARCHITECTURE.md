# Web3CMS アーキテクチャドキュメント

## システム概要

Web3CMS は、Web3 ウォレット認証機能を備えた AWS インフラストラクチャ上に構築されたサーバーレス、イベント駆動型のコンテンツ管理システムです。アーキテクチャは、スケーラビリティ、セキュリティ、コスト最適化に重点を置いたクラウドネイティブのベストプラクティスに従っています。

## アーキテクチャ図

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CloudFront CDN                             │
│                                                                     │
└────────────────────┬───────────────────────┬───────────────────────┘
                     │                       │
                     ▼                       ▼
            ┌────────────────┐      ┌────────────────┐
            │   S3 バケット  │      │  API Gateway   │
            │ (React SPA)    │      │   (REST API)   │
            └────────────────┘      └────────┬───────┘
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    │                       │                       │
                    ▼                       ▼                       ▼
            ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
            │ Lambda:      │      │ Lambda:      │      │ Lambda:      │
            │ CRUD ハンドラ│      │ Settings     │      │ Columns      │
            │              │      │ ハンドラ     │      │ ハンドラ     │
            └──────┬───────┘      └──────┬───────┘      └──────┬───────┘
                   │                     │                      │
                   │              ┌──────┴───────┐      ┌──────┴───────┐
                   │              │ Lambda:      │      │ Lambda:      │
                   │              │ Users        │      │ NFTs         │
                   │              │ ハンドラ     │      │ ハンドラ     │
                   │              └──────┬───────┘      └──────┬───────┘
                   │                     │                      │
                   └─────────────────────┴──────────────────────┘
                                        │
                                        ▼
                            ┌───────────────────────┐
                            │      DynamoDB         │
                            │  ┌─────────────────┐  │
                            │  │  Items テーブル │  │
                            │  ├─────────────────┤  │
                            │  │Settings テーブル│  │
                            │  ├─────────────────┤  │
                            │  │Columns テーブル │  │
                            │  ├─────────────────┤  │
                            │  │ Users テーブル  │  │
                            │  ├─────────────────┤  │
                            │  │  NFTs テーブル  │  │
                            │  └─────────────────┘  │
                            └───────────────────────┘
```

## コアコンポーネント

### 1. フロントエンドレイヤー

#### React シングルページアプリケーション (SPA)
- **技術**: React 19.1.0 と Vite
- **ホスティング**: CloudFront CDN を使用した S3 バケット
- **主な機能**:
  - Web3 ウォレット統合 (MetaMask SDK)
  - レスポンシブデザイン
  - クライアントサイドルーティング
  - リアルタイムマークダウンプレビュー
  - プログレッシブウェブアプリ機能

#### 主要なフロントエンドサービス

```javascript
frontend/src/services/
├── api/
│   ├── base.service.js      // 認証付きベース API クライアント
│   ├── item.service.js      // アイテム CRUD 操作
│   ├── folder.service.js    // フォルダ管理
│   ├── content.service.js   // コンテンツ管理
│   └── settings.service.js  // 設定管理
├── api.js                   // レガシー API サービス
└── nftService.js           // NFT 関連操作
```

### 2. API レイヤー

#### API Gateway 設定
- **タイプ**: REST API
- **認証**: Bearer トークン (ウォレットアドレス)
- **CORS**: すべてのオリジンで有効
- **レート制限**: デフォルトの AWS 制限 (10K RPS)

#### Lambda 関数

**CRUD ハンドラ** (`backend/src/handlers/crud.ts`)
- アイテムの汎用 CRUD 操作
- 自動生成 ID とタイムスタンプ
- 複雑な更新式をサポート

**Settings ハンドラ** (`backend/src/handlers/settings.ts`)
- アプリケーション設定管理
- デフォルトとして "latest" を使用したバージョン管理された設定
- キーバリューストアパターン

**Columns ハンドラ** (`backend/src/handlers/columns.ts`)
- コンテンツ管理システムのコア
- フォルダ階層サポート
- コンテンツワークフロー状態
- パブリック/プライベートアクセスパターン
- カスケード削除機能

**Users ハンドラ** (`backend/src/handlers/users.ts`)
- ユーザープロフィール管理
- プライマリキーとしての EOA (Ethereum Owner Address)
- Discord 統合サポート
- ロールベースのアクセス制御

**NFTs ハンドラ** (`backend/src/handlers/nfts.ts`)
- NFT メタデータ管理
- 所有者または作成者によるクエリ
- 複数のコントラクトアドレスのサポート
- トークンメタデータキャッシング

### 3. データレイヤー

#### DynamoDB テーブル

**Items テーブル**
```
プライマリキー: id (String)
GSI: eoa-type-index
  - パーティションキー: eoa
  - ソートキー: type
```

**Settings テーブル**
```
プライマリキー: settingKey (String)
ソートキー: version (String)
```

**Columns テーブル**
```
プライマリキー: id (String)
GSI: type-index
  - パーティションキー: type
サポート: folders, contents, root
```

**Users テーブル**
```
プライマリキー: eoa (String)
属性:
  - discordAddress: String
  - name: String
  - avatar: String
  - roles: Array
  - admin: Boolean
```

**NFTs テーブル**
```
パーティションキー: ca (String) - コントラクトアドレス
ソートキー: id (String) - トークン ID
GSI: owner-index
  - パーティションキー: owner
GSI: creator-index
  - パーティションキー: creator
属性:
  - tokenUrl: String
  - name: String
  - image: String
  - creator: String
  - owner: String
```

#### データモデル

**フォルダエンティティ**
```typescript
interface Folder {
  id: string;
  type: 'folder';
  parentId?: string;
  eoa: string;
  name: string;
  description?: string;
  status: 'public' | 'limited' | 'hidden';
  priority?: number;
  createdAt: string;
  updatedAt: string;
}
```

**コンテンツエンティティ**
```typescript
interface Content {
  id: string;
  type: 'content';
  folderId: string;
  eoa: string;
  status: 'draft' | 'review' | 'standby' | 'published';
  title: string;
  description?: string;
  content: string;
  contentType?: 'text' | 'html' | 'image' | 'video' | 'iframe' | 'link';
  priority?: number;
  createdAt: string;
  updatedAt: string;
}
```

### 4. インフラストラクチャレイヤー

#### AWS CDK スタックコンポーネント

```typescript
lib/fullstack-serverless-cdk-stack.ts
├── DynamoDB テーブル (5)
│   ├── Items テーブル
│   ├── Settings テーブル
│   ├── Columns テーブル
│   ├── Users テーブル
│   └── NFTs テーブル
├── Lambda 関数 (5)
│   ├── CRUD ハンドラ
│   ├── Settings ハンドラ
│   ├── Columns ハンドラ
│   ├── Users ハンドラ
│   └── NFTs ハンドラ
├── API Gateway REST API
├── S3 バケット (フロントエンドホスティング)
├── CloudFront ディストリビューション
├── IAM ロールとポリシー
└── Lambda レイヤー (共有依存関係)
```

#### 環境設定
- **環境**: dev, staging, prod
- **命名規則**: `{project}-{resource}-{env}`
- **リージョン**: 設定可能 (デフォルト: us-east-1)

## デザインパターン

### 1. リポジトリパターン

ベースリポジトリは共通の CRUD 操作を提供:

```typescript
backend/repositories/
├── base.repository.ts    // 抽象ベースクラス
├── item.repository.ts    // アイテムリポジトリ
├── folder.repository.ts  // フォルダリポジトリ
└── content.repository.ts // コンテンツリポジトリ
```

### 2. サービスレイヤーパターン

フロントエンドサービスは API 呼び出しをカプセル化:

```javascript
class BaseApiService {
  constructor(endpoint) { }
  async request(url, options) { }
  async getAll(params) { }
  async getById(id) { }
  async create(data) { }
  async update(id, data) { }
  async delete(id) { }
}
```

### 3. エラーハンドリングパターン

カスタムエラータイプによる集中エラー処理:

```typescript
backend/utils/errors.ts
├── ValidationError
├── NotFoundError
├── ForbiddenError
└── handleError()
```

### 4. レスポンスパターン

標準化された API レスポンス:

```typescript
// 成功
{
  statusCode: 200,
  headers: CORS_HEADERS,
  body: JSON.stringify(data)
}

// エラー
{
  statusCode: 400,
  headers: CORS_HEADERS,
  body: JSON.stringify({
    message: "エラーメッセージ",
    error: "詳細 (非本番環境のみ)"
  })
}
```

## セキュリティアーキテクチャ

### 認証フロー

```
┌─────────┐     ┌──────────┐     ┌────────────┐     ┌─────────┐
│ブラウザ │────▶│ MetaMask │────▶│フロントエンド│────▶│   API   │
└─────────┘     └──────────┘     └────────────┘     └─────────┘
     │               │                   │                 │
     │   接続        │                   │                 │
     │──────────────▶│                   │                 │
     │               │                   │                 │
     │   アドレス    │                   │                 │
     │◀──────────────│                   │                 │
     │               │                   │                 │
     │   EOA 保存    │                   │                 │
     │───────────────────────────────────▶                 │
     │               │                   │                 │
     │           API リクエスト          │                 │
     │───────────────────────────────────────────────────▶│
     │               │                   │  Bearer: EOA    │
     │               │                   │                 │
     │           レスポンス              │                 │
     │◀────────────────────────────────────────────────────│
```

### セキュリティ機能

1. **API セキュリティ**
   - Bearer トークン認証
   - リクエスト検証
   - 入力のサニタイゼーション
   - レート制限

2. **インフラストラクチャセキュリティ**
   - パブリックアクセスをブロックした S3 バケット
   - S3 アクセス用の CloudFront OAI
   - HTTPS 強制
   - IAM 最小権限の原則

3. **データセキュリティ**
   - EOA によるユーザー分離
   - 変更時の権限チェック
   - タイムスタンプによる監査証跡

## パフォーマンス最適化

### フロントエンド最適化

1. **コード分割**
   - 大きなコンポーネントの動的インポート
   - ルートベースのコード分割
   - 機能の遅延読み込み

2. **キャッシング戦略**
   - 静的アセット用の CloudFront キャッシング
   - ブラウザキャッシュヘッダー
   - API レスポンスキャッシング

3. **バンドル最適化**
   - ツリーシェイキング
   - 最小化
   - 圧縮

### バックエンド最適化

1. **Lambda 最適化**
   - 小さなバンドルによる最小限のコールドスタート
   - DynamoDB のコネクションプーリング
   - 効率的なクエリパターン

2. **データベース最適化**
   - 一般的なクエリパターン用の GSI
   - 可能な限りバッチ操作
   - プロジェクション式

3. **API 最適化**
   - レスポンス圧縮
   - ページネーションサポート
   - フィールドフィルタリング

## スケーラビリティの考慮事項

### 水平スケーリング
- Lambda 自動スケーリング
- DynamoDB オンデマンドスケーリング
- CloudFront グローバルエッジロケーション

### 垂直スケーリング
- Lambda メモリ/タイムアウト設定
- DynamoDB スループット調整
- API Gateway スロットリング制限

### コスト最適化
- 従量課金制のサーバーレスモデル
- S3 ライフサイクルポリシー
- CloudWatch ログ保持
- 本番環境用の予約容量

## モニタリングと可観測性

### CloudWatch 統合
- Lambda 関数メトリクス
- API Gateway メトリクス
- DynamoDB メトリクス
- カスタムアプリケーションメトリクス

### ロギング戦略
- 構造化 JSON ロギング
- ログレベル (ERROR, WARN, INFO, DEBUG)
- リクエスト追跡用の相関 ID
- ログの集約と分析

### アラート
- エラー用の CloudWatch アラーム
- SNS 通知
- リアルタイムモニタリング用のダッシュボード

## デプロイメントアーキテクチャ

### CI/CD パイプライン

```
┌─────────┐     ┌──────────┐     ┌─────────┐     ┌────────────┐
│ GitHub  │────▶│  GitHub  │────▶│   AWS   │────▶│ CloudFront │
│  Push   │     │ Actions  │     │   CDK   │     │   + S3     │
└─────────┘     └──────────┘     └─────────┘     └────────────┘
                      │                 │
                      │                 ▼
                      │         ┌──────────────┐
                      │         │ API Gateway  │
                      │         │ + Lambda     │
                      │         └──────────────┘
                      │                 │
                      │                 ▼
                      │         ┌──────────────┐
                      └────────▶│  DynamoDB    │
                                └──────────────┘
```

### デプロイメントプロセス

1. **ビルドフェーズ**
   - TypeScript コンパイル
   - フロントエンドバンドリング
   - 依存関係の最適化

2. **デプロイフェーズ**
   - CDK 合成
   - CloudFormation デプロイメント
   - Lambda 関数の更新
   - S3 同期
   - CloudFront 無効化

3. **デプロイ後**
   - 設定の更新
   - ヘルスチェック
   - スモークテスト

## 将来のアーキテクチャ拡張

### 計画された改善

1. **認証の強化**
   - 署名ベースの認証
   - JWT トークン生成
   - セッション管理
   - マルチウォレットサポート

2. **リアルタイム機能**
   - API Gateway 経由の WebSocket API
   - GraphQL サブスクリプション用の AppSync
   - ライブコラボレーション機能

3. **検索機能**
   - Amazon OpenSearch 統合
   - 全文検索
   - ファセット検索
   - 検索分析

4. **高度な機能**
   - 多言語サポート (i18n)
   - プラグインアーキテクチャ
   - Webhook システム
   - 高度な分析

### アーキテクチャの進化

1. **マイクロサービス移行**
   - サービスメッシュの検討
   - イベント駆動型アーキテクチャ
   - ドメイン駆動設計

2. **マルチリージョンサポート**
   - DynamoDB のグローバルテーブル
   - マルチリージョンレプリケーション
   - ジオルーティング

3. **セキュリティの強化**
   - AWS WAF 統合
   - DDoS 保護
   - 保管時の暗号化
   - キー管理サービス

## まとめ

Web3CMS アーキテクチャは、スケーラブルで安全、かつ高性能なコンテンツ管理システムのための強固な基盤を提供します。サーバーレスアプローチにより、高可用性を維持しながらコスト効率を確保しています。モジュラー設計により、要件の進化に応じて簡単に拡張や変更が可能です。