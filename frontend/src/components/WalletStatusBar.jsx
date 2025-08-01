import React, { useState, useEffect } from "react";
import { useWeb3 } from "../contexts/Web3Context";
import { useSettings } from "../contexts/SettingsContext";
import "./WalletStatusBar.css";

const WalletStatusBar = ({ isMobileMenuOpen = false }) => {
  const { account, chainId, provider, currentUser } = useWeb3();
  const { settings } = useSettings();
  const [copied, setCopied] = useState(false);
  const [balance, setBalance] = useState("0");
  const [mobileNavHeight, setMobileNavHeight] = useState(0);

  // 設定で指定されたチェーンIDを取得（数値に変換）
  const expectedChainId = settings?.chainId ? Number(settings.chainId) : 1; // デフォルトはMainnet

  // デバッグ情報
  useEffect(() => {
    console.log("WalletStatusBar Debug:", {
      chainId,
      chainIdType: typeof chainId,
      expectedChainId,
      expectedChainIdType: typeof expectedChainId,
      settings,
      settingsChainId: settings?.chainId,
      settingsChainIdType: typeof settings?.chainId,
      isCorrectChain: chainId && Number(chainId) === expectedChainId,
    });
  }, [chainId, expectedChainId, settings]);

  // チェーンIDが一致しているかチェック（両方を数値で比較）
  const isCorrectChain = chainId && Number(chainId) === expectedChainId;

  // バランスを取得（初回のみ、以降は手動更新またはイベントベース）
  useEffect(() => {
    const fetchBalance = async () => {
      if (provider && account) {
        try {
          // RPC呼び出しのみを使用（MetaMaskポップアップを避ける）
          const balanceWei = await provider.getBalance(account);
          // ethers v6の方法でバランスを変換
          const balanceEth = parseFloat(balanceWei) / 1e18;
          setBalance(balanceEth.toString());
        } catch (error) {
          console.error("Failed to fetch balance:", error);
          setBalance("0");
        }
      }
    };

    // 初回のみ取得
    fetchBalance();
    
    // ブロックの更新を監視してバランスを更新（MetaMaskを開かない）
    if (provider) {
      const handleBlock = async () => {
        // アカウントが変更された時のみ更新
        if (account) {
          try {
            const balanceWei = await provider.getBalance(account);
            const balanceEth = parseFloat(balanceWei) / 1e18;
            setBalance(balanceEth.toString());
          } catch (error) {
            // エラーは静かに処理（ユーザーを妨げない）
            console.error("Balance update error:", error);
          }
        }
      };
      
      // ブロック更新の監視（トランザクションがあった時のみ更新される）
      provider.on("block", handleBlock);
      
      return () => {
        provider.off("block", handleBlock);
      };
    }
  }, [provider, account]);

  // Calculate mobile nav height when menu opens
  useEffect(() => {
    if (isMobileMenuOpen) {
      const mobileNav = document.querySelector(".mobile-nav.active");
      if (mobileNav) {
        setMobileNavHeight(mobileNav.offsetHeight);
      }
    } else {
      setMobileNavHeight(0);
    }
  }, [isMobileMenuOpen]);

  // アドレスを短縮表示する関数
  const shortenAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // クリップボードにコピーする関数
  const copyToClipboard = async () => {
    if (!account) return;

    try {
      await navigator.clipboard.writeText(account);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy address:", err);
      // フォールバック：古いブラウザ向け
      const textArea = document.createElement("textarea");
      textArea.value = account;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err2) {
        console.error("Fallback copy failed:", err2);
      }
      document.body.removeChild(textArea);
    }
  };

  // チェーン名を取得する関数
  const getChainName = (id) => {
    const chains = {
      1: "Ethereum Mainnet",
      5: "Goerli",
      11155111: "Sepolia",
      137: "Polygon",
      80001: "Mumbai",
      56: "BSC Mainnet",
      97: "BSC Testnet",
      43114: "Avalanche",
      43113: "Avalanche Fuji",
      42161: "Arbitrum One",
      421613: "Arbitrum Goerli",
      10: "Optimism",
      420: "Optimism Goerli",
      250: "Fantom",
      4002: "Fantom Testnet",
      1313161554: "Aurora",
      1313161555: "Aurora Testnet",
      8453: "Base",
    };
    return chains[id] || `Chain ${id}`;
  };

  // 通貨単位を取得する関数
  const getCurrencySymbol = (id) => {
    const symbols = {
      1: "ETH",
      5: "ETH",
      11155111: "ETH",
      137: "POL",
      80001: "POL",
      56: "BNB",
      97: "BNB",
      43114: "AVAX",
      43113: "AVAX",
      42161: "ETH",
      421613: "ETH",
      10: "ETH",
      420: "ETH",
      250: "FTM",
      4002: "FTM",
      1313161554: "ETH",
      1313161555: "ETH",
      8453: "ETH",
    };
    return symbols[id] || "ETH";
  };

  // バランスをフォーマットする関数
  const formatBalance = (balance) => {
    if (!balance) return "0.0000";
    // 小数点以下4桁まで表示
    const formatted = parseFloat(balance).toFixed(4);
    // 末尾の不要な0を削除
    return formatted.replace(/\.?0+$/, "") || "0";
  };

  if (!account) {
    return null;
  }

  return (
    <div
      className={`wallet-status-bar ${
        isMobileMenuOpen ? "mobile-menu-open" : ""
      }`}
      style={
        isMobileMenuOpen && mobileNavHeight > 0
          ? { top: `${60 + mobileNavHeight}px` }
          : {}
      }
    >
      <div className="wallet-status-content">
        <div
          className={`chain-info ${!isCorrectChain ? "chain-mismatch" : ""}`}
        >
          <span className="chain-id">
            {chainId ? getChainName(chainId) : "Loading..."}
          </span>
          {!isCorrectChain && chainId && (
            <span className="chain-warning">
              ⚠️ Expected: {getChainName(expectedChainId)}
            </span>
          )}
        </div>

        <div className="wallet-status-info">
          {currentUser?.avatar && (
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name || 'User avatar'}
              className="wallet-status-avatar"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          )}
          <span className="wallet-status-address">
            {shortenAddress(account)}
          </span>

          <button
            className="copy-button"
            onClick={copyToClipboard}
            title={copied ? "Copied!" : "Copy address"}
          >
            {copied ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M13.5 4.5L6 12L2.5 8.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect
                  x="5"
                  y="5"
                  width="9"
                  height="9"
                  rx="1"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M2 2H10V3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M2 2V10H3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>

          <span className="wallet-status-balance">
            {chainId
              ? `${formatBalance(balance)} ${getCurrencySymbol(chainId)}`
              : "Loading..."}
          </span>
        </div>
      </div>
    </div>
  );
};

export default WalletStatusBar;
