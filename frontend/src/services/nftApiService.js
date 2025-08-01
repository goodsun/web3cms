class NFTApiService {
  constructor() {
    this.baseUrl = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) {
      console.log('NFT API already initialized with URL:', this.baseUrl);
      return;
    }

    try {
      // First try to get config from local storage
      const storedApiUrl = localStorage.getItem('apiUrl');
      if (storedApiUrl) {
        console.log('Using API URL from localStorage:', storedApiUrl);
        this.baseUrl = storedApiUrl;
      } else {
        // Otherwise fetch from config
        console.log('Fetching API config from /api-config.json');
        const response = await fetch('/api-config.json');
        if (!response.ok) {
          throw new Error(`Failed to fetch api-config.json: ${response.status} ${response.statusText}`);
        }
        const config = await response.json();
        console.log('API config loaded:', config);
        this.baseUrl = config.apiEndpoint || config.apiUrl;
        if (this.baseUrl) {
          localStorage.setItem('apiUrl', this.baseUrl);
        }
      }

      if (!this.baseUrl) {
        console.warn('No API URL configured. Please set it in Settings page.');
        throw new Error('API URL not configured');
      }

      // Remove trailing slash if present
      this.baseUrl = this.baseUrl.replace(/\/$/, '');
      
      console.log('NFT API initialized with URL:', this.baseUrl);
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize NFT API:', error);
      throw error;
    }
  }

  /**
   * Get all NFT info from API (combined endpoint)
   * @param {string} contractAddress - NFT contract address
   * @param {string} tokenId - Token ID
   * @param {boolean} force - Force refresh cache
   * @returns {Promise<object>} NFT info
   */
  async getNFTInfo(contractAddress, tokenId, force = false) {
    await this.init();
    
    try {
      const url = new URL(`${this.baseUrl}/nfts/${contractAddress}/${tokenId}/info`);
      if (force) {
        url.searchParams.append('force', 'true');
      }

      console.log('Fetching NFT info from:', url.toString());
      const response = await fetch(url.toString());
      console.log('API Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Response error body:', errorText);
        throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('API Response data:', data);
      return data;
    } catch (error) {
      console.error('Failed to fetch NFT info from API:', error);
      throw error;
    }
  }

  /**
   * Get token URI from API
   * @param {string} contractAddress - NFT contract address
   * @param {string} tokenId - Token ID
   * @param {boolean} force - Force refresh cache
   * @returns {Promise<object>} Token URI data
   */
  async getTokenURI(contractAddress, tokenId, force = false) {
    await this.init();
    
    try {
      const url = new URL(`${this.baseUrl}/nfts/${contractAddress}/${tokenId}/tokenURI`);
      if (force) {
        url.searchParams.append('force', 'true');
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to fetch token URI from API:', error);
      throw error;
    }
  }

  /**
   * Get owner from API
   * @param {string} contractAddress - NFT contract address
   * @param {string} tokenId - Token ID
   * @param {boolean} force - Force refresh cache
   * @returns {Promise<object>} Owner data
   */
  async getOwner(contractAddress, tokenId, force = false) {
    await this.init();
    
    try {
      const url = new URL(`${this.baseUrl}/nfts/${contractAddress}/${tokenId}/owner`);
      if (force) {
        url.searchParams.append('force', 'true');
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to fetch owner from API:', error);
      throw error;
    }
  }

  /**
   * Get creator from API
   * @param {string} contractAddress - NFT contract address
   * @param {string} tokenId - Token ID
   * @param {boolean} force - Force refresh cache
   * @returns {Promise<object>} Creator data
   */
  async getCreator(contractAddress, tokenId, force = false) {
    await this.init();
    
    try {
      const url = new URL(`${this.baseUrl}/nfts/${contractAddress}/${tokenId}/creator`);
      if (force) {
        url.searchParams.append('force', 'true');
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to fetch creator from API:', error);
      throw error;
    }
  }

  /**
   * Get TBA address from API
   * @param {string} contractAddress - NFT contract address
   * @param {string} tokenId - Token ID
   * @param {boolean} force - Force refresh cache
   * @returns {Promise<object>} TBA data
   */
  async getTBA(contractAddress, tokenId, force = false) {
    await this.init();
    
    try {
      const url = new URL(`${this.baseUrl}/nfts/${contractAddress}/${tokenId}/tba`);
      if (force) {
        url.searchParams.append('force', 'true');
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to fetch TBA from API:', error);
      throw error;
    }
  }

  /**
   * Get SBT flag from API
   * @param {string} contractAddress - NFT contract address
   * @param {string} tokenId - Token ID
   * @param {boolean} force - Force refresh cache
   * @returns {Promise<object>} SBT flag data
   */
  async getSbtFlag(contractAddress, tokenId, force = false) {
    await this.init();
    
    try {
      const url = new URL(`${this.baseUrl}/nfts/${contractAddress}/${tokenId}/sbtFlag`);
      if (force) {
        url.searchParams.append('force', 'true');
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to fetch SBT flag from API:', error);
      throw error;
    }
  }

  /**
   * Get royalty info from API
   * @param {string} contractAddress - NFT contract address
   * @param {string} tokenId - Token ID
   * @param {string} salePrice - Sale price for calculation (optional)
   * @param {boolean} force - Force refresh cache
   * @returns {Promise<object>} Royalty info data
   */
  async getRoyaltyInfo(contractAddress, tokenId, salePrice = null, force = false) {
    await this.init();
    
    try {
      const url = new URL(`${this.baseUrl}/nfts/${contractAddress}/${tokenId}/royaltyInfo`);
      if (force) {
        url.searchParams.append('force', 'true');
      }
      if (salePrice) {
        url.searchParams.append('salePrice', salePrice);
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to fetch royalty info from API:', error);
      throw error;
    }
  }
}

export default new NFTApiService();