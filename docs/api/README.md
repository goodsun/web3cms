# Web3CMS API Documentation

## Overview

Web3CMS API is a RESTful API built on AWS API Gateway and Lambda functions. It provides endpoints for content management, settings, and general CRUD operations.

## Base URLs

```
Development: https://your-api-dev.execute-api.region.amazonaws.com/dev
Staging: https://your-api-staging.execute-api.region.amazonaws.com/staging
Production: https://your-api.execute-api.region.amazonaws.com/prod
```

## Authentication

Most endpoints require authentication via MetaMask wallet address (EOA - Externally Owned Account).

### Authentication Header

```
Authorization: Bearer {wallet_address}
```

Example:
```
Authorization: Bearer 0x1234567890abcdef1234567890abcdef12345678
```

## Common Response Format

### Success Response

```json
{
  "data": { ... },
  "message": "Success"
}
```

### Error Response

```json
{
  "message": "Error description",
  "error": "Detailed error message (non-production only)"
}
```

### HTTP Status Codes

- `200 OK` - Success
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## API Endpoints

### Items Management

#### List Items
- **GET** `/items`
- **Auth Required**: Yes
- **Description**: Get all items for the authenticated user

#### Create Item
- **POST** `/items`
- **Auth Required**: Yes
- **Body**:
  ```json
  {
    "name": "string",
    "description": "string"
  }
  ```

#### Get Item
- **GET** `/items/{id}`
- **Auth Required**: Yes
- **Parameters**: `id` - Item ID

#### Update Item
- **PUT** `/items/{id}`
- **Auth Required**: Yes
- **Parameters**: `id` - Item ID
- **Body**:
  ```json
  {
    "name": "string",
    "description": "string"
  }
  ```

#### Delete Item
- **DELETE** `/items/{id}`
- **Auth Required**: Yes
- **Parameters**: `id` - Item ID

### Content Management (Columns)

#### Folders

##### List Folders
- **GET** `/columns/folders`
- **Auth Required**: No (public content)
- **Query Parameters**:
  - `status` - Filter by status (public/private)

##### Create Folder
- **POST** `/columns/folders`
- **Auth Required**: Yes
- **Body**:
  ```json
  {
    "name": "string",
    "parentId": "string (optional)",
    "status": "public|private",
    "priority": 0
  }
  ```

##### Update Folder
- **PUT** `/columns/folders/{id}`
- **Auth Required**: Yes
- **Parameters**: `id` - Folder ID

##### Delete Folder
- **DELETE** `/columns/folders/{id}`
- **Auth Required**: Yes
- **Parameters**: `id` - Folder ID
- **Query Parameters**:
  - `cascade` - Set to `true` to delete all contents

#### Contents

##### List Contents
- **GET** `/columns/contents`
- **Auth Required**: No (public content)
- **Query Parameters**:
  - `folderId` - Filter by folder
  - `status` - Filter by status

##### Get Content
- **GET** `/columns/contents/{id}`
- **Auth Required**: No (public content)
- **Parameters**: `id` - Content ID

##### Create Content
- **POST** `/columns/contents`
- **Auth Required**: Yes
- **Body**:
  ```json
  {
    "title": "string",
    "content": "string (markdown)",
    "folderId": "string (optional)",
    "status": "draft|review|standby|published",
    "priority": 0
  }
  ```

##### Update Content
- **PUT** `/columns/contents/{id}`
- **Auth Required**: Yes
- **Parameters**: `id` - Content ID

##### Delete Content
- **DELETE** `/columns/contents/{id}`
- **Auth Required**: Yes
- **Parameters**: `id` - Content ID

#### Root Content

##### Get Root Content
- **GET** `/columns/root`
- **Auth Required**: No
- **Description**: Get homepage content

##### Update Root Content
- **PUT** `/columns/root`
- **Auth Required**: Yes (Admin only)
- **Body**:
  ```json
  {
    "content": "string (markdown)"
  }
  ```

### Settings Management

#### Get Settings
- **GET** `/settings`
- **Auth Required**: No
- **Description**: Get public application settings

#### Update Settings
- **POST** `/settings`
- **Auth Required**: Yes (Admin only)
- **Body**:
  ```json
  {
    "siteName": "string",
    "description": "string",
    "adminEmails": ["email@example.com"],
    "features": {
      "requireAuth": false,
      "maintenanceMode": false
    }
  }
  ```

### User Management

#### List Users
- **GET** `/users`
- **Auth Required**: Yes (Admin only)
- **Description**: Get all registered users

#### Get User Profile
- **GET** `/users/profile`
- **Auth Required**: Yes
- **Description**: Get current user's profile

#### Update User Profile
- **PUT** `/users/profile`
- **Auth Required**: Yes
- **Body**:
  ```json
  {
    "displayName": "string",
    "avatarUrl": "string",
    "discordId": "string"
  }
  ```

### Admin Management

#### Check Admin Status
- **GET** `/admins/status`
- **Auth Required**: Yes
- **Description**: Check if current user is admin

#### List Admins
- **GET** `/admins`
- **Auth Required**: Yes
- **Description**: Get list of admin addresses

#### Grant Admin
- **POST** `/admins`
- **Auth Required**: Yes (Admin only)
- **Body**:
  ```json
  {
    "address": "0x..."
  }
  ```

#### Revoke Admin
- **DELETE** `/admins/{address}`
- **Auth Required**: Yes (Admin only)
- **Parameters**: `address` - Wallet address

### NFT Operations

See [NFT Endpoints Documentation](./nft-endpoints.md) for detailed NFT API documentation.

## Rate Limiting

- Default rate limit: 100 requests per minute per IP
- Authenticated requests: 200 requests per minute per wallet

## CORS Configuration

- Allowed origins: Configured per environment
- Allowed methods: GET, POST, PUT, DELETE, OPTIONS
- Allowed headers: Content-Type, Authorization

## Error Handling

All errors follow a consistent format:

```json
{
  "message": "Human-readable error message",
  "error": "Technical error details",
  "code": "ERROR_CODE"
}
```

Common error codes:
- `VALIDATION_ERROR` - Invalid input
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `INTERNAL_ERROR` - Server error