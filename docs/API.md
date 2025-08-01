# Web3CMS API ドキュメント

## 概要

Web3CMS API は、AWS API Gateway と Lambda 関数上に構築された RESTful API です。コンテンツ管理、設定、および一般的な CRUD 操作のためのエンドポイントを提供します。

## ベース URL

```
開発環境: https://api-dev.example.com
ステージング環境: https://api-staging.example.com
本番環境: https://api.example.com
```

## 認証

ほとんどのエンドポイントは、MetaMask ウォレットアドレス（EOA - Externally Owned Account）による認証が必要です。

### 認証ヘッダー

```
Authorization: Bearer {wallet_address}
```

例:
```
Authorization: Bearer 0x1234567890abcdef1234567890abcdef12345678
```

## 共通レスポンス形式

### 成功レスポンス

```json
{
  "data": { ... },
  "message": "Success"
}
```

### エラーレスポンス

```json
{
  "message": "エラーの説明",
  "error": "詳細なエラーメッセージ (非本番環境のみ)"
}
```

### HTTP ステータスコード

- `200 OK` - リクエスト成功
- `201 Created` - リソースの作成成功
- `204 No Content` - 削除成功
- `400 Bad Request` - 無効なリクエストパラメータ
- `401 Unauthorized` - 認証情報の欠落または無効
- `403 Forbidden` - 権限不足
- `404 Not Found` - リソースが見つからない
- `405 Method Not Allowed` - 無効な HTTP メソッド
- `500 Internal Server Error` - サーバーエラー

## エンドポイント

### Items API

汎用アイテムの基本的な CRUD 操作。

#### アイテム一覧取得

```http
GET /items
```

**レスポンス:**
```json
{
  "items": [
    {
      "id": "item-1234567890-abc123",
      "name": "サンプルアイテム",
      "description": "アイテムの説明",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

#### アイテム取得

```http
GET /items/{id}
```

**パラメータ:**
- `id` (パス) - アイテム ID

**レスポンス:**
```json
{
  "id": "item-1234567890-abc123",
  "name": "サンプルアイテム",
  "description": "アイテムの説明",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### アイテム作成

```http
POST /items
```

**リクエストボディ:**
```json
{
  "name": "新しいアイテム",
  "description": "アイテムの説明",
  "type": "custom",
  "metadata": { ... }
}
```

**レスポンス:**
```json
{
  "id": "item-1234567890-abc123",
  "name": "新しいアイテム",
  "description": "アイテムの説明",
  "type": "custom",
  "metadata": { ... },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### アイテム更新

```http
PUT /items/{id}
```

**パラメータ:**
- `id` (パス) - アイテム ID

**リクエストボディ:**
```json
{
  "name": "更新されたアイテム",
  "description": "更新された説明"
}
```

**レスポンス:**
```json
{
  "id": "item-1234567890-abc123",
  "name": "更新されたアイテム",
  "description": "更新された説明",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### アイテム削除

```http
DELETE /items/{id}
```

**パラメータ:**
- `id` (パス) - アイテム ID

**レスポンス:**
```
204 No Content
```

### Settings API

アプリケーション設定管理。

#### 設定取得

```http
GET /settings/{key}
```

**パラメータ:**
- `key` (パス) - 設定キー (デフォルト: "app_config")

**レスポンス:**
```json
{
  "settingKey": "app_config",
  "version": "latest",
  "data": {
    "siteName": "Web3CMS",
    "theme": "light",
    "features": { ... }
  },
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### 設定更新

```http
PUT /settings/{key}
```

**パラメータ:**
- `key` (パス) - 設定キー (デフォルト: "app_config")

**リクエストボディ:**
```json
{
  "data": {
    "siteName": "My Web3CMS",
    "theme": "dark",
    "features": { ... }
  }
}
```

**レスポンス:**
```json
{
  "settingKey": "app_config",
  "version": "latest",
  "data": { ... },
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Folders API

階層構造を持つコンテンツフォルダ管理。

#### フォルダ一覧取得

```http
GET /columns/folders
```

**ヘッダー:**
- `Authorization: Bearer {wallet_address}` (必須)

**レスポンス:**
```json
{
  "folders": [
    {
      "id": "folder-1234567890-abc123",
      "type": "folder",
      "eoa": "0x1234567890abcdef1234567890abcdef12345678",
      "name": "マイフォルダ",
      "description": "フォルダの説明",
      "status": "public",
      "priority": 0,
      "parentId": null,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### フォルダ取得

```http
GET /columns/folders/{id}
```

**ヘッダー:**
- `Authorization: Bearer {wallet_address}` (必須)

**パラメータ:**
- `id` (パス) - フォルダ ID

**レスポンス:**
```json
{
  "id": "folder-1234567890-abc123",
  "type": "folder",
  "eoa": "0x1234567890abcdef1234567890abcdef12345678",
  "name": "マイフォルダ",
  "description": "フォルダの説明",
  "status": "public",
  "priority": 0,
  "parentId": null,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### フォルダ作成

```http
POST /columns/folders
```

**ヘッダー:**
- `Authorization: Bearer {wallet_address}` (必須)

**リクエストボディ:**
```json
{
  "name": "新しいフォルダ",
  "description": "フォルダの説明",
  "status": "public",
  "priority": 0,
  "parentId": "parent-folder-id"
}
```

**ステータスオプション:**
- `public` - 全員に公開
- `limited` - 限定公開
- `hidden` - 非公開

**レスポンス:**
```json
{
  "id": "folder-1234567890-abc123",
  "type": "folder",
  "eoa": "0x1234567890abcdef1234567890abcdef12345678",
  "name": "新しいフォルダ",
  "description": "フォルダの説明",
  "status": "public",
  "priority": 0,
  "parentId": "parent-folder-id",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### フォルダ更新

```http
PUT /columns/folders/{id}
```

**ヘッダー:**
- `Authorization: Bearer {wallet_address}` (必須)

**パラメータ:**
- `id` (パス) - フォルダ ID

**リクエストボディ:**
```json
{
  "name": "更新されたフォルダ",
  "description": "更新された説明",
  "status": "limited",
  "priority": 1
}
```

**注意:** フォルダの所有者のみが更新できます。

**レスポンス:**
```json
{
  "id": "folder-1234567890-abc123",
  "name": "更新されたフォルダ",
  "description": "更新された説明",
  "status": "limited",
  "priority": 1,
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### フォルダ削除

```http
DELETE /columns/folders/{id}
```

**ヘッダー:**
- `Authorization: Bearer {wallet_address}` (必須)

**パラメータ:**
- `id` (パス) - フォルダ ID
- `cascade` (クエリ、オプション) - フォルダ内のすべてのコンテンツを削除 (true/false)

**例:**
```
DELETE /columns/folders/folder-123?cascade=true
```

**レスポンス:**
```
204 No Content
```

### Contents API

フォルダ内のコンテンツ管理。

#### コンテンツ一覧取得

```http
GET /columns/contents
```

**ヘッダー:**
- `Authorization: Bearer {wallet_address}` (必須)

**クエリパラメータ:**
- `folderId` (オプション) - フォルダ ID でフィルタ

**レスポンス:**
```json
{
  "contents": [
    {
      "id": "content-1234567890-abc123",
      "type": "content",
      "folderId": "folder-123",
      "eoa": "0x1234567890abcdef1234567890abcdef12345678",
      "status": "published",
      "title": "マイコンテンツ",
      "description": "コンテンツの説明",
      "content": "# マークダウンコンテンツ",
      "contentType": "text",
      "priority": 0,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### コンテンツ取得

```http
GET /columns/contents/{id}
```

**ヘッダー:**
- `Authorization: Bearer {wallet_address}` (必須)

**パラメータ:**
- `id` (パス) - コンテンツ ID

**レスポンス:**
```json
{
  "id": "content-1234567890-abc123",
  "type": "content",
  "folderId": "folder-123",
  "eoa": "0x1234567890abcdef1234567890abcdef12345678",
  "status": "published",
  "title": "マイコンテンツ",
  "description": "コンテンツの説明",
  "content": "# マークダウンコンテンツ",
  "contentType": "text",
  "priority": 0,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### コンテンツ作成

```http
POST /columns/contents
```

**ヘッダー:**
- `Authorization: Bearer {wallet_address}` (必須)

**リクエストボディ:**
```json
{
  "folderId": "folder-123",
  "title": "新しいコンテンツ",
  "description": "コンテンツの説明",
  "content": "# マークダウンコンテンツ",
  "contentType": "text",
  "status": "draft",
  "priority": 0
}
```

**ステータスオプション:**
- `draft` - 下書き
- `review` - レビュー中
- `standby` - 公開準備完了
- `published` - 公開済み

**コンテンツタイプオプション:**
- `text` - プレーンテキスト/マークダウン
- `html` - HTML コンテンツ
- `image` - 画像 URL
- `video` - ビデオ URL
- `iframe` - 埋め込み iframe
- `link` - 外部リンク

**レスポンス:**
```json
{
  "id": "content-1234567890-abc123",
  "type": "content",
  "folderId": "folder-123",
  "eoa": "0x1234567890abcdef1234567890abcdef12345678",
  "title": "新しいコンテンツ",
  "description": "コンテンツの説明",
  "content": "# マークダウンコンテンツ",
  "contentType": "text",
  "status": "draft",
  "priority": 0,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### コンテンツ更新

```http
PUT /columns/contents/{id}
```

**ヘッダー:**
- `Authorization: Bearer {wallet_address}` (必須)

**パラメータ:**
- `id` (パス) - コンテンツ ID

**リクエストボディ:**
```json
{
  "title": "更新されたコンテンツ",
  "description": "更新された説明",
  "content": "# 更新されたマークダウンコンテンツ",
  "status": "published"
}
```

**注意:** コンテンツの所有者のみが更新できます。

**レスポンス:**
```json
{
  "id": "content-1234567890-abc123",
  "title": "更新されたコンテンツ",
  "description": "更新された説明",
  "content": "# 更新されたマークダウンコンテンツ",
  "status": "published",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### コンテンツ削除

```http
DELETE /columns/contents/{id}
```

**ヘッダー:**
- `Authorization: Bearer {wallet_address}` (必須)

**パラメータ:**
- `id` (パス) - コンテンツ ID

**レスポンス:**
```
204 No Content
```

### Public API

認証を必要としないパブリックエンドポイント。

#### パブリックフォルダ一覧取得

```http
GET /columns/public/folders
```

**レスポンス:**
```json
{
  "folders": [
    {
      "id": "folder-1234567890-abc123",
      "type": "folder",
      "name": "パブリックフォルダ",
      "description": "パブリックフォルダの説明",
      "status": "public",
      "priority": 0,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**注意:** `status: "public"` のフォルダのみが返されます。

#### 公開済みコンテンツ一覧取得

```http
GET /columns/public/contents
```

**クエリパラメータ:**
- `folderId` (オプション) - フォルダ ID でフィルタ

**レスポンス:**
```json
{
  "contents": [
    {
      "id": "content-1234567890-abc123",
      "type": "content",
      "folderId": "folder-123",
      "status": "published",
      "title": "公開済みコンテンツ",
      "description": "コンテンツの説明",
      "content": "# パブリックコンテンツ",
      "contentType": "text",
      "priority": 0,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**注意:** `status: "published"` のコンテンツのみが返されます。

#### 公開済みコンテンツ取得

```http
GET /columns/public/contents/{id}
```

**パラメータ:**
- `id` (パス) - コンテンツ ID

**レスポンス:**
```json
{
  "id": "content-1234567890-abc123",
  "type": "content",
  "folderId": "folder-123",
  "status": "published",
  "title": "公開済みコンテンツ",
  "description": "コンテンツの説明",
  "content": "# パブリックコンテンツ",
  "contentType": "text",
  "priority": 0,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**注意:** コンテンツが公開されていない場合は 404 を返します。

### Users API

EOA をプライマリキーとするユーザープロフィール管理。

#### ユーザー一覧取得

```http
GET /users
```

**ヘッダー:**
- `Authorization: Bearer {wallet_address}` (管理者用オプション)

**レスポンス:**
```json
{
  "users": [
    {
      "eoa": "0x1234567890abcdef1234567890abcdef12345678",
      "discordAddress": "discord#1234",
      "name": "ユーザー名",
      "avatar": "https://example.com/avatar.png",
      "roles": ["user", "contributor"],
      "admin": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

#### ユーザー取得

```http
GET /users/{eoa}
```

**パラメータ:**
- `eoa` (パス) - Ethereum Owner Address

**レスポンス:**
```json
{
  "eoa": "0x1234567890abcdef1234567890abcdef12345678",
  "discordAddress": "discord#1234",
  "name": "ユーザー名",
  "avatar": "https://example.com/avatar.png",
  "roles": ["user", "contributor"],
  "admin": false,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### ユーザー作成

```http
POST /users
```

**ヘッダー:**
- `Authorization: Bearer {wallet_address}` (必須)

**リクエストボディ:**
```json
{
  "eoa": "0x1234567890abcdef1234567890abcdef12345678",
  "discordAddress": "discord#1234",
  "name": "ユーザー名",
  "avatar": "https://example.com/avatar.png",
  "roles": ["user"],
  "admin": false
}
```

**レスポンス:**
```json
{
  "eoa": "0x1234567890abcdef1234567890abcdef12345678",
  "discordAddress": "discord#1234",
  "name": "ユーザー名",
  "avatar": "https://example.com/avatar.png",
  "roles": ["user"],
  "admin": false,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### ユーザー更新

```http
PUT /users/{eoa}
```

**ヘッダー:**
- `Authorization: Bearer {wallet_address}` (必須)

**パラメータ:**
- `eoa` (パス) - Ethereum Owner Address

**リクエストボディ:**
```json
{
  "discordAddress": "newdiscord#5678",
  "name": "更新された名前",
  "avatar": "https://example.com/new-avatar.png",
  "roles": ["user", "contributor", "moderator"],
  "admin": true
}
```

**レスポンス:**
```json
{
  "eoa": "0x1234567890abcdef1234567890abcdef12345678",
  "discordAddress": "newdiscord#5678",
  "name": "更新された名前",
  "avatar": "https://example.com/new-avatar.png",
  "roles": ["user", "contributor", "moderator"],
  "admin": true,
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### ユーザー削除

```http
DELETE /users/{eoa}
```

**ヘッダー:**
- `Authorization: Bearer {wallet_address}` (必須、管理者のみ)

**パラメータ:**
- `eoa` (パス) - Ethereum Owner Address

**レスポンス:**
```
204 No Content
```

### NFTs API

複合キー（コントラクトアドレス + トークン ID）による NFT メタデータ管理。

#### NFT 一覧取得

```http
GET /nfts
```

**クエリパラメータ:**
- `owner` (オプション) - 所有者アドレスでフィルタ
- `creator` (オプション) - 作成者アドレスでフィルタ

**例:**
```
GET /nfts?owner=0x1234567890abcdef1234567890abcdef12345678
GET /nfts?creator=0xabcdef1234567890abcdef1234567890abcdef12
```

**レスポンス:**
```json
{
  "nfts": [
    {
      "ca": "0xcontract1234567890abcdef1234567890abcdef",
      "id": "1",
      "tokenUrl": "https://api.example.com/metadata/1",
      "name": "NFT #1",
      "image": "https://example.com/nft/1.png",
      "creator": "0xabcdef1234567890abcdef1234567890abcdef12",
      "owner": "0x1234567890abcdef1234567890abcdef12345678",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

#### コントラクトごとの NFT 一覧取得

```http
GET /nfts/{ca}
```

**パラメータ:**
- `ca` (パス) - コントラクトアドレス

**レスポンス:**
```json
{
  "nfts": [
    {
      "ca": "0xcontract1234567890abcdef1234567890abcdef",
      "id": "1",
      "tokenUrl": "https://api.example.com/metadata/1",
      "name": "NFT #1",
      "image": "https://example.com/nft/1.png",
      "creator": "0xabcdef1234567890abcdef1234567890abcdef12",
      "owner": "0x1234567890abcdef1234567890abcdef12345678",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

#### NFT 取得

```http
GET /nfts/{ca}/{id}
```

**パラメータ:**
- `ca` (パス) - コントラクトアドレス
- `id` (パス) - トークン ID

**レスポンス:**
```json
{
  "ca": "0xcontract1234567890abcdef1234567890abcdef",
  "id": "1",
  "tokenUrl": "https://api.example.com/metadata/1",
  "name": "NFT #1",
  "image": "https://example.com/nft/1.png",
  "creator": "0xabcdef1234567890abcdef1234567890abcdef12",
  "owner": "0x1234567890abcdef1234567890abcdef12345678",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### NFT 作成

```http
POST /nfts
```

**ヘッダー:**
- `Authorization: Bearer {wallet_address}` (必須)

**リクエストボディ:**
```json
{
  "ca": "0xcontract1234567890abcdef1234567890abcdef",
  "id": "1",
  "tokenUrl": "https://api.example.com/metadata/1",
  "name": "NFT #1",
  "image": "https://example.com/nft/1.png",
  "creator": "0xabcdef1234567890abcdef1234567890abcdef12",
  "owner": "0x1234567890abcdef1234567890abcdef12345678"
}
```

**レスポンス:**
```json
{
  "ca": "0xcontract1234567890abcdef1234567890abcdef",
  "id": "1",
  "tokenUrl": "https://api.example.com/metadata/1",
  "name": "NFT #1",
  "image": "https://example.com/nft/1.png",
  "creator": "0xabcdef1234567890abcdef1234567890abcdef12",
  "owner": "0x1234567890abcdef1234567890abcdef12345678",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### NFT 更新

```http
PUT /nfts/{ca}/{id}
```

**ヘッダー:**
- `Authorization: Bearer {wallet_address}` (必須)

**パラメータ:**
- `ca` (パス) - コントラクトアドレス
- `id` (パス) - トークン ID

**リクエストボディ:**
```json
{
  "tokenUrl": "https://api.example.com/metadata/1-updated",
  "name": "更新された NFT #1",
  "image": "https://example.com/nft/1-updated.png",
  "owner": "0xnewowner234567890abcdef1234567890abcdef"
}
```

**注意:** `creator` は作成後に更新できません。

**レスポンス:**
```json
{
  "ca": "0xcontract1234567890abcdef1234567890abcdef",
  "id": "1",
  "tokenUrl": "https://api.example.com/metadata/1-updated",
  "name": "更新された NFT #1",
  "image": "https://example.com/nft/1-updated.png",
  "creator": "0xabcdef1234567890abcdef1234567890abcdef12",
  "owner": "0xnewowner234567890abcdef1234567890abcdef",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### NFT 削除

```http
DELETE /nfts/{ca}/{id}
```

**ヘッダー:**
- `Authorization: Bearer {wallet_address}` (必須、管理者のみ)

**パラメータ:**
- `ca` (パス) - コントラクトアドレス
- `id` (パス) - トークン ID

**レスポンス:**
```
204 No Content
```

## レート制限

API は AWS API Gateway のデフォルトレート制限を実装しています：
- 秒間 10,000 リクエスト (RPS)
- バースト容量 5,000

## CORS

すべてのエンドポイントは以下のヘッダーで CORS をサポートしています：
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS`
- `Access-Control-Allow-Headers: Content-Type,Authorization`

## エラーハンドリング

### 一般的なエラーレスポンス

#### 400 Bad Request
```json
{
  "message": "リクエストボディが必要です"
}
```

#### 401 Unauthorized
```json
{
  "message": "Authorization ヘッダーが必要です"
}
```

#### 403 Forbidden
```json
{
  "message": "このアクションを実行する権限がありません"
}
```

#### 404 Not Found
```json
{
  "message": "フォルダが見つかりません"
}
```

#### 500 Internal Server Error
```json
{
  "message": "内部サーバーエラー",
  "error": "詳細なエラーメッセージ (非本番環境のみ)"
}
```

## SDK 例

### JavaScript/TypeScript

```javascript
// 提供された API サービスクラスの使用
import { FolderService, ContentService } from './services/api';

const folderService = new FolderService();
const contentService = new ContentService();

// フォルダ一覧取得
const folders = await folderService.getFolders();

// コンテンツ作成
const newContent = await contentService.create({
  folderId: 'folder-123',
  title: 'マイコンテンツ',
  content: '# Hello World',
  contentType: 'text',
  status: 'draft'
});

// コンテンツ更新
const updated = await contentService.update(newContent.id, {
  status: 'published'
});
```

### cURL 例

```bash
# パブリックフォルダ取得
curl https://api.example.com/columns/public/folders

# フォルダ作成 (認証付き)
curl -X POST https://api.example.com/columns/folders \
  -H "Authorization: Bearer 0x1234567890abcdef1234567890abcdef12345678" \
  -H "Content-Type: application/json" \
  -d '{"name":"マイフォルダ","status":"public"}'

# カスケード削除でフォルダ削除
curl -X DELETE https://api.example.com/columns/folders/folder-123?cascade=true \
  -H "Authorization: Bearer 0x1234567890abcdef1234567890abcdef12345678"
```

## Webhooks

現在未実装。将来のバージョンでは以下の Webhook をサポート予定：
- コンテンツ公開
- コンテンツ更新
- フォルダ作成/削除

## API バージョニング

API は現在 URL ベースのバージョニングを使用しています。将来のバージョンは以下で利用可能になります：
- `/v1/` - 現在のバージョン
- `/v2/` - 将来のバージョン (計画中)