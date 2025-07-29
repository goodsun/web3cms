import React from 'react';
import './NFTCard.css';

const NFTCard = ({ nft, onTransfer }) => {
  return (
    <div className="nft-card">
      <div className="nft-image-container">
        {nft.image ? (
          <img
            src={nft.image}
            alt={nft.name}
            className="nft-image"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div className={`nft-placeholder ${!nft.image ? 'show' : ''}`}>
          🖼️
        </div>
      </div>
      
      <div className="nft-details">
        <h3 className="nft-name">{nft.name}</h3>
        {nft.collection && (
          <p className="nft-collection">{nft.collection}</p>
        )}
        <p className="nft-id">Token ID: {nft.tokenId}</p>
      </div>
      
      <div className="nft-actions">
        <button className="btn btn-primary" onClick={onTransfer}>
          Transfer
        </button>
      </div>
    </div>
  );
};

export default NFTCard;