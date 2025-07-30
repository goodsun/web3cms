import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import { useSettings } from '../contexts/SettingsContext';
import { getNFTContract } from '../utils/contractHelpers';
import { ethers } from 'ethers';
import { getRpcProvider } from '../utils/rpcUtils';
import { copyToClipboard } from '../utils/copyToClipboard';
import { formatAddress } from '../utils/formatters';
import CopyButton from '../components/CopyButton';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import NFTCard from '../components/NFTCard';
import './NFTListPage.css';

const NFTListPage = ({ mode = 'owner' }) => {
  const { address } = useParams();
  const { provider } = useWeb3();
  const { settings } = useSettings();
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contractInfo, setContractInfo] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0 });
  const [viewMode, setViewMode] = useState(() => {
    // Default to instagram mode on mobile
    return window.innerWidth <= 768 ? 'instagram' : 'grid';
  });
  const [copySuccess, setCopySuccess] = useState(false);

  const web3Config = settings?.web3 || {};

  useEffect(() => {
    const fetchNFTs = async () => {
      if (!web3Config.nftContract || !address) {
        setLoading(false);
        return;
      }
      
      // Always use RPC provider for read-only operations
      let activeProvider = null;
      if (web3Config.rpcUrls) {
        activeProvider = getRpcProvider(web3Config.rpcUrls, web3Config.defaultChainId, ethers);
      }
      
      if (!activeProvider) {
        setError('No provider available. Please check RPC configuration.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Validate address
        if (!ethers.isAddress(address)) {
          throw new Error('Invalid Ethereum address');
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

        let tokenIds = [];

        if (mode === 'creator') {
          // Get tokens created by this address
          try {
            // First get the count of tokens created by this address
            const tokenCount = await nftContract.getCreatorTokenCount(address);
            const count = parseInt(tokenCount.toString());
            
            setLoadingProgress({ current: 0, total: count });
            
            // Then get each token ID using creatorTokens(address, index)
            // Batch requests for better performance
            const batchSize = 10;
            for (let i = 0; i < count; i += batchSize) {
              const batch = [];
              const end = Math.min(i + batchSize, count);
              
              for (let j = i; j < end; j++) {
                batch.push(nftContract.creatorTokens(address, j));
              }
              
              const batchResults = await Promise.all(batch);
              tokenIds.push(...batchResults.map(id => id.toString()));
              
              // Update progress
              setLoadingProgress({ current: Math.min(i + batchSize, count), total: count });
            }
          } catch (err) {
            console.error('Failed to fetch creator tokens:', err);
            throw new Error('Contract does not support getCreatorTokenCount/creatorTokens methods');
          }
        } else {
          // Get tokens owned by this address
          try {
            const balance = await nftContract.balanceOf(address);
            const balanceNum = parseInt(balance.toString());
            
            for (let i = 0; i < balanceNum; i++) {
              const tokenId = await nftContract.tokenOfOwnerByIndex(address, i);
              tokenIds.push(tokenId.toString());
            }
          } catch (err) {
            // If enumeration is not supported, we'll need to use events
            throw new Error('Contract does not support enumeration');
          }
        }

        // Fetch metadata for each token
        const nftPromises = tokenIds.map(async (tokenId) => {
          try {
            const [owner, tokenURI] = await Promise.all([
              nftContract.ownerOf(tokenId),
              nftContract.tokenURI(tokenId)
            ]);

            return {
              tokenId,
              owner,
              tokenURI,
              contractAddress: web3Config.nftContract
            };
          } catch (err) {
            console.error(`Failed to fetch NFT ${tokenId}:`, err);
            return null;
          }
        });

        const fetchedNFTs = (await Promise.all(nftPromises)).filter(Boolean);
        setNfts(fetchedNFTs);

        if (fetchedNFTs.length === 0) {
          setError(`No NFTs found for this ${mode}`);
        }
      } catch (err) {
        console.error('Failed to fetch NFTs:', err);
        setError(err.message || 'Failed to fetch NFTs');
      } finally {
        setLoading(false);
      }
    };

    fetchNFTs();
  }, [provider, web3Config.nftContract, web3Config.rpcUrls, web3Config.defaultChainId, address, mode]);

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Add class to body for global styling adjustments
  useEffect(() => {
    if (viewMode === 'instagram' && window.innerWidth <= 768) {
      document.body.classList.add('instagram-view-active');
    } else {
      document.body.classList.remove('instagram-view-active');
    }
    
    return () => {
      document.body.classList.remove('instagram-view-active');
    };
  }, [viewMode]);

  return (
    <div className="nft-list-page">
      <div className="page-header">
        <h1>
          NFTs by {mode === 'creator' ? 'Creator' : 'Owner'}
        </h1>
        <div className="address-display">
          <span className="address-label">{mode === 'creator' ? 'Creator' : 'Owner'}:</span>
          <span className="address-value">
            {formatAddress(address)}
          </span>
          <CopyButton text={address} label="address" />
        </div>
        {contractInfo && (
          <div className="contract-info">
            <small>
              Contract: {contractInfo.name} ({contractInfo.symbol})
            </small>
          </div>
        )}
      </div>

      {loading && (
        <>
          <LoadingState message="Loading NFTs..." />
          {loadingProgress.total > 0 && (
            <div className="loading-progress">
              <p>Progress: {loadingProgress.current} / {loadingProgress.total}</p>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${(loadingProgress.current / loadingProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </>
      )}

      {error && !loading && (
        <ErrorState message={error} />
      )}

      {!loading && !error && nfts.length > 0 && (
        <>
          <div className="view-toggle">
            <button 
              className={viewMode === 'grid' ? 'active' : ''}
              onClick={() => setViewMode('grid')}
              title="Card view"
            >
              ⬜
            </button>
            <button 
              className={viewMode === 'instagram' ? 'active' : ''}
              onClick={() => setViewMode('instagram')}
              title="Grid view"
            >
              ⚏
            </button>
          </div>
          <div className={`nft-grid ${viewMode === 'instagram' ? 'instagram-mode' : ''}`}>
            {nfts.map((nft) => (
              <NFTCard
                key={nft.tokenId}
                nft={nft}
                showOwner={mode === 'owner'}
                showActions={false}
              />
            ))}
          </div>
        </>
      )}

      {!loading && !error && nfts.length === 0 && (
        <div className="empty-state">
          <p>No NFTs found</p>
        </div>
      )}

      <div className="stats">
        Total: {nfts.length} NFT{nfts.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

export default NFTListPage;