import { ethers } from 'ethers';
import NFT_ABI from '../abis/nft_abi.json';
import REGISTRY_ABI from '../abis/registry_abi.json';
import IMPLEMENTATION_ABI from '../abis/imprementation_abi.json';

/**
 * Create NFT contract instance
 * @param {string} contractAddress - NFT contract address
 * @param {object} signerOrProvider - ethers signer or provider
 * @returns {object} Contract instance
 */
export const getNFTContract = (contractAddress, signerOrProvider) => {
  if (!contractAddress || !signerOrProvider) {
    throw new Error('Contract address and signer/provider are required');
  }
  return new ethers.Contract(contractAddress, NFT_ABI, signerOrProvider);
};

/**
 * Create TBA Registry contract instance
 * @param {string} registryAddress - Registry contract address
 * @param {object} signerOrProvider - ethers signer or provider
 * @returns {object} Contract instance
 */
export const getTBARegistryContract = (registryAddress, signerOrProvider) => {
  if (!registryAddress || !signerOrProvider) {
    throw new Error('Registry address and signer/provider are required');
  }
  return new ethers.Contract(registryAddress, REGISTRY_ABI, signerOrProvider);
};

// Alias for backward compatibility
export const getTBARegistry = getTBARegistryContract;

/**
 * Create TBA Implementation contract instance
 * @param {string} implementationAddress - Implementation contract address
 * @param {object} signerOrProvider - ethers signer or provider
 * @returns {object} Contract instance
 */
export const getTBAImplementationContract = (implementationAddress, signerOrProvider) => {
  if (!implementationAddress || !signerOrProvider) {
    throw new Error('Implementation address and signer/provider are required');
  }
  return new ethers.Contract(implementationAddress, IMPLEMENTATION_ABI, signerOrProvider);
};

/**
 * Calculate TBA address for a given NFT
 * @param {string} registryAddress - TBA Registry contract address
 * @param {string} implementationAddress - TBA Implementation contract address
 * @param {string} salt - Salt value (usually 0)
 * @param {number} chainId - Chain ID
 * @param {string} tokenContract - NFT contract address
 * @param {string} tokenId - NFT token ID
 * @param {object} provider - ethers provider
 * @returns {Promise<string>} TBA address
 */
export const calculateTBAAddress = async (
  registryAddress,
  implementationAddress,
  salt,
  chainId,
  tokenContract,
  tokenId,
  provider
) => {
  try {
    const registry = getTBARegistryContract(registryAddress, provider);
    
    // Most TBA registries have an 'account' or 'getAccount' function
    // Adjust based on your specific registry ABI
    const tbaAddress = await registry.account(
      implementationAddress,
      chainId,
      tokenContract,
      tokenId,
      salt
    );
    
    return tbaAddress;
  } catch (error) {
    console.error('Failed to calculate TBA address:', error);
    throw error;
  }
};

/**
 * Deploy TBA for a given NFT
 * @param {string} registryAddress - TBA Registry contract address
 * @param {string} implementationAddress - TBA Implementation contract address
 * @param {string} salt - Salt value (usually 0)
 * @param {number} chainId - Chain ID
 * @param {string} tokenContract - NFT contract address
 * @param {string} tokenId - NFT token ID
 * @param {object} signer - ethers signer
 * @returns {Promise<object>} Transaction receipt
 */
export const deployTBA = async (
  registryAddress,
  implementationAddress,
  salt,
  chainId,
  tokenContract,
  tokenId,
  signer
) => {
  try {
    const registry = getTBARegistryContract(registryAddress, signer);
    
    // The createAccount function requires 6 parameters including initData
    // initData can be empty bytes '0x' for default initialization
    const tx = await registry.createAccount(
      implementationAddress,
      chainId,
      tokenContract,
      ethers.toBigInt(tokenId),
      ethers.toBigInt(salt),
      '0x' // empty initData
    );
    
    const receipt = await tx.wait();
    return receipt;
  } catch (error) {
    console.error('Failed to deploy TBA:', error);
    throw error;
  }
};

/**
 * Get NFT metadata
 * @param {string} contractAddress - NFT contract address
 * @param {string} tokenId - Token ID
 * @param {object} provider - ethers provider
 * @returns {Promise<object>} NFT metadata
 */
export const getNFTMetadata = async (contractAddress, tokenId, provider) => {
  try {
    const nftContract = getNFTContract(contractAddress, provider);
    
    // Get basic info
    const [owner, tokenURI] = await Promise.all([
      nftContract.ownerOf(tokenId),
      nftContract.tokenURI(tokenId)
    ]);
    
    // Try to get name and symbol if available
    let name, symbol;
    try {
      [name, symbol] = await Promise.all([
        nftContract.name(),
        nftContract.symbol()
      ]);
    } catch (e) {
      // Some NFT contracts might not have name/symbol
      name = 'Unknown';
      symbol = 'UNKNOWN';
    }
    
    return {
      tokenId,
      owner,
      tokenURI,
      contractAddress,
      name,
      symbol
    };
  } catch (error) {
    console.error('Failed to get NFT metadata:', error);
    throw error;
  }
};

/**
 * Check if TBA is deployed for an NFT
 * @param {string} tbaAddress - Calculated TBA address
 * @param {object} provider - ethers provider
 * @returns {Promise<boolean>} True if deployed
 */
export const isTBADeployed = async (tbaAddress, provider) => {
  try {
    const code = await provider.getCode(tbaAddress);
    return code !== '0x';
  } catch (error) {
    console.error('Failed to check TBA deployment:', error);
    return false;
  }
};

// Export ABIs for direct use if needed
export { NFT_ABI, REGISTRY_ABI, IMPLEMENTATION_ABI };