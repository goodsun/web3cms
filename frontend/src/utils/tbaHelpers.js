import { ethers } from 'ethers';
import { 
  getTBARegistryContract, 
  getTBAImplementationContract,
  calculateTBAAddress as calculateAddress,
  deployTBA as deploy,
  isTBADeployed 
} from './contractHelpers';

/**
 * TBA Helper - Simplified interface for TBA operations
 */
export class TBAHelper {
  constructor(settings, provider, signer = null) {
    this.settings = settings;
    this.provider = provider;
    this.signer = signer;
    
    // Extract Web3 config
    const { web3 = {} } = settings || {};
    this.chainId = web3.defaultChainId || 1;
    this.registryAddress = web3.tbaRegistry;
    this.implementationAddress = web3.tbaImplementation;
    this.salt = web3.tbaSalt || '0';
  }

  /**
   * Validate if TBA is properly configured
   * @returns {boolean} True if all required settings are present
   */
  isConfigured() {
    return !!(this.registryAddress && this.implementationAddress);
  }

  /**
   * Get TBA address for an NFT
   * @param {string} nftContract - NFT contract address
   * @param {string} tokenId - NFT token ID
   * @returns {Promise<string>} TBA address
   */
  async getTBAAddress(nftContract, tokenId) {
    if (!this.isConfigured()) {
      throw new Error('TBA not configured. Please set registry and implementation addresses in settings.');
    }

    return calculateAddress(
      this.registryAddress,
      this.implementationAddress,
      this.salt,
      this.chainId,
      nftContract,
      tokenId,
      this.provider
    );
  }

  /**
   * Check if TBA is deployed for an NFT
   * @param {string} nftContract - NFT contract address
   * @param {string} tokenId - NFT token ID
   * @returns {Promise<boolean>} True if deployed
   */
  async isTBADeployed(nftContract, tokenId) {
    const tbaAddress = await this.getTBAAddress(nftContract, tokenId);
    return isTBADeployed(tbaAddress, this.provider);
  }

  /**
   * Deploy TBA for an NFT
   * @param {string} nftContract - NFT contract address
   * @param {string} tokenId - NFT token ID
   * @returns {Promise<object>} Transaction receipt with TBA address
   */
  async deployTBA(nftContract, tokenId) {
    if (!this.signer) {
      throw new Error('Signer required to deploy TBA');
    }

    if (!this.isConfigured()) {
      throw new Error('TBA not configured. Please set registry and implementation addresses in settings.');
    }

    // Check if already deployed
    const isDeployed = await this.isTBADeployed(nftContract, tokenId);
    if (isDeployed) {
      const tbaAddress = await this.getTBAAddress(nftContract, tokenId);
      return {
        status: 'already_deployed',
        tbaAddress
      };
    }

    // Deploy TBA
    const receipt = await deploy(
      this.registryAddress,
      this.implementationAddress,
      this.salt,
      this.chainId,
      nftContract,
      tokenId,
      this.signer
    );

    // Get the deployed TBA address
    const tbaAddress = await this.getTBAAddress(nftContract, tokenId);

    return {
      status: 'deployed',
      receipt,
      tbaAddress
    };
  }

  /**
   * Execute transaction from TBA
   * @param {string} tbaAddress - TBA address
   * @param {string} to - Target address
   * @param {string} value - ETH value in wei
   * @param {string} data - Transaction data
   * @returns {Promise<object>} Transaction receipt
   */
  async executeFromTBA(tbaAddress, to, value = '0', data = '0x') {
    if (!this.signer) {
      throw new Error('Signer required to execute from TBA');
    }

    const tbaContract = getTBAImplementationContract(tbaAddress, this.signer);
    
    // Most TBA implementations have an 'execute' function
    // Adjust based on your specific implementation ABI
    const tx = await tbaContract.execute(to, value, data);
    return tx.wait();
  }

  /**
   * Get TBA balance
   * @param {string} nftContract - NFT contract address
   * @param {string} tokenId - NFT token ID
   * @returns {Promise<object>} Balance info
   */
  async getTBABalance(nftContract, tokenId) {
    const tbaAddress = await this.getTBAAddress(nftContract, tokenId);
    const isDeployed = await isTBADeployed(tbaAddress, this.provider);
    
    if (!isDeployed) {
      return {
        tbaAddress,
        isDeployed: false,
        balance: '0',
        balanceFormatted: '0.0'
      };
    }

    const balance = await this.provider.getBalance(tbaAddress);
    
    return {
      tbaAddress,
      isDeployed: true,
      balance: balance.toString(),
      balanceFormatted: ethers.formatEther(balance)
    };
  }

  /**
   * Get multiple TBA addresses for multiple NFTs
   * @param {Array<{contract: string, tokenId: string}>} nfts - Array of NFTs
   * @returns {Promise<Array>} Array of TBA info
   */
  async getTBAAddresses(nfts) {
    const promises = nfts.map(async ({ contract, tokenId }) => {
      try {
        const tbaAddress = await this.getTBAAddress(contract, tokenId);
        const isDeployed = await isTBADeployed(tbaAddress, this.provider);
        
        return {
          nftContract: contract,
          tokenId,
          tbaAddress,
          isDeployed
        };
      } catch (error) {
        return {
          nftContract: contract,
          tokenId,
          error: error.message
        };
      }
    });

    return Promise.all(promises);
  }
}

/**
 * Create TBA helper instance
 * @param {object} settings - Settings from SettingsContext
 * @param {object} provider - ethers provider
 * @param {object} signer - ethers signer (optional)
 * @returns {TBAHelper} TBA helper instance
 */
export const createTBAHelper = (settings, provider, signer = null) => {
  return new TBAHelper(settings, provider, signer);
};