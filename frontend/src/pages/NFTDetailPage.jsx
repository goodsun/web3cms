import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import { useSettings } from '../contexts/SettingsContext';
import { getNFTContract, getTBARegistry, calculateTBAAddress, deployTBA, isTBADeployed } from '../utils/contractHelpers';
import { ethers } from 'ethers';
import { getRpcProvider } from '../utils/rpcUtils';
import nftService from '../services/nftService';
import TBANFTTransfer from '../components/TBANFTTransfer';
import { copyToClipboard } from '../utils/copyToClipboard';
import './NFTDetailPage.css';
import './NFTDetailPage-instagram.css';

// Component for rendering URL attributes with MIME type detection
const AttributeUrlCard = ({ trait_type, value, index }) => {
  const [loadingMime, setLoadingMime] = useState(true);
  const [mimeType, setMimeType] = useState(null);
  const [showLightbox, setShowLightbox] = useState(false);
  const valueStr = String(value);
  const url = valueStr.startsWith('http') ? valueStr : `https://${valueStr}`;
  
  const fetchMimeType = async (url) => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const contentType = response.headers.get('content-type');
      return contentType;
    } catch (error) {
      console.error('Failed to fetch MIME type:', error);
      return null;
    }
  };
  
  // Fetch MIME type for this URL
  useEffect(() => {
    const fetchAttributeMimeType = async () => {
      const type = await fetchMimeType(url);
      setMimeType(type);
      setLoadingMime(false);
    };
    fetchAttributeMimeType();
  }, [url]);
  
  // Handle ESC key and body scroll lock
  useEffect(() => {
    if (showLightbox) {
      const handleEsc = (e) => {
        if (e.key === 'Escape') {
          setShowLightbox(false);
        }
      };
      
      // Prevent body scroll when lightbox is open
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleEsc);
      
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleEsc);
      };
    }
  }, [showLightbox]);
  
  const renderUrlAttribute = () => {
    if (loadingMime) {
      return (
        <div className="attr-content">
          <div className="attr-loading">Loading...</div>
        </div>
      );
    }
    
    // Check MIME type for images
    if (mimeType && mimeType.startsWith('image/')) {
      return (
        <>
          <div className="attr-content">
            <img 
              src={url} 
              alt={trait_type} 
              className="attr-image clickable" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowLightbox(true);
              }}
              title="Click to view full image"
            />
          </div>
          {showLightbox && createPortal(
            <div className="lightbox" onClick={() => setShowLightbox(false)}>
              <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                <img src={url} alt={trait_type} />
                <div className="lightbox-header">
                  <span className="lightbox-title">{trait_type}</span>
                  <button 
                    className="lightbox-close" 
                    onClick={() => setShowLightbox(false)}
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}
        </>
      );
    }
    
    // Check MIME type for 3D models
    if (mimeType && (
      mimeType === 'model/gltf-binary' ||
      mimeType === 'model/gltf+json' ||
      mimeType.includes('model/') ||
      (mimeType === 'application/octet-stream' && url.match(/\.(glb|gltf)$/i))
    )) {
      return (
        <div className="attr-content">
          <iframe
            src={`https://3d.bon-soleil.com/?src=${encodeURIComponent(url)}`}
            title={`3D Model: ${trait_type}`}
            className="attr-3d-viewer"
            frameBorder="0"
            allowFullScreen
          />
          <a 
            href={`https://3d.bon-soleil.com/?src=${encodeURIComponent(url)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="attr-external-link"
          >
            Open in 3D Viewer
          </a>
        </div>
      );
    }
    
    // Check MIME type for videos
    if (mimeType && mimeType.startsWith('video/')) {
      return (
        <div className="attr-content">
          <video controls className="attr-video">
            <source src={url} type={mimeType} />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }
    
    // Default: treat as a link
    return (
      <div className="attr-content">
        <a 
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="attr-link"
        >
          🔗 {valueStr}
        </a>
      </div>
    );
  };
  
  return (
    <div key={index} className="attribute-url-card">
      {renderUrlAttribute()}
      <div className="attr-type-overlay">
        <span>{trait_type}</span>
      </div>
    </div>
  );
};

const NFTDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { account, provider, signer } = useWeb3();
  const { settings } = useSettings();
  const [nft, setNft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [tbaAddress, setTbaAddress] = useState(null);
  const [tbaDeployed, setTbaDeployed] = useState(false);
  const [tbaBalance, setTbaBalance] = useState('0');
  const [tbaOwnedNFTs, setTbaOwnedNFTs] = useState([]);
  const [loadingTBA, setLoadingTBA] = useState(false);
  const [deployingTBA, setDeployingTBA] = useState(false);
  const [activeTab, setActiveTab] = useState(null); // Will be set based on metadata
  const [transferTo, setTransferTo] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [burning, setBurning] = useState(false);
  const [showBurnConfirmation, setShowBurnConfirmation] = useState(false);
  const [animationMimeType, setAnimationMimeType] = useState(null);
  const [attributeMimeTypes, setAttributeMimeTypes] = useState({});
  const [transferringTBANft, setTransferringTBANft] = useState(null);

  const web3Config = settings?.web3 || {};

  useEffect(() => {
    const fetchNFTDetails = async () => {
      if (!web3Config.nftContract || !id) {
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
        const nftContract = getNFTContract(web3Config.nftContract, activeProvider);

        // Get basic NFT info
        const [owner, tokenURI] = await Promise.all([
          nftContract.ownerOf(id),
          nftContract.tokenURI(id)
        ]);

        // Get contract info
        let contractInfo = {};
        try {
          const [name, symbol] = await Promise.all([
            nftContract.name(),
            nftContract.symbol()
          ]);
          contractInfo = { name, symbol };
        } catch (err) {
          console.warn('Could not fetch contract info:', err);
        }

        // Get creator and SBT flag if available
        let creator = null;
        let isSbt = false;
        try {
          creator = await nftContract.tokenCreator(id);
        } catch (err) {
          console.warn('Could not fetch creator:', err);
        }
        try {
          isSbt = await nftContract.sbtFlag(id);
        } catch (err) {
          console.warn('Could not fetch SBT flag:', err);
        }

        const nftData = {
          tokenId: id,
          owner,
          creator,
          isSbt,
          tokenURI,
          contractAddress: web3Config.nftContract,
          contractInfo
        };

        setNft(nftData);

        // Fetch metadata if tokenURI is available
        if (tokenURI) {
          try {
            const response = await fetch(tokenURI);
            const data = await response.json();
            setMetadata(data);
            
            // Set default tab based on available media
            if (!activeTab) {
              if (data.animation_url) {
                setActiveTab('animation');
                fetchAnimationMimeType(data.animation_url);
              } else if (data.youtube_url) {
                setActiveTab('youtube');
              } else if (data.model) {
                setActiveTab('3d');
              } else if (data.image) {
                setActiveTab('image');
              }
            }
            
            // Check animation_url MIME type if available
            if (data.animation_url) {
              fetchAnimationMimeType(data.animation_url);
            }
          } catch (err) {
            console.warn('Could not fetch metadata:', err);
          }
        }

        // Calculate TBA address if configured
        if (web3Config.tbaRegistry && web3Config.tbaImplementation) {
          try {
            const registry = getTBARegistry(web3Config.tbaRegistry, activeProvider);
            const chainId = await activeProvider.getNetwork().then(n => n.chainId);
            const salt = ethers.toBigInt(web3Config.tbaSalt || '0');
            
            // Log parameters for debugging
            console.log('TBA calculation params:', {
              registry: web3Config.tbaRegistry,
              implementation: web3Config.tbaImplementation,
              chainId: chainId.toString(),
              nftContract: web3Config.nftContract,
              tokenId: id,
              salt: salt.toString()
            });
            
            const tba = await calculateTBAAddress(
              web3Config.tbaRegistry,
              web3Config.tbaImplementation,
              salt.toString(),
              Number(chainId),
              web3Config.nftContract,
              id,
              activeProvider
            );
            setTbaAddress(tba);
            
            // Check if TBA is deployed
            const isDeployed = await isTBADeployed(tba, activeProvider);
            setTbaDeployed(isDeployed);
            
            if (isDeployed) {
              // Get TBA balance
              const balance = await activeProvider.getBalance(tba);
              setTbaBalance(ethers.formatEther(balance));
              
              // Get NFTs owned by TBA
              await fetchTBAOwnedNFTs(tba, activeProvider);
            }
          } catch (err) {
            console.warn('TBA feature not available on this network:', err.message);
            // TBA is optional, continue without it
          }
        }

      } catch (err) {
        console.error('Failed to fetch NFT details:', err);
        setError(err.message || 'Failed to fetch NFT details');
      } finally {
        setLoading(false);
      }
    };

    fetchNFTDetails();
  }, [web3Config.nftContract, web3Config.rpcUrls, web3Config.defaultChainId, web3Config.tbaRegistry, web3Config.tbaImplementation, web3Config.tbaSalt, id]);

  const fetchTBAOwnedNFTs = async (tbaAddr, activeProvider) => {
    if (!activeProvider || !web3Config.nftContract) return;
    
    setLoadingTBA(true);
    try {
      const nftContract = getNFTContract(web3Config.nftContract, activeProvider);
      const ownedNFTs = [];
      
      // Get total supply and check ownership for each token
      // This is a simplified approach - in production, you'd want to use events or a more efficient method
      try {
        const balance = await nftContract.balanceOf(tbaAddr);
        const balanceNum = Number(balance);
        
        if (balanceNum > 0) {
          // Try to get tokens by index
          for (let i = 0; i < balanceNum && i < 10; i++) { // Limit to 10 for performance
            try {
              const tokenId = await nftContract.tokenOfOwnerByIndex(tbaAddr, i);
              const tokenURI = await nftContract.tokenURI(tokenId);
              
              // Fetch metadata
              let metadata = null;
              try {
                const response = await fetch(tokenURI);
                metadata = await response.json();
              } catch (err) {
                console.warn('Could not fetch metadata:', err);
              }
              
              ownedNFTs.push({
                tokenId: tokenId.toString(),
                tokenURI,
                metadata
              });
            } catch (err) {
              console.warn('Could not fetch token by index:', err);
            }
          }
        }
      } catch (err) {
        console.warn('Could not enumerate TBA owned tokens:', err);
      }
      
      setTbaOwnedNFTs(ownedNFTs);
    } catch (err) {
      console.error('Failed to fetch TBA owned NFTs:', err);
    } finally {
      setLoadingTBA(false);
    }
  };

  const handleDeployTBA = async () => {
    if (!account || !provider || !signer) {
      setError('Please connect your wallet');
      return;
    }

    if (nft.owner.toLowerCase() !== account.toLowerCase()) {
      setError('You are not the owner of this NFT');
      return;
    }

    setDeployingTBA(true);
    setError(null);

    try {
      const chainId = await provider.getNetwork().then(n => n.chainId);
      const salt = ethers.toBigInt(web3Config.tbaSalt || '0');
      
      const receipt = await deployTBA(
        web3Config.tbaRegistry,
        web3Config.tbaImplementation,
        salt.toString(),
        Number(chainId),
        web3Config.nftContract,
        id,
        signer
      );
      
      setTbaDeployed(true);
      
      // Refresh TBA info using RPC provider
      let activeProvider = provider;
      if (web3Config.rpcUrls) {
        activeProvider = getRpcProvider(web3Config.rpcUrls, web3Config.defaultChainId, ethers) || provider;
      }
      
      const balance = await activeProvider.getBalance(tbaAddress);
      setTbaBalance(ethers.formatEther(balance));
      await fetchTBAOwnedNFTs(tbaAddress, activeProvider);
      
      alert('TBA deployed successfully!');
    } catch (err) {
      console.error('Failed to deploy TBA:', err);
      setError(err.message || 'Failed to deploy TBA');
    } finally {
      setDeployingTBA(false);
    }
  };

  const handleTransfer = async () => {
    if (!transferTo || !ethers.isAddress(transferTo)) {
      setError('Please enter a valid address');
      return;
    }

    if (!account) {
      setError('Please connect your wallet');
      return;
    }

    if (nft.owner.toLowerCase() !== account.toLowerCase()) {
      setError('You are not the owner of this NFT');
      return;
    }

    setTransferring(true);
    setError(null);

    try {
      if (!signer) {
        setError('Wallet not properly connected');
        return;
      }
      
      const nftContract = getNFTContract(web3Config.nftContract, signer);
      
      // Add logging for debugging
      console.log('Transfer parameters:', {
        from: account,
        to: transferTo,
        tokenId: id
      });
      
      if (window.addDebugLog) {
        window.addDebugLog('info', 'Initiating NFT transfer', {
          from: account,
          to: transferTo,
          tokenId: id,
          contract: web3Config.nftContract
        });
      }
      
      // Use safeTransferFrom instead of transferFrom for better compatibility
      // Also explicitly set gas limit for mobile compatibility
      const gasEstimate = await nftContract['safeTransferFrom(address,address,uint256)'].estimateGas(
        account, 
        transferTo, 
        id
      );
      
      const tx = await nftContract['safeTransferFrom(address,address,uint256)'](
        account,
        transferTo,
        id,
        {
          gasLimit: gasEstimate * 120n / 100n // Add 20% buffer
        }
      );
      
      if (window.addDebugLog) {
        window.addDebugLog('info', 'Transaction sent', { hash: tx.hash });
      }
      
      await tx.wait();
      
      // Refresh NFT data
      const newOwner = await nftContract.ownerOf(id);
      setNft({ ...nft, owner: newOwner });
      setTransferTo('');
      alert('Transfer successful!');
    } catch (err) {
      console.error('Transfer failed:', err);
      if (window.addDebugLog) {
        window.addDebugLog('error', 'Transfer failed', {
          error: err.message,
          code: err.code
        });
      }
      setError(err.message || 'Transfer failed');
    } finally {
      setTransferring(false);
    }
  };

  const handleBurn = async () => {
    if (!account) {
      setError('Please connect your wallet');
      return;
    }
    if (nft.owner.toLowerCase() !== account.toLowerCase()) {
      setError('You are not the owner of this NFT');
      return;
    }
    
    setShowBurnConfirmation(false);
    setBurning(true);
    setError(null);
    
    try {
      if (!signer) {
        setError('Wallet not properly connected');
        return;
      }
      
      const result = await nftService.burnNFT(web3Config.nftContract, id, signer);
      
      if (result.success) {
        alert('NFT burned successfully!');
        // Navigate to the NFTs list page since this NFT no longer exists
        navigate('/nfts');
      }
    } catch (err) {
      console.error('Burn failed:', err);
      setError(err.message || 'Failed to burn NFT');
      setBurning(false);
    }
  };

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleCopyToClipboard = async (text, label = 'Text') => {
    const success = await copyToClipboard(text);
    if (success) {
      alert(`${label} copied to clipboard!`);
    } else {
      alert(`Failed to copy ${label.toLowerCase()}. Please copy manually: ${text}`);
    }
  };

  const handleTBANftTransferComplete = async (nft, recipientAddress) => {
    // Hide the transfer UI
    setTransferringTBANft(null);
    
    // Refresh TBA owned NFTs
    let activeProvider = provider;
    if (web3Config.rpcUrls) {
      activeProvider = getRpcProvider(web3Config.rpcUrls, web3Config.defaultChainId, ethers) || provider;
    }
    
    if (activeProvider && tbaAddress) {
      await fetchTBAOwnedNFTs(tbaAddress, activeProvider);
    }
    
    alert(`NFT transferred successfully to ${recipientAddress}`);
  };

  const fetchAnimationMimeType = async (url) => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const contentType = response.headers.get('content-type');
      setAnimationMimeType(contentType);
      return contentType;
    } catch (error) {
      console.error('Failed to fetch MIME type:', error);
      return null;
    }
  };

  const is3DContent = (animationUrl, mimeType) => {
    if (!animationUrl) return false;

    // Check MIME type first if available
    if (mimeType) {
      return (
        mimeType.includes('model/') ||
        mimeType.includes('application/octet-stream') ||
        mimeType === 'model/gltf+json' ||
        mimeType === 'model/gltf-binary'
      );
    }

    // Check metadata mime_type if available
    if (metadata?.animation_mime_type) {
      return (
        metadata.animation_mime_type.includes('model/') ||
        metadata.animation_mime_type.includes('application/octet-stream') ||
        metadata.animation_mime_type === 'model/gltf+json' ||
        metadata.animation_mime_type === 'model/gltf-binary'
      );
    }

    // Fallback to file extension check
    const url = animationUrl.toLowerCase();
    return (
      url.includes('.gltf') ||
      url.includes('.glb') ||
      url.includes('.obj') ||
      url.includes('.fbx')
    );
  };

  // Add mobile class for specific styling
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        document.body.classList.add('nft-detail-mobile');
      } else {
        document.body.classList.remove('nft-detail-mobile');
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      document.body.classList.remove('nft-detail-mobile');
    };
  }, []);

  return (
    <div className="nft-detail-page">
      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading NFT details...</p>
        </div>
      )}

      {error && !loading && (
        <div className="error-state">
          <p className="error-message">{error}</p>
        </div>
      )}

      {!loading && nft && (
        <div className="nft-detail">
          <div className="nft-header">
            <h1>
              {metadata?.name || `Token #${nft.tokenId}`}
              {nft.isSbt && <span className="sbt-badge">SBT</span>}
              {tbaDeployed && <span className="tba-badge">TBA</span>}
            </h1>
            <div className="contract-info">
              {metadata?.description && (
                <p className="nft-description">{metadata.description}</p>
              )}
              <div className="contract-details">
                {nft.contractInfo && (
                  <span>{nft.contractInfo.name} ({nft.contractInfo.symbol})</span>
                )}
                <span className="separator">•</span>
                <span>Token ID: {nft.tokenId}</span>
              </div>
            </div>
          </div>

          <div className="nft-content">
            {/* Media tabs */}
            {(metadata?.image || metadata?.animation_url || metadata?.model || metadata?.youtube_url) && (
              <div className="media-tabs">
                {metadata?.image && (
                  <button
                    className={`media-tab ${activeTab === 'image' ? 'active' : ''}`}
                    onClick={() => setActiveTab('image')}
                  >
                    Image
                  </button>
                )}
                {metadata?.animation_url && (
                  <button
                    className={`media-tab ${activeTab === 'animation' ? 'active' : ''}`}
                    onClick={() => setActiveTab('animation')}
                  >
                    {is3DContent(metadata.animation_url, animationMimeType) ? '3D Model' : 'Animation'}
                  </button>
                )}
                {metadata?.model && (
                  <button
                    className={`media-tab ${activeTab === '3d' ? 'active' : ''}`}
                    onClick={() => setActiveTab('3d')}
                  >
                    3D Model
                  </button>
                )}
                {metadata?.youtube_url && (
                  <button
                    className={`media-tab ${activeTab === 'youtube' ? 'active' : ''}`}
                    onClick={() => setActiveTab('youtube')}
                  >
                    YouTube
                  </button>
                )}
              </div>
            )}

            {/* Metadata Display */}
            {metadata && (
              <div className="metadata-section">
                <div className="media-display">
                  {activeTab === 'image' && metadata.image && (
                    <div className="nft-image">
                      <img src={metadata.image} alt={metadata.name || `NFT #${nft.tokenId}`} />
                    </div>
                  )}
                  {activeTab === 'animation' && metadata.animation_url && (
                    is3DContent(metadata.animation_url, animationMimeType) ? (
                      <div className="nft-3d-model">
                        <iframe
                          src={`https://3d.bon-soleil.com/?src=${encodeURIComponent(metadata.animation_url)}`}
                          title="3D Model Viewer"
                          width="100%"
                          height="600"
                          frameBorder="0"
                          allowFullScreen
                        />
                        <div className="external-link-wrapper">
                          <a 
                            href={`https://3d.bon-soleil.com/?src=${encodeURIComponent(metadata.animation_url)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="external-link"
                          >
                            Open in 3D Viewer
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="nft-animation">
                        <video controls loop autoPlay muted>
                          <source src={metadata.animation_url} />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    )
                  )}
                  {activeTab === '3d' && metadata.model && (
                    <div className="nft-3d-model">
                      <iframe
                        src={`https://3d.bon-soleil.com/?src=${encodeURIComponent(metadata.model)}`}
                        title="3D Model Viewer"
                        width="100%"
                        height="500"
                        frameBorder="0"
                        allowFullScreen
                      />
                      <div className="external-link-wrapper">
                        <a 
                          href={`https://3d.bon-soleil.com/?src=${encodeURIComponent(metadata.model)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="external-link"
                        >
                          Open in 3D Viewer
                        </a>
                      </div>
                    </div>
                  )}
                  {activeTab === 'youtube' && metadata.youtube_url && (() => {
                    // Extract YouTube video ID from various URL formats
                    const getYouTubeId = (url) => {
                      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
                      const match = url.match(regExp);
                      return (match && match[2].length === 11) ? match[2] : null;
                    };
                    
                    const videoId = getYouTubeId(metadata.youtube_url);
                    
                    return (
                      <div className="nft-youtube">
                        {videoId ? (
                          <iframe
                            src={`https://www.youtube.com/embed/${videoId}`}
                            title="YouTube video player"
                            width="100%"
                            height="500"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : (
                          <div className="youtube-error">
                            <p>Unable to embed YouTube video</p>
                            <a 
                              href={metadata.youtube_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="external-link"
                            >
                              Watch on YouTube
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
                {/* Details Section moved here */}
                <div className="details-section">
                  <h3>Details</h3>
                  <div className="detail-item">
                    <span className="detail-label">Owner:</span>
                    <div className="detail-value-wrapper">
                      <Link to={`/nfts/owner/${nft.owner}`} className="detail-value address">
                        {formatAddress(nft.owner)}
                      </Link>
                      <button 
                        onClick={() => handleCopyToClipboard(nft.owner, 'Owner address')} 
                        className="copy-button"
                        title="Copy address"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                  {nft.creator && (
                    <div className="detail-item">
                      <span className="detail-label">Creator:</span>
                      <div className="detail-value-wrapper">
                        <Link to={`/nfts/creator/${nft.creator}`} className="detail-value address">
                          {formatAddress(nft.creator)}
                        </Link>
                        <button 
                          onClick={() => handleCopyToClipboard(nft.creator, 'Creator address')} 
                          className="copy-button"
                          title="Copy address"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="detail-item">
                    <span className="detail-label">Contract:</span>
                    <div className="detail-value-wrapper">
                      <span className="detail-value address">{formatAddress(nft.contractAddress)}</span>
                      <button 
                        onClick={() => handleCopyToClipboard(nft.contractAddress, 'Contract address')} 
                        className="copy-button"
                        title="Copy address"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                  {nft.tokenURI && (
                    <div className="detail-item">
                      <span className="detail-label">Metadata:</span>
                      <a 
                        href={nft.tokenURI} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="detail-value link"
                      >
                        View JSON
                      </a>
                    </div>
                  )}
                  {metadata?.external_url && (
                    <div className="detail-item">
                      <span className="detail-label">External URL:</span>
                      <a 
                        href={metadata.external_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="detail-value link"
                      >
                        🔗 Visit Website
                      </a>
                    </div>
                  )}
                  {metadata?.youtube_url && (
                    <div className="detail-item">
                      <span className="detail-label">YouTube:</span>
                      <a 
                        href={metadata.youtube_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="detail-value link"
                      >
                        ▶️ Watch Video
                      </a>
                    </div>
                  )}
                  {tbaAddress && (
                    <div className="detail-item">
                      <span className="detail-label">TBA Address:</span>
                      <div className="detail-value-wrapper">
                        <span className="detail-value address">{formatAddress(tbaAddress)}</span>
                        <button 
                          onClick={() => handleCopyToClipboard(tbaAddress, 'TBA address')} 
                          className="copy-button"
                          title="Copy address"
                        >
                          📋
                        </button>
                        {tbaDeployed && (
                          <span className="tba-status deployed">Deployed</span>
                        )}
                        {!tbaDeployed && (
                          <span className="tba-status not-deployed">Not Deployed</span>
                        )}
                      </div>
                    </div>
                  )}
                  {tbaDeployed && (
                    <div className="detail-item">
                      <span className="detail-label">TBA Balance:</span>
                      <span className="detail-value">{tbaBalance} ETH</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Attributes Section - Full width below image */}
            {metadata?.attributes && metadata.attributes.length > 0 && (() => {
              // Separate URL attributes from text attributes
              const urlAttributes = [];
              const textAttributes = [];
              
              metadata.attributes.forEach((attr, index) => {
                const value = String(attr.value);
                if (value.match(/^(https?:\/\/|www\.)/i)) {
                  urlAttributes.push({ ...attr, index });
                } else {
                  textAttributes.push({ ...attr, index });
                }
              });
              
              return (
                <div className="attributes-section">
                  <h3>Attributes</h3>
                  
                  {/* URL-based attributes in 3-column grid */}
                  {urlAttributes.length > 0 && (
                    <div className="attributes-url-grid">
                      {urlAttributes.map(({ trait_type, value, index }) => (
                        <AttributeUrlCard
                          key={index}
                          trait_type={trait_type}
                          value={value}
                          index={index}
                        />
                      ))}
                    </div>
                  )}
                  
                  {/* Text attributes in list style */}
                  {textAttributes.length > 0 && (
                    <>
                      {urlAttributes.length > 0 && <div className="attributes-divider" />}
                      <div className="attributes-text-list">
                        {textAttributes.map(({ trait_type, value, index }) => (
                          <div key={index} className="attribute-text-item">
                            <span className="attr-type">{trait_type}</span>
                            <span className="attr-value">{value}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })()}

            {/* TBA Section */}
            {tbaAddress && (
              <div className="tba-section">
                <h3>Token Bound Account (TBA)</h3>
                {!tbaDeployed && (
                  <div className="tba-deploy">
                    <p>Deploy a Token Bound Account for this NFT to enable it to own assets and interact with smart contracts.</p>
                    {account && nft.owner.toLowerCase() === account.toLowerCase() && (
                      <button
                        onClick={handleDeployTBA}
                        disabled={deployingTBA}
                        className="deploy-tba-button"
                      >
                        {deployingTBA ? 'Deploying...' : 'Deploy TBA'}
                      </button>
                    )}
                    {(!account || nft.owner.toLowerCase() !== account.toLowerCase()) && (
                      <p className="tba-notice">Connect wallet as owner to deploy TBA</p>
                    )}
                  </div>
                )}
                {tbaDeployed && (
                  <div className="tba-info">
                    <p>This NFT has a Token Bound Account deployed.</p>
                    <p className="tba-address-info">
                      TBA Address: <span className="address">{tbaAddress}</span>
                    </p>
                    <p className="tba-balance-info">
                      Balance: <span className="balance">{tbaBalance} ETH</span>
                    </p>
                    {loadingTBA && <p>Loading TBA owned assets...</p>}
                    {!loadingTBA && tbaOwnedNFTs.length > 0 && (
                      <div className="tba-owned-nfts">
                        <h4>NFTs Owned by TBA</h4>
                        <div className="tba-nfts-grid">
                          {tbaOwnedNFTs.map((ownedNft) => (
                            <div key={ownedNft.tokenId} className="tba-owned-nft-container">
                              <Link 
                                to={`/nfts/token/${ownedNft.tokenId}`}
                                className="tba-owned-nft"
                              >
                                {ownedNft.metadata?.image && (
                                  <img src={ownedNft.metadata.image} alt={ownedNft.metadata.name || `Token #${ownedNft.tokenId}`} />
                                )}
                                <div className="tba-nft-info">
                                  <p>{ownedNft.metadata?.name || `Token #${ownedNft.tokenId}`}</p>
                                </div>
                              </Link>
                              {account && nft.owner.toLowerCase() === account.toLowerCase() && (
                                <button
                                  className="tba-nft-transfer-btn"
                                  onClick={() => setTransferringTBANft(ownedNft)}
                                  title="Transfer this NFT from TBA"
                                >
                                  Transfer
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                        {transferringTBANft && (
                          <TBANFTTransfer
                            tbaAddress={tbaAddress}
                            nft={{
                              token_id: transferringTBANft.tokenId,
                              contract_address: web3Config.nftContract,
                              name: transferringTBANft.metadata?.name || `Token #${transferringTBANft.tokenId}`
                            }}
                            onTransferComplete={handleTBANftTransferComplete}
                            onCancel={() => setTransferringTBANft(null)}
                          />
                        )}
                      </div>
                    )}
                    {!loadingTBA && tbaOwnedNFTs.length === 0 && (
                      <p>No NFTs owned by this TBA yet.</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Transfer Section */}
            {account && nft.owner.toLowerCase() === account.toLowerCase() && !nft.isSbt && (
              <div className="transfer-section">
                <h3>Transfer NFT</h3>
                <div className="transfer-form">
                  <input
                    type="text"
                    placeholder="Recipient address (0x...)"
                    value={transferTo}
                    onChange={(e) => setTransferTo(e.target.value)}
                    className="transfer-input"
                    disabled={transferring}
                  />
                  <button
                    onClick={handleTransfer}
                    disabled={transferring || !transferTo}
                    className="transfer-button"
                  >
                    {transferring ? 'Transferring...' : 'Transfer'}
                  </button>
                </div>
              </div>
            )}

            {/* Burn Section */}
            {account && nft.owner.toLowerCase() === account.toLowerCase() && !nft.isSbt && (
              <div className="burn-section">
                <h3>Burn NFT</h3>
                <p className="burn-warning">⚠️ Burning is permanent and cannot be undone. The NFT will be destroyed forever.</p>
                <button
                  onClick={() => setShowBurnConfirmation(true)}
                  disabled={burning}
                  className="burn-button"
                >
                  {burning ? 'Burning...' : '🔥 Burn NFT'}
                </button>
              </div>
            )}

            {/* Burn Confirmation Dialog */}
            {showBurnConfirmation && createPortal(
              <div className="burn-confirmation-overlay" onClick={() => setShowBurnConfirmation(false)}>
                <div className="burn-confirmation-dialog" onClick={(e) => e.stopPropagation()}>
                  <h3>⚠️ Confirm NFT Burn</h3>
                  <p>Are you absolutely sure you want to burn this NFT?</p>
                  <p className="burn-nft-info">
                    <strong>{metadata?.name || `NFT #${id}`}</strong><br/>
                    Token ID: {id}
                  </p>
                  <p className="burn-final-warning">This action is <strong>permanent</strong> and <strong>cannot be undone</strong>.</p>
                  <div className="burn-confirmation-buttons">
                    <button 
                      onClick={() => setShowBurnConfirmation(false)}
                      className="cancel-burn-button"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleBurn}
                      className="confirm-burn-button"
                    >
                      Yes, Burn NFT
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NFTDetailPage;