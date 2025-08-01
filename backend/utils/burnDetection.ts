/**
 * Utilities for detecting burned NFTs
 */

// Common burn addresses
const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
const DEAD_ADDRESS = '0x000000000000000000000000000000000000dEaD';

/**
 * Check if an address indicates the NFT has been burned
 * @param address The owner address to check
 * @returns true if the address is a burn address
 */
export function isBurnAddress(address: string | null | undefined): boolean {
  if (!address) return false;
  
  const normalizedAddress = address.toLowerCase();
  return normalizedAddress === NULL_ADDRESS.toLowerCase() || 
         normalizedAddress === DEAD_ADDRESS.toLowerCase();
}

/**
 * Get a list of known burn addresses
 * @returns Array of burn addresses
 */
export function getBurnAddresses(): string[] {
  return [NULL_ADDRESS, DEAD_ADDRESS];
}