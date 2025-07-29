import { ethers } from 'ethers';
import { getNFTContract, getNFTMetadata } from './contractHelpers';

/**
 * NFT Helper - Simplified interface for NFT operations
 */
export class NFTHelper {
  constructor(settings, provider, signer = null) {
    this.settings = settings;
    this.provider = provider;
    this.signer = signer;
    
    // Extract Web3 config
    const { web3 = {} } = settings || {};
    this.nftContract = web3.nftContract;
  }

  /**
   * Check if NFT contract is configured
   * @returns {boolean} True if configured
   */
  isConfigured() {
    return !!this.nftContract;
  }

  /**
   * Get NFT contract instance
   * @param {string} contractAddress - Optional contract address, defaults to settings
   * @returns {object} Contract instance
   */
  getContract(contractAddress = null) {
    const address = contractAddress || this.nftContract;
    if (!address) {
      throw new Error('NFT contract address not configured');
    }
    return getNFTContract(address, this.signer || this.provider);
  }

  /**
   * Get NFT balance for an address
   * @param {string} owner - Owner address
   * @param {string} contractAddress - Optional contract address
   * @returns {Promise<string>} NFT balance
   */
  async getBalance(owner, contractAddress = null) {
    const contract = this.getContract(contractAddress);
    const balance = await contract.balanceOf(owner);
    return balance.toString();
  }

  /**
   * Get token ID at index for owner
   * @param {string} owner - Owner address
   * @param {number} index - Token index
   * @param {string} contractAddress - Optional contract address
   * @returns {Promise<string>} Token ID
   */
  async getTokenOfOwnerByIndex(owner, index, contractAddress = null) {
    const contract = this.getContract(contractAddress);
    
    try {
      // Try ERC721Enumerable method first
      const tokenId = await contract.tokenOfOwnerByIndex(owner, index);
      return tokenId.toString();
    } catch (error) {
      // If not enumerable, we'll need to use events or other methods
      throw new Error('Contract does not support enumeration');
    }
  }

  /**
   * Get all NFTs owned by an address
   * @param {string} owner - Owner address
   * @param {string} contractAddress - Optional contract address
   * @returns {Promise<Array>} Array of NFT metadata
   */
  async getNFTsForOwner(owner, contractAddress = null) {
    const contract = this.getContract(contractAddress);
    const balance = await this.getBalance(owner, contractAddress);
    const nfts = [];

    for (let i = 0; i < parseInt(balance); i++) {
      try {
        const tokenId = await this.getTokenOfOwnerByIndex(owner, i, contractAddress);
        const metadata = await getNFTMetadata(
          contractAddress || this.nftContract,
          tokenId,
          this.provider
        );
        nfts.push(metadata);
      } catch (error) {
        console.error(`Failed to get NFT at index ${i}:`, error);
      }
    }

    return nfts;
  }

  /**
   * Transfer NFT
   * @param {string} from - From address
   * @param {string} to - To address
   * @param {string} tokenId - Token ID
   * @param {string} contractAddress - Optional contract address
   * @returns {Promise<object>} Transaction receipt
   */
  async transfer(from, to, tokenId, contractAddress = null) {
    if (!this.signer) {
      throw new Error('Signer required to transfer NFT');
    }

    const contract = this.getContract(contractAddress);
    
    // Use safeTransferFrom
    const tx = await contract['safeTransferFrom(address,address,uint256)'](
      from,
      to,
      tokenId
    );
    
    return tx.wait();
  }

  /**
   * Approve spending
   * @param {string} spender - Spender address
   * @param {string} tokenId - Token ID
   * @param {string} contractAddress - Optional contract address
   * @returns {Promise<object>} Transaction receipt
   */
  async approve(spender, tokenId, contractAddress = null) {
    if (!this.signer) {
      throw new Error('Signer required to approve');
    }

    const contract = this.getContract(contractAddress);
    const tx = await contract.approve(spender, tokenId);
    return tx.wait();
  }

  /**
   * Get approved address for token
   * @param {string} tokenId - Token ID
   * @param {string} contractAddress - Optional contract address
   * @returns {Promise<string>} Approved address
   */
  async getApproved(tokenId, contractAddress = null) {
    const contract = this.getContract(contractAddress);
    return contract.getApproved(tokenId);
  }

  /**
   * Check if operator is approved for all
   * @param {string} owner - Owner address
   * @param {string} operator - Operator address
   * @param {string} contractAddress - Optional contract address
   * @returns {Promise<boolean>} True if approved
   */
  async isApprovedForAll(owner, operator, contractAddress = null) {
    const contract = this.getContract(contractAddress);
    return contract.isApprovedForAll(owner, operator);
  }

  /**
   * Set approval for all
   * @param {string} operator - Operator address
   * @param {boolean} approved - Approval status
   * @param {string} contractAddress - Optional contract address
   * @returns {Promise<object>} Transaction receipt
   */
  async setApprovalForAll(operator, approved, contractAddress = null) {
    if (!this.signer) {
      throw new Error('Signer required to set approval');
    }

    const contract = this.getContract(contractAddress);
    const tx = await contract.setApprovalForAll(operator, approved);
    return tx.wait();
  }

  /**
   * Parse token URI to get metadata
   * @param {string} tokenURI - Token URI
   * @returns {Promise<object>} Parsed metadata
   */
  async parseTokenURI(tokenURI) {
    try {
      // Handle IPFS URIs
      if (tokenURI.startsWith('ipfs://')) {
        tokenURI = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
      }

      // Handle data URIs
      if (tokenURI.startsWith('data:')) {
        const [, base64Data] = tokenURI.split(',');
        const jsonString = atob(base64Data);
        return JSON.parse(jsonString);
      }

      // Handle HTTP(S) URIs
      const response = await fetch(tokenURI);
      return response.json();
    } catch (error) {
      console.error('Failed to parse token URI:', error);
      return null;
    }
  }
}

/**
 * Create NFT helper instance
 * @param {object} settings - Settings from SettingsContext
 * @param {object} provider - ethers provider
 * @param {object} signer - ethers signer (optional)
 * @returns {NFTHelper} NFT helper instance
 */
export const createNFTHelper = (settings, provider, signer = null) => {
  return new NFTHelper(settings, provider, signer);
};