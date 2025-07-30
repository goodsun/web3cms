import React, { useState } from 'react';
import { ethers } from 'ethers';
import { getTBAImplementationContract, getNFTContract } from '../utils/contractHelpers';
import './TBANFTTransfer.css';

const TBANFTTransfer = ({ tbaAddress, nft, onTransferComplete, onCancel }) => {
  const [recipientAddress, setRecipientAddress] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [error, setError] = useState('');

  const handleTransfer = async () => {
    if (!recipientAddress || !ethers.isAddress(recipientAddress)) {
      setError('Please enter a valid recipient address');
      return;
    }

    setError('');
    setIsTransferring(true);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Get TBA implementation contract
      const tbaContract = getTBAImplementationContract(tbaAddress, signer);
      
      // Get NFT contract
      const nftContract = getNFTContract(nft.contract_address, provider);
      
      // Encode the transferFrom call
      const transferData = nftContract.interface.encodeFunctionData(
        'transferFrom',
        [tbaAddress, recipientAddress, nft.token_id]
      );
      
      // Execute the transfer through TBA's executeCall
      const tx = await tbaContract.executeCall(
        nft.contract_address,  // to: NFT contract address
        0,                     // value: 0 ETH
        transferData           // data: encoded transferFrom call
      );
      
      // Wait for transaction confirmation
      await tx.wait();
      
      // Notify parent component
      if (onTransferComplete) {
        onTransferComplete(nft, recipientAddress);
      }
      
      // Reset form
      setRecipientAddress('');
      setIsTransferring(false);
      
    } catch (error) {
      console.error('Transfer failed:', error);
      setError(error.message || 'Transfer failed. Please try again.');
      setIsTransferring(false);
    }
  };

  return (
    <div className="tba-nft-transfer">
      <h4>Transfer NFT from TBA</h4>
      <div className="transfer-form">
        <input
          type="text"
          placeholder="Recipient address (0x...)"
          value={recipientAddress}
          onChange={(e) => setRecipientAddress(e.target.value)}
          disabled={isTransferring}
          className="recipient-input"
        />
        <button
          onClick={handleTransfer}
          disabled={isTransferring || !recipientAddress}
          className="transfer-button"
        >
          {isTransferring ? 'Transferring...' : 'Transfer NFT'}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={isTransferring}
            className="cancel-button"
          >
            Cancel
          </button>
        )}
      </div>
      {error && <div className="error-message">{error}</div>}
      <div className="transfer-info">
        <p><strong>NFT:</strong> {nft.name || `Token #${nft.token_id}`}</p>
        <p><strong>Contract:</strong> {nft.contract_address.slice(0, 6)}...{nft.contract_address.slice(-4)}</p>
        <p><strong>From TBA:</strong> {tbaAddress.slice(0, 6)}...{tbaAddress.slice(-4)}</p>
      </div>
    </div>
  );
};

export default TBANFTTransfer;