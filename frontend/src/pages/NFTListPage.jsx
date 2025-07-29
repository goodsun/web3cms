import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import { useSettings } from '../contexts/SettingsContext';
import { getNFTContract } from '../utils/contractHelpers';
import { ethers } from 'ethers';
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

  const web3Config = settings?.web3 || {};

  useEffect(() => {
    const fetchNFTs = async () => {
      if (!provider || !web3Config.nftContract || !address) {
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

        const nftContract = getNFTContract(web3Config.nftContract, provider);

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
  }, [provider, web3Config.nftContract, address, mode]);

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="nft-list-page">
      <div className="page-header">
        <h1>
          NFTs by {mode === 'creator' ? 'Creator' : 'Owner'}
        </h1>
        <div className="address-display">
          <span className="address-label">{mode === 'creator' ? 'Creator' : 'Owner'}:</span>
          <span className="address-value">{address}</span>
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
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading NFTs...</p>
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
        </div>
      )}

      {error && !loading && (
        <div className="error-state">
          <p className="error-message">{error}</p>
        </div>
      )}

      {!loading && !error && nfts.length > 0 && (
        <div className="nft-grid">
          {nfts.map((nft) => (
            <Link key={nft.tokenId} to={`/nfts/token/${nft.tokenId}`} className="nft-card">
              <div className="nft-id">
                Token ID: {nft.tokenId}
              </div>
              {nft.owner && (
                <div className="nft-owner">
                  Owner: {formatAddress(nft.owner)}
                </div>
              )}
              {nft.tokenURI && (
                <div className="nft-uri">
                  <span className="uri-link">
                    View Details →
                  </span>
                </div>
              )}
            </Link>
          ))}
        </div>
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