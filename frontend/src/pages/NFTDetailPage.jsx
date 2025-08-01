import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useWeb3 } from "../contexts/Web3Context";
import { useSettings } from "../contexts/SettingsContext";
import { useI18n } from "../contexts/I18nContext";
import {
  getNFTContract,
  getTBARegistry,
  calculateTBAAddress,
  deployTBA,
  isTBADeployed,
} from "../utils/contractHelpers";
import { ethers } from "ethers";
import { getRpcProvider } from "../utils/rpcUtils";
import nftService from "../services/nftService";
import nftApiService from "../services/nftApiService";
import TBANFTTransfer from "../components/TBANFTTransfer";
import CopyButton from "../components/CopyButton";
import ChainMismatchModal from "../components/ChainMismatchModal";
import { useChainGuard } from "../hooks/useChainGuard";
import UserDisplay from "../components/UserDisplay";
import NFTCard from "../components/NFTCard";
import "./NFTDetailPage.css";
import "./NFTDetailPage-instagram.css";

// Component for rendering URL attributes with MIME type detection
const AttributeUrlCard = ({ trait_type, value, index }) => {
  const { t } = useI18n();
  const [loadingMime, setLoadingMime] = useState(true);
  const [mimeType, setMimeType] = useState(null);
  const [showLightbox, setShowLightbox] = useState(false);
  const valueStr = String(value);
  const url = valueStr.startsWith("http") ? valueStr : `https://${valueStr}`;

  const fetchMimeType = async (url) => {
    try {
      const response = await fetch(url, { method: "HEAD" });
      const contentType = response.headers.get("content-type");
      return contentType;
    } catch (error) {
      console.error("Failed to fetch MIME type:", error);
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
        if (e.key === "Escape") {
          setShowLightbox(false);
        }
      };

      // Prevent body scroll when lightbox is open
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleEsc);

      return () => {
        document.body.style.overflow = "";
        document.removeEventListener("keydown", handleEsc);
      };
    }
  }, [showLightbox]);

  const renderUrlAttribute = () => {
    if (loadingMime) {
      return (
        <div className="attr-content">
          <div className="attr-loading">{t('nfts.detail.loading', 'Loading...')}</div>
        </div>
      );
    }

    // Check MIME type for images
    if (mimeType && mimeType.startsWith("image/")) {
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
              title={t('nfts.detail.viewFullImage', 'Click to view full image')}
            />
          </div>
          {showLightbox &&
            createPortal(
              <div className="lightbox" onClick={() => setShowLightbox(false)}>
                <div
                  className="lightbox-content"
                  onClick={(e) => e.stopPropagation()}
                >
                  <img src={url} alt={trait_type} />
                  <div className="lightbox-header">
                    <span className="lightbox-title">{trait_type}</span>
                    <button
                      className="lightbox-close"
                      onClick={() => setShowLightbox(false)}
                      aria-label={t('nfts.detail.close', 'Close')}
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
    if (
      mimeType &&
      (mimeType === "model/gltf-binary" ||
        mimeType === "model/gltf+json" ||
        mimeType.includes("model/") ||
        (mimeType === "application/octet-stream" &&
          url.match(/\.(glb|gltf)$/i)))
    ) {
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
    if (mimeType && mimeType.startsWith("video/")) {
      return (
        <div className="attr-content">
          <video controls className="attr-video">
            <source src={url} type={mimeType} />
            {t('nfts.detail.noVideoSupport', 'Your browser does not support the video tag.')}
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
  const { t } = useI18n();
  const [nft, setNft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [tbaAddress, setTbaAddress] = useState(null);
  const [tbaDeployed, setTbaDeployed] = useState(false);
  const [tbaBalance, setTbaBalance] = useState("0");
  const [tbaOwnedNFTs, setTbaOwnedNFTs] = useState([]);
  const [loadingTBA, setLoadingTBA] = useState(false);
  const [deployingTBA, setDeployingTBA] = useState(false);
  const [activeTab, setActiveTab] = useState(null); // Will be set based on metadata
  const [transferTo, setTransferTo] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [burning, setBurning] = useState(false);
  const [showBurnConfirmation, setShowBurnConfirmation] = useState(false);
  const [animationMimeType, setAnimationMimeType] = useState(null);
  const [attributeMimeTypes, setAttributeMimeTypes] = useState({});
  const [transferringTBANft, setTransferringTBANft] = useState(null);

  const web3Config = settings?.web3 || {};

  // Chain guard hook
  const {
    isCorrectChain,
    currentChainId,
    expectedChainId,
    showChainModal,
    executeWithChainGuard,
    handleSwitchChain,
    handleCloseModal,
  } = useChainGuard();

  useEffect(() => {
    const fetchNFTDetails = async () => {
      if (!web3Config.nftContract || !id) {
        setLoading(false);
        return;
      }

      // Always use RPC provider for read-only operations
      let activeProvider = null;
      if (web3Config.rpcUrls) {
        activeProvider = getRpcProvider(
          web3Config.rpcUrls,
          web3Config.defaultChainId,
          ethers
        );
      }

      if (!activeProvider) {
        setError(t('nfts.detail.noProvider', 'No provider available. Please check RPC configuration.'));
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Try to get NFT info from API first
        let nftData = null;
        let apiData = null;
        
        try {
          // Use force refresh if requested (you can add this feature later)
          const forceRefresh = false;
          console.log('API Call: getNFTInfo', { contractAddress: web3Config.nftContract, tokenId: id, forceRefresh });
          apiData = await nftApiService.getNFTInfo(web3Config.nftContract, id, forceRefresh);
          
          // Check if NFT is burned
          if (apiData.burned) {
            setError(t('nfts.detail.burned', 'This NFT has been burned and no longer exists.'));
            setLoading(false);
            return;
          }
          
          // Transform API data to match existing format
          nftData = {
            tokenId: id,
            owner: apiData.owner,
            creator: apiData.creator,
            isSbt: apiData.sbtFlag || false,
            tokenURI: apiData.tokenURI,
            contractAddress: web3Config.nftContract,
            contractInfo: {}, // We'll get this from RPC as fallback
            name: apiData.name,
            description: apiData.description,
            imageUrl: apiData.imageUrl,
            tba: apiData.tba,
            royalty: apiData.royalty,
          };
        } catch (apiError) {
          console.warn("Failed to fetch from API, falling back to RPC:", apiError);
          
          // Fallback to direct RPC calls
          const nftContract = getNFTContract(
            web3Config.nftContract,
            activeProvider
          );

          // Get basic NFT info
          console.log('RPC Call: ownerOf', { contractAddress: web3Config.nftContract, tokenId: id });
          console.log('RPC Call: tokenURI', { contractAddress: web3Config.nftContract, tokenId: id });
          const [owner, tokenURI] = await Promise.all([
            nftContract.ownerOf(id),
            nftContract.tokenURI(id),
          ]);

          // Get contract info
          let contractInfo = {};
          try {
            console.log('RPC Call: name', { contractAddress: web3Config.nftContract });
            console.log('RPC Call: symbol', { contractAddress: web3Config.nftContract });
            const [name, symbol] = await Promise.all([
              nftContract.name(),
              nftContract.symbol(),
            ]);
            contractInfo = { name, symbol };
          } catch (err) {
            console.warn("Could not fetch contract info:", err);
          }

          // Get creator and SBT flag if available
          let creator = null;
          let isSbt = false;
          try {
            console.log('RPC Call: tokenCreator', { contractAddress: web3Config.nftContract, tokenId: id });
            creator = await nftContract.tokenCreator(id);
          } catch (err) {
            console.warn("Could not fetch creator:", err);
          }
          try {
            console.log('RPC Call: sbtFlag', { contractAddress: web3Config.nftContract, tokenId: id });
            isSbt = await nftContract.sbtFlag(id);
          } catch (err) {
            console.warn("Could not fetch SBT flag:", err);
          }

          nftData = {
            tokenId: id,
            owner,
            creator,
            isSbt,
            tokenURI,
            contractAddress: web3Config.nftContract,
            contractInfo,
          };
        }

        // If we got data from API but need contract info, get it from RPC
        if (apiData && (!nftData.contractInfo || !nftData.contractInfo.name)) {
          try {
            const nftContract = getNFTContract(
              web3Config.nftContract,
              activeProvider
            );
            console.log('RPC Call: name (for API data)', { contractAddress: web3Config.nftContract });
            console.log('RPC Call: symbol (for API data)', { contractAddress: web3Config.nftContract });
            const [name, symbol] = await Promise.all([
              nftContract.name(),
              nftContract.symbol(),
            ]);
            nftData.contractInfo = { name, symbol };
          } catch (err) {
            console.warn("Could not fetch contract info:", err);
            nftData.contractInfo = {};
          }
        }

        setNft(nftData);

        // Fetch metadata if tokenURI is available
        if (apiData && (apiData.name || apiData.description || apiData.imageUrl)) {
          // If we got metadata from API, use it directly
          const metadataFromApi = {
            name: apiData.name,
            description: apiData.description,
            image: apiData.imageUrl,
            animation_url: apiData.animation_url,
            youtube_url: apiData.youtube_url,
            model: apiData.model,
            attributes: apiData.attributes,
            external_url: apiData.external_url,
            background_color: apiData.background_color,
            properties: apiData.properties,
            // Keep any other fields from apiData
            ...apiData,
          };
          setMetadata(metadataFromApi);
          
          // Set default tab based on available media
          if (!activeTab) {
            if (metadataFromApi.animation_url) {
              setActiveTab("animation");
              fetchAnimationMimeType(metadataFromApi.animation_url);
            } else if (metadataFromApi.youtube_url) {
              setActiveTab("youtube");
            } else if (metadataFromApi.model) {
              setActiveTab("3d");
            } else if (metadataFromApi.image) {
              setActiveTab("image");
            }
          }
          
          // Check animation_url MIME type if available
          if (metadataFromApi.animation_url) {
            fetchAnimationMimeType(metadataFromApi.animation_url);
          }
        } else if (nftData.tokenURI) {
          // Fallback to fetching metadata from tokenURI
          try {
            const response = await fetch(nftData.tokenURI);
            const data = await response.json();
            setMetadata(data);

            // Set default tab based on available media
            if (!activeTab) {
              if (data.animation_url) {
                setActiveTab("animation");
                fetchAnimationMimeType(data.animation_url);
              } else if (data.youtube_url) {
                setActiveTab("youtube");
              } else if (data.model) {
                setActiveTab("3d");
              } else if (data.image) {
                setActiveTab("image");
              }
            }

            // Check animation_url MIME type if available
            if (data.animation_url) {
              fetchAnimationMimeType(data.animation_url);
            }
          } catch (err) {
            console.warn("Could not fetch metadata:", err);
          }
        }

        // Calculate TBA address if configured
        if (web3Config.tbaRegistry && web3Config.tbaImplementation) {
          try {
            let tba;
            // If we got TBA from API, use it
            if (apiData && apiData.tba) {
              tba = apiData.tba;
              setTbaAddress(tba);
            } else {
              // Fallback to calculating TBA
              const registry = getTBARegistry(
                web3Config.tbaRegistry,
                activeProvider
              );
              const chainId = await activeProvider
                .getNetwork()
                .then((n) => n.chainId);
              const salt = ethers.toBigInt(web3Config.tbaSalt || "0");

              // Log parameters for debugging
              console.log("TBA calculation params:", {
                registry: web3Config.tbaRegistry,
                implementation: web3Config.tbaImplementation,
                chainId: chainId.toString(),
                nftContract: web3Config.nftContract,
                tokenId: id,
                salt: salt.toString(),
              });

              tba = await calculateTBAAddress(
                web3Config.tbaRegistry,
                web3Config.tbaImplementation,
                salt.toString(),
                Number(chainId),
                web3Config.nftContract,
                id,
                activeProvider
              );
              setTbaAddress(tba);
            }

            // Check if TBA is deployed
            console.log('RPC Call: getCode (check TBA deployment)', { address: tba });
            const isDeployed = await isTBADeployed(tba, activeProvider);
            setTbaDeployed(isDeployed);

            if (isDeployed) {
              // Get TBA balance
              console.log('RPC Call: getBalance', { address: tba });
              const balance = await activeProvider.getBalance(tba);
              setTbaBalance(ethers.formatEther(balance));

              // Get NFTs owned by TBA
              await fetchTBAOwnedNFTs(tba, activeProvider);
            }
          } catch (err) {
            console.warn(
              "TBA feature not available on this network:",
              err.message
            );
            // TBA is optional, continue without it
          }
        }
      } catch (err) {
        console.error("Failed to fetch NFT details:", err);
        setError(err.message || t('nfts.detail.fetchError', 'Failed to fetch NFT details'));
      } finally {
        setLoading(false);
      }
    };

    fetchNFTDetails();
  }, [
    web3Config.nftContract,
    web3Config.rpcUrls,
    web3Config.defaultChainId,
    web3Config.tbaRegistry,
    web3Config.tbaImplementation,
    web3Config.tbaSalt,
    id,
  ]);

  const fetchTBAOwnedNFTs = async (tbaAddr, activeProvider) => {
    if (!activeProvider || !web3Config.nftContract) return;

    setLoadingTBA(true);
    try {
      const nftContract = getNFTContract(
        web3Config.nftContract,
        activeProvider
      );
      const ownedNFTs = [];

      // Get total supply and check ownership for each token
      // This is a simplified approach - in production, you'd want to use events or a more efficient method
      try {
        console.log('RPC Call: balanceOf (TBA)', { contractAddress: web3Config.nftContract, owner: tbaAddr });
        const balance = await nftContract.balanceOf(tbaAddr);
        const balanceNum = Number(balance);

        if (balanceNum > 0) {
          // Try to get tokens by index
          for (let i = 0; i < balanceNum && i < 10; i++) {
            // Limit to 10 for performance
            try {
              console.log('RPC Call: tokenOfOwnerByIndex', { contractAddress: web3Config.nftContract, owner: tbaAddr, index: i });
              const tokenId = await nftContract.tokenOfOwnerByIndex(tbaAddr, i);
              console.log('RPC Call: tokenURI (TBA owned)', { contractAddress: web3Config.nftContract, tokenId: tokenId.toString() });
              const tokenURI = await nftContract.tokenURI(tokenId);

              // Fetch metadata
              let metadata = null;
              try {
                const response = await fetch(tokenURI);
                metadata = await response.json();
              } catch (err) {
                console.warn("Could not fetch metadata:", err);
              }

              ownedNFTs.push({
                tokenId: tokenId.toString(),
                tokenURI,
                metadata,
              });
            } catch (err) {
              console.warn("Could not fetch token by index:", err);
            }
          }
        }
      } catch (err) {
        console.warn("Could not enumerate TBA owned tokens:", err);
      }

      setTbaOwnedNFTs(ownedNFTs);
    } catch (err) {
      console.error("Failed to fetch TBA owned NFTs:", err);
    } finally {
      setLoadingTBA(false);
    }
  };

  const handleDeployTBA = async () => {
    if (!account || !provider || !signer) {
      setError(t('nfts.detail.connectWallet', 'Please connect your wallet'));
      return;
    }

    if (nft.owner.toLowerCase() !== account.toLowerCase()) {
      setError(t('nfts.detail.notOwner', 'You are not the owner of this NFT'));
      return;
    }

    // Execute with chain guard
    executeWithChainGuard(async () => {
      setDeployingTBA(true);
      setError(null);

      try {
        const chainId = await provider.getNetwork().then((n) => n.chainId);
        const salt = ethers.toBigInt(web3Config.tbaSalt || "0");

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
          activeProvider =
            getRpcProvider(
              web3Config.rpcUrls,
              web3Config.defaultChainId,
              ethers
            ) || provider;
        }

        const balance = await activeProvider.getBalance(tbaAddress);
        setTbaBalance(ethers.formatEther(balance));
        await fetchTBAOwnedNFTs(tbaAddress, activeProvider);

        alert(t('nfts.detail.tbaDeploySuccess', 'TBA deployed successfully!'));
      } catch (err) {
        console.error("Failed to deploy TBA:", err);
        setError(err.message || t('nfts.detail.tbaDeployError', 'Failed to deploy TBA'));
      } finally {
        setDeployingTBA(false);
      }
    });
  };

  const handleTransfer = async () => {
    if (!transferTo || !ethers.isAddress(transferTo)) {
      setError(t('nfts.detail.invalidAddress', 'Please enter a valid address'));
      return;
    }

    if (!account) {
      setError(t('nfts.detail.connectWallet', 'Please connect your wallet'));
      return;
    }

    if (nft.owner.toLowerCase() !== account.toLowerCase()) {
      setError(t('nfts.detail.notOwner', 'You are not the owner of this NFT'));
      return;
    }

    // Execute with chain guard
    executeWithChainGuard(async () => {
      setTransferring(true);
      setError(null);

      try {
        if (!signer) {
          setError(t('nfts.detail.walletNotConnected', 'Wallet not properly connected'));
          return;
        }

        const nftContract = getNFTContract(web3Config.nftContract, signer);

        // Add logging for debugging
        console.log("Transfer parameters:", {
          from: account,
          to: transferTo,
          tokenId: id,
        });

        if (window.addDebugLog) {
          window.addDebugLog("info", "Initiating NFT transfer", {
            from: account,
            to: transferTo,
            tokenId: id,
            contract: web3Config.nftContract,
          });
        }

        // Use safeTransferFrom instead of transferFrom for better compatibility
        // Also explicitly set gas limit for mobile compatibility
        const gasEstimate = await nftContract[
          "safeTransferFrom(address,address,uint256)"
        ].estimateGas(account, transferTo, id);

        const tx = await nftContract[
          "safeTransferFrom(address,address,uint256)"
        ](account, transferTo, id, {
          gasLimit: (gasEstimate * 120n) / 100n, // Add 20% buffer
        });

        if (window.addDebugLog) {
          window.addDebugLog("info", "Transaction sent", { hash: tx.hash });
        }

        await tx.wait();

        // Refresh NFT data
        const newOwner = await nftContract.ownerOf(id);
        setNft({ ...nft, owner: newOwner });
        setTransferTo("");
        alert(t('nfts.detail.transferSuccess', 'Transfer successful!'));
      } catch (err) {
        console.error("Transfer failed:", err);
        if (window.addDebugLog) {
          window.addDebugLog("error", "Transfer failed", {
            error: err.message,
            code: err.code,
          });
        }
        setError(err.message || t('nfts.detail.transferError', 'Transfer failed'));
      } finally {
        setTransferring(false);
      }
    });
  };

  const handleBurn = async () => {
    if (!account) {
      setError(t('nfts.detail.connectWallet', 'Please connect your wallet'));
      return;
    }
    if (nft.owner.toLowerCase() !== account.toLowerCase()) {
      setError(t('nfts.detail.notOwner', 'You are not the owner of this NFT'));
      return;
    }

    setShowBurnConfirmation(false);

    // Execute with chain guard
    executeWithChainGuard(async () => {
      setBurning(true);
      setError(null);

      try {
        if (!signer) {
          setError(t('nfts.detail.walletNotConnected', 'Wallet not properly connected'));
          return;
        }

        const result = await nftService.burnNFT(
          web3Config.nftContract,
          id,
          signer
        );

        if (result.success) {
          alert(t('nfts.detail.burnSuccess', 'NFT burned successfully!'));
          // Navigate to the NFTs list page since this NFT no longer exists
          navigate("/nfts");
        }
      } catch (err) {
        console.error("Burn failed:", err);
        setError(err.message || t('nfts.detail.burnError', 'Failed to burn NFT'));
        setBurning(false);
      }
    });
  };

  const formatAddress = (addr) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleTBANftTransferComplete = async (nft, recipientAddress) => {
    // Hide the transfer UI
    setTransferringTBANft(null);

    // Refresh TBA owned NFTs
    let activeProvider = provider;
    if (web3Config.rpcUrls) {
      activeProvider =
        getRpcProvider(web3Config.rpcUrls, web3Config.defaultChainId, ethers) ||
        provider;
    }

    if (activeProvider && tbaAddress) {
      await fetchTBAOwnedNFTs(tbaAddress, activeProvider);
    }

    alert(t('nfts.detail.transferSuccessTo', 'NFT transferred successfully to {{address}}').replace('{{address}}', recipientAddress));
  };

  const fetchAnimationMimeType = async (url) => {
    try {
      const response = await fetch(url, { method: "HEAD" });
      const contentType = response.headers.get("content-type");
      setAnimationMimeType(contentType);
      return contentType;
    } catch (error) {
      console.error("Failed to fetch MIME type:", error);
      return null;
    }
  };

  const is3DContent = (animationUrl, mimeType) => {
    if (!animationUrl) return false;

    // Check MIME type first if available
    if (mimeType) {
      return (
        mimeType.includes("model/") ||
        mimeType.includes("application/octet-stream") ||
        mimeType === "model/gltf+json" ||
        mimeType === "model/gltf-binary"
      );
    }

    // Check metadata mime_type if available
    if (metadata?.animation_mime_type) {
      return (
        metadata.animation_mime_type.includes("model/") ||
        metadata.animation_mime_type.includes("application/octet-stream") ||
        metadata.animation_mime_type === "model/gltf+json" ||
        metadata.animation_mime_type === "model/gltf-binary"
      );
    }

    // Fallback to file extension check
    const url = animationUrl.toLowerCase();
    return (
      url.includes(".gltf") ||
      url.includes(".glb") ||
      url.includes(".obj") ||
      url.includes(".fbx")
    );
  };

  // Add mobile class for specific styling
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        document.body.classList.add("nft-detail-mobile");
      } else {
        document.body.classList.remove("nft-detail-mobile");
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      document.body.classList.remove("nft-detail-mobile");
    };
  }, []);

  return (
    <div className="nft-detail-page">
      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>{t('nfts.detail.loading', 'Loading NFT details...')}</p>
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
                  <span>
                    {nft.contractInfo.name} ({nft.contractInfo.symbol})
                  </span>
                )}
                <span className="separator">•</span>
                <span>Token ID: {nft.tokenId}</span>
              </div>
            </div>
          </div>

          <div className="nft-content">
            {/* Media tabs */}
            {(metadata?.image ||
              metadata?.animation_url ||
              metadata?.model ||
              metadata?.youtube_url) && (
              <div className="media-tabs">
                {metadata?.image && (
                  <button
                    className={`media-tab ${
                      activeTab === "image" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("image")}
                  >
                    Image
                  </button>
                )}
                {metadata?.animation_url && (
                  <button
                    className={`media-tab ${
                      activeTab === "animation" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("animation")}
                  >
                    {is3DContent(metadata.animation_url, animationMimeType)
                      ? "3D Model"
                      : "Animation"}
                  </button>
                )}
                {metadata?.model && (
                  <button
                    className={`media-tab ${
                      activeTab === "3d" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("3d")}
                  >
                    3D Model
                  </button>
                )}
                {metadata?.youtube_url && (
                  <button
                    className={`media-tab ${
                      activeTab === "youtube" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("youtube")}
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
                  {activeTab === "image" && metadata.image && (
                    <div className="nft-image">
                      <img
                        src={metadata.image}
                        alt={metadata.name || `NFT #${nft.tokenId}`}
                      />
                    </div>
                  )}
                  {activeTab === "animation" &&
                    metadata.animation_url &&
                    (is3DContent(metadata.animation_url, animationMimeType) ? (
                      <div className="nft-3d-model">
                        <iframe
                          src={`https://3d.bon-soleil.com/?src=${encodeURIComponent(
                            metadata.animation_url
                          )}`}
                          title={t('nfts.detail.3dViewer', '3D Model Viewer')}
                          width="100%"
                          height="600"
                          frameBorder="0"
                          allowFullScreen
                        />
                        <div className="external-link-wrapper">
                          <a
                            href={`https://3d.bon-soleil.com/?src=${encodeURIComponent(
                              metadata.animation_url
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="external-link"
                          >
                            {t('nfts.detail.open3D', 'Open in 3D Viewer')}
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="nft-animation">
                        <video controls loop autoPlay muted>
                          <source src={metadata.animation_url} />
                          {t('nfts.detail.noVideoSupport', 'Your browser does not support the video tag.')}
                        </video>
                      </div>
                    ))}
                  {activeTab === "3d" && metadata.model && (
                    <div className="nft-3d-model">
                      <iframe
                        src={`https://3d.bon-soleil.com/?src=${encodeURIComponent(
                          metadata.model
                        )}`}
                        title="3D Model Viewer"
                        width="100%"
                        height="500"
                        frameBorder="0"
                        allowFullScreen
                      />
                      <div className="external-link-wrapper">
                        <a
                          href={`https://3d.bon-soleil.com/?src=${encodeURIComponent(
                            metadata.model
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="external-link"
                        >
                          Open in 3D Viewer
                        </a>
                      </div>
                    </div>
                  )}
                  {activeTab === "youtube" &&
                    metadata.youtube_url &&
                    (() => {
                      // Extract YouTube video ID from various URL formats
                      const getYouTubeId = (url) => {
                        const regExp =
                          /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
                        const match = url.match(regExp);
                        return match && match[2].length === 11
                          ? match[2]
                          : null;
                      };

                      const videoId = getYouTubeId(metadata.youtube_url);

                      return (
                        <div className="nft-youtube">
                          {videoId ? (
                            <iframe
                              src={`https://www.youtube.com/embed/${videoId}`}
                              title={t('nfts.detail.youtubePlayer', 'YouTube video player')}
                              width="100%"
                              height="500"
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          ) : (
                            <div className="youtube-error">
                              <p>{t('nfts.detail.youtubeEmbedError', 'Unable to embed YouTube video')}</p>
                              <a
                                href={metadata.youtube_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="external-link"
                              >
                                {t('nfts.detail.watchYouTube', 'Watch on YouTube')}
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                </div>
                {/* Details Section moved here */}
                <div className="details-section">
                  <h3>{t('nfts.detail.details', 'Details')}</h3>
                  <div className="detail-item">
                    <span className="detail-label">{t('nfts.owner', 'Owner')}:</span>
                    <div className="detail-value-wrapper">
                      <UserDisplay
                        address={nft.owner}
                        size="medium"
                        linkToProfile={true}
                      />
                      <CopyButton text={nft.owner} label={t('nfts.detail.ownerAddress', 'Owner address')} />
                    </div>
                  </div>
                  {nft.creator && (
                    <div className="detail-item">
                      <span className="detail-label">{t('nfts.creator', 'Creator')}:</span>
                      <div className="detail-value-wrapper">
                        <UserDisplay
                          address={nft.creator}
                          size="medium"
                          linkToProfile={true}
                        />
                        <CopyButton
                          text={nft.creator}
                          label={t('nfts.detail.creatorAddress', 'Creator address')}
                        />
                      </div>
                    </div>
                  )}
                  <div className="detail-item">
                    <span className="detail-label">{t('nfts.contractAddress', 'Contract')}:</span>
                    <div className="detail-value-wrapper">
                      <span className="detail-value address">
                        {formatAddress(nft.contractAddress)}
                      </span>
                      <CopyButton
                        text={nft.contractAddress}
                        label={t('nfts.detail.contractAddress', 'Contract address')}
                      />
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
                        {t('nfts.detail.viewJSON', 'View JSON')}
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
                        🔗 {t('nfts.detail.visitWebsite', 'Visit Website')}
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
                        ▶️ {t('nfts.detail.watchVideo', 'Watch Video')}
                      </a>
                    </div>
                  )}
                  {tbaAddress && tbaDeployed && (
                    <div className="detail-item">
                      <span className="detail-label">{t('nfts.detail.tbaAddress', 'TBA Address')}:</span>
                      <div className="detail-value-wrapper">
                        <span className="detail-value address">
                          {formatAddress(tbaAddress)}
                        </span>
                        <CopyButton text={tbaAddress} label={t('nfts.detail.tbaAddress', 'TBA address')} />
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
            {metadata?.attributes &&
              metadata.attributes.length > 0 &&
              (() => {
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
                    <h3>{t('nfts.detail.attributes', 'Attributes')}</h3>

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
                        {urlAttributes.length > 0 && (
                          <div className="attributes-divider" />
                        )}
                        <div className="attributes-text-list">
                          {textAttributes.map(
                            ({ trait_type, value, index }) => (
                              <div key={index} className="attribute-text-item">
                                <span className="attr-type">{trait_type}</span>
                                <span className="attr-value">{value}</span>
                              </div>
                            )
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}

            {/* TBA Section */}
            {tbaAddress && (
              <div className="tba-section">
                <h3>{t('nfts.detail.tbaTitle', 'Token Bound Account (TBA)')}</h3>
                {!tbaDeployed && (
                  <div className="tba-deploy">
                    <p>
                      {t('nfts.detail.tbaDescription', 'Deploy a Token Bound Account for this NFT to enable it to own assets and interact with smart contracts.')}
                    </p>
                    {account &&
                      nft.owner.toLowerCase() === account.toLowerCase() && (
                        <button
                          onClick={handleDeployTBA}
                          disabled={deployingTBA}
                          className="deploy-tba-button"
                        >
                          {deployingTBA ? t('nfts.detail.deploying', 'Deploying...') : t('nfts.detail.deployTBA', 'Deploy TBA')}
                        </button>
                      )}
                    {(!account ||
                      nft.owner.toLowerCase() !== account.toLowerCase()) && (
                      <p className="tba-notice">
                        {t('nfts.detail.tbaConnectPrompt', 'Connect wallet as owner to deploy TBA')}
                      </p>
                    )}
                  </div>
                )}
                {tbaDeployed && (
                  <div className="tba-info">
                    <p>{t('nfts.detail.tbaDeployed', 'This NFT has a Token Bound Account deployed.')}</p>
                    <p className="tba-address-info">
                      TBA Address: <span className="address">{tbaAddress}</span>
                    </p>
                    <p className="tba-balance-info">
                      Balance: <span className="balance">{tbaBalance} ETH</span>
                    </p>
                    {loadingTBA && <p>{t('nfts.detail.loadingTBA', 'Loading TBA owned assets...')}</p>}
                    {!loadingTBA && tbaOwnedNFTs.length > 0 && (
                      <div className="tba-owned-nfts">
                        <h4>{t('nfts.detail.tbaOwnedNFTs', 'NFTs Owned by TBA')}</h4>
                        <div className="tba-nfts-grid nfts-grid">
                          {tbaOwnedNFTs.map((ownedNft) => (
                            <NFTCard
                              key={ownedNft.tokenId}
                              nft={{
                                ...ownedNft,
                                image: ownedNft.metadata?.image,
                                name: ownedNft.metadata?.name,
                                description: ownedNft.metadata?.description,
                              }}
                              showActions={
                                account &&
                                nft.owner.toLowerCase() ===
                                  account.toLowerCase()
                              }
                              onTransfer={() => setTransferringTBANft(ownedNft)}
                            />
                          ))}
                        </div>
                        {transferringTBANft && (
                          <TBANFTTransfer
                            tbaAddress={tbaAddress}
                            nft={{
                              token_id: transferringTBANft.tokenId,
                              contract_address: web3Config.nftContract,
                              name:
                                transferringTBANft.metadata?.name ||
                                `Token #${transferringTBANft.tokenId}`,
                            }}
                            onTransferComplete={handleTBANftTransferComplete}
                            onCancel={() => setTransferringTBANft(null)}
                          />
                        )}
                      </div>
                    )}
                    {!loadingTBA && tbaOwnedNFTs.length === 0 && (
                      <p>{t('nfts.detail.noTBAAssets', 'No NFTs owned by this TBA yet.')}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Transfer Section */}
            {account &&
              nft.owner.toLowerCase() === account.toLowerCase() &&
              !nft.isSbt && (
                <div className="transfer-section">
                  <h3>{t('nfts.detail.transferNFT', 'Transfer NFT')}</h3>
                  <div className="transfer-form">
                    <input
                      type="text"
                      placeholder={t('nfts.detail.recipientPlaceholder', 'Recipient address (0x...')}
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
                      {transferring ? t('nfts.detail.transferring', 'Transferring...') : t('nfts.detail.transfer', 'Transfer')}
                    </button>
                  </div>
                </div>
              )}

            {/* Burn Section */}
            {account &&
              nft.owner.toLowerCase() === account.toLowerCase() &&
              !nft.isSbt && (
                <div className="burn-section">
                  <h3>{t('nfts.detail.burnNFT', 'Burn NFT')}</h3>
                  <p className="burn-warning">
                    ⚠️ {t('nfts.detail.burnWarning', 'Burning is permanent and cannot be undone. The NFT will be destroyed forever.')}
                  </p>
                  <button
                    onClick={() => setShowBurnConfirmation(true)}
                    disabled={burning}
                    className="burn-button"
                  >
                    {burning ? t('nfts.detail.burning', 'Burning...') : t('nfts.detail.burnNFT', 'Burn NFT')}
                  </button>
                </div>
              )}

            {/* Burn Confirmation Dialog */}
            {showBurnConfirmation &&
              createPortal(
                <div
                  className="burn-confirmation-overlay"
                  onClick={() => setShowBurnConfirmation(false)}
                >
                  <div
                    className="burn-confirmation-dialog"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3>⚠️ {t('nfts.detail.confirmBurn', 'Confirm NFT Burn')}</h3>
                    <p>{t('nfts.detail.confirmBurnQuestion', 'Are you absolutely sure you want to burn this NFT?')}</p>
                    <p className="burn-nft-info">
                      <strong>{metadata?.name || `NFT #${id}`}</strong>
                      <br />
                      Token ID: {id}
                    </p>
                    <p className="burn-final-warning">
                      {t('nfts.detail.permanentAction', 'This action is permanent and cannot be undone.')}
                    </p>
                    <div className="burn-confirmation-buttons">
                      <button
                        onClick={() => setShowBurnConfirmation(false)}
                        className="cancel-burn-button"
                      >
                        {t('nfts.detail.cancel', 'Cancel')}
                      </button>
                      <button
                        onClick={handleBurn}
                        className="confirm-burn-button"
                      >
                        {t('nfts.detail.yesBurn', 'Yes, Burn NFT')}
                      </button>
                    </div>
                  </div>
                </div>,
                document.body
              )}
          </div>
        </div>
      )}

      {/* Chain Mismatch Modal */}
      <ChainMismatchModal
        isOpen={showChainModal}
        onClose={handleCloseModal}
        currentChainId={currentChainId}
        expectedChainId={expectedChainId}
        onSwitchChain={handleSwitchChain}
      />
    </div>
  );
};

export default NFTDetailPage;
