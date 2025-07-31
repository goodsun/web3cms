# Web3CMS Architecture Documentation

## System Overview

Web3CMS is a serverless, event-driven content management system built on AWS infrastructure with Web3 wallet authentication capabilities. The architecture follows cloud-native best practices with a focus on scalability, security, and cost optimization.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CloudFront CDN                             │
│                                                                     │
└────────────────────┬───────────────────────┬───────────────────────┘
                     │                       │
                     ▼                       ▼
            ┌────────────────┐      ┌────────────────┐
            │   S3 Bucket    │      │  API Gateway   │
            │ (React SPA)    │      │   (REST API)   │
            └────────────────┘      └────────┬───────┘
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    │                       │                       │
                    ▼                       ▼                       ▼
            ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
            │ Lambda:      │      │ Lambda:      │      │ Lambda:      │
            │ CRUD Handler │      │ Settings     │      │ Columns      │
            │              │      │ Handler      │      │ Handler      │
            └──────┬───────┘      └──────┬───────┘      └──────┬───────┘
                   │                     │                      │
                   └─────────────────────┴──────────────────────┘
                                        │
                                        ▼
                            ┌───────────────────────┐
                            │      DynamoDB         │
                            │  ┌─────────────────┐  │
                            │  │  Items Table    │  │
                            │  ├─────────────────┤  │
                            │  │ Settings Table  │  │
                            │  ├─────────────────┤  │
                            │  │ Columns Table   │  │
                            │  └─────────────────┘  │
                            └───────────────────────┘
```

## Core Components

### 1. Frontend Layer

#### React Single Page Application (SPA)
- **Technology**: React 19.1.0 with Vite
- **Hosting**: S3 bucket with CloudFront CDN
- **Key Features**:
  - Web3 wallet integration (MetaMask SDK)
  - Responsive design
  - Client-side routing
  - Real-time markdown preview
  - Progressive Web App capabilities

#### Key Frontend Services

```javascript
frontend/src/services/
├── api/
│   ├── base.service.js      // Base API client with auth
│   ├── item.service.js      // Items CRUD operations
│   ├── folder.service.js    // Folder management
│   ├── content.service.js   // Content management
│   └── settings.service.js  // Settings management
├── api.js                   // Legacy API service
└── nftService.js           // NFT-related operations
```

### 2. API Layer

#### API Gateway Configuration
- **Type**: REST API
- **Authentication**: Bearer token (wallet address)
- **CORS**: Enabled for all origins
- **Rate Limiting**: Default AWS limits (10K RPS)

#### Lambda Functions

**CRUD Handler** (`backend/src/handlers/crud.ts`)
- Generic CRUD operations for items
- Auto-generated IDs and timestamps
- Supports complex update expressions

**Settings Handler** (`backend/src/handlers/settings.ts`)
- Application configuration management
- Versioned settings with "latest" as default
- Key-value store pattern

**Columns Handler** (`backend/src/handlers/columns.ts`)
- Content management system core
- Folder hierarchy support
- Content workflow states
- Public/private access patterns
- Cascade delete functionality

### 3. Data Layer

#### DynamoDB Tables

**Items Table**
```
Primary Key: id (String)
GSI: eoa-type-index
  - Partition Key: eoa
  - Sort Key: type
```

**Settings Table**
```
Primary Key: settingKey (String)
Sort Key: version (String)
```

**Columns Table**
```
Primary Key: id (String)
GSI: type-index
  - Partition Key: type
Supports: folders, contents
```

#### Data Models

**Folder Entity**
```typescript
interface Folder {
  id: string;
  type: 'folder';
  parentId?: string;
  eoa: string;
  name: string;
  description?: string;
  status: 'public' | 'limited' | 'hidden';
  priority?: number;
  createdAt: string;
  updatedAt: string;
}
```

**Content Entity**
```typescript
interface Content {
  id: string;
  type: 'content';
  folderId: string;
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
```

### 4. Infrastructure Layer

#### AWS CDK Stack Components

```typescript
lib/fullstack-serverless-cdk-stack.ts
├── DynamoDB Tables (3)
├── Lambda Functions (3)
├── API Gateway REST API
├── S3 Bucket (Frontend hosting)
├── CloudFront Distribution
├── IAM Roles and Policies
└── Lambda Layers (shared dependencies)
```

#### Environment Configuration
- **Environments**: dev, staging, prod
- **Naming Convention**: `{project}-{resource}-{env}`
- **Region**: Configurable (default: us-east-1)

## Design Patterns

### 1. Repository Pattern

Base repository provides common CRUD operations:

```typescript
backend/repositories/
├── base.repository.ts    // Abstract base class
├── item.repository.ts    // Items repository
├── folder.repository.ts  // Folders repository
└── content.repository.ts // Contents repository
```

### 2. Service Layer Pattern

Frontend services encapsulate API calls:

```javascript
class BaseApiService {
  constructor(endpoint) { }
  async request(url, options) { }
  async getAll(params) { }
  async getById(id) { }
  async create(data) { }
  async update(id, data) { }
  async delete(id) { }
}
```

### 3. Error Handling Pattern

Centralized error handling with custom error types:

```typescript
backend/utils/errors.ts
├── ValidationError
├── NotFoundError
├── ForbiddenError
└── handleError()
```

### 4. Response Pattern

Standardized API responses:

```typescript
// Success
{
  statusCode: 200,
  headers: CORS_HEADERS,
  body: JSON.stringify(data)
}

// Error
{
  statusCode: 400,
  headers: CORS_HEADERS,
  body: JSON.stringify({
    message: "Error message",
    error: "Details (non-prod only)"
  })
}
```

## Security Architecture

### Authentication Flow

```
┌─────────┐     ┌──────────┐     ┌────────────┐     ┌─────────┐
│ Browser │────▶│ MetaMask │────▶│  Frontend  │────▶│   API   │
└─────────┘     └──────────┘     └────────────┘     └─────────┘
     │               │                   │                 │
     │   Connect     │                   │                 │
     │──────────────▶│                   │                 │
     │               │                   │                 │
     │   Address     │                   │                 │
     │◀──────────────│                   │                 │
     │               │                   │                 │
     │   Store EOA   │                   │                 │
     │───────────────────────────────────▶                 │
     │               │                   │                 │
     │           API Request            │                 │
     │───────────────────────────────────────────────────▶│
     │               │                   │  Bearer: EOA    │
     │               │                   │                 │
     │           Response               │                 │
     │◀────────────────────────────────────────────────────│
```

### Security Features

1. **API Security**
   - Bearer token authentication
   - Request validation
   - Input sanitization
   - Rate limiting

2. **Infrastructure Security**
   - S3 bucket with blocked public access
   - CloudFront OAI for S3 access
   - HTTPS enforcement
   - IAM least privilege principle

3. **Data Security**
   - User isolation by EOA
   - Permission checks on mutations
   - Audit trails via timestamps

## Performance Optimization

### Frontend Optimization

1. **Code Splitting**
   - Dynamic imports for large components
   - Route-based code splitting
   - Lazy loading of features

2. **Caching Strategy**
   - CloudFront caching for static assets
   - Browser caching headers
   - API response caching

3. **Bundle Optimization**
   - Tree shaking
   - Minification
   - Compression

### Backend Optimization

1. **Lambda Optimization**
   - Minimal cold starts with small bundles
   - Connection pooling for DynamoDB
   - Efficient query patterns

2. **Database Optimization**
   - GSI for common query patterns
   - Batch operations where possible
   - Projection expressions

3. **API Optimization**
   - Response compression
   - Pagination support
   - Field filtering

## Scalability Considerations

### Horizontal Scaling
- Lambda auto-scaling
- DynamoDB on-demand scaling
- CloudFront global edge locations

### Vertical Scaling
- Lambda memory/timeout configuration
- DynamoDB throughput adjustment
- API Gateway throttling limits

### Cost Optimization
- Pay-per-use serverless model
- S3 lifecycle policies
- CloudWatch log retention
- Reserved capacity for production

## Monitoring and Observability

### CloudWatch Integration
- Lambda function metrics
- API Gateway metrics
- DynamoDB metrics
- Custom application metrics

### Logging Strategy
- Structured JSON logging
- Log levels (ERROR, WARN, INFO, DEBUG)
- Correlation IDs for request tracking
- Log aggregation and analysis

### Alerting
- CloudWatch Alarms for errors
- SNS notifications
- Dashboard for real-time monitoring

## Deployment Architecture

### CI/CD Pipeline

```
┌─────────┐     ┌──────────┐     ┌─────────┐     ┌────────────┐
│  GitHub │────▶│  GitHub  │────▶│   AWS   │────▶│ CloudFront │
│  Push   │     │ Actions  │     │   CDK   │     │   + S3     │
└─────────┘     └──────────┘     └─────────┘     └────────────┘
                      │                 │
                      │                 ▼
                      │         ┌──────────────┐
                      │         │ API Gateway  │
                      │         │ + Lambda     │
                      │         └──────────────┘
                      │                 │
                      │                 ▼
                      │         ┌──────────────┐
                      └────────▶│  DynamoDB    │
                                └──────────────┘
```

### Deployment Process

1. **Build Phase**
   - TypeScript compilation
   - Frontend bundling
   - Dependency optimization

2. **Deploy Phase**
   - CDK synthesis
   - CloudFormation deployment
   - Lambda function updates
   - S3 sync
   - CloudFront invalidation

3. **Post-Deploy**
   - Configuration updates
   - Health checks
   - Smoke tests

## Future Architecture Enhancements

### Planned Improvements

1. **Authentication Enhancement**
   - Signature-based authentication
   - JWT token generation
   - Session management
   - Multi-wallet support

2. **Real-time Features**
   - WebSocket API via API Gateway
   - AppSync for GraphQL subscriptions
   - Live collaboration features

3. **Search Capabilities**
   - Amazon OpenSearch integration
   - Full-text search
   - Faceted search
   - Search analytics

4. **Advanced Features**
   - Multi-language support (i18n)
   - Plugin architecture
   - Webhook system
   - Advanced analytics

### Architectural Evolution

1. **Microservices Migration**
   - Service mesh consideration
   - Event-driven architecture
   - Domain-driven design

2. **Multi-Region Support**
   - Global Tables for DynamoDB
   - Multi-region replication
   - Geo-routing

3. **Enhanced Security**
   - AWS WAF integration
   - DDoS protection
   - Encryption at rest
   - Key management service

## Conclusion

The Web3CMS architecture provides a solid foundation for a scalable, secure, and performant content management system. The serverless approach ensures cost-effectiveness while maintaining high availability. The modular design allows for easy extension and modification as requirements evolve.