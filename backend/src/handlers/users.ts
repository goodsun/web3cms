import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
  BatchGetCommand,
} from '@aws-sdk/lib-dynamodb';
import { createResponse, HTTP_STATUS } from '../../utils/response';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const tableName = process.env.USERS_TABLE_NAME!;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const method = event.httpMethod;
  const path = event.path;
  
  // Extract EOA from path and normalize to lowercase
  const pathParts = path.split('/');
  const rawEoa = pathParts[pathParts.length - 1];
  const eoa = rawEoa ? rawEoa.toLowerCase() : rawEoa;

  try {
    switch (method) {
      case 'GET':
        if (eoa && eoa !== 'users') {
          // GET /users/{eoa} - Get specific user
          const result = await docClient.send(
            new GetCommand({
              TableName: tableName,
              Key: { eoa },
            })
          );
          
          if (!result.Item) {
            return createResponse(HTTP_STATUS.NOT_FOUND, {
              message: 'User not found'
            });
          }
          
          return createResponse(HTTP_STATUS.OK, result.Item);
        } else {
          // Check for batch request
          if (event.queryStringParameters?.eoas) {
            // GET /users?eoas=addr1,addr2,addr3 - Batch get users
            const eoas = event.queryStringParameters.eoas
              .split(',')
              .map(addr => addr.toLowerCase())
              .filter(addr => addr);
            
            if (eoas.length === 0) {
              return createResponse(HTTP_STATUS.BAD_REQUEST, {
                message: 'No valid EOA addresses provided'
              });
            }
            
            // DynamoDB BatchGet has a limit of 100 items
            if (eoas.length > 100) {
              return createResponse(HTTP_STATUS.BAD_REQUEST, {
                message: 'Too many addresses. Maximum 100 allowed per request'
              });
            }
            
            const result = await docClient.send(
              new BatchGetCommand({
                RequestItems: {
                  [tableName]: {
                    Keys: eoas.map(eoa => ({ eoa }))
                  }
                }
              })
            );
            
            const users = result.Responses?.[tableName] || [];
            return createResponse(HTTP_STATUS.OK, {
              users,
              count: users.length,
              requested: eoas.length
            });
          } else {
            // GET /users - List all users
            const result = await docClient.send(
              new ScanCommand({
                TableName: tableName,
              })
            );
            
            return createResponse(HTTP_STATUS.OK, {
              users: result.Items || [],
              count: result.Count || 0,
            });
          }
        }

      case 'POST':
        // POST /users - Create new user
        const createBody = JSON.parse(event.body || '{}');
        
        if (!createBody.eoa) {
          return createResponse(HTTP_STATUS.BAD_REQUEST, {
            message: 'EOA address is required'
          });
        }

        // Normalize EOA to lowercase
        const normalizedEoa = createBody.eoa.toLowerCase();

        // Check if user already exists
        const existing = await docClient.send(
          new GetCommand({
            TableName: tableName,
            Key: { eoa: normalizedEoa },
          })
        );
        
        if (existing.Item) {
          return createResponse(HTTP_STATUS.CONFLICT, {
            message: 'User already exists',
            user: existing.Item
          });
        }

        const newUser = {
          eoa: normalizedEoa,
          discordId: createBody.discordId || null,
          name: createBody.name || null,
          avatar: createBody.avatar || null,
          roles: createBody.roles || [],
          admin: createBody.admin || false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await docClient.send(
          new PutCommand({
            TableName: tableName,
            Item: newUser,
          })
        );

        return createResponse(HTTP_STATUS.CREATED, newUser);

      case 'PUT':
        // PUT /users/{eoa} - Update user
        if (!eoa || eoa === 'users') {
          return createResponse(HTTP_STATUS.BAD_REQUEST, {
            message: 'EOA address is required'
          });
        }

        const updateBody = JSON.parse(event.body || '{}');
        
        // Build update expression
        const updateExpression: string[] = [];
        const expressionAttributeNames: Record<string, string> = {};
        const expressionAttributeValues: Record<string, any> = {};

        if (updateBody.discordId !== undefined) {
          updateExpression.push('#discordId = :discordId');
          expressionAttributeNames['#discordId'] = 'discordId';
          expressionAttributeValues[':discordId'] = updateBody.discordId;
        }

        if (updateBody.name !== undefined) {
          updateExpression.push('#name = :name');
          expressionAttributeNames['#name'] = 'name';
          expressionAttributeValues[':name'] = updateBody.name;
        }

        if (updateBody.avatar !== undefined) {
          updateExpression.push('#avatar = :avatar');
          expressionAttributeNames['#avatar'] = 'avatar';
          expressionAttributeValues[':avatar'] = updateBody.avatar;
        }

        if (updateBody.roles !== undefined) {
          updateExpression.push('#roles = :roles');
          expressionAttributeNames['#roles'] = 'roles';
          expressionAttributeValues[':roles'] = updateBody.roles;
        }

        if (updateBody.admin !== undefined) {
          updateExpression.push('#admin = :admin');
          expressionAttributeNames['#admin'] = 'admin';
          expressionAttributeValues[':admin'] = updateBody.admin;
        }

        // Always update updatedAt
        updateExpression.push('#updatedAt = :updatedAt');
        expressionAttributeNames['#updatedAt'] = 'updatedAt';
        expressionAttributeValues[':updatedAt'] = new Date().toISOString();

        const updateResult = await docClient.send(
          new UpdateCommand({
            TableName: tableName,
            Key: { eoa },
            UpdateExpression: `SET ${updateExpression.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW',
          })
        );

        return createResponse(HTTP_STATUS.OK, updateResult.Attributes);

      case 'DELETE':
        // DELETE /users/{eoa} - Delete user
        if (!eoa || eoa === 'users') {
          return createResponse(HTTP_STATUS.BAD_REQUEST, {
            message: 'EOA address is required'
          });
        }

        await docClient.send(
          new DeleteCommand({
            TableName: tableName,
            Key: { eoa },
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