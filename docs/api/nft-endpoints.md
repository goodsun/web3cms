# NFT API エンドポイント

このドキュメントは、Web3CMS システムの NFT 関連 API エンドポイントについて説明します。

## ベース URL
```
https://te84a7g526.execute-api.ap-northeast-1.amazonaws.com/dev
```

## 更新履歴
- 2025-08-01: DRY原則に従い、メタデータ抽出ロジックを共通化
  - 統合エンドポイントがHTTP URLからもメタデータを正しく取得するように修正
  - `nftMetadata.ts`ユーティリティで重複コードを削除
- 2025-08-01: Burn検出機能を追加
  - null address (0x0000...0000) または dead address (0x0000...dEaD) への転送を検出
  - burnされたNFTのDynamoDBレコードを自動削除
  - レスポンスに`burned: true`フラグを追加
- 2025-08-01: Burn検出を拡張
  - コントラクトエラー（ERC721: invalid token ID）も burn として検出
  - 完全に削除されたトークンにも対応
- 2025-08-01: sbtFlagとroyaltyInfoエンドポイントを追加
  - SBT（Soul Bound Token）判定をキャッシュ対応
  - ロイヤリティ情報をキャッシュ対応（EIP-2981）
  - 統合エンドポイントにも両機能を追加

## エンドポイント

### 1. トークン URI の取得
特定の NFT のトークン URI を取得します。

**エンドポイント:** `GET /nfts/{ca}/{id}/tokenURI`

**パラメータ:**
- `ca` (パス): コントラクトアドレス
- `id` (パス): トークン ID
- `force` (クエリ、オプション): "true" に設定するとキャッシュを強制更新

**レスポンス:**
```json
{
  "tokenURI": "string",
  "contractAddress": "string",
  "tokenId": "string",
  "name": "string",
  "description": "string",
  "imageUrl": "string",
  "cached": boolean,
  "updatedAt": "ISO 8601 datetime"
}
```

**キャッシュ TTL:** 30日（不変データ）

### 2. 所有者の取得
特定の NFT の現在の所有者を取得します。

**エンドポイント:** `GET /nfts/{ca}/{id}/owner`

**パラメータ:**
- `ca` (パス): コントラクトアドレス
- `id` (パス): トークン ID
- `force` (クエリ、オプション): "true" に設定するとキャッシュを強制更新

**レスポンス:**
```json
{
  "owner": "string (address)",
  "contractAddress": "string",
  "tokenId": "string",
  "cached": boolean,
  "updatedAt": "ISO 8601 datetime"
}
```

**キャッシュ TTL:** 5分（可変データ）

### 3. 作成者の取得
特定の NFT の作成者を取得します。

**エンドポイント:** `GET /nfts/{ca}/{id}/creator`

**パラメータ:**
- `ca` (パス): コントラクトアドレス
- `id` (パス): トークン ID
- `force` (クエリ、オプション): "true" に設定するとキャッシュを強制更新

**レスポンス:**
```json
{
  "creator": "string (address)",
  "contractAddress": "string",
  "tokenId": "string",
  "cached": boolean,
  "updatedAt": "ISO 8601 datetime"
}
```

**キャッシュ TTL:** 30日（不変データ）

### 4. TBA アドレスの取得
特定の NFT のトークンバウンドアカウント（TBA）アドレスを取得します。

**エンドポイント:** `GET /nfts/{ca}/{id}/tba`

**パラメータ:**
- `ca` (パス): コントラクトアドレス
- `id` (パス): トークン ID
- `force` (クエリ、オプション): "true" に設定するとキャッシュを強制更新

**レスポンス:**
```json
{
  "tba": "string (address)",
  "contractAddress": "string",
  "tokenId": "string",
  "cached": boolean,
  "updatedAt": "ISO 8601 datetime"
}
```

**キャッシュ TTL:** 30日（不変データ）

### 5. SBT フラグの取得
特定の NFT の SBT（Soul Bound Token）フラグを取得します。

**エンドポイント:** `GET /nfts/{ca}/{id}/sbtFlag`

**パラメータ:**
- `ca` (パス): コントラクトアドレス
- `id` (パス): トークン ID
- `force` (クエリ、オプション): "true" に設定するとキャッシュを強制更新

**レスポンス:**
```json
{
  "sbtFlag": boolean,
  "contractAddress": "string",
  "tokenId": "string",
  "cached": boolean,
  "updatedAt": "ISO 8601 datetime"
}
```

**キャッシュ TTL:** 30日（不変データ）

### 6. ロイヤリティ情報の取得
特定の NFT のロイヤリティ情報を取得します（EIP-2981）。

**エンドポイント:** `GET /nfts/{ca}/{id}/royaltyInfo`

**パラメータ:**
- `ca` (パス): コントラクトアドレス
- `id` (パス): トークン ID
- `salePrice` (クエリ、オプション): 計算用の販売価格（デフォルト: 1 ETH in wei）
- `force` (クエリ、オプション): "true" に設定するとキャッシュを強制更新

**レスポンス:**
```json
{
  "receiver": "string (address)",
  "percentage": number,
  "royaltyAmount": "string",
  "salePrice": "string",
  "contractAddress": "string",
  "tokenId": "string",
  "cached": boolean,
  "updatedAt": "ISO 8601 datetime"
}
```

**キャッシュ TTL:** 30日（不変データ）

### 7. すべての NFT 情報の取得（統合）
単一のリクエストですべての NFT 情報を取得します。

**エンドポイント:** `GET /nfts/{ca}/{id}/info`

**パラメータ:**
- `ca` (パス): コントラクトアドレス
- `id` (パス): トークン ID
- `force` (クエリ、オプション): "true" に設定するとキャッシュを強制更新

**レスポンス:**
```json
{
  "tokenURI": "string",
  "name": "string",
  "description": "string",
  "imageUrl": "string",
  "owner": "string (address)",
  "creator": "string (address)",
  "tba": "string (address)",
  "sbtFlag": boolean,
  "royalty": {
    "receiver": "string (address)",
    "percentage": number
  },
  "contractAddress": "string",
  "tokenId": "string",
  "cached": boolean,
  "updatedAt": "ISO 8601 datetime"
}
```

**キャッシュ戦略:** 
- データタイプごとに異なる TTL を使用
- Owner: 5分（可変）
- TokenURI、Creator、TBA、SBT フラグ、ロイヤリティ情報: 30日（不変）
- 期限切れのデータのみブロックチェーンから取得

## エラーレスポンス

すべてのエンドポイントは標準的な HTTP エラーコードを返します：

- `400 Bad Request`: 無効なパラメータ
- `404 Not Found`: NFT または設定が見つからない
- `500 Internal Server Error`: サーバーエラーまたは RPC 失敗

エラーレスポンス形式:
```json
{
  "message": "エラーの説明",
  "error": "詳細なエラーメッセージ（オプション）"
}
```

## キャッシング戦略

API はインテリジェントなキャッシング戦略を実装しています：

1. **不変データ**（30日キャッシュ）:
   - トークン URI
   - 作成者
   - TBA アドレス

2. **可変データ**（5分キャッシュ）:
   - 所有者

3. **キャッシュバイパス**:
   - `?force=true` を使用してキャッシュをバイパスし、ブロックチェーンから最新データを取得

4. **キャッシュストレージ**:
   - すべてのキャッシュデータは DynamoDB に保存
   - キャッシュには各フィールドの有効期限タイムスタンプが含まれる
   - 部分的な更新がサポートされている（期限切れのフィールドのみ更新）

## 実装の詳細

### メタデータ抽出
- **データ URL**: base64エンコードされたJSONメタデータを直接解析
- **HTTP URL**: 外部URLからJSONメタデータを取得
- **IPFS URL**: `ipfs://`を`https://ipfs.io/ipfs/`に変換
- **Arweave URL**: `ar://`を`https://arweave.net/`に変換
- **画像処理**: 
  - base64画像または1000文字を超える画像URLは`NOT_URL`として保存
  - IPFS/Arweave画像URLは自動的にHTTP URLに変換

### 共通ユーティリティ
- `backend/utils/nftMetadata.ts` - メタデータ抽出の共通ロジック
- `backend/utils/burnDetection.ts` - burn検出の共通ロジック
- `backend/utils/response.ts` - HTTPレスポンスの標準化

### Burn 検出
NFTがburnされた場合の処理：

1. **転送によるburn判定**: owner addressが以下の場合
   - `0x0000000000000000000000000000000000000000` (null address)
   - `0x000000000000000000000000000000000000dEaD` (dead address)

2. **削除によるburn判定**: コントラクトエラーが以下の場合
   - `ERC721: invalid token ID` - トークンが存在しない
   - `ERC721: owner query for nonexistent token` - 削除されたトークンへのアクセス

3. **処理内容**:
   - DynamoDBレコードを自動削除
   - `burned: true`フラグ付きでレスポンス返却
   - `owner: null`として返却

```json
// Burned NFT レスポンス例
{
  "owner": null,
  "contractAddress": "0x...",
  "tokenId": "123",
  "burned": true,
  "cached": false,
  "updatedAt": "2025-08-01T..."
}
```

## NFT コントラクトメソッド実装マトリックス

以下は、NFTコントラクトの読み取り専用メソッドとAPIエンドポイントの実装状況です：

| メソッド | タイプ | キャッシュ TTL | API エンドポイント | ステータス | 備考 |
|--------|------|-----------|--------------|--------|-------|
| `tokenURI(uint256)` | view | 30日 | `/nfts/{ca}/{id}/tokenURI` | ✅ 実装済み | メタデータも抽出 |
| `ownerOf(uint256)` | view | 5分 | `/nfts/{ca}/{id}/owner` | ✅ 実装済み | Burn検出機能付き |
| `tokenCreator(uint256)` | view | 30日 | `/nfts/{ca}/{id}/creator` | ✅ 実装済み | |
| `sbtFlag(uint256)` | view | 30日 | `/nfts/{ca}/{id}/sbtFlag` | ✅ 実装済み | SBT判定 |
| `royaltyInfo(uint256,uint256)` | view | 30日 | `/nfts/{ca}/{id}/royaltyInfo` | ✅ 実装済み | EIP-2981 |
| `balanceOf(address)` | view | - | - | ❌ 未実装 | |
| `getApproved(uint256)` | view | - | - | ❌ 未実装 | |
| `isApprovedForAll(address,address)` | view | - | - | ❌ 未実装 | |
| `name()` | view | - | - | ❌ 未実装 | コントラクト全体情報 |
| `symbol()` | view | - | - | ❌ 未実装 | コントラクト全体情報 |
| `totalSupply()` | view | - | - | ❌ 未実装 | |
| `tokenByIndex(uint256)` | view | - | - | ❌ 未実装 | |
| `tokenOfOwnerByIndex(address,uint256)` | view | - | - | ❌ 未実装 | |
| `metaUrl(uint256)` | view | - | - | ❌ 未実装 | tokenURIと同じ |
| `originalTokenInfo(uint256)` | view | - | - | ❌ 未実装 | インポート情報 |
| **TBA アドレス** | 計算値 | 30日 | `/nfts/{ca}/{id}/tba` | ✅ 実装済み | 外部計算 |
| **統合情報** | 複数 | 異なる | `/nfts/{ca}/{id}/info` | ✅ 実装済み | 統合エンドポイント |

### 実装済みエンドポイント
- **6個のメソッド**: tokenURI、ownerOf、tokenCreator、sbtFlag、royaltyInfo、TBA（計算値）
- **1個の統合エンドポイント**: 全情報を一括取得

### キャッシュ戦略
- **不変データ**: 30日間キャッシュ（tokenURI、creator、TBA、sbtFlag、royaltyInfo）
- **可変データ**: 5分間キャッシュ（owner）
- **Burn検出**: 自動的にDynamoDBレコードを削除

## 使用例

```bash
# すべての NFT 情報を取得
curl https://te84a7g526.execute-api.ap-northeast-1.amazonaws.com/dev/nfts/0x3a222E6021Ce5caaA48525e99a544DEfDfc7D936/83/info

# 強制更新でトークン URI を取得
curl https://te84a7g526.execute-api.ap-northeast-1.amazonaws.com/dev/nfts/0x3a222E6021Ce5caaA48525e99a544DEfDfc7D936/83/tokenURI?force=true

# 現在の所有者を取得
curl https://te84a7g526.execute-api.ap-northeast-1.amazonaws.com/dev/nfts/0x3a222E6021Ce5caaA48525e99a544DEfDfc7D936/83/owner

# SBT フラグを取得
curl https://te84a7g526.execute-api.ap-northeast-1.amazonaws.com/dev/nfts/0x3a222E6021Ce5caaA48525e99a544DEfDfc7D936/83/sbtFlag

# ロイヤリティ情報を取得
curl https://te84a7g526.execute-api.ap-northeast-1.amazonaws.com/dev/nfts/0x3a222E6021Ce5caaA48525e99a544DEfDfc7D936/83/royaltyInfo
```