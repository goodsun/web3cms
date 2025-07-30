/**
 * Common formatting utilities
 */

/**
 * Format an Ethereum address to show only first 6 and last 4 characters
 * @param {string} address - The full Ethereum address
 * @returns {string} - Formatted address (e.g., "0x1234...5678")
 */
export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Format a number with comma separators
 * @param {number|string} num - The number to format
 * @returns {string} - Formatted number with commas
 */
export const formatNumber = (num) => {
  if (!num) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Format ETH value from wei
 * @param {string|BigInt} wei - Value in wei
 * @param {number} decimals - Number of decimal places to show
 * @returns {string} - Formatted ETH value
 */
export const formatEth = (wei, decimals = 4) => {
  if (!wei) return '0';
  try {
    const eth = parseFloat(wei) / 1e18;
    return eth.toFixed(decimals);
  } catch {
    return '0';
  }
};

/**
 * Truncate string in the middle
 * @param {string} str - String to truncate
 * @param {number} startLen - Number of characters to show at start
 * @param {number} endLen - Number of characters to show at end
 * @returns {string} - Truncated string
 */
export const truncateMiddle = (str, startLen = 6, endLen = 4) => {
  if (!str || str.length <= startLen + endLen) return str;
  return `${str.slice(0, startLen)}...${str.slice(-endLen)}`;
};

/**
 * Format timestamp to readable date
 * @param {number|string} timestamp - Unix timestamp or date string
 * @returns {string} - Formatted date string
 */
export const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};