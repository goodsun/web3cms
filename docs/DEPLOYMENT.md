# Web3CMS デプロイメントガイド

## 概要

このガイドでは、AWS CDK を使用した Web3CMS の AWS へのデプロイプロセスについて説明します。アプリケーションは開発（dev）、ステージング（staging）、本番（prod）の 3 つの環境をサポートしています。

## 前提条件

### 必要なソフトウェア

1. **Node.js** (v20.x 以上)
   ```bash
   node --version  # v20.x.x 以上が表示されるはず
   ```

2. **AWS CLI** (v2.x)
   ```bash
   aws --version
   ```

3. **AWS CDK CLI**
   ```bash
   npm install -g aws-cdk
   cdk --version
   ```

### AWS 設定

1. **AWS 認証情報の設定**
   ```bash
   aws configure
   ```
   以下を入力：
   - AWS アクセスキー ID
   - AWS シークレットアクセスキー
   - デフォルトリージョン（例: us-east-1）
   - デフォルト出力形式（json）

2. **AWS アクセスの確認**
   ```bash
   aws sts get-caller-identity
   ```

3. **CDK のブートストラップ**（初回のみ）
   ```bash
   cdk bootstrap aws://ACCOUNT-ID/REGION
   ```

## クイックデプロイメント

### ワンコマンドデプロイメント

提供されている npm スクリプトを使用する最速のデプロイ方法：

```bash
# 開発環境へのデプロイ
npm run deploy:dev

# ステージング環境へのデプロイ
npm run deploy:staging

# 本番環境へのデプロイ
npm run deploy:prod
```

これらのコマンドは以下を実行します：
1. TypeScript コードのビルド
2. CDK スタックのデプロイ
3. フロントエンド設定の更新
4. CloudFront キャッシュの無効化

## ステップバイステップのデプロイメント

### 1. 依存関係のインストール

```bash
# ルートディレクトリ
npm install

# フロントエンドの依存関係
cd frontend
npm install
cd ..

# バックエンドの依存関係
cd backend
npm install
cd ..
```

### 2. プロジェクトのビルド

```bash
# TypeScript ファイルのビルド
npm run build

# フロントエンドのビルド
cd frontend
npm run build
cd ..
```

### 3. インフラストラクチャのデプロイ

```bash
# 開発環境へのデプロイ
cdk deploy --context env=dev

# ステージング環境へのデプロイ
cdk deploy --context env=staging

# 本番環境へのデプロイ
cdk deploy --context env=prod
```

### 4. フロントエンド設定の更新

デプロイ後、API エンドポイントでフロントエンドを更新：

```bash
# 提供されたスクリプトを使用
./scripts/update-frontend-config.sh dev

# または手動で
API_URL=$(./scripts/get-api-endpoint.sh dev)
echo "VITE_API_ENDPOINT=$API_URL" > frontend/.env.production.local
```

### 5. フロントエンドのデプロイ

```bash
cd frontend
npm run build
cd ..

# CDK デプロイメントはビルドされたファイルを自動的に S3 に同期します
```

## デプロイメントスクリプト

### deploy-with-config.sh

完全なデプロイメントプロセスを処理する自動デプロイメントスクリプト：

```bash
./scripts/deploy-with-config.sh [環境]
```

機能：
- 環境パラメータの検証
- TypeScript コードのビルド
- CDK スタックのデプロイ
- フロントエンド設定の更新
- 新しい設定でフロントエンドを再ビルド
- S3 への同期
- CloudFront キャッシュの無効化

### update-frontend-config.sh

デプロイされた API エンドポイントでフロントエンド設定を更新：

```bash
./scripts/update-frontend-config.sh [環境]
```

### get-api-endpoint.sh

指定された環境の API エンドポイント URL を取得：

```bash
./scripts/get-api-endpoint.sh [環境]
```

## 環境設定

### 環境変数

各環境は特定の命名規則を使用：

```
開発環境: {projectName}-{resource}-dev
ステージング環境: {projectName}-{resource}-staging
本番環境: {projectName}-{resource}-prod
```

### CDK コンテキスト

`cdk.json` でデプロイメントパラメータを設定：

```json
{
  "context": {
    "projectName": "web3cms",
    "region": "us-east-1",
    "dev": {
      "account": "123456789012"
    },
    "staging": {
      "account": "123456789012"
    },
    "prod": {
      "account": "123456789012"
    }
  }
}
```

## リソース概要

### 作成される AWS リソース

1. **API Gateway**
   - CORS が有効な REST API
   - items、settings、columns のエンドポイント

2. **Lambda 関数** (3)
   - CRUD ハンドラ
   - Settings ハンドラ
   - Columns ハンドラ

3. **DynamoDB テーブル** (3)
   - Items テーブル
   - Settings テーブル
   - Columns テーブル

4. **S3 バケット**
   - フロントエンドホスティング
   - パブリックアクセスをブロック

5. **CloudFront ディストリビューション**
   - グローバル CDN
   - カスタムエラーページ
   - HTTPS のみ

6. **IAM ロールとポリシー**
   - Lambda 実行ロール
   - DynamoDB アクセスポリシー

## デプロイ後のタスク

### 1. デプロイの確認

すべてのリソースが作成されていることを確認：

```bash
# CloudFormation スタックの一覧表示
aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE

# スタック出力の取得
aws cloudformation describe-stacks --stack-name web3cms-stack-dev
```

### 2. API エンドポイントのテスト

```bash
# API URL の取得
API_URL=$(./scripts/get-api-endpoint.sh dev)

# ヘルスエンドポイントのテスト
curl $API_URL/items

# パブリックエンドポイントのテスト
curl $API_URL/columns/public/folders
```

### 3. フロントエンドへのアクセス

CloudFront URL はデプロイ後に出力されます：
```
https://d1234567890abc.cloudfront.net
```

### 4. カスタムドメインの設定（オプション）

1. us-east-1 で ACM 証明書をリクエスト
2. ドメイン設定で CDK スタックを更新
3. Route53 または外部 DNS を設定

## ロールバック手順

### クイックロールバック

```bash
# 前のバージョンへのロールバック
cdk deploy --rollback

# または破棄して再デプロイ
cdk destroy --context env=dev
cdk deploy --context env=dev
```

### 手動ロールバック

1. **フロントエンドのロールバック**
   ```bash
   # 前のビルドを復元
   aws s3 sync s3://bucket-name-backup/ s3://bucket-name/ --delete
   ```

2. **Lambda のロールバック**
   ```bash
   # 関数コードを前のバージョンに更新
   aws lambda update-function-code --function-name function-name --s3-bucket bucket --s3-key previous-version.zip
   ```

## デプロイメントの監視

### CloudFormation イベント

デプロイメントの進行状況を監視：

```bash
# スタックイベントを監視
watch -n 2 "aws cloudformation describe-stack-events --stack-name web3cms-stack-dev | head -20"
```

### デプロイメントログ

CDK デプロイメントログを確認：
```bash
# CDK はデプロイメント中に詳細なログを出力します
cdk deploy --verbose
```

## トラブルシューティング

### 一般的な問題

1. **CDK ブートストラップが必要**
   ```
   エラー: This stack uses assets, so the toolkit stack must be deployed
   解決策: 'cdk bootstrap' を実行
   ```

2. **不十分な IAM 権限**
   ```
   エラー: User is not authorized to perform: cloudformation:CreateStack
   解決策: AWS 認証情報に AdministratorAccess または必要なポリシーがあることを確認
   ```

3. **DynamoDB テーブルが存在する**
   ```
   エラー: Table already exists
   解決策: 既存のスタックを破棄するか、異なる環境名を使用
   ```

4. **S3 バケット名の競合**
   ```
   エラー: Bucket name already exists
   解決策: S3 バケット名はグローバル；cdk.json の projectName を変更
   ```

### デバッグコマンド

```bash
# Lambda ログの確認
aws logs tail /aws/lambda/web3cms-crud-dev --follow

# API Gateway ログの確認
aws logs tail API-Gateway-Execution-Logs_${REST_API_ID}/prod --follow

# Lambda 関数のテスト
aws lambda invoke --function-name web3cms-crud-dev --payload '{"httpMethod":"GET","path":"/items"}' response.json
```

## 本番デプロイメントチェックリスト

- [ ] ステージング環境でテストを実行
- [ ] 現在の本番データをバックアップ
- [ ] 環境変数をレビューして更新
- [ ] CloudWatch アラームを有効化
- [ ] 必要に応じて自動スケーリングを設定
- [ ] ロールバック手順をテスト
- [ ] カスタムドメインを使用する場合は DNS レコードを更新
- [ ] デプロイメントの進行状況を監視
- [ ] デプロイ後にすべてのエンドポイントを確認
- [ ] CloudFront ディストリビューションを確認

## コスト最適化

### 開発環境
- DynamoDB オンデマンド価格を使用
- Lambda メモリを必要最小限に設定
- S3 ライフサイクルポリシーを設定

### 本番環境
- 予測可能なワークロードには DynamoDB プロビジョンド容量を検討
- S3 Intelligent-Tiering を有効化
- CloudFront キャッシングを効果的に使用
- 予算アラートを設定

## セキュリティの考慮事項

### デプロイ前
1. 最小権限の IAM ポリシーをレビュー
2. AWS CloudTrail を有効化
3. AWS Config を設定
4. AWS GuardDuty を設定

### デプロイ後
1. S3 バケットのバージョニングを有効化
2. CloudWatch アラームを設定
3. エラー用の SNS 通知を設定
4. API Gateway のスロットリング制限をレビュー

## メンテナンス

### 定期的なタスク
- CloudWatch ログとメトリクスを監視
- アクセスキーをレビューしてローテーション
- 依存関係を定期的に更新
- DynamoDB テーブルをバックアップ
- コスト最適化レポートをレビュー

### 更新手順
1. 開発環境で更新をテスト
2. ステージングにデプロイして確認
3. 本番デプロイメントをスケジュール
4. デプロイ後のメトリクスを監視

## サポート

デプロイメントの問題については：
1. CloudFormation イベントでエラーを確認
2. CloudWatch ログをレビュー
3. AWS CDK ドキュメントを参照
4. GitHub issues で類似の問題を確認