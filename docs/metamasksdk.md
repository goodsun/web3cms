了解です。以下に、**Vite + Vanilla JS + MetaMask SDK + ethers.js** で構成される「モバイルNFT表示・送信アプリ」のサンプルコードを、**Markdown形式でサンプル集**としてまとめました。

---

# 📦 モバイルNFT DApp サンプル集（Vite + MetaMask SDK）

このドキュメントは、MetaMask SDK を使ってモバイルで NFT を表示・送信するための最小構成サンプル集です。

---

## ✅ 前提環境

* Vite（Vanilla JS テンプレート）
* ethers.js
* @metamask/sdk
* MetaMask モバイルアプリ（インストール済）

```bash
npm create vite@latest nft-app --template vanilla
cd nft-app
npm install
npm install @metamask/sdk ethers
```

---

## 🔗 1. MetaMask 接続

```js
// main.js
import MetaMaskSDK from '@metamask/sdk';
import { ethers } from 'ethers';

const sdk = new MetaMaskSDK({
  dappMetadata: {
    name: "NFT Mobile Viewer",
    url: window.location.href,
  },
});

const ethereum = sdk.getProvider();

document.getElementById('connectBtn').addEventListener('click', async () => {
  const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
  document.getElementById('address').innerText = `Connected: ${accounts[0]}`;
});
```

```html
<!-- index.html -->
<button id="connectBtn">Connect MetaMask</button>
<p id="address">Not connected</p>
```

---

## 🔍 2. 自分のNFT一覧を取得（ERC-721）

### 方法1：OpenSea API（推奨・高速）

```js
async function fetchNFTs(ownerAddress) {
  const res = await fetch(`https://api.opensea.io/api/v2/chain/ethereum/account/${ownerAddress}/nfts`);
  const data = await res.json();
  return data.nfts; // [{metadata, contract, token_id, ...}]
}
```

### 方法2：オンチェーンで取得（例: ERC721）

```js
const ERC721_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function tokenOfOwnerByIndex(address, index) view returns (uint256)",
  "function tokenURI(uint256) view returns (string)",
];

async function getNFTsOnChain(ownerAddress, nftAddress, provider) {
  const contract = new ethers.Contract(nftAddress, ERC721_ABI, provider);
  const balance = await contract.balanceOf(ownerAddress);
  const tokens = [];

  for (let i = 0; i < balance; i++) {
    const tokenId = await contract.tokenOfOwnerByIndex(ownerAddress, i);
    const tokenURI = await contract.tokenURI(tokenId);
    tokens.push({ tokenId, tokenURI });
  }

  return tokens;
}
```

---

## 📤 3. NFT送信（ERC-721）

```js
const ERC721_ABI = [
  "function safeTransferFrom(address from, address to, uint256 tokenId)"
];

async function sendNFT(nftAddress, from, to, tokenId, signer) {
  const nftContract = new ethers.Contract(nftAddress, ERC721_ABI, signer);
  const tx = await nftContract.safeTransferFrom(from, to, tokenId);
  await tx.wait();
  console.log("✅ Transfer complete:", tx.hash);
}
```

---

## 🧠 4. セッションの保持（自動再接続）

```js
// 保存しておく
localStorage.setItem('connected', 'true');

// アプリ起動時に確認
if (localStorage.getItem('connected')) {
  ethereum.request({ method: 'eth_requestAccounts' })
    .then(accounts => {
      document.getElementById('address').innerText = `Reconnected: ${accounts[0]}`;
    });
}
```

---

## 🎨 5. NFTの表示（画像）

```js
function renderNFTs(nfts) {
  const container = document.getElementById('nftContainer');
  container.innerHTML = '';

  nfts.forEach(nft => {
    const img = document.createElement('img');
    img.src = nft.metadata?.image || 'fallback.png';
    img.alt = nft.name || 'NFT';
    img.style.width = '120px';
    img.style.margin = '8px';
    container.appendChild(img);
  });
}
```

---

## 📁 6. 全体構成例

```
nft-app/
├── index.html
├── main.js
├── style.css
├── vite.config.js
```

---

## 📚 補足

* **OpenSea API（v2）** を使うには APIキー不要でOK（rate limit に注意）
* **Alchemy / Moralis** を使えばマルチチェーン対応も可能
* 送信には **ユーザーの署名が必要**なので、MetaMask が自動で表示されます

---

## ✅ 推奨ライブラリ（軽量）

| ライブラリ           | 用途         | サイズ感      |
| --------------- | ---------- | --------- |
| `@metamask/sdk` | ウォレット接続    | 小〜中       |
| `ethers`        | ブロックチェーン操作 | 約100KB圧縮後 |
| `vite`          | 開発用ビルドツール  | 超高速       |

