import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  DeleteCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { HTTP_STATUS, ERROR_MESSAGES, generateTimestamp } from '../constants';
import { createResponse } from '../../utils/response';
import { handleError, ValidationError, NotFoundError, ForbiddenError } from '../../utils/errors';
import { generateId } from '../../utils/id-generator';

const client = new DynamoDBClient({ region: process.env.REGION });
const docClient = DynamoDBDocumentClient.from(client);
const tableName = process.env.TABLE_NAME!;
const usersTableName = process.env.USERS_TABLE_NAME!;


// Get user EOA from authorization header
const getUserEOA = (event: APIGatewayProxyEvent): string | null => {
  const authHeader = event.headers?.Authorization || event.headers?.authorization;
  if (authHeader) {
    return authHeader.replace('Bearer ', '').toLowerCase();
  }
  return null;
};

// Check if user is admin
const isUserAdmin = async (eoa: string): Promise<boolean> => {
  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: usersTableName,
        Key: { eoa: eoa.toLowerCase() },
      })
    );
    return result.Item?.admin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Types
interface Folder {
  id: string;
  type: 'folder';
  parentId?: string;
  eoa: string;
  name: string;
  description?: string;
  status: 'public' | 'limited' | 'hidden';
  priority?: number;
  contents?: string;
  createdAt: string;
  updatedAt: string;
}

interface Content {
  id: string;
  type: 'content';
  folderId?: string | null;
  eoa: string;
  status: 'draft' | 'review' | 'standby' | 'published';
  title: string;
  description?: string;
  content: string;
  contentType?: 'text' | 'html' | 'image' | 'video' | 'iframe' | 'link';
  priority?: number;
  createdAt: string;
  updatedAt: string;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event, null, 2));

  // Handle preflight OPTIONS requests
  if (event.httpMethod === 'OPTIONS') {
    return createResponse(HTTP_STATUS.OK, {});
  }

  try {
    const { httpMethod, path, resource } = event;
    const userEOA = getUserEOA(event);

    // Handle public endpoints (no authentication required)
    if (resource === '/columns/public/folders') {
      if (httpMethod === 'GET') {
        // Get all public folders
        const result = await docClient.send(
          new QueryCommand({
            TableName: tableName,
            IndexName: 'type-index',
            KeyConditionExpression: '#type = :type',
            FilterExpression: '#status = :status',
            ExpressionAttributeNames: {
              '#type': 'type',
              '#status': 'status'
            },
            ExpressionAttributeValues: {
              ':type': 'folder',
              ':status': 'public'
            }
          })
        );

        return createResponse(HTTP_STATUS.OK, {
          folders: result.Items || []
        });
      }
      return createResponse(HTTP_STATUS.METHOD_NOT_ALLOWED, {
        message: 'Method not allowed'
      });
    }

    if (resource === '/columns/public/contents') {
      if (httpMethod === 'GET') {
        // Get all published contents
        const result = await docClient.send(
          new QueryCommand({
            TableName: tableName,
            IndexName: 'type-index',
            KeyConditionExpression: '#type = :type',
            FilterExpression: '#status = :status',
            ExpressionAttributeNames: {
              '#type': 'type',
              '#status': 'status'
            },
            ExpressionAttributeValues: {
              ':type': 'content',
              ':status': 'published'
            }
          })
        );

        return createResponse(HTTP_STATUS.OK, {
          contents: result.Items || []
        });
      }
      return createResponse(HTTP_STATUS.METHOD_NOT_ALLOWED, {
        message: 'Method not allowed'
      });
    }

    if (resource === '/columns/public/contents/{id}') {
      if (httpMethod === 'GET') {
        const contentId = event.pathParameters?.id;
        if (!contentId) {
          return createResponse(HTTP_STATUS.BAD_REQUEST, {
            message: 'Content ID is required'
          });
        }

        // Get specific public content
        const getResult = await docClient.send(
          new GetCommand({
            TableName: tableName,
            Key: { id: contentId },
          })
        );

        if (!getResult.Item || getResult.Item.type !== 'content') {
          return createResponse(HTTP_STATUS.NOT_FOUND, {
            message: 'Content not found'
          });
        }

        // Only return if content is published
        if (getResult.Item.status !== 'published') {
          return createResponse(HTTP_STATUS.NOT_FOUND, {
            message: 'Content not found'
          });
        }

        return createResponse(HTTP_STATUS.OK, {
          content: getResult.Item
        });
      }
      return createResponse(HTTP_STATUS.METHOD_NOT_ALLOWED, {
        message: 'Method not allowed'
      });
    }

    // Require authentication for all other operations
    if (!userEOA) {
      return createResponse(HTTP_STATUS.UNAUTHORIZED, { 
        message: 'Authentication required' 
      });
    }

    // Handle different endpoints based on resource instead of path
    if (resource === '/columns/folders') {
      switch (httpMethod) {
        case 'GET':
          // Get all folders
          const result = await docClient.send(
            new QueryCommand({
              TableName: tableName,
              IndexName: 'type-index',
              KeyConditionExpression: '#type = :type',
              ExpressionAttributeNames: {
                '#type': 'type'
              },
              ExpressionAttributeValues: {
                ':type': 'folder'
              }
            })
          );

          return createResponse(HTTP_STATUS.OK, {
            folders: result.Items || []
          });

        case 'POST':
          // Create new folder
          const body = event.body ? JSON.parse(event.body) : null;
          if (!body || !body.name) {
            return createResponse(HTTP_STATUS.BAD_REQUEST, {
              message: 'Folder name is required'
            });
          }

          const timestamp = generateTimestamp();
          const folderId = body.id || generateId('folder');
          
          // Check if ID already exists (especially important for 'root')
          if (body.id) {
            const existingItem = await docClient.send(
              new GetCommand({
                TableName: tableName,
                Key: { id: body.id },
              })
            );
            
            if (existingItem.Item) {
              return createResponse(HTTP_STATUS.CONFLICT, {
                message: 'Item with this ID already exists'
              });
            }
          }
          
          const newFolder: Folder = {
            id: folderId,
            type: 'folder',
            eoa: userEOA,
            name: body.name,
            description: body.description,
            status: body.status || 'public',
            priority: body.priority || 0,
            parentId: body.parentId,
            createdAt: timestamp,
            updatedAt: timestamp,
            ...(body.contents && { contents: body.contents })
          };

          await docClient.send(
            new PutCommand({
              TableName: tableName,
              Item: newFolder,
            })
          );

          return createResponse(HTTP_STATUS.CREATED, newFolder);

        default:
          return createResponse(HTTP_STATUS.METHOD_NOT_ALLOWED, {
            message: 'Method not allowed'
          });
      }
    }

    if (resource === '/columns/folders/{id}') {
      const folderId = event.pathParameters?.id;
      if (!folderId) {
        return createResponse(HTTP_STATUS.BAD_REQUEST, {
          message: 'Folder ID is required'
        });
      }

      switch (httpMethod) {
        case 'GET':
          // Get specific folder
          const getResult = await docClient.send(
            new GetCommand({
              TableName: tableName,
              Key: { id: folderId },
            })
          );

          if (!getResult.Item || getResult.Item.type !== 'folder') {
            return createResponse(HTTP_STATUS.NOT_FOUND, {
              message: 'Folder not found'
            });
          }

          return createResponse(HTTP_STATUS.OK, getResult.Item);

        case 'PUT':
          // Update folder
          const updateBody = event.body ? JSON.parse(event.body) : null;
          if (!updateBody) {
            return createResponse(HTTP_STATUS.BAD_REQUEST, {
              message: 'Request body is required'
            });
          }

          // First check if folder exists and belongs to user
          const checkResult = await docClient.send(
            new GetCommand({
              TableName: tableName,
              Key: { id: folderId },
            })
          );

          if (!checkResult.Item || checkResult.Item.type !== 'folder') {
            return createResponse(HTTP_STATUS.NOT_FOUND, {
              message: 'Folder not found'
            });
          }

          // Check if user owns the folder or is admin
          const isAdmin = await isUserAdmin(userEOA);
          if (checkResult.Item.eoa !== userEOA && !isAdmin) {
            return createResponse(HTTP_STATUS.FORBIDDEN, {
              message: 'You do not have permission to update this folder'
            });
          }

          // Update folder
          const updatedFolder = {
            ...checkResult.Item,
            ...updateBody,
            id: folderId, // Ensure ID doesn't change
            type: 'folder', // Ensure type doesn't change
            eoa: userEOA, // Ensure owner doesn't change
            updatedAt: generateTimestamp(),
          };

          await docClient.send(
            new PutCommand({
              TableName: tableName,
              Item: updatedFolder,
            })
          );

          return createResponse(HTTP_STATUS.OK, updatedFolder);

        case 'DELETE':
          // Delete folder
          // Check for cascade parameter
          const cascade = event.queryStringParameters?.cascade === 'true';
          
          // First check if folder exists and belongs to user
          const deleteCheckResult = await docClient.send(
            new GetCommand({
              TableName: tableName,
              Key: { id: folderId },
            })
          );

          if (!deleteCheckResult.Item || deleteCheckResult.Item.type !== 'folder') {
            return createResponse(HTTP_STATUS.NOT_FOUND, {
              message: 'Folder not found'
            });
          }

          // Check if user owns the folder or is admin
          const isAdminDelete = await isUserAdmin(userEOA);
          if (deleteCheckResult.Item.eoa !== userEOA && !isAdminDelete) {
            return createResponse(HTTP_STATUS.FORBIDDEN, {
              message: 'You do not have permission to delete this folder'
            });
          }

          // Check if folder has contents or subfolders
          const [contentsResult, subfoldersResult] = await Promise.all([
            // Check for contents in this folder
            docClient.send(
              new QueryCommand({
                TableName: tableName,
                IndexName: 'type-index',
                KeyConditionExpression: '#type = :type',
                FilterExpression: 'folderId = :folderId',
                ExpressionAttributeNames: {
                  '#type': 'type'
                },
                ExpressionAttributeValues: {
                  ':type': 'content',
                  ':folderId': folderId
                }
              })
            ),
            // Check for subfolders
            docClient.send(
              new QueryCommand({
                TableName: tableName,
                IndexName: 'type-index',
                KeyConditionExpression: '#type = :type',
                FilterExpression: 'parentId = :parentId',
                ExpressionAttributeNames: {
                  '#type': 'type'
                },
                ExpressionAttributeValues: {
                  ':type': 'folder',
                  ':parentId': folderId
                }
              })
            )
          ]);

          const hasContents = (contentsResult.Items?.length || 0) > 0;
          const hasSubfolders = (subfoldersResult.Items?.length || 0) > 0;

          if ((hasContents || hasSubfolders) && !cascade) {
            return createResponse(HTTP_STATUS.BAD_REQUEST, {
              message: 'Cannot delete folder with contents or subfolders. Use cascade=true to force delete.',
              details: {
                contentsCount: contentsResult.Items?.length || 0,
                subfoldersCount: subfoldersResult.Items?.length || 0
              }
            });
          }

          // If cascade delete is requested, delete all contents and subfolders
          if (cascade && (hasContents || hasSubfolders)) {
            const deletePromises = [];

            // Delete all contents
            if (contentsResult.Items) {
              for (const content of contentsResult.Items) {
                deletePromises.push(
                  docClient.send(
                    new DeleteCommand({
                      TableName: tableName,
                      Key: { id: content.id },
                    })
                  )
                );
              }
            }

            // Recursively delete subfolders
            // Note: This is simplified. In production, you'd want to handle deeper nesting
            if (subfoldersResult.Items) {
              for (const subfolder of subfoldersResult.Items) {
                deletePromises.push(
                  docClient.send(
                    new DeleteCommand({
                      TableName: tableName,
                      Key: { id: subfolder.id },
                    })
                  )
                );
              }
            }

            // Execute all deletes
            await Promise.all(deletePromises);
          }

          // Finally, delete the folder itself
          await docClient.send(
            new DeleteCommand({
              TableName: tableName,
              Key: { id: folderId },
            })
          );

          return createResponse(HTTP_STATUS.NO_CONTENT, '');

        default:
          return createResponse(HTTP_STATUS.METHOD_NOT_ALLOWED, {
            message: 'Method not allowed'
          });
      }
    }

    if (resource === '/columns/contents') {
      switch (httpMethod) {
        case 'GET':
          // Get all contents
          const result = await docClient.send(
            new QueryCommand({
              TableName: tableName,
              IndexName: 'type-index',
              KeyConditionExpression: '#type = :type',
              ExpressionAttributeNames: {
                '#type': 'type'
              },
              ExpressionAttributeValues: {
                ':type': 'content'
              }
            })
          );

          return createResponse(HTTP_STATUS.OK, {
            contents: result.Items || []
          });

        case 'POST':
          // Create new content
          const body = event.body ? JSON.parse(event.body) : null;
          if (!body || !body.title) {
            return createResponse(HTTP_STATUS.BAD_REQUEST, {
              message: 'Title is required'
            });
          }

          const timestamp = generateTimestamp();
          const contentId = body.id || `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          // Check if ID already exists (especially important for 'root')
          if (body.id) {
            const existingItem = await docClient.send(
              new GetCommand({
                TableName: tableName,
                Key: { id: body.id },
              })
            );
            
            if (existingItem.Item) {
              return createResponse(HTTP_STATUS.CONFLICT, {
                message: 'Item with this ID already exists'
              });
            }
          }

          const newContent: Content = {
            id: contentId,
            type: 'content',
            eoa: userEOA,
            ...(body.folderId && { folderId: body.folderId }),
            title: body.title,
            description: body.description,
            content: body.content || '',
            contentType: body.contentType || 'text',
            status: body.status || 'draft',
            priority: body.priority || 0,
            createdAt: timestamp,
            updatedAt: timestamp,
          };

          await docClient.send(
            new PutCommand({
              TableName: tableName,
              Item: newContent,
            })
          );

          return createResponse(HTTP_STATUS.CREATED, newContent);

        default:
          return createResponse(HTTP_STATUS.METHOD_NOT_ALLOWED, {
            message: 'Method not allowed'
          });
      }
    }

    if (resource === '/columns/contents/{id}') {
      const contentId = event.pathParameters?.id;
      if (!contentId) {
        return createResponse(HTTP_STATUS.BAD_REQUEST, {
          message: 'Content ID is required'
        });
      }

      switch (httpMethod) {
        case 'GET':
          // Get specific content
          const getResult = await docClient.send(
            new GetCommand({
              TableName: tableName,
              Key: { id: contentId },
            })
          );

          if (!getResult.Item || getResult.Item.type !== 'content') {
            return createResponse(HTTP_STATUS.NOT_FOUND, {
              message: 'Content not found'
            });
          }

          return createResponse(HTTP_STATUS.OK, getResult.Item);

        case 'PUT':
          // Update content
          const updateBody = event.body ? JSON.parse(event.body) : null;
          if (!updateBody) {
            return createResponse(HTTP_STATUS.BAD_REQUEST, {
              message: 'Request body is required'
            });
          }

          // First check if content exists and belongs to user
          const checkResult = await docClient.send(
            new GetCommand({
              TableName: tableName,
              Key: { id: contentId },
            })
          );

          if (!checkResult.Item || checkResult.Item.type !== 'content') {
            return createResponse(HTTP_STATUS.NOT_FOUND, {
              message: 'Content not found'
            });
          }

          // Check if user owns the content or is admin
          const isAdminUpdateContent = await isUserAdmin(userEOA);
          if (checkResult.Item.eoa !== userEOA && !isAdminUpdateContent) {
            return createResponse(HTTP_STATUS.FORBIDDEN, {
              message: 'You do not have permission to update this content'
            });
          }

          // Update content
          const updatedContent = {
            ...checkResult.Item,
            ...updateBody,
            id: contentId, // Ensure ID doesn't change
            type: 'content', // Ensure type doesn't change
            eoa: userEOA, // Ensure owner doesn't change
            updatedAt: generateTimestamp(),
          };

          await docClient.send(
            new PutCommand({
              TableName: tableName,
              Item: updatedContent,
            })
          );

          return createResponse(HTTP_STATUS.OK, updatedContent);

        case 'DELETE':
          // Delete content
          // First check if content exists and belongs to user
          const deleteCheckResult = await docClient.send(
            new GetCommand({
              TableName: tableName,
              Key: { id: contentId },
            })
          );

          if (!deleteCheckResult.Item || deleteCheckResult.Item.type !== 'content') {
            return createResponse(HTTP_STATUS.NOT_FOUND, {
              message: 'Content not found'
            });
          }

          // Check if user owns the content or is admin
          const isAdminDeleteContent = await isUserAdmin(userEOA);
          if (deleteCheckResult.Item.eoa !== userEOA && !isAdminDeleteContent) {
            return createResponse(HTTP_STATUS.FORBIDDEN, {
              message: 'You do not have permission to delete this content'
            });
          }

          await docClient.send(
            new DeleteCommand({
              TableName: tableName,
              Key: { id: contentId },
            })
          );

          return createResponse(HTTP_STATUS.NO_CONTENT, '');

        default:
          return createResponse(HTTP_STATUS.METHOD_NOT_ALLOWED, {
            message: 'Method not allowed'
          });
      }
    }

    return createResponse(HTTP_STATUS.NOT_FOUND, { 
      message: 'Endpoint not found' 
    });
  } catch (error) {
    console.error('Error:', error);
    return createResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, {
      message: ERROR_MESSAGES.INTERNAL_ERROR,
      ...(process.env.ENV !== 'prod' && { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
    });
  }
};