/**
 * Parse comma-separated RPC URLs and return an array
 * @param {string} rpcUrls - Comma-separated RPC URLs
 * @returns {string[]} Array of RPC URLs
 */
export const parseRpcUrls = (rpcUrls) => {
  if (!rpcUrls) return [];
  
  return rpcUrls
    .split(',')
    .map(url => url.trim())
    .filter(url => url.length > 0);
};

/**
 * Get a random RPC URL from the list (round-robin)
 * @param {string[]} rpcUrls - Array of RPC URLs
 * @returns {string|null} Selected RPC URL or null if empty
 */
export const getRandomRpcUrl = (rpcUrls) => {
  if (!rpcUrls || rpcUrls.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * rpcUrls.length);
  return rpcUrls[randomIndex];
};

// Keep track of the last used index for true round-robin
let lastUsedIndex = -1;

/**
 * Get the next RPC URL in round-robin fashion
 * @param {string[]} rpcUrls - Array of RPC URLs
 * @returns {string|null} Next RPC URL or null if empty
 */
export const getNextRpcUrl = (rpcUrls) => {
  if (!rpcUrls || rpcUrls.length === 0) return null;
  
  lastUsedIndex = (lastUsedIndex + 1) % rpcUrls.length;
  return rpcUrls[lastUsedIndex];
};

/**
 * Create a provider with fallback RPC URLs
 * @param {string} rpcUrlsString - Comma-separated RPC URLs
 * @param {object} ethers - ethers.js library
 * @returns {object|null} Provider instance or null
 */
export const createProviderWithFallback = (rpcUrlsString, ethers) => {
  const rpcUrls = parseRpcUrls(rpcUrlsString);
  const selectedUrl = getNextRpcUrl(rpcUrls);
  
  if (!selectedUrl) return null;
  
  try {
    return new ethers.JsonRpcProvider(selectedUrl);
  } catch (error) {
    console.error('Failed to create provider:', error);
    return null;
  }
};

/**
 * Get RPC provider for read-only operations
 * @param {string} rpcUrlsString - Comma-separated RPC URLs
 * @param {number} chainId - Chain ID for the network
 * @param {object} ethers - ethers.js library instance
 * @returns {object|null} Provider instance or null
 */
export const getRpcProvider = (rpcUrlsString, chainId, ethers) => {
  if (!rpcUrlsString || !ethers) return null;
  
  const rpcUrls = parseRpcUrls(rpcUrlsString);
  const selectedUrl = getNextRpcUrl(rpcUrls);
  
  if (!selectedUrl) return null;
  
  try {
    return new ethers.JsonRpcProvider(selectedUrl);
  } catch (error) {
    console.error('Failed to create RPC provider:', error);
    return null;
  }
};