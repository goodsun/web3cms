# Web3CMS Backend Development Guide

## Overview

The Web3CMS backend is built with AWS Lambda functions written in TypeScript, providing serverless API endpoints for the application.

## Architecture

### Lambda Functions

The backend consists of several Lambda function handlers:

- **crud.ts** - Basic CRUD operations for items
- **settings.ts** - Application settings management
- **columns.ts** - CMS content and folder management
- **users.ts** - User profile management
- **admins.ts** - Admin role management
- **nfts.ts** - NFT data caching and operations

### Data Layer

- **DynamoDB Tables**:
  - `Items` - User items storage
  - `Settings` - Application configuration
  - `Columns` - CMS folders and contents
  - `Users` - User profiles
  - `NFTs` - NFT metadata cache

### Project Structure

```
backend/
├── src/
│   ├── handlers/           # Lambda function handlers
│   │   ├── crud.ts        # Items CRUD operations
│   │   ├── settings.ts    # Settings management
│   │   ├── columns.ts     # CMS operations
│   │   ├── users.ts       # User management
│   │   ├── admins.ts      # Admin management
│   │   └── nfts.ts        # NFT operations
│   ├── repositories/       # Data access layer
│   │   ├── base.repository.ts
│   │   ├── items.repository.ts
│   │   ├── settings.repository.ts
│   │   ├── columns.repository.ts
│   │   ├── users.repository.ts
│   │   └── nfts.repository.ts
│   ├── utils/             # Utility functions
│   │   ├── auth.ts        # Authentication helpers
│   │   ├── response.ts    # HTTP response helpers
│   │   └── validation.ts  # Input validation
│   └── constants.ts       # Shared constants
├── tests/                 # Unit tests
├── package.json
└── tsconfig.json
```

## Development Setup

### Prerequisites

- Node.js 20.x or higher
- AWS CLI configured
- TypeScript knowledge

### Installation

```bash
cd backend
npm install
```

### Build

```bash
npm run build
```

### Watch Mode

For development with auto-recompilation:

```bash
npm run watch
```

## Lambda Function Development

### Handler Structure

Each Lambda handler follows this pattern:

```typescript
import { APIGatewayProxyHandler } from 'aws-lambda';
import { createResponse, createErrorResponse } from '../utils/response';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // Extract auth info
    const eoa = event.headers.Authorization?.replace('Bearer ', '');
    
    // Validate input
    const body = JSON.parse(event.body || '{}');
    
    // Business logic
    const result = await processRequest(body, eoa);
    
    // Return success response
    return createResponse(200, result);
  } catch (error) {
    // Return error response
    return createErrorResponse(error);
  }
};
```

### Repository Pattern

Data access uses the repository pattern:

```typescript
export class ItemsRepository extends BaseRepository {
  constructor() {
    super(process.env.TABLE_NAME!);
  }

  async getItemsByUser(eoa: string): Promise<Item[]> {
    const params = {
      TableName: this.tableName,
      FilterExpression: 'eoa = :eoa',
      ExpressionAttributeValues: {
        ':eoa': eoa
      }
    };
    
    const result = await this.dynamoDb.scan(params).promise();
    return result.Items as Item[];
  }
}
```

### Environment Variables

Lambda functions use these environment variables:

- `TABLE_NAME` - DynamoDB table for items
- `SETTINGS_TABLE_NAME` - Settings table
- `COLUMNS_TABLE_NAME` - CMS content table
- `USERS_TABLE_NAME` - Users table
- `NFTS_TABLE_NAME` - NFT cache table
- `REGION` - AWS region
- `ENV` - Environment (dev/staging/prod)

## Testing

### Unit Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Test Structure

```typescript
import { handler } from '../src/handlers/crud';

describe('CRUD Handler', () => {
  it('should create an item', async () => {
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({ name: 'Test Item' }),
      headers: { Authorization: 'Bearer 0x123...' }
    };
    
    const response = await handler(event, context, callback);
    
    expect(response.statusCode).toBe(201);
    expect(JSON.parse(response.body)).toHaveProperty('id');
  });
});
```

## API Development

### Adding New Endpoints

1. Create handler in `src/handlers/`
2. Add repository if needed in `src/repositories/`
3. Update CDK stack to create Lambda function
4. Add API Gateway route in CDK
5. Update API documentation

### Error Handling

Use consistent error responses:

```typescript
// Validation error
if (!body.name) {
  throw new ValidationError('Name is required');
}

// Not found error
if (!item) {
  throw new NotFoundError('Item not found');
}

// Permission error
if (item.eoa !== userEoa) {
  throw new ForbiddenError('Access denied');
}
```

### Authentication

Most endpoints require wallet authentication:

```typescript
const requireAuth = (eoa?: string) => {
  if (!eoa) {
    throw new UnauthorizedError('Authentication required');
  }
  return eoa.toLowerCase();
};
```

## Database Schema

### Items Table

```typescript
interface Item {
  id: string;          // UUID
  eoa: string;         // Owner address
  name: string;
  description?: string;
  createdAt: string;   // ISO timestamp
  updatedAt: string;   // ISO timestamp
}
```

### Columns Table

```typescript
interface Folder {
  id: string;
  name: string;
  parentId?: string;
  eoa: string;
  status: 'public' | 'private';
  priority: number;
  createdAt: string;
  updatedAt: string;
}

interface Content {
  id: string;
  title: string;
  content: string;     // Markdown
  folderId?: string;
  eoa: string;
  status: 'draft' | 'review' | 'standby' | 'published';
  priority: number;
  createdAt: string;
  updatedAt: string;
}
```

## Best Practices

### 1. Input Validation

Always validate input data:

```typescript
const validateFolder = (data: any) => {
  if (!data.name || typeof data.name !== 'string') {
    throw new ValidationError('Invalid folder name');
  }
  
  if (data.status && !['public', 'private'].includes(data.status)) {
    throw new ValidationError('Invalid status');
  }
};
```

### 2. Consistent Responses

Use helper functions for responses:

```typescript
// Success
return createResponse(200, { message: 'Success', data: result });

// Error
return createErrorResponse(error);
```

### 3. Logging

Use structured logging:

```typescript
console.log('Processing request', {
  method: event.httpMethod,
  path: event.path,
  user: eoa
});
```

### 4. Performance

- Use DynamoDB batch operations for multiple items
- Implement caching where appropriate
- Keep Lambda packages small

## Deployment

### Local Testing

Use SAM CLI for local testing:

```bash
sam local start-api
```

### Deploy Changes

```bash
# Build and deploy
npm run build
cdk deploy --context env=dev
```

## Troubleshooting

### Common Issues

1. **DynamoDB Throttling**
   - Solution: Enable auto-scaling or use on-demand billing

2. **Lambda Timeout**
   - Solution: Increase timeout in CDK stack
   - Default: 10 seconds

3. **CORS Errors**
   - Solution: Check API Gateway CORS configuration

### Debugging

1. Check CloudWatch Logs:
```bash
aws logs tail /aws/lambda/web3cms-items-handler-dev
```

2. Enable detailed logging:
```typescript
console.log('Debug:', JSON.stringify(event, null, 2));
```

## Related Documentation

- [API Documentation](../../api/README.md) - API endpoint reference
- [Architecture Guide](../../architecture/ARCHITECTURE.md) - System architecture
- [Deployment Guide](../../deployment/DEPLOYMENT.md) - Deployment instructions