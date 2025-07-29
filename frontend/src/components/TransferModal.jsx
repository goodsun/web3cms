import React, { useState } from 'react';
import './TransferModal.css';

const TransferModal = ({ nft, onClose, onTransfer }) => {
  const [recipientAddress, setRecipientAddress] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate address
    if (!/^0x[a-fA-F0-9]{40}$/.test(recipientAddress)) {
      setError('Invalid Ethereum address');
      return;
    }

    setIsTransferring(true);

    try {
      const result = await onTransfer(recipientAddress);
      setSuccess(`Transfer successful! Transaction hash: ${result.hash}`);
      
      // Close modal after 3 seconds
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err) {
      console.error('Transfer failed:', err);
      setError(err.message || 'Transfer failed. Please try again.');
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ×
        </button>
        
        <h2>Transfer NFT</h2>
        
        <div className="nft-info">
          {nft.image && (
            <img src={nft.image} alt={nft.name} className="nft-info-image" />
          )}
          <div className="nft-info-details">
            <div className="nft-info-name">{nft.name}</div>
            <div className="nft-info-id">Token ID: {nft.tokenId}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="transfer-form">
          <div className="form-group">
            <label htmlFor="recipientAddress">Recipient Address:</label>
            <input
              type="text"
              id="recipientAddress"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              placeholder="0x..."
              className="form-input"
              required
              disabled={isTransferring}
            />
            <small className="form-help">
              Enter the Ethereum address to send this NFT to
            </small>
          </div>

          {error && (
            <div className="message message-error">
              {error}
            </div>
          )}

          {success && (
            <div className="message message-success">
              {success}
            </div>
          )}

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isTransferring || !recipientAddress}
            >
              {isTransferring ? 'Transferring...' : 'Transfer NFT'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isTransferring}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransferModal;