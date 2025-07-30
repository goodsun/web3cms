import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import { useSettings } from '../contexts/SettingsContext';
import { getNFTContract } from '../utils/contractHelpers';
import { getRpcProvider } from '../utils/rpcUtils';
import { ethers } from 'ethers';
import './NFTsPage.css';

const NFTsPage = () => {
  const { account, isConnected, chainId, provider } = useWeb3();
  const { settings, loading: settingsLoading } = useSettings();
  const [nftInfo, setNftInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const web3Config = settings?.web3 || {};

  // Fetch NFT contract info when provider and contract address are available
  useEffect(() => {
    const fetchNFTInfo = async () => {
      if (!web3Config.nftContract) return;
      
      // Always use RPC provider for read-only operations
      let activeProvider = null;
      if (web3Config.rpcUrls) {
        activeProvider = getRpcProvider(web3Config.rpcUrls, web3Config.defaultChainId, ethers);
      }
      
      if (!activeProvider) return;
      
      setLoading(true);
      try {
        const nftContract = getNFTContract(web3Config.nftContract, activeProvider);
        
        // Try to get name, symbol, and totalSupply
        const promises = [];
        const fields = {};
        
        // Name
        promises.push(
          nftContract.name()
            .then(name => { fields.name = name; })
            .catch(() => { fields.name = 'N/A'; })
        );
        
        // Symbol
        promises.push(
          nftContract.symbol()
            .then(symbol => { fields.symbol = symbol; })
            .catch(() => { fields.symbol = 'N/A'; })
        );
        
        // Total Supply (if available)
        promises.push(
          nftContract.totalSupply()
            .then(supply => { fields.totalSupply = supply.toString(); })
            .catch(() => { fields.totalSupply = 'N/A'; })
        );
        
        await Promise.all(promises);
        setNftInfo(fields);
      } catch (error) {
        console.error('Failed to fetch NFT info:', error);
        setNftInfo({ error: error.message });
      } finally {
        setLoading(false);
      }
    };

    fetchNFTInfo();
  }, [provider, web3Config.nftContract, web3Config.rpcUrls, web3Config.defaultChainId]);

  // Render loading state after all hooks
  if (settingsLoading) {
    return (
      <div className="nfts-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="nfts-page">
      <div className="page-header">
        <h1>
          {nftInfo && nftInfo.name ? nftInfo.name : 'NFTs'}
        </h1>
      </div>

      {/* Quick Links */}
      <section className="config-section">
        <h2>Quick Links</h2>
        <div className="quick-links">
          {isConnected && account && (
            <>
              <Link to="/nfts/mint" className="quick-link">
                <span className="link-icon">✨</span>
                <span className="link-text">Mint NFT</span>
                <span className="link-desc">Create a new NFT</span>
              </Link>
              <Link to={`/nfts/owner/${account}`} className="quick-link">
                <span className="link-icon">👤</span>
                <span className="link-text">View My NFTs</span>
                <span className="link-desc">NFTs owned by your wallet</span>
              </Link>
              <Link to={`/nfts/creator/${account}`} className="quick-link">
                <span className="link-icon">🎨</span>
                <span className="link-text">View My Created NFTs</span>
                <span className="link-desc">NFTs created by your wallet</span>
              </Link>
            </>
          )}
          <Link to="/nfts/creator" className="quick-link">
            <span className="link-icon">👥</span>
            <span className="link-text">View All Creators</span>
            <span className="link-desc">Browse all NFT creators</span>
          </Link>
        </div>
      </section>

      {/* Web3 Settings */}
      <section className="config-section">
        <h2>Web3 Settings</h2>
        <div className="config-grid">
          <div className="config-item">
            <label>Default Chain ID</label>
            <div className="config-value monospace">
              {web3Config.defaultChainId || 'Not set'}
            </div>
          </div>
          
          <div className="config-item full-width">
            <label>RPC URLs</label>
            <div className="config-value monospace">
              {web3Config.rpcUrls ? (
                <div className="rpc-urls">
                  {web3Config.rpcUrls.split(',').map((url, index) => (
                    <div key={index} className="rpc-url">
                      {url.trim()}
                    </div>
                  ))}
                </div>
              ) : (
                'Not configured'
              )}
            </div>
          </div>

          <div className="config-item">
            <label>NFT Contract</label>
            <div className="config-value monospace">
              {web3Config.nftContract || 'Not set'}
            </div>
            {nftInfo && !nftInfo.error && web3Config.nftContract && (
              <div className="nft-contract-info">
                <small>
                  {loading ? (
                    'Loading...'
                  ) : (
                    <>
                      Name: <strong>{nftInfo.name}</strong> | 
                      Symbol: <strong>{nftInfo.symbol}</strong>
                      {nftInfo.totalSupply !== 'N/A' && (
                        <> | Total Supply: <strong>{nftInfo.totalSupply}</strong></>
                      )}
                    </>
                  )}
                </small>
              </div>
            )}
          </div>

          <div className="config-item">
            <label>TBA Registry</label>
            <div className="config-value monospace">
              {web3Config.tbaRegistry || 'Not set'}
            </div>
          </div>

          <div className="config-item">
            <label>TBA Implementation</label>
            <div className="config-value monospace">
              {web3Config.tbaImplementation || 'Not set'}
            </div>
          </div>

          <div className="config-item">
            <label>TBA Salt</label>
            <div className="config-value monospace">
              {web3Config.tbaSalt || '0'}
            </div>
          </div>
        </div>
      </section>

      {/* Connection Status */}
      <section className="config-section">
        <h2>Connection Status</h2>
        <div className="config-grid">
          <div className="config-item">
            <label>Wallet Connected</label>
            <div className="config-value">
              {isConnected ? 'Yes' : 'No'}
            </div>
          </div>
          {isConnected && (
            <>
              <div className="config-item">
                <label>Account</label>
                <div className="config-value monospace">
                  {account}
                </div>
              </div>
              <div className="config-item">
                <label>Current Chain ID</label>
                <div className="config-value monospace">
                  {chainId}
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Configuration Status */}
      <section className="config-section">
        <h2>Configuration Status</h2>
        <div className="status-grid">
          <div className="status-item">
            <span className={`status-indicator ${isConnected ? 'status-ok' : 'status-warning'}`}>●</span>
            <span>Wallet Connection</span>
          </div>
          <div className="status-item">
            <span className={`status-indicator ${web3Config.rpcUrls ? 'status-ok' : 'status-error'}`}>●</span>
            <span>RPC Configuration</span>
          </div>
          <div className="status-item">
            <span className={`status-indicator ${web3Config.nftContract ? 'status-ok' : 'status-warning'}`}>●</span>
            <span>NFT Contract</span>
          </div>
          <div className="status-item">
            <span className={`status-indicator ${web3Config.tbaRegistry && web3Config.tbaImplementation ? 'status-ok' : 'status-warning'}`}>●</span>
            <span>TBA Configuration</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default NFTsPage;