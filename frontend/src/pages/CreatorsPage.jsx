import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import { useSettings } from '../contexts/SettingsContext';
import { getNFTContract } from '../utils/contractHelpers';
import { getRpcProvider } from '../utils/rpcUtils';
import { ethers } from 'ethers';
import './CreatorsPage.css';

const CreatorsPage = () => {
  const { provider } = useWeb3();
  const { settings, loading: settingsLoading } = useSettings();
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contractInfo, setContractInfo] = useState(null);

  const web3Config = settings?.web3 || {};

  useEffect(() => {
    const fetchCreators = async () => {
      if (!web3Config.nftContract || !web3Config.rpcUrls) {
        setLoading(false);
        if (!web3Config.nftContract) {
          setError('NFT contract not configured');
        } else if (!web3Config.rpcUrls) {
          setError('RPC URLs not configured');
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Always use RPC provider for read-only operations
        const activeProvider = getRpcProvider(web3Config.rpcUrls, web3Config.defaultChainId, ethers);
        
        if (!activeProvider) {
          setError('No provider available. Please check RPC configuration.');
          setLoading(false);
          return;
        }

        const nftContract = getNFTContract(web3Config.nftContract, activeProvider);

        // Get contract info
        try {
          const [name, symbol] = await Promise.all([
            nftContract.name(),
            nftContract.symbol()
          ]);
          setContractInfo({ name, symbol });
        } catch (err) {
          console.warn('Could not fetch contract info:', err);
        }

        // Get all creators
        try {
          const creatorsList = await nftContract.getCreators();
          setCreators(creatorsList);
        } catch (err) {
          console.error('Failed to fetch creators:', err);
          throw new Error('Contract does not support getCreators() method');
        }

      } catch (err) {
        console.error('Failed to fetch creators:', err);
        setError(err.message || 'Failed to fetch creators');
      } finally {
        setLoading(false);
      }
    };

    // Small delay to ensure settings are properly loaded
    const timeoutId = setTimeout(() => {
      fetchCreators();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [web3Config.nftContract, web3Config.rpcUrls, web3Config.defaultChainId]);

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Show loading while settings are being loaded
  if (settingsLoading) {
    return (
      <div className="creators-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="creators-page">
      <div className="page-header">
        <h1>NFT Creators</h1>
        {contractInfo && (
          <div className="contract-info">
            <small>
              Contract: {contractInfo.name} ({contractInfo.symbol})
            </small>
          </div>
        )}
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading creators...</p>
        </div>
      )}

      {error && !loading && (
        <div className="error-state">
          <p className="error-message">{error}</p>
        </div>
      )}

      {!loading && !error && creators.length > 0 && (
        <div className="creators-grid">
          {creators.map((creator, index) => (
            <Link 
              key={creator} 
              to={`/nfts/creator/${creator}`}
              className="creator-card"
            >
              <div className="creator-avatar">
                {/* Simple identicon-like avatar */}
                <div className="avatar-placeholder">
                  {index + 1}
                </div>
              </div>
              <div className="creator-info">
                <div className="creator-address">
                  {formatAddress(creator)}
                </div>
                <div className="creator-label">
                  Creator #{index + 1}
                </div>
              </div>
              <div className="creator-arrow">
                →
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && !error && creators.length === 0 && (
        <div className="empty-state">
          <p>No creators found</p>
        </div>
      )}

      <div className="stats">
        Total: {creators.length} creator{creators.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

export default CreatorsPage;