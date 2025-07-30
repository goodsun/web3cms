import { ethers } from 'ethers';

class NFTService {
  constructor() {
    this.ERC721_ABI = [
      'function balanceOf(address owner) view returns (uint256)',
      'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
      'function tokenURI(uint256 tokenId) view returns (string)',
      'function safeTransferFrom(address from, address to, uint256 tokenId)',
      'function ownerOf(uint256 tokenId) view returns (address)',
      'function name() view returns (string)',
      'function symbol() view returns (string)',
    ];
  }

  // Fetch NFTs using OpenSea API
  async fetchNFTsFromOpenSea(ownerAddress, chain = 'ethereum') {
    try {
      const response = await fetch(
        `https://api.opensea.io/api/v2/chain/${chain}/account/${ownerAddress}/nfts`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`OpenSea API error: ${response.status}`);
      }

      const data = await response.json();
      return this.normalizeOpenSeaNFTs(data.nfts || []);
    } catch (error) {
      console.error('OpenSea API failed:', error);
      return [];
    }
  }

  // Normalize OpenSea response
  normalizeOpenSeaNFTs(nfts) {
    return nfts.map((nft) => ({
      contract: nft.contract,
      tokenId: nft.token_id,
      name: nft.metadata?.name || nft.name || 'Unnamed NFT',
      description: nft.metadata?.description || '',
      image: nft.metadata?.image || nft.display_image_url || '',
      collection: nft.collection || '',
      owner: nft.owners?.[0]?.address || '',
      source: 'opensea',
    }));
  }

  // Fetch NFTs on-chain
  async fetchNFTsOnChain(ownerAddress, contractAddress, provider) {
    if (!provider) throw new Error('Provider not available');

    const contract = new ethers.Contract(contractAddress, this.ERC721_ABI, provider);

    try {
      const balance = await contract.balanceOf(ownerAddress);
      const nfts = [];

      for (let i = 0; i < balance; i++) {
        const tokenId = await contract.tokenOfOwnerByIndex(ownerAddress, i);
        const tokenURI = await contract.tokenURI(tokenId);

        let metadata = {};
        if (tokenURI.startsWith('http')) {
          try {
            const response = await fetch(tokenURI);
            metadata = await response.json();
          } catch (e) {
            console.error('Failed to fetch metadata:', e);
          }
        }

        nfts.push({
          contract: contractAddress,
          tokenId: tokenId.toString(),
          name: metadata.name || `Token #${tokenId}`,
          description: metadata.description || '',
          image: metadata.image || '',
          tokenURI,
          owner: ownerAddress,
          source: 'onchain',
        });
      }

      return nfts;
    } catch (error) {
      console.error('On-chain fetch failed:', error);
      throw error;
    }
  }

  // Transfer NFT
  async transferNFT(contractAddress, toAddress, tokenId, signer) {
    if (!signer) throw new Error('Signer not available');

    const contract = new ethers.Contract(contractAddress, this.ERC721_ABI, signer);

    try {
      const fromAddress = await signer.getAddress();
      const tx = await contract.safeTransferFrom(fromAddress, toAddress, tokenId);

      const receipt = await tx.wait();

      return {
        success: true,
        hash: tx.hash,
        receipt,
      };
    } catch (error) {
      console.error('Transfer failed:', error);
      throw error;
    }
  }

  // Burn NFT
  async burnNFT(contractAddress, tokenId, signer) {
    if (!signer) throw new Error('Signer not available');
    if (!contractAddress) throw new Error('Contract address not available');

    // Import the full ABI that includes burn function
    const { getNFTContract } = await import('../utils/contractHelpers');
    const contract = getNFTContract(contractAddress, signer);

    try {
      // Add logging for debugging
      console.log('Burn parameters:', { tokenId });
      
      if (window.addDebugLog) {
        window.addDebugLog('info', 'Initiating NFT burn', {
          tokenId,
          contract: contractAddress
        });
      }
      
      // Estimate gas first for better mobile compatibility
      const gasEstimate = await contract.burn.estimateGas(tokenId);
      
      const tx = await contract.burn(tokenId, {
        gasLimit: gasEstimate * 120n / 100n // Add 20% buffer
      });
      
      if (window.addDebugLog) {
        window.addDebugLog('info', 'Burn transaction sent', { hash: tx.hash });
      }
      
      const receipt = await tx.wait();

      return {
        success: true,
        hash: tx.hash,
        receipt,
      };
    } catch (error) {
      console.error('Burn failed:', error);
      if (window.addDebugLog) {
        window.addDebugLog('error', 'Burn failed', {
          error: error.message,
          code: error.code
        });
      }
      throw error;
    }
  }

  // Check ownership
  async checkOwnership(contractAddress, tokenId, ownerAddress, provider) {
    if (!provider) throw new Error('Provider not available');

    const contract = new ethers.Contract(contractAddress, this.ERC721_ABI, provider);

    try {
      const owner = await contract.ownerOf(tokenId);
      return owner.toLowerCase() === ownerAddress.toLowerCase();
    } catch (error) {
      console.error('Ownership check failed:', error);
      return false;
    }
  }
}

export default new NFTService();