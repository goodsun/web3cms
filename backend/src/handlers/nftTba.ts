import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ethers } from 'ethers';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { createResponse, HTTP_STATUS } from '../../utils/response';

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
    // First, check cache (unless force is true)
    const nftsTableName = process.env.NFTS_TABLE_NAME || `web3cms-nfts-${process.env.ENV}`;
    let cacheResult: any = {};
    const now = Math.floor(Date.now() / 1000);
    const CACHE_TTL = 30 * 24 * 60 * 60; // 30 days for TBA address (immutable)
    
    if (!force) {
      cacheResult = await docClient.send(
        new GetCommand({
          TableName: nftsTableName,
          Key: { ca, id }
        })
      );

      // Check if tba exists in cache and is not expired
      if (cacheResult.Item?.tba && 
          cacheResult.Item?.tbaExpiry && 
          cacheResult.Item.tbaExpiry > now) {
        // Return from cache
        return createResponse(HTTP_STATUS.OK, {
          tba: cacheResult.Item.tba,
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

    if (!web3Config.tbaRegistry || !web3Config.tbaImplementation) {
      return createResponse(HTTP_STATUS.NOT_FOUND, {
        message: 'TBA not configured'
      });
    }

    // Create provider - same as frontend
    const activeProvider = getRpcProvider(web3Config.rpcUrls, web3Config.defaultChainId, ethers);
    
    if (!activeProvider) {
      return createResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, {
        message: 'No provider available. Please check RPC configuration.'
      });
    }
    
    // Calculate TBA address
    const tba = await calculateTBAAddress(
      web3Config.tbaRegistry,
      web3Config.tbaImplementation,
      web3Config.tbaSalt || '0',
      web3Config.defaultChainId,
      ca,
      id,
      activeProvider
    );
    
    // Save to cache
    let nftData: any = {
      ca,
      id,
      tba,
      tbaExpiry: now + CACHE_TTL,
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
      tba,
      contractAddress: ca,
      tokenId: id,
      cached: false,
      updatedAt: nftData.updatedAt
    });
  } catch (error) {
    console.error('Error fetching TBA address:', error);
    
    return createResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, {
      message: 'Failed to fetch TBA address',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};