import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import { useSettings } from '../contexts/SettingsContext';
import { getNFTContract } from '../utils/contractHelpers';
import { ethers } from 'ethers';
import ChainMismatchModal from '../components/ChainMismatchModal';
import { useChainGuard } from '../hooks/useChainGuard';
import './MintPage.css';

const MintPage = () => {
  const navigate = useNavigate();
  const { account, provider, signer, isConnected } = useWeb3();
  const { settings } = useSettings();
  const [formData, setFormData] = useState({
    recipient: '',
    tokenURI: ''
  });
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [contractInfo, setContractInfo] = useState(null);
  const [metadataPreview, setMetadataPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [mintFee, setMintFee] = useState('0');

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
    const fetchContractInfo = async () => {
      if (!provider || !web3Config.nftContract) return;

      try {
        const nftContract = getNFTContract(web3Config.nftContract, provider);
        const [name, symbol, fee] = await Promise.all([
          nftContract.name(),
          nftContract.symbol(),
          nftContract.mintFee().catch(() => ethers.parseEther('0'))
        ]);
        setContractInfo({ name, symbol });
        setMintFee(ethers.formatEther(fee));
      } catch (err) {
        console.warn('Could not fetch contract info:', err);
      }
    };

    fetchContractInfo();
  }, [provider, web3Config.nftContract]);

  // Set recipient to current account by default
  useEffect(() => {
    if (account && !formData.recipient) {
      setFormData(prev => ({ ...prev, recipient: account }));
    }
  }, [account]);

  // Fetch metadata preview when tokenURI changes
  useEffect(() => {
    const fetchMetadataPreview = async () => {
      if (!formData.tokenURI.trim()) {
        setMetadataPreview(null);
        setPreviewError(null);
        return;
      }

      try {
        setPreviewLoading(true);
        setPreviewError(null);

        const response = await fetch(formData.tokenURI.trim());
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const metadata = await response.json();
        setMetadataPreview(metadata);
      } catch (err) {
        console.error('Failed to fetch metadata:', err);
        setPreviewError(err.message || 'Failed to fetch metadata');
        setMetadataPreview(null);
      } finally {
        setPreviewLoading(false);
      }
    };

    // Debounce the metadata fetch
    const timeoutId = setTimeout(fetchMetadataPreview, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.tokenURI]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleMint = async (e) => {
    e.preventDefault();
    
    if (!isConnected) {
      setError('Please connect your wallet');
      return;
    }

    if (!web3Config.nftContract) {
      setError('NFT contract not configured');
      return;
    }

    const { recipient, tokenURI } = formData;

    // Validate inputs
    if (!recipient || !ethers.isAddress(recipient)) {
      setError('Please enter a valid recipient address');
      return;
    }

    if (!tokenURI) {
      setError('Please enter a token URI');
      return;
    }


    // Execute with chain guard
    executeWithChainGuard(async () => {
      setMinting(true);
      setError(null);
      setSuccess(null);

      try {
      if (!signer) {
        setError('Wallet not properly connected');
        return;
      }
      
      const nftContract = getNFTContract(web3Config.nftContract, signer);

      // Single mint only - mint(address to, string _metaUrl, uint16 feeRate, bool _sbtFlag)
      const tx = await nftContract.mint(
        recipient, 
        tokenURI,
        0,     // feeRate: 0 for no royalty
        false, // sbtFlag: false for transferable NFT
        { value: ethers.parseEther(mintFee) } // Send mint fee if required
      );

      const receipt = await tx.wait();
      
      // Extract token ID from Transfer event
      let tokenId;
      const transferEvent = receipt.events?.find(e => e.event === 'Transfer');
      if (transferEvent) {
        tokenId = transferEvent.args.tokenId.toString();
      }

      setSuccess({
        message: 'Successfully minted NFT!',
        tokenId,
        txHash: receipt.transactionHash
      });

      // Reset form
      setFormData({
        recipient: account || '',
        tokenURI: ''
      });
      setMetadataPreview(null);

      // Navigate to token detail after a delay
      if (tokenId) {
        setTimeout(() => {
          navigate(`/nfts/token/${tokenId}`);
        }, 2000);
      }
    } catch (err) {
      console.error('Minting failed:', err);
      setError(err.message || 'Failed to mint NFT');
    } finally {
      setMinting(false);
    }
    });
  };

  return (
    <div className="mint-page">
      <div className="page-header">
        <h1>Mint NFT</h1>
        {contractInfo && (
          <div className="contract-info">
            {contractInfo.name} ({contractInfo.symbol})
            {parseFloat(mintFee) > 0 && (
              <span> - Mint Fee: {mintFee} ETH</span>
            )}
          </div>
        )}
      </div>

      {!isConnected && (
        <div className="warning-message">
          Please connect your wallet to mint NFTs
        </div>
      )}

      <form onSubmit={handleMint} className="mint-form">
        <div className="form-section">
          <h2>NFT Details</h2>
          
          <div className="form-group">
            <label htmlFor="recipient">Recipient Address</label>
            <input
              type="text"
              id="recipient"
              name="recipient"
              value={formData.recipient}
              onChange={handleInputChange}
              placeholder="0x..."
              className="form-input"
              disabled={minting}
            />
            <small className="form-hint">The address that will receive the NFT</small>
          </div>

          <div className="form-group">
            <label htmlFor="tokenURI">Token URI</label>
            <input
              type="text"
              id="tokenURI"
              name="tokenURI"
              value={formData.tokenURI}
              onChange={handleInputChange}
              placeholder="https://example.com/metadata.json"
              className="form-input"
              disabled={minting}
            />
            <small className="form-hint">URL pointing to the NFT metadata JSON</small>
          </div>

        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {success && (
          <div className="success-message">
            <p>{success.message}</p>
            {success.tokenId && (
              <p>Token ID: #{success.tokenId}</p>
            )}
            {success.txHash && (
              <p>
                Transaction: {success.txHash.slice(0, 10)}...{success.txHash.slice(-8)}
              </p>
            )}
          </div>
        )}

        <div className="form-actions">
          <button
            type="submit"
            disabled={minting || !isConnected}
            className="mint-button"
          >
            {minting ? 'Minting...' : 'Mint NFT'}
          </button>
        </div>
      </form>

      {/* Metadata Preview */}
      {previewLoading && (
        <div className="metadata-preview loading">
          <h3>Loading metadata preview...</h3>
        </div>
      )}

      {previewError && (
        <div className="metadata-preview error">
          <h3>Preview Error</h3>
          <p>{previewError}</p>
        </div>
      )}

      {metadataPreview && !previewLoading && !previewError && (
        <div className="metadata-preview">
          <h3>Metadata Preview</h3>
          <div className="preview-content">
            {metadataPreview.image && (
              <div className="preview-image">
                <img
                  src={metadataPreview.image}
                  alt={metadataPreview.name || 'NFT Preview'}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
            <div className="preview-details">
              {metadataPreview.name && (
                <div className="preview-item">
                  <strong>Name:</strong> {metadataPreview.name}
                </div>
              )}
              {metadataPreview.description && (
                <div className="preview-item">
                  <strong>Description:</strong> {metadataPreview.description}
                </div>
              )}
              {metadataPreview.attributes && metadataPreview.attributes.length > 0 && (
                <div className="preview-item">
                  <strong>Attributes:</strong>
                  <div className="attributes-list">
                    {metadataPreview.attributes.map((attr, index) => (
                      <div key={index} className="attribute-item">
                        <span className="trait-type">{attr.trait_type}:</span>
                        <span className="trait-value">{attr.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Metadata Helper Link */}
      <div className="metadata-helper">
        <h3>Need Help Creating Metadata?</h3>
        <p>
          Create and host your NFT metadata easily with our metadata generator:
        </p>
        <a 
          href="https://meta.bon-soleil.com/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="metadata-helper-link"
        >
          🔗 Open Metadata Generator
        </a>
      </div>
      
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

export default MintPage;