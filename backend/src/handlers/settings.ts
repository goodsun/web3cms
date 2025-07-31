import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';
import { createResponse } from '../../utils/response';
import { handleError, ValidationError, NotFoundError } from '../../utils/errors';

const client = new DynamoDBClient({ region: process.env.REGION });
const docClient = DynamoDBDocumentClient.from(client);
const tableName = process.env.SETTINGS_TABLE_NAME!;


export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const { httpMethod, pathParameters } = event;
    const settingKey = pathParameters?.key || 'app_config';

    switch (httpMethod) {
      case 'GET':
        // Get setting
        const result = await docClient.send(
          new GetCommand({
            TableName: tableName,
            Key: {
              settingKey,
              version: 'latest',
            },
          })
        );

        if (!result.Item) {
          throw new NotFoundError('Settings not found');
        }

        return createResponse(200, result.Item);

      case 'PUT':
        // Update setting
        if (!event.body) {
          throw new ValidationError(400, 'Request body is required');
        }

        const body = JSON.parse(event.body);
        
        const settingItem = {
          settingKey,
          version: 'latest',
          data: body.data || body,
          updatedAt: new Date().toISOString(),
        };

        await docClient.send(
          new PutCommand({
            TableName: tableName,
            Item: settingItem,
          })
        );

        return createResponse(200, settingItem);

      default:
        throw new ValidationError(405, 'Method not allowed');
    }
  } catch (error) {
    return handleError(error);
  }
};