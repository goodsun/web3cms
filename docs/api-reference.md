# Web3CMS API リファレンス

## ベース URL
- 開発環境: `https://te84a7g526.execute-api.ap-northeast-1.amazonaws.com/dev/`
- 本番環境: `https://api.example.com/prod/`

## 認証
ほとんどのエンドポイントはウォレット署名による認証が必要です。パブリックエンドポイントはその旨が記載されています。

## エンドポイント

### NFT 操作

#### NFT トークン URI の取得
特定の NFT の tokenURI を取得し、メタデータと共に結果をキャッシュします。

**エンドポイント:** `GET /nfts/{ca}/{id}/tokenURI`

**パラメータ:**
- `ca` (パス) - コントラクトアドレス
- `id` (パス) - トークン ID
- `force` (クエリ、オプション) - `true` に設定するとキャッシュをバイパスして強制的に更新

**レスポンス:**
```json
{
  "tokenURI": "https://arweave.net/...",
  "contractAddress": "0x3a222E6021Ce5caaA48525e99a544DEfDfc7D936",
  "tokenId": "1",
  "name": "NFT 名",
  "description": "NFT の説明",
  "imageUrl": "https://arweave.net/..." | "NOT_URL",
  "cached": true | false,
  "updatedAt": "2025-08-01T16:09:00.492Z"
}
```

**キャッシュ動作:**
- TokenURI は 30 日間キャッシュされます（不変データ）
- メタデータ（name、description、imageUrl）が抽出されキャッシュされます
- `?force=true` を使用してキャッシュをバイパスし、データを更新
- 大きい画像や base64 エンコードされた画像は `"NOT_URL"` として保存されます

**例:**
```bash
# tokenURI を取得（利用可能な場合はキャッシュを使用）
curl -X GET "https://api.example.com/dev/nfts/0x3a222E6021Ce5caaA48525e99a544DEfDfc7D936/1/tokenURI"

# 強制更新（キャッシュをバイパス）
curl -X GET "https://api.example.com/dev/nfts/0x3a222E6021Ce5caaA48525e99a544DEfDfc7D936/1/tokenURI?force=true"
```

#### NFT 一覧
所有者または作成者で NFT をクエリします。

**エンドポイント:** `GET /nfts`

**クエリパラメータ:**
- `owner` - 所有者アドレスでフィルタ
- `creator` - 作成者アドレスでフィルタ

**レスポンス:**
```json
{
  "items": [
    {
      "ca": "0x...",
      "id": "1",
      "owner": "0x...",
      "creator": "0x...",
      "tokenURI": "https://...",
      "name": "NFT 名",
      "description": "説明",
      "imageUrl": "https://..."
    }
  ]
}
```

#### コントラクトと ID で NFT を取得
**エンドポイント:** `GET /nfts/{ca}/{id}`

#### NFT キャッシュエントリの作成/更新
**エンドポイント:** `POST /nfts`
**エンドポイント:** `PUT /nfts/{ca}/{id}`

### ユーザー管理

#### ユーザープロフィールの取得
**エンドポイント:** `GET /users/{eoa}`

**レスポンス:**
```json
{
  "eoa": "0x...",
  "name": "ユーザー名",
  "icon": "https://...",
  "bio": "ユーザーの自己紹介",
  "isAdmin": false,
  "createdAt": "2025-01-01T00:00:00Z"
}
```

#### 全ユーザー一覧
**エンドポイント:** `GET /users`

#### ユーザーの作成/更新
**エンドポイント:** `POST /users`
**エンドポイント:** `PUT /users/{eoa}`

### 設定管理

#### 設定の取得
**エンドポイント:** `GET /settings/{key}`

**一般的なキー:**
- `app_config` - web3 設定を含むアプリケーション設定

**レスポンス:**
```json
{
  "settingKey": "app_config",
  "version": "latest",
  "data": {
    "web3": {
      "rpcUrls": "https://polygon-mainnet.g.alchemy.com/v2/...",
      "defaultChainId": 137,
      "nftContract": "0x..."
    }
  }
}
```

#### 設定の更新
**エンドポイント:** `PUT /settings/{key}`

**必須:** 管理者認証

### コンテンツ管理

#### フォルダ

##### フォルダ一覧
**エンドポイント:** `GET /columns/folders`

##### フォルダ取得
**エンドポイント:** `GET /columns/folders/{id}`

##### フォルダ作成
**エンドポイント:** `POST /columns/folders`

##### フォルダ更新
**エンドポイント:** `PUT /columns/folders/{id}`

##### フォルダ削除
**エンドポイント:** `DELETE /columns/folders/{id}`

#### コンテンツ

##### コンテンツ一覧
**エンドポイント:** `GET /columns/contents`

**クエリパラメータ:**
- `folder` - フォルダ ID でフィルタ

##### コンテンツ取得
**エンドポイント:** `GET /columns/contents/{id}`

##### コンテンツ作成
**エンドポイント:** `POST /columns/contents`

##### コンテンツ更新
**エンドポイント:** `PUT /columns/contents/{id}`

##### コンテンツ削除
**エンドポイント:** `DELETE /columns/contents/{id}`

#### パブリックコンテンツアクセス

##### パブリックフォルダ一覧
**エンドポイント:** `GET /columns/public/folders`

認証不要。

##### パブリックコンテンツ一覧
**エンドポイント:** `GET /columns/public/contents`

認証不要。

##### パブリックコンテンツ取得
**エンドポイント:** `GET /columns/public/contents/{id}`

認証不要。

### アイテム（レガシー）

#### アイテム一覧
**エンドポイント:** `GET /items`

#### アイテム取得
**エンドポイント:** `GET /items/{id}`

#### アイテム作成
**エンドポイント:** `POST /items`

#### アイテム更新
**エンドポイント:** `PUT /items/{id}`

#### アイテム削除
**エンドポイント:** `DELETE /items/{id}`

## エラーレスポンス

すべてのエンドポイントは一貫したエラーレスポンスを返します：

```json
{
  "message": "エラーの説明",
  "error": "詳細なエラーメッセージ（オプション）"
}
```

**一般的な HTTP ステータスコード:**
- `200 OK` - 成功
- `400 Bad Request` - 無効なリクエストパラメータ
- `401 Unauthorized` - 認証が必要
- `403 Forbidden` - 権限不足
- `404 Not Found` - リソースが見つからない
- `500 Internal Server Error` - サーバーエラー

## レート制限
API リクエストは AWS API Gateway のデフォルトレート制限の対象となります。カスタム制限については管理者にお問い合わせください。

## データ型

### アドレス形式
すべての Ethereum アドレスはチェックサム形式（大文字小文字混在）で提供する必要があります。

### タイムスタンプ
すべてのタイムスタンプは ISO 8601 形式です: `YYYY-MM-DDTHH:mm:ss.sssZ`

### NFT メタデータ
NFT メタデータは以下をサポートする ERC-721 メタデータ標準に従います：
- `name` - NFT 名
- `description` - NFT の説明
- `image` / `image_url` / `imageUrl` - NFT 画像 URL

## 注意事項

1. **キャッシング戦略:**
   - TokenURI: 30 日間（不変）
   - 所有者データ: 5 分間（可変）
   - 設定: キャッシュなし（常に最新）

2. **RPC 設定:**
   - 複数の RPC URL を設定可能（カンマ区切り）
   - システムは負荷分散のためラウンドロビン選択を使用

3. **大容量データの処理:**
   - メタデータ内の Base64 エンコード画像は `"NOT_URL"` に置き換えられます
   - DynamoDB アイテムサイズ制限は 400KB