import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import MetaMaskSDK from "@metamask/sdk";
import { ethers } from "ethers";
import { userService } from "../services/api";

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
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);

  // Initialize MetaMask SDK
  useEffect(() => {
    const initSDK = async () => {
      try {
        // Detect if mobile device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );
        
        if (window.addDebugLog) {
          window.addDebugLog('info', 'Initializing MetaMask SDK', { isMobile, userAgent: navigator.userAgent });
        }

        const MMSDK = new MetaMaskSDK({
          dappMetadata: {
            name: "Web3CMS NFT Viewer",
            url: window.location.origin,
          },
          // Don't prefer desktop on mobile devices
          preferDesktop: !isMobile,
          storage: {
            enabled: true,
          },
          // Force disconnect any existing connections on mobile
          forceDeleteProvider: isMobile,
          // Use in-app browser detection
          checkInstallationImmediately: false,
          // Handle deep links properly on mobile
          openDeeplink: (link) => {
            if (isMobile) {
              window.location.href = link;
            } else {
              window.open(link, '_blank');
            }
          },
          // Ensure connection persistence on mobile
          communicationLayerPreference: 'socket',
        });

        await MMSDK.init();
        const ethereum = MMSDK.getProvider();

        setSdk(MMSDK);
        setEthereum(ethereum);
        setIsInitialized(true);
        
        if (window.addDebugLog) {
          window.addDebugLog('success', 'MetaMask SDK initialized', { hasEthereum: !!ethereum });
        }

        // Clear stale connections on mobile
        if (isMobile) {
          localStorage.removeItem("web3_connected");
          localStorage.removeItem("walletAddress");
        }

        // Check for existing connection (desktop only)
        const storedConnection = localStorage.getItem("web3_connected");
        if (storedConnection === "true" && ethereum && !isMobile) {
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
            console.log("Chain changed to:", chainId);
        if (window.addDebugLog) {
          window.addDebugLog('info', 'Chain changed', { chainId, chainIdInt: parseInt(chainId, 16) });
        }
            setChainId(parseInt(chainId, 16));
            // Don't reload on mobile to preserve connection state
            if (!isMobile) {
              window.location.reload();
            }
          });
        }
      } catch (err) {
        console.error("Failed to initialize MetaMask SDK:", err);
        if (window.addDebugLog) {
          window.addDebugLog('error', 'Failed to initialize MetaMask SDK', { error: err.message });
        }
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

  const handleAccountsChanged = useCallback(async (accounts, eth = ethereum) => {
    if (accounts.length === 0) {
      // Disconnected
      setAccount(null);
      setProvider(null);
      setSigner(null);
      setChainId(null);
      setCurrentUser(null);
      localStorage.removeItem("web3_connected");
      localStorage.removeItem("walletAddress");
    } else {
      // Connected
      const account = accounts[0].toLowerCase(); // Normalize to lowercase
      setAccount(account);
      
      if (window.addDebugLog) {
        window.addDebugLog('success', 'Account connected', { account });
      }

      const provider = new ethers.BrowserProvider(eth);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();

      setProvider(provider);
      setSigner(signer);
      setChainId(Number(network.chainId));

      localStorage.setItem("web3_connected", "true");
      localStorage.setItem("walletAddress", account);

      // Register or fetch user
      setIsLoadingUser(true);
      try {
        let user = await userService.getCurrentUser(account);
        if (!user) {
          // Register new user as member
          user = await userService.registerUser(account);
        }
        setCurrentUser(user);
      } catch (err) {
        console.error("Failed to register/fetch user:", err);
      } finally {
        setIsLoadingUser(false);
      }
    }
  }, [ethereum]);

  const connect = useCallback(async () => {
    if (!ethereum) {
      setError("MetaMask not initialized");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Clear any existing connection first on mobile
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      
      if (isMobile) {
        // Don't terminate SDK during connection, just clear storage
        // Clear local storage to ensure fresh connection
        localStorage.removeItem("web3_connected");
        localStorage.removeItem("walletAddress");
      }

      console.log("Requesting accounts from MetaMask...");
      if (window.addDebugLog) {
        window.addDebugLog('info', 'Requesting MetaMask accounts...', { isMobile });
      }
      
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      
      console.log("Received accounts:", accounts);
      if (window.addDebugLog) {
        window.addDebugLog('success', `Received ${accounts.length} accounts`, { accounts });
      }

      if (accounts.length > 0) {
        await handleAccountsChanged(accounts, ethereum);
      } else if (isMobile) {
        // On mobile, if accounts are empty after authorization, show error
        // Do not poll to avoid MetaMask popups
        console.error("No accounts returned after authorization on mobile");
        if (window.addDebugLog) {
          window.addDebugLog('error', 'No accounts returned after mobile authorization');
        }
        setError("Unable to connect wallet. Please try again.");
      }
    } catch (err) {
      console.error("Connection failed:", err);
      const errorDetails = {
        message: err.message,
        code: err.code,
        stack: err.stack
      };
      console.error("Error details:", errorDetails);
      if (window.addDebugLog) {
        window.addDebugLog('error', 'Connection failed', errorDetails);
      }
      
      // More specific error messages
      if (err.code === 4001) {
        setError("User rejected the connection request");
      } else if (err.code === -32002) {
        setError("Connection request pending. Please check MetaMask");
      } else {
        setError(`Failed to connect wallet: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setIsConnecting(false);
    }
  }, [ethereum, sdk]);

  const disconnect = useCallback(async () => {
    // Terminate SDK connection on mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    
    if (isMobile && sdk && sdk.terminate) {
      try {
        await sdk.terminate();
      } catch (err) {
        console.error("Error terminating SDK:", err);
      }
    }
    
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setCurrentUser(null);
    localStorage.removeItem("web3_connected");
    localStorage.removeItem("walletAddress");
  }, [sdk]);

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

  const refreshUser = useCallback(async () => {
    if (!account) return;
    
    setIsLoadingUser(true);
    try {
      const user = await userService.getCurrentUser(account);
      setCurrentUser(user);
    } catch (err) {
      console.error("Failed to refresh user:", err);
    } finally {
      setIsLoadingUser(false);
    }
  }, [account]);

  // Remove focus event listener - it causes MetaMask to pop up repeatedly
  // Focus handling is not necessary for maintaining connection

  const value = {
    account,
    provider,
    signer,
    chainId,
    isConnecting,
    error,
    isConnected: !!account,
    isInitialized,
    currentUser,
    isLoadingUser,
    isMember: !!currentUser,
    isAdmin: currentUser?.admin === true,
    connect,
    disconnect,
    switchNetwork,
    refreshUser,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};
