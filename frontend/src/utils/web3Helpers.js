/**
 * Web3 Helpers - Central export for all Web3 utilities
 */

export * from './contractHelpers';
export * from './tbaHelpers';
export * from './nftHelpers';
export * from './rpcUtils';

// Re-export main helper creators for convenience
export { createTBAHelper } from './tbaHelpers';
export { createNFTHelper } from './nftHelpers';

/**
 * Create all helpers at once
 * @param {object} settings - Settings from SettingsContext
 * @param {object} provider - ethers provider
 * @param {object} signer - ethers signer (optional)
 * @returns {object} Object containing all helpers
 */
export const createWeb3Helpers = (settings, provider, signer = null) => {
  return {
    tba: new (require('./tbaHelpers').TBAHelper)(settings, provider, signer),
    nft: new (require('./nftHelpers').NFTHelper)(settings, provider, signer),
  };
};