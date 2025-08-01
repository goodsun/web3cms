import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ethers } from 'ethers';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, GetCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { createResponse, HTTP_STATUS } from '../../utils/response';
import { isBurnAddress } from '../../utils/burnDetection';

// NFT ABI with ownerOf method
const NFT_ABI = [
  'function ownerOf(uint256 tokenId) view returns (address)'
];

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// Same as frontend getRpcProvider logic
const getRpcProvider = (rpcUrls: string, defaultChainId: number, ethers: any) => {
  const urls = rpcUrls.split(',').map(url => url.trim()).filter(url => url.length > 0);
  if (urls.length === 0) return null;
  
  // Use first URL for now (can implement round-robin later)
  const url = urls[0];
  return new ethers.JsonRpcProvider(url);
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
    // First, check cache (unless force is true)
    const nftsTableName = process.env.NFTS_TABLE_NAME || `web3cms-nfts-${process.env.ENV}`;
    let cacheResult: any = {};
    const now = Math.floor(Date.now() / 1000);
    const CACHE_TTL = 5 * 60; // 5 minutes for owner (mutable)
    
    if (!force) {
      cacheResult = await docClient.send(
        new GetCommand({
          TableName: nftsTableName,
          Key: { ca, id }
        })
      );

      // Check if owner exists in cache and is not expired
      if (cacheResult.Item?.owner && 
          cacheResult.Item?.ownerExpiry && 
          cacheResult.Item.ownerExpiry > now) {
        // Return from cache
        return createResponse(HTTP_STATUS.OK, {
          owner: cacheResult.Item.owner,
          contractAddress: ca,
          tokenId: id,
          cached: true,
          updatedAt: cacheResult.Item.updatedAt
        });
      }
    } else if (force) {
      // If force is true, still get the existing item to merge data
      cacheResult = await docClient.send(
        new GetCommand({
          TableName: nftsTableName,
          Key: { ca, id }
        })
      );
    }

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
    
    // Create contract instance
    const nftContract = new ethers.Contract(ca, NFT_ABI, activeProvider);
    
    // Call ownerOf method
    const owner = await nftContract.ownerOf(id);
    
    // Check if NFT has been burned
    if (isBurnAddress(owner)) {
      // Delete the record from DynamoDB
      await docClient.send(
        new DeleteCommand({
          TableName: nftsTableName,
          Key: { ca, id }
        })
      );
      
      return createResponse(HTTP_STATUS.OK, {
        owner,
        contractAddress: ca,
        tokenId: id,
        burned: true,
        cached: false,
        updatedAt: new Date().toISOString()
      });
    }
    
    // Save to cache
    let nftData: any = {
      ca,
      id,
      owner,
      ownerExpiry: now + CACHE_TTL,
      updatedAt: new Date().toISOString()
    };

    // If item exists, merge with existing data
    if (cacheResult.Item) {
      // Merge existing data with new data (new data overwrites)
      nftData = Object.assign({}, cacheResult.Item, nftData);
    } else {
      nftData.createdAt = new Date().toISOString();
    }

    await docClient.send(
      new PutCommand({
        TableName: nftsTableName,
        Item: nftData
      })
    );
    
    return createResponse(HTTP_STATUS.OK, {
      owner,
      contractAddress: ca,
      tokenId: id,
      cached: false,
      updatedAt: nftData.updatedAt
    });
  } catch (error) {
    console.error('Error fetching owner:', error);
    
    // Check if it's a burned/invalid token error
    if (error instanceof Error && 
        (error.message.includes('ERC721: invalid token ID') || 
         error.message.includes('ERC721: owner query for nonexistent token'))) {
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
    
    // Check if it's a contract error
    if (error instanceof Error && error.message.includes('call revert exception')) {
      return createResponse(HTTP_STATUS.NOT_FOUND, {
        message: 'Token does not exist'
      });
    }
    
    return createResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, {
      message: 'Failed to fetch owner',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};