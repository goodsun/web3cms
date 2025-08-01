/**
 * Common utilities for NFT metadata handling
 */

export interface NFTMetadata {
  name?: string;
  description?: string;
  imageUrl?: string;
  animation_url?: string;
  youtube_url?: string;
  model?: string;
  attributes?: Array<{
    trait_type: string;
    value: any;
    display_type?: string;
  }>;
  external_url?: string;
  background_color?: string;
  properties?: any;
  [key: string]: any; // Allow additional fields
}

/**
 * Extract metadata from a tokenURI
 * Handles both data: URLs and HTTP URLs
 */
export async function extractMetadataFromTokenURI(tokenURI: string): Promise<NFTMetadata> {
  const metadata: NFTMetadata = {};
  
  try {
    let parsed: any = null;
    
    if (tokenURI.startsWith('data:application/json')) {
      // Handle base64 encoded JSON metadata
      const base64Data = tokenURI.split(',')[1];
      const jsonString = Buffer.from(base64Data, 'base64').toString('utf-8');
      parsed = JSON.parse(jsonString);
    } else if (tokenURI.startsWith('http') || tokenURI.startsWith('ipfs://') || tokenURI.startsWith('ar://')) {
      // Handle external URLs
      const metadataUrl = convertToHttpUrl(tokenURI);
      
      const response = await fetch(metadataUrl);
      if (response.ok) {
        parsed = await response.json();
      }
    }
    
    if (parsed) {
      // Extract all standard fields
      metadata.name = parsed.name || '';
      metadata.description = parsed.description || '';
      
      // Handle image URL
      const image = parsed.image || parsed.image_url || parsed.imageUrl || null;
      if (image) {
        metadata.imageUrl = processImageUrl(image);
      }
      
      // Handle animation URL
      if (parsed.animation_url) {
        metadata.animation_url = convertToHttpUrl(parsed.animation_url);
      }
      
      // Handle YouTube URL
      if (parsed.youtube_url) {
        metadata.youtube_url = parsed.youtube_url;
      }
      
      // Handle 3D model
      if (parsed.model) {
        metadata.model = convertToHttpUrl(parsed.model);
      }
      
      // Handle attributes
      if (parsed.attributes && Array.isArray(parsed.attributes)) {
        metadata.attributes = parsed.attributes;
      }
      
      // Handle external URL
      if (parsed.external_url) {
        metadata.external_url = parsed.external_url;
      }
      
      // Handle background color
      if (parsed.background_color) {
        metadata.background_color = parsed.background_color;
      }
      
      // Handle properties
      if (parsed.properties) {
        metadata.properties = parsed.properties;
      }
      
      // Copy any additional fields that might exist
      const standardFields = ['name', 'description', 'image', 'image_url', 'imageUrl', 
        'animation_url', 'youtube_url', 'model', 'attributes', 'external_url', 
        'background_color', 'properties'];
      
      for (const key in parsed) {
        if (!standardFields.includes(key) && !metadata.hasOwnProperty(key)) {
          metadata[key] = parsed[key];
        }
      }
    }
  } catch (error) {
    console.warn('Failed to extract metadata from tokenURI:', error);
    // Return empty metadata on error
  }
  
  return metadata;
}

/**
 * Convert IPFS and Arweave URLs to HTTP URLs
 */
export function convertToHttpUrl(url: string): string {
  if (url.startsWith('ipfs://')) {
    return url.replace('ipfs://', 'https://ipfs.io/ipfs/');
  } else if (url.startsWith('ar://')) {
    return url.replace('ar://', 'https://arweave.net/');
  }
  return url;
}

/**
 * Process image URL - handle base64, IPFS, Arweave, and size limits
 */
export function processImageUrl(image: string): string {
  // Check if image is base64 or too long
  if (image.startsWith('data:') || image.length > 1000) {
    return 'NOT_URL';
  }
  
  // Convert special protocols to HTTP
  return convertToHttpUrl(image);
}