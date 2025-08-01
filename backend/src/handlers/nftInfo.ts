import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ethers } from 'ethers';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, GetCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { createResponse, HTTP_STATUS } from '../../utils/response';
import { extractMetadataFromTokenURI } from '../../utils/nftMetadata';
import { isBurnAddress } from '../../utils/burnDetection';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const NFT_ABI = [
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tokenCreator(uint256 tokenId) view returns (address)',
  'function sbtFlag(uint256 tokenId) view returns (bool)',
  'function royaltyInfo(uint256 tokenId, uint256 salePrice) view returns (address receiver, uint256 royaltyAmount)'
];

// Same as frontend getRpcProvider logic
const getRpcProvider = (rpcUrls: string, defaultChainId: number, ethers: any) => {
  const urls = rpcUrls.split(',').map(url => url.trim()).filter(url => url.length > 0);
  if (urls.length === 0) return null;
  
  // Use first URL for now (can implement round-robin later)
  const url = urls[0];
  return new ethers.JsonRpcProvider(url);
};

// Calculate TBA address (same logic as frontend)
const calculateTBAAddress = async (
  registryAddress: string,
  implementationAddress: string,
  salt: string,
  chainId: number,
  nftContract: string,
  tokenId: string,
  provider: any
) => {
  try {
    // Get registry contract code to determine the method to use
    const registryCode = await provider.getCode(registryAddress);
    
    // Create the registry contract interface
    const registryInterface = new ethers.Interface([
      'function account(address implementation, uint256 chainId, address tokenContract, uint256 tokenId, uint256 salt) view returns (address)',
      'function createAccount(address implementation, uint256 chainId, address tokenContract, uint256 tokenId, uint256 salt, bytes initData) returns (address)'
    ]);
    
    // Encode the function call to get consistent behavior
    const accountData = registryInterface.encodeFunctionData('account', [
      implementationAddress,
      chainId,
      nftContract,
      tokenId,
      salt
    ]);
    
    // Use staticCall to get the account address
    const result = await provider.call({
      to: registryAddress,
      data: accountData
    });
    
    // Decode the address from the result
    const decoded = registryInterface.decodeFunctionResult('account', result);
    return decoded[0];
  } catch (error) {
    console.error('Failed to calculate TBA address:', error);
    throw error;
  }
};

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const pathParameters = event.pathParameters || {};
  const ca = pathParameters.ca; // contract address
  const id = pathParameters.id; // token id
  
  // Get force parameter from query string
  const force = event.queryStringParameters?.force === 'true';

  if (!ca || !id) {
    return createResponse(HTTP_STATUS.BAD_REQUEST, {
      message: 'Contract address and token ID are required'
    });
  }

  try {
    // Get settings from DynamoDB - same as frontend gets from API
    const settingsTableName = process.env.SETTINGS_TABLE_NAME || `web3cms-settings-${process.env.ENV}`;
    const result = await docClient.send(
      new QueryCommand({
        TableName: settingsTableName,
        KeyConditionExpression: 'settingKey = :key',
        ExpressionAttributeValues: {
          ':key': 'app_config'
        },
        Limit: 1,
        ScanIndexForward: false
      })
    );

    if (!result.Items || result.Items.length === 0) {
      return createResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, {
        message: 'Settings not found'
      });
    }

    const settings = result.Items[0];
    const web3Config = settings.data?.web3;

    if (!web3Config || !web3Config.rpcUrls) {
      return createResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, {
        message: 'RPC configuration not found'
      });
    }

    // Create provider - same as frontend
    const activeProvider = getRpcProvider(web3Config.rpcUrls, web3Config.defaultChainId, ethers);
    
    if (!activeProvider) {
      return createResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, {
        message: 'No provider available. Please check RPC configuration.'
      });
    }

    // Check cache (unless force is true)
    const nftsTableName = process.env.NFTS_TABLE_NAME || `web3cms-nfts-${process.env.ENV}`;
    const now = Math.floor(Date.now() / 1000);
    
    // Different TTLs for different data
    const OWNER_TTL = 5 * 60; // 5 minutes for owner (mutable)
    const IMMUTABLE_TTL = 30 * 24 * 60 * 60; // 30 days for immutable data
    
    let cacheResult: any = {};
    let needsUpdate = false;
    let nftData: any = {
      ca,
      id,
      updatedAt: new Date().toISOString()
    };

    if (!force) {
      cacheResult = await docClient.send(
        new GetCommand({
          TableName: nftsTableName,
          Key: { ca, id }
        })
      );

      if (cacheResult.Item) {
        nftData = { ...cacheResult.Item };
        
        // Check what's still valid in cache
        const validTokenURI = cacheResult.Item.tokenURI && 
          cacheResult.Item.tokenURIExpiry && 
          cacheResult.Item.tokenURIExpiry > now;
        
        const validOwner = cacheResult.Item.owner && 
          cacheResult.Item.ownerExpiry && 
          cacheResult.Item.ownerExpiry > now;
        
        const validCreator = cacheResult.Item.creator && 
          cacheResult.Item.creatorExpiry && 
          cacheResult.Item.creatorExpiry > now;
        
        const validTba = cacheResult.Item.tba && 
          cacheResult.Item.tbaExpiry && 
          cacheResult.Item.tbaExpiry > now;
        
        const validSbtFlag = cacheResult.Item.sbtFlag !== undefined && 
          cacheResult.Item.sbtFlagExpiry && 
          cacheResult.Item.sbtFlagExpiry > now;
        
        const validRoyaltyInfo = cacheResult.Item.royaltyReceiver && 
          cacheResult.Item.royaltyPercentage !== undefined &&
          cacheResult.Item.royaltyInfoExpiry && 
          cacheResult.Item.royaltyInfoExpiry > now;

        // If all data is valid, return from cache
        if (validTokenURI && validOwner && validCreator && validTba && validSbtFlag && validRoyaltyInfo) {
          const response: any = {
            tokenURI: cacheResult.Item.tokenURI,
            name: cacheResult.Item.name,
            description: cacheResult.Item.description,
            imageUrl: cacheResult.Item.imageUrl,
            owner: cacheResult.Item.owner,
            creator: cacheResult.Item.creator,
            tba: cacheResult.Item.tba,
            sbtFlag: cacheResult.Item.sbtFlag,
            royalty: {
              receiver: cacheResult.Item.royaltyReceiver,
              percentage: cacheResult.Item.royaltyPercentage / 100 // Convert basis points to percentage
            },
            contractAddress: ca,
            tokenId: id,
            cached: true,
            updatedAt: cacheResult.Item.updatedAt
          };
          
          // Add additional metadata fields if they exist
          if (cacheResult.Item.animation_url) response.animation_url = cacheResult.Item.animation_url;
          if (cacheResult.Item.youtube_url) response.youtube_url = cacheResult.Item.youtube_url;
          if (cacheResult.Item.model) response.model = cacheResult.Item.model;
          if (cacheResult.Item.attributes) response.attributes = cacheResult.Item.attributes;
          if (cacheResult.Item.external_url) response.external_url = cacheResult.Item.external_url;
          if (cacheResult.Item.background_color) response.background_color = cacheResult.Item.background_color;
          if (cacheResult.Item.properties) response.properties = cacheResult.Item.properties;
          
          return createResponse(HTTP_STATUS.OK, response);
        }
        
        // Some data needs refresh
        needsUpdate = true;
      }
    } else {
      // Force refresh - still get existing data to merge
      cacheResult = await docClient.send(
        new GetCommand({
          TableName: nftsTableName,
          Key: { ca, id }
        })
      );
      if (cacheResult.Item) {
        nftData = { ...cacheResult.Item };
      }
      needsUpdate = true;
    }

    // Create contract instance
    const nftContract = new ethers.Contract(ca, NFT_ABI, activeProvider);
    
    // Fetch all data in parallel
    const promises: Promise<any>[] = [];
    const dataToFetch: string[] = [];

    // Determine what needs to be fetched
    if (force || !nftData.tokenURI || !nftData.tokenURIExpiry || nftData.tokenURIExpiry <= now) {
      promises.push(nftContract.tokenURI(id));
      dataToFetch.push('tokenURI');
    }

    if (force || !nftData.owner || !nftData.ownerExpiry || nftData.ownerExpiry <= now) {
      promises.push(nftContract.ownerOf(id));
      dataToFetch.push('owner');
    }

    if (force || !nftData.creator || !nftData.creatorExpiry || nftData.creatorExpiry <= now) {
      promises.push(nftContract.tokenCreator(id));
      dataToFetch.push('creator');
    }

    if (force || !nftData.tba || !nftData.tbaExpiry || nftData.tbaExpiry <= now) {
      if (web3Config.tbaRegistry && web3Config.tbaImplementation) {
        promises.push(calculateTBAAddress(
          web3Config.tbaRegistry,
          web3Config.tbaImplementation,
          web3Config.tbaSalt || '0',
          web3Config.defaultChainId,
          ca,
          id,
          activeProvider
        ));
        dataToFetch.push('tba');
      }
    }

    if (force || nftData.sbtFlag === undefined || !nftData.sbtFlagExpiry || nftData.sbtFlagExpiry <= now) {
      promises.push(nftContract.sbtFlag(id));
      dataToFetch.push('sbtFlag');
    }

    if (force || !nftData.royaltyReceiver || nftData.royaltyPercentage === undefined || !nftData.royaltyInfoExpiry || nftData.royaltyInfoExpiry <= now) {
      // Use 1 ETH as default sale price for royalty calculation
      const salePrice = '1000000000000000000';
      promises.push(nftContract.royaltyInfo(id, salePrice));
      dataToFetch.push('royaltyInfo');
    }

    // Execute all promises
    if (promises.length > 0) {
      const results = await Promise.all(promises);
      
      // Map results back to data
      for (let index = 0; index < dataToFetch.length; index++) {
        const key = dataToFetch[index];
        if (key === 'tokenURI') {
          nftData.tokenURI = results[index];
          nftData.tokenURIExpiry = now + IMMUTABLE_TTL;
          
          // Extract metadata from tokenURI using common utility
          const metadata = await extractMetadataFromTokenURI(nftData.tokenURI);
          nftData.name = metadata.name || nftData.name || '';
          nftData.description = metadata.description || nftData.description || '';
          nftData.imageUrl = metadata.imageUrl || nftData.imageUrl || null;
          
          // Store additional metadata fields
          if (metadata.animation_url) nftData.animation_url = metadata.animation_url;
          if (metadata.youtube_url) nftData.youtube_url = metadata.youtube_url;
          if (metadata.model) nftData.model = metadata.model;
          if (metadata.attributes) nftData.attributes = metadata.attributes;
          if (metadata.external_url) nftData.external_url = metadata.external_url;
          if (metadata.background_color) nftData.background_color = metadata.background_color;
          if (metadata.properties) nftData.properties = metadata.properties;
        } else if (key === 'owner') {
          nftData.owner = results[index];
          nftData.ownerExpiry = now + OWNER_TTL;
        } else if (key === 'creator') {
          nftData.creator = results[index];
          nftData.creatorExpiry = now + IMMUTABLE_TTL;
        } else if (key === 'tba') {
          nftData.tba = results[index];
          nftData.tbaExpiry = now + IMMUTABLE_TTL;
        } else if (key === 'sbtFlag') {
          nftData.sbtFlag = results[index];
          nftData.sbtFlagExpiry = now + IMMUTABLE_TTL;
        } else if (key === 'royaltyInfo') {
          const [receiver, royaltyAmount] = results[index];
          const salePrice = '1000000000000000000'; // 1 ETH used for calculation
          const percentage = Number((BigInt(royaltyAmount) * BigInt(10000)) / BigInt(salePrice));
          nftData.royaltyReceiver = receiver;
          nftData.royaltyPercentage = percentage; // Store as basis points
          nftData.royaltyInfoExpiry = now + IMMUTABLE_TTL;
        }
      }

      nftData.updatedAt = new Date().toISOString();
      if (!nftData.createdAt) {
        nftData.createdAt = nftData.updatedAt;
      }

      // Check if NFT has been burned
      if (nftData.owner && isBurnAddress(nftData.owner)) {
        // Delete the record from DynamoDB
        await docClient.send(
          new DeleteCommand({
            TableName: nftsTableName,
            Key: { ca, id }
          })
        );
        
        // Return burned NFT info
        return createResponse(HTTP_STATUS.OK, {
          owner: nftData.owner,
          contractAddress: ca,
          tokenId: id,
          burned: true,
          cached: false,
          updatedAt: nftData.updatedAt
        });
      }

      // Save to cache
      await docClient.send(
        new PutCommand({
          TableName: nftsTableName,
          Item: nftData
        })
      );
    }

    // Prepare response
    const response: any = {
      contractAddress: ca,
      tokenId: id,
      cached: promises.length === 0,
      updatedAt: nftData.updatedAt
    };

    // Add available data to response
    if (nftData.tokenURI) {
      response.tokenURI = nftData.tokenURI;
      response.name = nftData.name;
      response.description = nftData.description;
      response.imageUrl = nftData.imageUrl;
      
      // Add additional metadata fields
      if (nftData.animation_url) response.animation_url = nftData.animation_url;
      if (nftData.youtube_url) response.youtube_url = nftData.youtube_url;
      if (nftData.model) response.model = nftData.model;
      if (nftData.attributes) response.attributes = nftData.attributes;
      if (nftData.external_url) response.external_url = nftData.external_url;
      if (nftData.background_color) response.background_color = nftData.background_color;
      if (nftData.properties) response.properties = nftData.properties;
    }
    if (nftData.owner) response.owner = nftData.owner;
    if (nftData.creator) response.creator = nftData.creator;
    if (nftData.tba) response.tba = nftData.tba;
    if (nftData.sbtFlag !== undefined) response.sbtFlag = nftData.sbtFlag;
    if (nftData.royaltyReceiver && nftData.royaltyPercentage !== undefined) {
      response.royalty = {
        receiver: nftData.royaltyReceiver,
        percentage: nftData.royaltyPercentage / 100 // Convert basis points to percentage
      };
    }

    return createResponse(HTTP_STATUS.OK, response);
  } catch (error) {
    console.error('Error fetching NFT info:', error);
    
    // Check if it's a burned/invalid token error
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorReason = (error as any)?.reason || '';
    
    if (errorMessage.includes('ERC721: invalid token ID') || 
        errorMessage.includes('ERC721: owner query for nonexistent token') ||
        errorReason.includes('ERC721: invalid token ID') ||
        errorReason.includes('ERC721: owner query for nonexistent token')) {
      // Delete the cached record if it exists
      const nftsTableName = process.env.NFTS_TABLE_NAME || `web3cms-nfts-${process.env.ENV}`;
      await docClient.send(
        new DeleteCommand({
          TableName: nftsTableName,
          Key: { ca, id }
        })
      );
      
      return createResponse(HTTP_STATUS.OK, {
        owner: null,
        contractAddress: ca,
        tokenId: id,
        burned: true,
        cached: false,
        updatedAt: new Date().toISOString()
      });
    }
    
    return createResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, {
      message: 'Failed to fetch NFT info',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: process.env.ENV === 'dev' ? String(error) : undefined
    });
  }
};