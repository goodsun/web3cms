import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useWeb3 } from "../contexts/Web3Context";
import { useSettings } from "../contexts/SettingsContext";
import { useI18n } from "../contexts/I18nContext";
import { getNFTContract } from "../utils/contractHelpers";
import { getRpcProvider } from "../utils/rpcUtils";
import { ethers } from "ethers";
import { userService } from '../services/api';
import NFTCard from "../components/NFTCard";
import "./NFTsPage.css";

const ITEMS_PER_PAGE = 9;

const NFTsPage = () => {
  const navigate = useNavigate();
  const { account, isConnected } = useWeb3();
  const { settings, loading: settingsLoading } = useSettings();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState("all");
  const [nfts, setNfts] = useState([]);
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [contractInfo, setContractInfo] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const observerRef = useRef();
  const lastNftElementRef = useRef();

  const web3Config = settings?.web3 || {};

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch NFT contract info
  useEffect(() => {
    const fetchContractInfo = async () => {
      if (!web3Config.nftContract || !web3Config.rpcUrls) return;

      const activeProvider = getRpcProvider(
        web3Config.rpcUrls,
        web3Config.defaultChainId,
        ethers
      );

      if (!activeProvider) return;

      try {
        const nftContract = getNFTContract(
          web3Config.nftContract,
          activeProvider
        );

        const [name, symbol] = await Promise.all([
          nftContract.name().catch(() => "NFT Collection"),
          nftContract.symbol().catch(() => "NFT"),
        ]);

        setContractInfo({ name, symbol });
      } catch (error) {
        console.error("Failed to fetch contract info:", error);
      }
    };

    fetchContractInfo();
  }, [web3Config.nftContract, web3Config.rpcUrls, web3Config.defaultChainId]);

  // Fetch NFTs based on active tab
  const fetchNFTs = useCallback(async (startIndex = 0, append = false) => {
    if (!web3Config.nftContract || !web3Config.rpcUrls) {
      setError(t('nfts.error', 'Failed to load NFTs. Please try again.'));
      return;
    }

    if (startIndex === 0) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);

    try {
      const activeProvider = getRpcProvider(
        web3Config.rpcUrls,
        web3Config.defaultChainId,
        ethers
      );

      if (!activeProvider) {
        throw new Error('No provider available');
      }

      const nftContract = getNFTContract(web3Config.nftContract, activeProvider);

      let nftList = [];
      let endIndex = startIndex + ITEMS_PER_PAGE;

      if (activeTab === "all") {
        // Fetch all NFTs
        const totalSupply = await nftContract.totalSupply();
        const totalSupplyNum = Number(totalSupply);
        
        if (startIndex >= totalSupplyNum) {
          setHasMore(false);
          return;
        }

        endIndex = Math.min(endIndex, totalSupplyNum);

        for (let i = startIndex; i < endIndex; i++) {
          try {
            const [owner, tokenURI, creator] = await Promise.all([
              nftContract.ownerOf(i),
              nftContract.tokenURI(i),
              nftContract.tokenCreator(i).catch(() => null),
            ]);

            // Fetch metadata
            let metadata = {};
            try {
              const response = await fetch(tokenURI);
              metadata = await response.json();
            } catch (err) {
              console.warn("Could not fetch metadata for token", i);
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
          } catch (err) {
            console.warn(`Error fetching token ${i}:`, err);
          }
        }

        setHasMore(endIndex < totalSupplyNum);
      } else if (activeTab === "owned" && account) {
        // Fetch owned NFTs
        const balance = await nftContract.balanceOf(account);
        const balanceNum = Number(balance);

        if (startIndex >= balanceNum) {
          setHasMore(false);
          return;
        }

        endIndex = Math.min(endIndex, balanceNum);

        for (let i = startIndex; i < endIndex; i++) {
          try {
            const tokenId = await nftContract.tokenOfOwnerByIndex(account, i);
            const [tokenURI, creator] = await Promise.all([
              nftContract.tokenURI(tokenId),
              nftContract.tokenCreator(tokenId).catch(() => null),
            ]);

            // Fetch metadata
            let metadata = {};
            try {
              const response = await fetch(tokenURI);
              metadata = await response.json();
            } catch (err) {
              console.warn("Could not fetch metadata for token", tokenId);
            }

            nftList.push({
              tokenId: tokenId.toString(),
              owner: account,
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
      } else if (activeTab === "created" && account) {
        // For created NFTs, we need to scan through all tokens
        // This is inefficient but necessary without an index
        const totalSupply = await nftContract.totalSupply();
        const totalSupplyNum = Number(totalSupply);
        
        let scannedCount = 0;
        let foundCount = 0;

        for (let i = 0; i < totalSupplyNum && foundCount < endIndex; i++) {
          try {
            const creator = await nftContract.tokenCreator(i).catch(() => null);
            
            if (creator && creator.toLowerCase() === account.toLowerCase()) {
              if (scannedCount >= startIndex) {
                const [owner, tokenURI] = await Promise.all([
                  nftContract.ownerOf(i),
                  nftContract.tokenURI(i),
                ]);

                // Fetch metadata
                let metadata = {};
                try {
                  const response = await fetch(tokenURI);
                  metadata = await response.json();
                } catch (err) {
                  console.warn("Could not fetch metadata for token", i);
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
      console.error("Failed to fetch NFTs:", err);
      setError(t('nfts.error', 'Failed to load NFTs. Please try again.'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeTab, account, web3Config, t]);

  // Fetch creators
  const fetchCreators = useCallback(async () => {
    if (!web3Config.nftContract || !web3Config.rpcUrls) {
      setError(t('nfts.error', 'Failed to load NFTs. Please try again.'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const activeProvider = getRpcProvider(
        web3Config.rpcUrls,
        web3Config.defaultChainId,
        ethers
      );

      if (!activeProvider) {
        throw new Error('No provider available');
      }

      const nftContract = getNFTContract(web3Config.nftContract, activeProvider);

      // Get all creators
      const creatorsList = await nftContract.getCreators();
      
      // Fetch user info for all creators
      const batchResult = await userService.getBatchUsers(creatorsList);
      const creatorsWithInfo = creatorsList.map(creator => {
        const userInfo = batchResult.users?.find(
          u => u.eoa.toLowerCase() === creator.toLowerCase()
        );
        return {
          address: creator,
          name: userInfo?.name,
          avatar: userInfo?.avatar,
        };
      });

      setCreators(creatorsWithInfo);
      setHasMore(false); // Creators don't have pagination
    } catch (err) {
      console.error("Failed to fetch creators:", err);
      setError(t('nfts.error', 'Failed to load NFTs. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [web3Config, t]);

  // Effect to fetch data when tab changes
  useEffect(() => {
    setNfts([]);
    setCreators([]);
    setCurrentIndex(0);
    setHasMore(true);

    if (activeTab === "creators") {
      fetchCreators();
    } else {
      fetchNFTs(0, false);
    }
  }, [activeTab, fetchNFTs, fetchCreators]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (loading || loadingMore || !hasMore || activeTab === "creators") return;

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
  }, [loading, loadingMore, hasMore, currentIndex, fetchNFTs, activeTab]);

  const formatAddress = (addr) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (settingsLoading) {
    return (
      <div className="nfts-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>{t("common.loading", "Loading...")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="nfts-page">
      <div className="page-header">
        <h1>{contractInfo?.name || t('nfts.title', 'NFT Collection')}</h1>
        {contractInfo && (
          <div className="contract-info">
            <small>
              {contractInfo.symbol} • {formatAddress(web3Config.nftContract)}
            </small>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === "creators" ? "active" : ""}`}
          onClick={() => setActiveTab("creators")}
        >
          {isMobile ? "Creators" : t("nfts.viewAllCreators", "View All Creators")}
        </button>
        <button
          className={`tab-button ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          {isMobile ? "All" : t("nfts.allNfts", "All NFTs")}
        </button>
        {isConnected && account && (
          <>
            <button
              className={`tab-button ${activeTab === "owned" ? "active" : ""}`}
              onClick={() => setActiveTab("owned")}
            >
              {isMobile ? "Owned" : t("nfts.viewMyNfts", "View My NFTs")}
            </button>
            <button
              className={`tab-button ${activeTab === "created" ? "active" : ""}`}
              onClick={() => setActiveTab("created")}
            >
              {isMobile ? "Created" : t("nfts.viewMyCreatedNfts", "View My Created NFTs")}
            </button>
          </>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>{t("nfts.loading", "Loading NFT collection...")}</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="error-state">
          <p className="error-message">{error}</p>
        </div>
      )}

      {/* Content based on active tab */}
      {!loading && !error && (
        <>
          {activeTab === "creators" ? (
            <div className="creators-grid">
              {creators.map((creator, index) => (
                <Link
                  key={creator.address}
                  to={`/nfts/creator/${creator.address}`}
                  className="creator-card"
                >
                  <div className="creator-avatar">
                    {creator.avatar ? (
                      <img
                        src={creator.avatar}
                        alt={creator.name || "Creator avatar"}
                        className="avatar-image"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextElementSibling.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div
                      className={`avatar-placeholder ${
                        creator.avatar ? "" : "show"
                      }`}
                    >
                      {creator.name
                        ? creator.name.charAt(0).toUpperCase()
                        : index + 1}
                    </div>
                  </div>
                  <div className="creator-info">
                    <div className="creator-name">
                      {creator.name || formatAddress(creator.address)}
                    </div>
                    <div className="creator-label">
                      {creator.name
                        ? formatAddress(creator.address)
                        : `Creator #${index + 1}`}
                    </div>
                  </div>
                  <div className="creator-arrow">→</div>
                </Link>
              ))}
              {creators.length === 0 && (
                <div className="empty-state">
                  <p>{t("nfts.noCreators", "No creators found")}</p>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className={`nft-grid ${isMobile ? 'instagram-mode' : ''}`}>
                {nfts.map((nft, index) => (
                  <div
                    key={`${nft.tokenId}-${index}`}
                    ref={index === nfts.length - 1 ? lastNftElementRef : null}
                  >
                    <NFTCard
                      nft={nft}
                      onClick={() => navigate(`/nfts/token/${nft.tokenId}`)}
                    />
                  </div>
                ))}
              </div>
              
              {nfts.length === 0 && (
                <div className="empty-state">
                  <p>{t("nfts.noNfts", "No NFTs found in your collection")}</p>
                </div>
              )}

              {loadingMore && (
                <div className="loading-more">
                  <div className="spinner"></div>
                  <p>{t("common.loading", "Loading...")}</p>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default NFTsPage;