import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import { getNFTContract } from '../utils/contractHelpers';
import { getRpcProvider } from '../utils/rpcUtils';
import { ethers } from 'ethers';
import UserDisplay from './UserDisplay';
import './NFTCard.css';

const NFTCard = ({ nft, showOwner = false, showActions = false, onTransfer }) => {
  const { settings } = useSettings();
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const web3Config = settings?.web3 || {};
  
  useEffect(() => {
    const fetchMetadata = async () => {
      if (!nft.tokenURI) return;
      
      setLoading(true);
      try {
        const response = await fetch(nft.tokenURI);
        const data = await response.json();
        setMetadata(data);
      } catch (err) {
        console.error('Failed to fetch metadata:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMetadata();
  }, [nft.tokenURI]);
  
  const imageUrl = metadata?.image || nft.image;
  const name = metadata?.name || nft.name || `Token #${nft.tokenId}`;
  const description = metadata?.description || nft.description;
  
  return (
    <Link to={`/nfts/token/${nft.tokenId}`} className="nft-card">
      <div className="nft-image-container">
        {loading ? (
          <div className="nft-placeholder show">
            <div className="spinner-small"></div>
          </div>
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="nft-image"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div className={`nft-placeholder ${!imageUrl && !loading ? 'show' : ''}`}>
          🖼️
        </div>
        <div className="nft-overlay">
          <span className="nft-overlay-title">{name}</span>
        </div>
      </div>
      
      <div className="nft-details">
        <h3 className="nft-name">{name}</h3>
        {description && (
          <p className="nft-description">{description}</p>
        )}
        <p className="nft-id">Token ID: {nft.tokenId}</p>
        {showOwner && nft.owner && (
          <p className="nft-owner">
            Owner: <UserDisplay address={nft.owner} size="small" />
          </p>
        )}
      </div>
      
      {showActions && (
        <div className="nft-actions" onClick={(e) => e.preventDefault()}>
          <button className="btn btn-primary" onClick={onTransfer}>
            Transfer
          </button>
        </div>
      )}
    </Link>
  );
};

export default NFTCard;