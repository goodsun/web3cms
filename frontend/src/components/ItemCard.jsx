import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import { getNFTContract } from '../utils/contractHelpers';
import { getRpcProvider } from '../utils/rpcUtils';
import { ethers } from 'ethers';
import './ItemCard.css';

const ItemCard = ({ item, onEdit, onDelete }) => {
  const { settings } = useSettings();
  const [nftMetadata, setNftMetadata] = useState(null);
  const [loadingNft, setLoadingNft] = useState(false);
  
  const web3Config = settings?.web3 || {};
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  const renderContact = (contact) => {
    if (!contact) return null;
    
    // Check if it's an email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(contact)) {
      return (
        <a href={`mailto:${contact}`} className="contact-link email">
          {contact}
        </a>
      );
    }
    
    // Check if it's a URL
    const urlRegex = /^(https?:\/\/|www\.)/i;
    if (urlRegex.test(contact)) {
      const url = contact.startsWith('http') ? contact : `https://${contact}`;
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="contact-link url">
          {contact}
        </a>
      );
    }
    
    // Otherwise, display as plain text
    return <span className="contact-text">{contact}</span>;
  };
  
  useEffect(() => {
    const fetchNFTMetadata = async () => {
      if (!item.tokenId || !web3Config.nftContract || !web3Config.rpcUrls) {
        return;
      }
      
      setLoadingNft(true);
      
      try {
        const activeProvider = getRpcProvider(web3Config.rpcUrls, web3Config.defaultChainId, ethers);
        if (!activeProvider) return;
        
        const nftContract = getNFTContract(web3Config.nftContract, activeProvider);
        const tokenURI = await nftContract.tokenURI(item.tokenId);
        
        const response = await fetch(tokenURI);
        const metadata = await response.json();
        
        setNftMetadata(metadata);
      } catch (err) {
        console.error('Failed to fetch NFT metadata:', err);
      } finally {
        setLoadingNft(false);
      }
    };
    
    fetchNFTMetadata();
  }, [item.tokenId, web3Config.nftContract, web3Config.rpcUrls, web3Config.defaultChainId]);

  return (
    <div className="item-card">
      {item.tokenId && nftMetadata?.image && (
        <Link to={`/nfts/token/${item.tokenId}`} className="item-nft-image">
          <img src={nftMetadata.image} alt={nftMetadata.name || item.name} />
          <span className="nft-badge">NFT #{item.tokenId}</span>
        </Link>
      )}
      
      <div className="item-header">
        <h3>{item.name}</h3>
        <span className="item-category">{item.category}</span>
      </div>
      
      <p className="item-description">{item.description}</p>
      
      {item.contact && (
        <div className="item-contact">
          <span className="contact-label">Contact:</span> {renderContact(item.contact)}
        </div>
      )}
      
      {item.tokenId && !loadingNft && !nftMetadata && (
        <p className="item-nft-info">
          NFT Token ID: <Link to={`/nfts/token/${item.tokenId}`} className="nft-link">{item.tokenId}</Link>
        </p>
      )}
      
      <div className="item-meta">
        <small>ID: {item.id}</small>
        <small>Created: {formatDate(item.createdAt)}</small>
      </div>
      
      <div className="item-actions">
        <button 
          className="btn btn-secondary"
          onClick={onEdit}
        >
          Edit
        </button>
        <button 
          className="btn btn-danger"
          onClick={onDelete}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default ItemCard;