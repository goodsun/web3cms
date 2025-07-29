import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import { useSettings } from '../contexts/SettingsContext';
import { getNFTContract } from '../utils/contractHelpers';
import { ethers } from 'ethers';
import './MintPage.css';

const MintPage = () => {
  const navigate = useNavigate();
  const { account, provider, isConnected } = useWeb3();
  const { settings } = useSettings();
  const [formData, setFormData] = useState({
    recipient: '',
    tokenURI: '',
    quantity: '1'
  });
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [contractInfo, setContractInfo] = useState(null);

  const web3Config = settings?.web3 || {};

  useEffect(() => {
    const fetchContractInfo = async () => {
      if (!provider || !web3Config.nftContract) return;

      try {
        const nftContract = getNFTContract(web3Config.nftContract, provider);
        const [name, symbol] = await Promise.all([
          nftContract.name(),
          nftContract.symbol()
        ]);
        setContractInfo({ name, symbol });
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

    const { recipient, tokenURI, quantity } = formData;

    // Validate inputs
    if (!recipient || !ethers.isAddress(recipient)) {
      setError('Please enter a valid recipient address');
      return;
    }

    if (!tokenURI) {
      setError('Please enter a token URI');
      return;
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 1 || qty > 100) {
      setError('Please enter a valid quantity (1-100)');
      return;
    }

    setMinting(true);
    setError(null);
    setSuccess(null);

    try {
      const signer = provider.getSigner();
      const nftContract = getNFTContract(web3Config.nftContract, signer);

      // Check if contract has batch mint function
      let tx;
      if (qty === 1) {
        // Single mint
        tx = await nftContract.mint(recipient, tokenURI);
      } else {
        // Try batch mint
        try {
          // Create array of same tokenURI for batch mint
          const tokenURIs = Array(qty).fill(tokenURI);
          tx = await nftContract.batchMint(recipient, tokenURIs);
        } catch (err) {
          // Fallback to multiple single mints if batch not supported
          setError('Batch minting not supported. Please mint one at a time.');
          setMinting(false);
          return;
        }
      }

      const receipt = await tx.wait();
      
      // Extract token ID from Transfer event
      let tokenId;
      const transferEvent = receipt.events?.find(e => e.event === 'Transfer');
      if (transferEvent) {
        tokenId = transferEvent.args.tokenId.toString();
      }

      setSuccess({
        message: `Successfully minted ${qty} NFT${qty > 1 ? 's' : ''}!`,
        tokenId,
        txHash: receipt.transactionHash
      });

      // Reset form
      setFormData({
        recipient: account || '',
        tokenURI: '',
        quantity: '1'
      });

      // Navigate to token detail after a delay
      if (tokenId && qty === 1) {
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
  };

  return (
    <div className="mint-page">
      <div className="page-header">
        <h1>Mint NFT</h1>
        {contractInfo && (
          <div className="contract-info">
            {contractInfo.name} ({contractInfo.symbol})
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

          <div className="form-group">
            <label htmlFor="quantity">Quantity</label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              min="1"
              max="100"
              className="form-input"
              disabled={minting}
            />
            <small className="form-hint">Number of NFTs to mint (1-100)</small>
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

      {/* Metadata Template */}
      <div className="metadata-template">
        <h3>Metadata Template</h3>
        <p>Your token URI should point to a JSON file with this structure:</p>
        <pre>{`{
  "name": "NFT Name",
  "description": "NFT Description",
  "image": "https://example.com/image.png",
  "attributes": [
    {
      "trait_type": "Category",
      "value": "Art"
    }
  ]
}`}</pre>
      </div>
    </div>
  );
};

export default MintPage;