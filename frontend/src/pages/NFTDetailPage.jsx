import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import { useSettings } from '../contexts/SettingsContext';
import { getNFTContract, getTBARegistry } from '../utils/contractHelpers';
import { ethers } from 'ethers';
import './NFTDetailPage.css';

const NFTDetailPage = () => {
  const { id } = useParams();
  const { account, provider } = useWeb3();
  const { settings } = useSettings();
  const [nft, setNft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [tbaAddress, setTbaAddress] = useState(null);
  const [transferTo, setTransferTo] = useState('');
  const [transferring, setTransferring] = useState(false);

  const web3Config = settings?.web3 || {};

  useEffect(() => {
    const fetchNFTDetails = async () => {
      if (!provider || !web3Config.nftContract || !id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const nftContract = getNFTContract(web3Config.nftContract, provider);

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

        // Get creator if available
        let creator = null;
        try {
          creator = await nftContract.getCreator(id);
        } catch (err) {
          console.warn('Could not fetch creator:', err);
        }

        const nftData = {
          tokenId: id,
          owner,
          creator,
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
          } catch (err) {
            console.warn('Could not fetch metadata:', err);
          }
        }

        // Calculate TBA address if configured
        if (web3Config.tbaRegistry && web3Config.tbaImplementation) {
          try {
            const registry = getTBARegistry(web3Config.tbaRegistry, provider);
            const chainId = await provider.getNetwork().then(n => n.chainId);
            const salt = web3Config.tbaSalt || '0';
            
            const tba = await registry.account(
              web3Config.tbaImplementation,
              salt,
              chainId,
              web3Config.nftContract,
              id
            );
            setTbaAddress(tba);
          } catch (err) {
            console.warn('Could not calculate TBA address:', err);
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
  }, [provider, web3Config, id]);

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
      const signer = provider.getSigner();
      const nftContract = getNFTContract(web3Config.nftContract, signer);
      
      const tx = await nftContract.transferFrom(account, transferTo, id);
      await tx.wait();
      
      // Refresh NFT data
      const newOwner = await nftContract.ownerOf(id);
      setNft({ ...nft, owner: newOwner });
      setTransferTo('');
      alert('Transfer successful!');
    } catch (err) {
      console.error('Transfer failed:', err);
      setError(err.message || 'Transfer failed');
    } finally {
      setTransferring(false);
    }
  };

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

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
            <h1>Token #{nft.tokenId}</h1>
            {nft.contractInfo && (
              <div className="contract-info">
                {nft.contractInfo.name} ({nft.contractInfo.symbol})
              </div>
            )}
          </div>

          <div className="nft-content">
            {/* Metadata Display */}
            {metadata && (
              <div className="metadata-section">
                {metadata.image && (
                  <div className="nft-image">
                    <img src={metadata.image} alt={metadata.name || `NFT #${nft.tokenId}`} />
                  </div>
                )}
                <div className="metadata-details">
                  {metadata.name && (
                    <h2 className="nft-name">{metadata.name}</h2>
                  )}
                  {metadata.description && (
                    <p className="nft-description">{metadata.description}</p>
                  )}
                  {metadata.attributes && metadata.attributes.length > 0 && (
                    <div className="attributes">
                      <h3>Attributes</h3>
                      <div className="attributes-grid">
                        {metadata.attributes.map((attr, index) => (
                          <div key={index} className="attribute">
                            <div className="attr-type">{attr.trait_type}</div>
                            <div className="attr-value">{attr.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Details Section */}
            <div className="details-section">
              <h3>Details</h3>
              <div className="detail-item">
                <span className="detail-label">Owner:</span>
                <Link to={`/nfts/owner/${nft.owner}`} className="detail-value address">
                  {formatAddress(nft.owner)}
                </Link>
              </div>
              {nft.creator && (
                <div className="detail-item">
                  <span className="detail-label">Creator:</span>
                  <Link to={`/nfts/creator/${nft.creator}`} className="detail-value address">
                    {formatAddress(nft.creator)}
                  </Link>
                </div>
              )}
              <div className="detail-item">
                <span className="detail-label">Contract:</span>
                <span className="detail-value address">{formatAddress(nft.contractAddress)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Token ID:</span>
                <span className="detail-value">{nft.tokenId}</span>
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
              {tbaAddress && (
                <div className="detail-item">
                  <span className="detail-label">TBA Address:</span>
                  <span className="detail-value address">{formatAddress(tbaAddress)}</span>
                </div>
              )}
            </div>

            {/* Transfer Section */}
            {account && nft.owner.toLowerCase() === account.toLowerCase() && (
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
          </div>
        </div>
      )}
    </div>
  );
};

export default NFTDetailPage;