import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import UserDisplay from '../components/UserDisplay';
import { userService } from '../services/api';
import nftApiService from '../services/nftApiService';
import './NFTListPage.css';

const ITEMS_PER_PAGE = 9;

const NFTListPage = ({ mode = 'owner' }) => {
  const { address } = useParams();
  const { provider } = useWeb3();
  const { settings } = useSettings();
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [contractInfo, setContractInfo] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const observerRef = useRef();
  const lastNftElementRef = useRef();
  
  // Fixed view mode based on device
  const isMobile = window.innerWidth <= 768;
  const viewMode = isMobile ? 'instagram' : 'grid';
  const [copySuccess, setCopySuccess] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  const web3Config = settings?.web3 || {};

  // Fetch user info for the address
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!address) return;
      
      try {
        const user = await userService.getCurrentUser(address);
        setUserInfo(user);
      } catch (err) {
        console.error('Failed to fetch user info:', err);
      }
    };
    
    fetchUserInfo();
  }, [address]);

  // Fetch NFTs based on mode (owner or creator)
  const fetchNFTs = useCallback(async (startIndex = 0, append = false) => {
    if (!web3Config.nftContract || !address || !web3Config.rpcUrls) {
      setError('Configuration missing');
      return;
    }

    if (startIndex === 0) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);

    try {
      const activeProvider = getRpcProvider(web3Config.rpcUrls, web3Config.defaultChainId, ethers);
      
      if (!activeProvider) {
        setError('No provider available. Please check RPC configuration.');
        return;
      }

      const nftContract = getNFTContract(web3Config.nftContract, activeProvider);

      // Get contract info if not already fetched
      if (!contractInfo) {
        try {
          const [name, symbol] = await Promise.all([
            nftContract.name(),
            nftContract.symbol()
          ]);
          setContractInfo({ name, symbol });
        } catch (err) {
          console.warn('Could not fetch contract info:', err);
        }
      }

      let nftList = [];
      let endIndex = startIndex + ITEMS_PER_PAGE;

      if (mode === 'owner') {
        // Try API first for better performance
        try {
          const apiNfts = await nftApiService.getNFTsByOwner(web3Config.nftContract, address);
          
          // Filter and paginate
          const paginatedNfts = apiNfts.slice(startIndex, endIndex);
          
          nftList = paginatedNfts.map(apiNft => ({
            tokenId: apiNft.tokenId,
            owner: apiNft.owner,
            creator: apiNft.creator,
            tokenURI: apiNft.tokenURI,
            name: apiNft.name || `Token #${apiNft.tokenId}`,
            description: apiNft.description,
            image: apiNft.imageUrl,
            contractAddress: web3Config.nftContract,
            isBurned: apiNft.burned || false,
          }));
          
          setHasMore(endIndex < apiNfts.length);
        } catch (apiError) {
          console.warn('API fetch failed, falling back to RPC:', apiError);
          
          // Fallback to RPC
          const balance = await nftContract.balanceOf(address);
          const balanceNum = Number(balance);
          
          if (startIndex >= balanceNum) {
            setHasMore(false);
            return;
          }

          endIndex = Math.min(endIndex, balanceNum);

          for (let i = startIndex; i < endIndex; i++) {
            try {
              const tokenId = await nftContract.tokenOfOwnerByIndex(address, i);
              const [tokenURI, creator] = await Promise.all([
                nftContract.tokenURI(tokenId),
                nftContract.tokenCreator(tokenId).catch(() => null),
              ]);

              let metadata = {};
              try {
                const response = await fetch(tokenURI);
                metadata = await response.json();
              } catch (err) {
                console.warn('Could not fetch metadata for token', tokenId);
              }

              nftList.push({
                tokenId: tokenId.toString(),
                owner: address,
                creator,
                tokenURI,
                name: metadata.name || `Token #${tokenId}`,
                description: metadata.description,
                image: metadata.image,
                contractAddress: web3Config.nftContract,
              });
            } catch (err) {
              console.warn(`Error fetching owned token at index ${i}:`, err);
            }
          }

          setHasMore(endIndex < balanceNum);
        }
      } else if (mode === 'creator') {
        // For creator mode, we need to scan through all tokens
        const totalSupply = await nftContract.totalSupply();
        const totalSupplyNum = Number(totalSupply);
        
        let scannedCount = 0;
        let foundCount = 0;

        for (let i = 0; i < totalSupplyNum && foundCount < endIndex; i++) {
          try {
            const creator = await nftContract.tokenCreator(i).catch(() => null);
            
            if (creator && creator.toLowerCase() === address.toLowerCase()) {
              if (scannedCount >= startIndex) {
                const [owner, tokenURI] = await Promise.all([
                  nftContract.ownerOf(i),
                  nftContract.tokenURI(i),
                ]);

                let metadata = {};
                try {
                  const response = await fetch(tokenURI);
                  metadata = await response.json();
                } catch (err) {
                  console.warn('Could not fetch metadata for token', i);
                }

                nftList.push({
                  tokenId: i.toString(),
                  owner,
                  creator,
                  tokenURI,
                  name: metadata.name || `Token #${i}`,
                  description: metadata.description,
                  image: metadata.image,
                  contractAddress: web3Config.nftContract,
                });
                foundCount++;
              }
              scannedCount++;
            }
          } catch (err) {
            console.warn(`Error checking token ${i}:`, err);
          }
        }

        setHasMore(foundCount === ITEMS_PER_PAGE);
      }

      if (append) {
        setNfts(prev => [...prev, ...nftList]);
      } else {
        setNfts(nftList);
      }
      setCurrentIndex(endIndex);
    } catch (err) {
      console.error('Failed to fetch NFTs:', err);
      setError(err.message || 'Failed to fetch NFTs');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [mode, address, web3Config, contractInfo]);

  // Initial fetch
  useEffect(() => {
    setNfts([]);
    setCurrentIndex(0);
    setHasMore(true);
    fetchNFTs(0, false);
  }, [fetchNFTs]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (loading || loadingMore || !hasMore) return;

    if (observerRef.current) observerRef.current.disconnect();

    const callback = (entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        fetchNFTs(currentIndex, true);
      }
    };

    observerRef.current = new IntersectionObserver(callback);
    if (lastNftElementRef.current) {
      observerRef.current.observe(lastNftElementRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [loading, loadingMore, hasMore, currentIndex, fetchNFTs]);

  const handleCopyAddress = () => {
    copyToClipboard(address, () => setCopySuccess(true));
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleCardClick = (tokenId) => {
    window.location.href = `/nfts/token/${tokenId}`;
  };

  const renderNFTGrid = () => {
    if (nfts.length === 0) {
      return (
        <div className="empty-state">
          <p>No NFTs found {mode === 'owner' ? 'owned by' : 'created by'} this address</p>
        </div>
      );
    }

    return (
      <>
        <div className={`nft-grid ${viewMode === 'instagram' ? 'instagram-mode' : ''}`}>
          {nfts.map((nft, index) => (
            <div
              key={`${nft.tokenId}-${index}`}
              ref={index === nfts.length - 1 ? lastNftElementRef : null}
              onClick={() => handleCardClick(nft.tokenId)}
            >
              <NFTCard nft={nft} />
            </div>
          ))}
        </div>
        
        {loadingMore && (
          <div className="loading-more">
            <div className="spinner"></div>
            <p>Loading more...</p>
          </div>
        )}
      </>
    );
  };

  // Add mobile class for specific styling
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        document.body.classList.add('instagram-view-active');
      } else {
        document.body.classList.remove('instagram-view-active');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.body.classList.remove('instagram-view-active');
    };
  }, []);

  return (
    <div className="nft-list-page">
      <div className="page-header">
        <h1>
          {contractInfo && contractInfo.name ? contractInfo.name : 'NFTs'} {mode === 'owner' ? 'Owned' : 'Created'} by
        </h1>
        <div className="header-info">
          <UserDisplay address={address} size="large" showAddress={false} />
          <div className="address-display">
            <span className="address-label">{mode === 'owner' ? 'Owner' : 'Creator'}:</span>
            <span className="address-value">{formatAddress(address)}</span>
            <CopyButton text={address} onCopy={handleCopyAddress} />
          </div>
        </div>
      </div>

      {loading && !loadingMore ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        renderNFTGrid()
      )}

      <div className="stats">
        {hasMore ? 'Scroll for more' : `Total: ${nfts.length} NFT${nfts.length !== 1 ? 's' : ''}`}
      </div>
    </div>
  );
};

export default NFTListPage;