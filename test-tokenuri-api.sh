#!/bin/bash

# tokenURI API単体テストスクリプト
API_URL="https://te84a7g526.execute-api.ap-northeast-1.amazonaws.com/dev"

# Polygon mainnetの実際の設定
CONTRACT_ADDRESS="0xAc6991f0CbAf163f2442C2c1c17b827006FFD4f6"  # 正しいNFTコントラクト
TOKEN_ID="1"

echo "=== tokenURI API 単体テスト ==="
echo "コントラクト: ${CONTRACT_ADDRESS}"
echo "Token ID: ${TOKEN_ID}"
echo ""

echo "1. tokenURI取得テスト"
echo "GET ${API_URL}/nfts/${CONTRACT_ADDRESS}/${TOKEN_ID}/tokenURI"
echo ""

# APIを呼び出し
RESPONSE=$(curl -s -X GET "${API_URL}/nfts/${CONTRACT_ADDRESS}/${TOKEN_ID}/tokenURI")

# レスポンスを表示
echo "レスポンス:"
echo "$RESPONSE" | jq .

# tokenURIが取得できたかチェック
if echo "$RESPONSE" | jq -e '.tokenURI' > /dev/null 2>&1; then
    echo ""
    echo "✅ tokenURI取得成功！"
    TOKEN_URI=$(echo "$RESPONSE" | jq -r '.tokenURI')
    echo "tokenURI: $TOKEN_URI"
else
    echo ""
    echo "❌ tokenURI取得失敗"
fi

echo ""
echo "=== テスト完了 ==="