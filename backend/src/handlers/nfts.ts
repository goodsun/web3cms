import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { createResponse, HTTP_STATUS } from '../../utils/response';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const tableName = process.env.NFTS_TABLE_NAME!;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const method = event.httpMethod;
  const path = event.path;
  const queryParams = event.queryStringParameters || {};
  
  // Extract path parameters
  const pathParts = path.split('/');
  const resourceType = pathParts[2]; // 'nfts' or specific operation
  const ca = pathParts[3]; // contract address
  const id = pathParts[4]; // token id

  try {
    switch (method) {
      case 'GET':
        if (ca && id) {
          // GET /nfts/{ca}/{id} - Get specific NFT
          const result = await docClient.send(
            new GetCommand({
              TableName: tableName,
              Key: { ca, id },
            })
          );
          
          if (!result.Item) {
            return createResponse(HTTP_STATUS.NOT_FOUND, {
              message: 'NFT not found'
            });
          }
          
          return createResponse(HTTP_STATUS.OK, result.Item);
        } else if (ca && !id) {
          // GET /nfts/{ca} - Get all NFTs for a contract
          const result = await docClient.send(
            new QueryCommand({
              TableName: tableName,
              KeyConditionExpression: 'ca = :ca',
              ExpressionAttributeValues: {
                ':ca': ca,
              },
            })
          );
          
          return createResponse(HTTP_STATUS.OK, {
            nfts: result.Items || [],
            count: result.Count || 0,
          });
        } else if (queryParams.owner) {
          // GET /nfts?owner={owner} - Get NFTs by owner
          const result = await docClient.send(
            new QueryCommand({
              TableName: tableName,
              IndexName: 'owner-index',
              KeyConditionExpression: '#owner = :owner',
              ExpressionAttributeNames: {
                '#owner': 'owner',
              },
              ExpressionAttributeValues: {
                ':owner': queryParams.owner,
              },
            })
          );
          
          return createResponse(HTTP_STATUS.OK, {
            nfts: result.Items || [],
            count: result.Count || 0,
          });
        } else if (queryParams.creator) {
          // GET /nfts?creator={creator} - Get NFTs by creator
          const result = await docClient.send(
            new QueryCommand({
              TableName: tableName,
              IndexName: 'creator-index',
              KeyConditionExpression: 'creator = :creator',
              ExpressionAttributeValues: {
                ':creator': queryParams.creator,
              },
            })
          );
          
          return createResponse(HTTP_STATUS.OK, {
            nfts: result.Items || [],
            count: result.Count || 0,
          });
        } else {
          return createResponse(HTTP_STATUS.BAD_REQUEST, {
            message: 'Contract address or query parameter required'
          });
        }

      case 'POST':
        // POST /nfts - Create new NFT
        const createBody = JSON.parse(event.body || '{}');
        
        if (!createBody.ca || !createBody.id) {
          return createResponse(HTTP_STATUS.BAD_REQUEST, {
            message: 'Contract address (ca) and token ID (id) are required'
          });
        }

        // Check if NFT already exists
        const existing = await docClient.send(
          new GetCommand({
            TableName: tableName,
            Key: { ca: createBody.ca, id: createBody.id },
          })
        );
        
        if (existing.Item) {
          return createResponse(HTTP_STATUS.CONFLICT, {
            message: 'NFT already exists'
          });
        }

        const newNFT = {
          ca: createBody.ca,
          id: createBody.id,
          tokenUrl: createBody.tokenUrl || null,
          name: createBody.name || null,
          image: createBody.image || null,
          creator: createBody.creator || null,
          owner: createBody.owner || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await docClient.send(
          new PutCommand({
            TableName: tableName,
            Item: newNFT,
          })
        );

        return createResponse(HTTP_STATUS.CREATED, newNFT);

      case 'PUT':
        // PUT /nfts/{ca}/{id} - Update NFT
        if (!ca || !id) {
          return createResponse(HTTP_STATUS.BAD_REQUEST, {
            message: 'Contract address and token ID are required'
          });
        }

        const updateBody = JSON.parse(event.body || '{}');
        
        // Build update expression
        const updateExpression: string[] = [];
        const expressionAttributeNames: Record<string, string> = {};
        const expressionAttributeValues: Record<string, any> = {};

        if (updateBody.tokenUrl !== undefined) {
          updateExpression.push('#tokenUrl = :tokenUrl');
          expressionAttributeNames['#tokenUrl'] = 'tokenUrl';
          expressionAttributeValues[':tokenUrl'] = updateBody.tokenUrl;
        }

        if (updateBody.name !== undefined) {
          updateExpression.push('#name = :name');
          expressionAttributeNames['#name'] = 'name';
          expressionAttributeValues[':name'] = updateBody.name;
        }

        if (updateBody.image !== undefined) {
          updateExpression.push('#image = :image');
          expressionAttributeNames['#image'] = 'image';
          expressionAttributeValues[':image'] = updateBody.image;
        }

        if (updateBody.owner !== undefined) {
          updateExpression.push('#owner = :owner');
          expressionAttributeNames['#owner'] = 'owner';
          expressionAttributeValues[':owner'] = updateBody.owner;
        }

        // Always update updatedAt
        updateExpression.push('#updatedAt = :updatedAt');
        expressionAttributeNames['#updatedAt'] = 'updatedAt';
        expressionAttributeValues[':updatedAt'] = new Date().toISOString();

        const updateResult = await docClient.send(
          new UpdateCommand({
            TableName: tableName,
            Key: { ca, id },
            UpdateExpression: `SET ${updateExpression.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW',
          })
        );

        return createResponse(HTTP_STATUS.OK, updateResult.Attributes);

      case 'DELETE':
        // DELETE /nfts/{ca}/{id} - Delete NFT
        if (!ca || !id) {
          return createResponse(HTTP_STATUS.BAD_REQUEST, {
            message: 'Contract address and token ID are required'
          });
        }

        await docClient.send(
          new DeleteCommand({
            TableName: tableName,
            Key: { ca, id },
          })
        );

        return createResponse(HTTP_STATUS.NO_CONTENT);

      default:
        return createResponse(HTTP_STATUS.METHOD_NOT_ALLOWED, {
          message: 'Method not allowed'
        });
    }
  } catch (error) {
    console.error('Error:', error);
    return createResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, {
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};