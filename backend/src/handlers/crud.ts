import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  DeleteCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { HTTP_STATUS, ERROR_MESSAGES, generateTimestamp } from '../constants';
import { createResponse } from '../../utils/response';
import { handleError, ValidationError, NotFoundError } from '../../utils/errors';
import { generateId } from '../../utils/id-generator';

const client = new DynamoDBClient({ region: process.env.REGION });
const docClient = DynamoDBDocumentClient.from(client);
const tableName = process.env.TABLE_NAME!;


export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const { httpMethod, path, pathParameters, body } = event;

    // Handle different HTTP methods
    switch (httpMethod) {
      case 'GET':
        if (pathParameters?.id) {
          // Get specific item
          const getResult = await docClient.send(
            new GetCommand({
              TableName: tableName,
              Key: { id: pathParameters.id },
            })
          );

          if (!getResult.Item) {
            throw new NotFoundError(ERROR_MESSAGES.ITEM_NOT_FOUND);
          }

          return createResponse(HTTP_STATUS.OK, getResult.Item);
        } else {
          // List all items
          const scanResult = await docClient.send(
            new ScanCommand({
              TableName: tableName,
            })
          );

          return createResponse(HTTP_STATUS.OK, {
            items: scanResult.Items || [],
            count: scanResult.Count || 0,
          });
        }

      case 'POST':
        if (!body) {
          throw new ValidationError(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.BODY_REQUIRED);
        }

        const newItem = JSON.parse(body);
        
        // Generate ID if not provided
        if (!newItem.id) {
          newItem.id = generateId('item');
        }
        
        // Check if ID already exists (especially important for 'root')
        const existingItem = await docClient.send(
          new GetCommand({
            TableName: tableName,
            Key: { id: newItem.id },
          })
        );
        
        if (existingItem.Item) {
          throw new ValidationError(HTTP_STATUS.CONFLICT, 'Item with this ID already exists');
        }
        
        // Add timestamp
        const timestamp = generateTimestamp();
        newItem.createdAt = timestamp;
        newItem.updatedAt = timestamp;

        await docClient.send(
          new PutCommand({
            TableName: tableName,
            Item: newItem,
          })
        );

        return createResponse(HTTP_STATUS.CREATED, newItem);

      case 'PUT':
        if (!pathParameters?.id || !body) {
          throw new ValidationError(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.ID_AND_BODY_REQUIRED);
        }

        const updateData = JSON.parse(body);
        delete updateData.id; // Don't update the ID
        
        // Build update expression
        const updateExpressionParts: string[] = [];
        const expressionAttributeNames: Record<string, string> = {};
        const expressionAttributeValues: Record<string, any> = {};
        
        Object.keys(updateData).forEach((key, index) => {
          const attrName = `#attr${index}`;
          const attrValue = `:val${index}`;
          
          updateExpressionParts.push(`${attrName} = ${attrValue}`);
          expressionAttributeNames[attrName] = key;
          expressionAttributeValues[attrValue] = updateData[key];
        });
        
        // Add updatedAt
        updateExpressionParts.push('#updatedAt = :updatedAt');
        expressionAttributeNames['#updatedAt'] = 'updatedAt';
        expressionAttributeValues[':updatedAt'] = generateTimestamp();

        const updateResult = await docClient.send(
          new UpdateCommand({
            TableName: tableName,
            Key: { id: pathParameters.id },
            UpdateExpression: `SET ${updateExpressionParts.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW',
          })
        );

        return createResponse(HTTP_STATUS.OK, updateResult.Attributes);

      case 'DELETE':
        if (!pathParameters?.id) {
          throw new ValidationError(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.ID_REQUIRED);
        }

        await docClient.send(
          new DeleteCommand({
            TableName: tableName,
            Key: { id: pathParameters.id },
          })
        );

        return createResponse(HTTP_STATUS.NO_CONTENT, '');

      default:
        return createResponse(HTTP_STATUS.METHOD_NOT_ALLOWED, { message: ERROR_MESSAGES.METHOD_NOT_ALLOWED });
    }
  } catch (error) {
    return handleError(error);
  }
};