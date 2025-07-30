import React, { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { getNFTContract } from '../utils/contractHelpers';
import { getRpcProvider } from '../utils/rpcUtils';
import { ethers } from 'ethers';
import './ItemForm.css';

const ItemForm = ({ item, onSubmit, onCancel }) => {
  const { settings } = useSettings();
  const [formData, setFormData] = useState({
    name: item?.name || '',
    description: item?.description || '',
    category: item?.category || 'general',
    tokenId: item?.tokenId || '',
    contact: item?.contact || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [nftMetadata, setNftMetadata] = useState(null);
  const [loadingNft, setLoadingNft] = useState(false);
  
  const web3Config = settings?.web3 || {};

  // Fetch NFT metadata when tokenId changes
  useEffect(() => {
    const fetchNFTMetadata = async () => {
      if (!formData.tokenId || !web3Config.nftContract || !web3Config.rpcUrls) {
        setNftMetadata(null);
        return;
      }
      
      setLoadingNft(true);
      setNftMetadata(null);
      
      try {
        // Get RPC provider
        const activeProvider = getRpcProvider(web3Config.rpcUrls, web3Config.defaultChainId, ethers);
        if (!activeProvider) {
          console.warn('No provider available');
          return;
        }
        
        const nftContract = getNFTContract(web3Config.nftContract, activeProvider);
        
        // Get token URI
        const tokenURI = await nftContract.tokenURI(formData.tokenId);
        
        // Fetch metadata
        const response = await fetch(tokenURI);
        const metadata = await response.json();
        
        setNftMetadata(metadata);
        
        // Auto-fill form fields if empty
        setFormData(prev => ({
          ...prev,
          name: prev.name || metadata.name || '',
          description: prev.description || metadata.description || '',
        }));
      } catch (err) {
        console.error('Failed to fetch NFT metadata:', err);
        // Don't show error, just don't display metadata
      } finally {
        setLoadingNft(false);
      }
    };
    
    // Debounce the fetch
    const timeoutId = setTimeout(fetchNFTMetadata, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.tokenId, web3Config.nftContract, web3Config.rpcUrls, web3Config.defaultChainId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await onSubmit(formData);
      // Reset form on success
      setFormData({
        name: '',
        description: '',
        category: 'general',
        tokenId: '',
        contact: '',
      });
      setNftMetadata(null);
    } catch (err) {
      setError(err.message || 'Failed to create item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="item-form-container">
      <form onSubmit={handleSubmit} className="item-form">
        <h2>{item ? 'Edit Item' : 'Create New Item'}</h2>
        
        <div className="form-group">
          <label htmlFor="tokenId">NFT Token ID</label>
          <input
            type="text"
            id="tokenId"
            name="tokenId"
            value={formData.tokenId}
            onChange={handleChange}
            className="form-input"
            placeholder="Enter NFT token ID (optional)"
          />
          {loadingNft && (
            <small className="loading-text">Loading NFT metadata...</small>
          )}
        </div>
        
        {nftMetadata && (
          <div className="nft-preview">
            <h3>NFT Information</h3>
            <div className="nft-preview-content">
              {nftMetadata.image && (
                <div className="nft-preview-image">
                  <img src={nftMetadata.image} alt={nftMetadata.name || 'NFT'} />
                </div>
              )}
              <div className="nft-preview-details">
                {nftMetadata.name && (
                  <p><strong>Name:</strong> {nftMetadata.name}</p>
                )}
                {nftMetadata.description && (
                  <p><strong>Description:</strong> {nftMetadata.description}</p>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="name">Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="form-input"
            placeholder="Enter item name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="form-textarea"
            rows="4"
            placeholder="Enter item description"
          />
        </div>

        <div className="form-group">
          <label htmlFor="contact">Contact</label>
          <input
            type="text"
            id="contact"
            name="contact"
            value={formData.contact}
            onChange={handleChange}
            className="form-input"
            placeholder="URL, email address, or other contact info"
          />
          <small className="form-help">
            Enter a URL, email address, or any contact information
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="form-select"
          >
            <option value="general">General</option>
            <option value="technology">Technology</option>
            <option value="business">Business</option>
            <option value="personal">Personal</option>
          </select>
        </div>

        {error && (
          <div className="message message-error">
            {error}
          </div>
        )}

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || !formData.name}
          >
            {isSubmitting ? (item ? 'Updating...' : 'Creating...') : (item ? 'Update Item' : 'Create Item')}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ItemForm;