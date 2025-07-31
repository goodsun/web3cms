import { useState, useCallback } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { useSettings } from '../contexts/SettingsContext';

export const useChainGuard = () => {
  const { chainId, provider } = useWeb3();
  const { settings } = useSettings();
  const [showChainModal, setShowChainModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // Get expected chain ID from settings
  const expectedChainId = settings?.chainId ? Number(settings.chainId) : 1;

  // Check if current chain matches expected chain
  const isCorrectChain = chainId && Number(chainId) === expectedChainId;

  // Switch to the correct chain
  const switchChain = async () => {
    if (!window.ethereum) {
      alert('MetaMask is not installed!');
      return false;
    }

    try {
      const chainIdHex = `0x${expectedChainId.toString(16)}`;
      
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
      
      return true;
    } catch (error) {
      // This error code indicates that the chain has not been added to MetaMask
      if (error.code === 4902) {
        try {
          // Try to add the chain
          const chainParams = getChainParams(expectedChainId);
          if (chainParams) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [chainParams],
            });
            return true;
          } else {
            alert(`Chain ${expectedChainId} is not configured. Please add it manually to MetaMask.`);
            return false;
          }
        } catch (addError) {
          console.error('Failed to add chain:', addError);
          alert('Failed to add the network. Please add it manually to MetaMask.');
          return false;
        }
      } else {
        console.error('Failed to switch chain:', error);
        alert('Failed to switch network. Please switch manually in MetaMask.');
        return false;
      }
    }
  };

  // Execute action with chain guard
  const executeWithChainGuard = useCallback(async (action) => {
    if (!isCorrectChain) {
      setPendingAction(() => action);
      setShowChainModal(true);
      return false;
    }
    
    // Execute the action immediately if on correct chain
    return await action();
  }, [isCorrectChain]);

  // Handle switching chain and executing pending action
  const handleSwitchChain = async () => {
    const success = await switchChain();
    if (success && pendingAction) {
      // Wait a bit for the chain switch to complete
      setTimeout(async () => {
        await pendingAction();
        setPendingAction(null);
      }, 1000);
    }
    setShowChainModal(false);
  };

  // Close modal without switching
  const handleCloseModal = () => {
    setShowChainModal(false);
    setPendingAction(null);
  };

  return {
    isCorrectChain,
    currentChainId: chainId,
    expectedChainId,
    showChainModal,
    executeWithChainGuard,
    handleSwitchChain,
    handleCloseModal,
  };
};

// Helper function to get chain parameters for adding to MetaMask
const getChainParams = (chainId) => {
  const chainConfigs = {
    137: {
      chainId: '0x89',
      chainName: 'Polygon Mainnet',
      nativeCurrency: {
        name: 'POL',
        symbol: 'POL',
        decimals: 18,
      },
      rpcUrls: ['https://polygon-rpc.com/'],
      blockExplorerUrls: ['https://polygonscan.com/'],
    },
    80001: {
      chainId: '0x13881',
      chainName: 'Mumbai Testnet',
      nativeCurrency: {
        name: 'POL',
        symbol: 'POL',
        decimals: 18,
      },
      rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
      blockExplorerUrls: ['https://mumbai.polygonscan.com/'],
    },
    56: {
      chainId: '0x38',
      chainName: 'BNB Smart Chain',
      nativeCurrency: {
        name: 'BNB',
        symbol: 'BNB',
        decimals: 18,
      },
      rpcUrls: ['https://bsc-dataseed.binance.org/'],
      blockExplorerUrls: ['https://bscscan.com/'],
    },
    8453: {
      chainId: '0x2105',
      chainName: 'Base',
      nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18,
      },
      rpcUrls: ['https://mainnet.base.org/'],
      blockExplorerUrls: ['https://basescan.org/'],
    },
    // Add more chains as needed
  };

  return chainConfigs[chainId] || null;
};