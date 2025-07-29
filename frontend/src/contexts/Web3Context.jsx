import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import MetaMaskSDK from "@metamask/sdk";
import { ethers } from "ethers";

const Web3Context = createContext();

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
};

export const Web3Provider = ({ children }) => {
  const [sdk, setSdk] = useState(null);
  const [ethereum, setEthereum] = useState(null);
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  // Initialize MetaMask SDK
  useEffect(() => {
    const initSDK = async () => {
      try {
        const MMSDK = new MetaMaskSDK({
          dappMetadata: {
            name: "Web3CMS NFT Viewer",
            url: window.location.origin,
          },
          preferDesktop: true,
          storage: {
            enabled: true,
          },
        });

        await MMSDK.init();
        const ethereum = MMSDK.getProvider();

        setSdk(MMSDK);
        setEthereum(ethereum);

        // Check for existing connection
        const storedConnection = localStorage.getItem("web3_connected");
        if (storedConnection === "true" && ethereum) {
          const accounts = await ethereum.request({ method: "eth_accounts" });
          if (accounts.length > 0) {
            await handleAccountsChanged(accounts, ethereum);
          }
        }

        // Setup event listeners
        if (ethereum) {
          ethereum.on("accountsChanged", (accounts) =>
            handleAccountsChanged(accounts, ethereum)
          );
          ethereum.on("chainChanged", (chainId) => {
            setChainId(parseInt(chainId, 16));
            window.location.reload();
          });
        }
      } catch (err) {
        console.error("Failed to initialize MetaMask SDK:", err);
        setError("Failed to initialize wallet connection");
      }
    };

    initSDK();

    return () => {
      if (ethereum) {
        ethereum.removeAllListeners();
      }
    };
  }, []);

  const handleAccountsChanged = async (accounts, eth = ethereum) => {
    if (accounts.length === 0) {
      // Disconnected
      setAccount(null);
      setProvider(null);
      setSigner(null);
      setChainId(null);
      localStorage.removeItem("web3_connected");
    } else {
      // Connected
      const account = accounts[0];
      setAccount(account);

      const provider = new ethers.BrowserProvider(eth);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();

      setProvider(provider);
      setSigner(signer);
      setChainId(Number(network.chainId));

      localStorage.setItem("web3_connected", "true");
    }
  };

  const connect = useCallback(async () => {
    if (!ethereum) {
      setError("MetaMask not initialized");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length > 0) {
        await handleAccountsChanged(accounts);
      }
    } catch (err) {
      console.error("Connection failed:", err);
      setError("Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  }, [ethereum]);

  const disconnect = useCallback(() => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    localStorage.removeItem("web3_connected");
  }, []);

  const switchNetwork = useCallback(
    async (chainId) => {
      if (!ethereum) return;

      try {
        await ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${chainId.toString(16)}` }],
        });
      } catch (err) {
        console.error("Failed to switch network:", err);
        setError("Failed to switch network");
      }
    },
    [ethereum]
  );

  const value = {
    account,
    provider,
    signer,
    chainId,
    isConnecting,
    error,
    isConnected: !!account,
    connect,
    disconnect,
    switchNetwork,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};
