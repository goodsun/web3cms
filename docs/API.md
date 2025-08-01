# Web3CMS API Documentation

## Overview

The Web3CMS API is a RESTful API built on AWS API Gateway and Lambda functions. It provides endpoints for content management, settings, and general CRUD operations.

## Base URL

```
Development: https://api-dev.example.com
Staging: https://api-staging.example.com
Production: https://api.example.com
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

## Common Response Formats

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
  "error": "Detailed error message (only in non-production)"
}
```

### HTTP Status Codes

- `200 OK` - Successful request
- `201 Created` - Resource created successfully
- `204 No Content` - Successful deletion
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `405 Method Not Allowed` - Invalid HTTP method
- `500 Internal Server Error` - Server error

## Endpoints

### Items API

Basic CRUD operations for generic items.

#### List Items

```http
GET /items
```

**Response:**
```json
{
  "items": [
    {
      "id": "item-1234567890-abc123",
      "name": "Sample Item",
      "description": "Item description",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

#### Get Item

```http
GET /items/{id}
```

**Parameters:**
- `id` (path) - Item ID

**Response:**
```json
{
  "id": "item-1234567890-abc123",
  "name": "Sample Item",
  "description": "Item description",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### Create Item

```http
POST /items
```

**Request Body:**
```json
{
  "name": "New Item",
  "description": "Item description",
  "type": "custom",
  "metadata": { ... }
}
```

**Response:**
```json
{
  "id": "item-1234567890-abc123",
  "name": "New Item",
  "description": "Item description",
  "type": "custom",
  "metadata": { ... },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### Update Item

```http
PUT /items/{id}
```

**Parameters:**
- `id` (path) - Item ID

**Request Body:**
```json
{
  "name": "Updated Item",
  "description": "Updated description"
}
```

**Response:**
```json
{
  "id": "item-1234567890-abc123",
  "name": "Updated Item",
  "description": "Updated description",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### Delete Item

```http
DELETE /items/{id}
```

**Parameters:**
- `id` (path) - Item ID

**Response:**
```
204 No Content
```

### Settings API

Application configuration management.

#### Get Settings

```http
GET /settings/{key}
```

**Parameters:**
- `key` (path) - Setting key (default: "app_config")

**Response:**
```json
{
  "settingKey": "app_config",
  "version": "latest",
  "data": {
    "siteName": "Web3CMS",
    "theme": "light",
    "features": { ... }
  },
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### Update Settings

```http
PUT /settings/{key}
```

**Parameters:**
- `key` (path) - Setting key (default: "app_config")

**Request Body:**
```json
{
  "data": {
    "siteName": "My Web3CMS",
    "theme": "dark",
    "features": { ... }
  }
}
```

**Response:**
```json
{
  "settingKey": "app_config",
  "version": "latest",
  "data": { ... },
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Folders API

Content folder management with hierarchical structure.

#### List Folders

```http
GET /columns/folders
```

**Headers:**
- `Authorization: Bearer {wallet_address}` (required)

**Response:**
```json
{
  "folders": [
    {
      "id": "folder-1234567890-abc123",
      "type": "folder",
      "eoa": "0x1234567890abcdef1234567890abcdef12345678",
      "name": "My Folder",
      "description": "Folder description",
      "status": "public",
      "priority": 0,
      "parentId": null,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### Get Folder

```http
GET /columns/folders/{id}
```

**Headers:**
- `Authorization: Bearer {wallet_address}` (required)

**Parameters:**
- `id` (path) - Folder ID

**Response:**
```json
{
  "id": "folder-1234567890-abc123",
  "type": "folder",
  "eoa": "0x1234567890abcdef1234567890abcdef12345678",
  "name": "My Folder",
  "description": "Folder description",
  "status": "public",
  "priority": 0,
  "parentId": null,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### Create Folder

```http
POST /columns/folders
```

**Headers:**
- `Authorization: Bearer {wallet_address}` (required)

**Request Body:**
```json
{
  "name": "New Folder",
  "description": "Folder description",
  "status": "public",
  "priority": 0,
  "parentId": "parent-folder-id"
}
```

**Status Options:**
- `public` - Visible to everyone
- `limited` - Limited visibility
- `hidden` - Hidden from public

**Response:**
```json
{
  "id": "folder-1234567890-abc123",
  "type": "folder",
  "eoa": "0x1234567890abcdef1234567890abcdef12345678",
  "name": "New Folder",
  "description": "Folder description",
  "status": "public",
  "priority": 0,
  "parentId": "parent-folder-id",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### Update Folder

```http
PUT /columns/folders/{id}
```

**Headers:**
- `Authorization: Bearer {wallet_address}` (required)

**Parameters:**
- `id` (path) - Folder ID

**Request Body:**
```json
{
  "name": "Updated Folder",
  "description": "Updated description",
  "status": "limited",
  "priority": 1
}
```

**Note:** Only the folder owner can update it.

**Response:**
```json
{
  "id": "folder-1234567890-abc123",
  "name": "Updated Folder",
  "description": "Updated description",
  "status": "limited",
  "priority": 1,
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### Delete Folder

```http
DELETE /columns/folders/{id}
```

**Headers:**
- `Authorization: Bearer {wallet_address}` (required)

**Parameters:**
- `id` (path) - Folder ID
- `cascade` (query, optional) - Delete all contents in folder (true/false)

**Example:**
```
DELETE /columns/folders/folder-123?cascade=true
```

**Response:**
```
204 No Content
```

### Contents API

Content management within folders.

#### List Contents

```http
GET /columns/contents
```

**Headers:**
- `Authorization: Bearer {wallet_address}` (required)

**Query Parameters:**
- `folderId` (optional) - Filter by folder ID

**Response:**
```json
{
  "contents": [
    {
      "id": "content-1234567890-abc123",
      "type": "content",
      "folderId": "folder-123",
      "eoa": "0x1234567890abcdef1234567890abcdef12345678",
      "status": "published",
      "title": "My Content",
      "description": "Content description",
      "content": "# Markdown content here",
      "contentType": "text",
      "priority": 0,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### Get Content

```http
GET /columns/contents/{id}
```

**Headers:**
- `Authorization: Bearer {wallet_address}` (required)

**Parameters:**
- `id` (path) - Content ID

**Response:**
```json
{
  "id": "content-1234567890-abc123",
  "type": "content",
  "folderId": "folder-123",
  "eoa": "0x1234567890abcdef1234567890abcdef12345678",
  "status": "published",
  "title": "My Content",
  "description": "Content description",
  "content": "# Markdown content here",
  "contentType": "text",
  "priority": 0,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### Create Content

```http
POST /columns/contents
```

**Headers:**
- `Authorization: Bearer {wallet_address}` (required)

**Request Body:**
```json
{
  "folderId": "folder-123",
  "title": "New Content",
  "description": "Content description",
  "content": "# Markdown content here",
  "contentType": "text",
  "status": "draft",
  "priority": 0
}
```

**Status Options:**
- `draft` - Work in progress
- `review` - Under review
- `standby` - Ready to publish
- `published` - Published and visible

**Content Type Options:**
- `text` - Plain text/Markdown
- `html` - HTML content
- `image` - Image URL
- `video` - Video URL
- `iframe` - Embedded iframe
- `link` - External link

**Response:**
```json
{
  "id": "content-1234567890-abc123",
  "type": "content",
  "folderId": "folder-123",
  "eoa": "0x1234567890abcdef1234567890abcdef12345678",
  "title": "New Content",
  "description": "Content description",
  "content": "# Markdown content here",
  "contentType": "text",
  "status": "draft",
  "priority": 0,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### Update Content

```http
PUT /columns/contents/{id}
```

**Headers:**
- `Authorization: Bearer {wallet_address}` (required)

**Parameters:**
- `id` (path) - Content ID

**Request Body:**
```json
{
  "title": "Updated Content",
  "description": "Updated description",
  "content": "# Updated markdown content",
  "status": "published"
}
```

**Note:** Only the content owner can update it.

**Response:**
```json
{
  "id": "content-1234567890-abc123",
  "title": "Updated Content",
  "description": "Updated description",
  "content": "# Updated markdown content",
  "status": "published",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### Delete Content

```http
DELETE /columns/contents/{id}
```

**Headers:**
- `Authorization: Bearer {wallet_address}` (required)

**Parameters:**
- `id` (path) - Content ID

**Response:**
```
204 No Content
```

### Public API

Public endpoints that don't require authentication.

#### List Public Folders

```http
GET /columns/public/folders
```

**Response:**
```json
{
  "folders": [
    {
      "id": "folder-1234567890-abc123",
      "type": "folder",
      "name": "Public Folder",
      "description": "Public folder description",
      "status": "public",
      "priority": 0,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Note:** Only folders with `status: "public"` are returned.

#### List Published Contents

```http
GET /columns/public/contents
```

**Query Parameters:**
- `folderId` (optional) - Filter by folder ID

**Response:**
```json
{
  "contents": [
    {
      "id": "content-1234567890-abc123",
      "type": "content",
      "folderId": "folder-123",
      "status": "published",
      "title": "Published Content",
      "description": "Content description",
      "content": "# Public content",
      "contentType": "text",
      "priority": 0,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Note:** Only contents with `status: "published"` are returned.

#### Get Published Content

```http
GET /columns/public/contents/{id}
```

**Parameters:**
- `id` (path) - Content ID

**Response:**
```json
{
  "id": "content-1234567890-abc123",
  "type": "content",
  "folderId": "folder-123",
  "status": "published",
  "title": "Published Content",
  "description": "Content description",
  "content": "# Public content",
  "contentType": "text",
  "priority": 0,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Note:** Returns 404 if content is not published.

### Users API

User profile management with EOA as primary key.

#### List Users

```http
GET /users
```

**Headers:**
- `Authorization: Bearer {wallet_address}` (optional for admin)

**Response:**
```json
{
  "users": [
    {
      "eoa": "0x1234567890abcdef1234567890abcdef12345678",
      "discordAddress": "discord#1234",
      "name": "User Name",
      "avatar": "https://example.com/avatar.png",
      "roles": ["user", "contributor"],
      "admin": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

#### Get User

```http
GET /users/{eoa}
```

**Parameters:**
- `eoa` (path) - Ethereum Owner Address

**Response:**
```json
{
  "eoa": "0x1234567890abcdef1234567890abcdef12345678",
  "discordAddress": "discord#1234",
  "name": "User Name",
  "avatar": "https://example.com/avatar.png",
  "roles": ["user", "contributor"],
  "admin": false,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### Create User

```http
POST /users
```

**Headers:**
- `Authorization: Bearer {wallet_address}` (required)

**Request Body:**
```json
{
  "eoa": "0x1234567890abcdef1234567890abcdef12345678",
  "discordAddress": "discord#1234",
  "name": "User Name",
  "avatar": "https://example.com/avatar.png",
  "roles": ["user"],
  "admin": false
}
```

**Response:**
```json
{
  "eoa": "0x1234567890abcdef1234567890abcdef12345678",
  "discordAddress": "discord#1234",
  "name": "User Name",
  "avatar": "https://example.com/avatar.png",
  "roles": ["user"],
  "admin": false,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### Update User

```http
PUT /users/{eoa}
```

**Headers:**
- `Authorization: Bearer {wallet_address}` (required)

**Parameters:**
- `eoa` (path) - Ethereum Owner Address

**Request Body:**
```json
{
  "discordAddress": "newdiscord#5678",
  "name": "Updated Name",
  "avatar": "https://example.com/new-avatar.png",
  "roles": ["user", "contributor", "moderator"],
  "admin": true
}
```

**Response:**
```json
{
  "eoa": "0x1234567890abcdef1234567890abcdef12345678",
  "discordAddress": "newdiscord#5678",
  "name": "Updated Name",
  "avatar": "https://example.com/new-avatar.png",
  "roles": ["user", "contributor", "moderator"],
  "admin": true,
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### Delete User

```http
DELETE /users/{eoa}
```

**Headers:**
- `Authorization: Bearer {wallet_address}` (required, admin only)

**Parameters:**
- `eoa` (path) - Ethereum Owner Address

**Response:**
```
204 No Content
```

### NFTs API

NFT metadata management with composite key (contract address + token ID).

#### List NFTs

```http
GET /nfts
```

**Query Parameters:**
- `owner` (optional) - Filter by owner address
- `creator` (optional) - Filter by creator address

**Examples:**
```
GET /nfts?owner=0x1234567890abcdef1234567890abcdef12345678
GET /nfts?creator=0xabcdef1234567890abcdef1234567890abcdef12
```

**Response:**
```json
{
  "nfts": [
    {
      "ca": "0xcontract1234567890abcdef1234567890abcdef",
      "id": "1",
      "tokenUrl": "https://api.example.com/metadata/1",
      "name": "NFT #1",
      "image": "https://example.com/nft/1.png",
      "creator": "0xabcdef1234567890abcdef1234567890abcdef12",
      "owner": "0x1234567890abcdef1234567890abcdef12345678",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

#### List NFTs by Contract

```http
GET /nfts/{ca}
```

**Parameters:**
- `ca` (path) - Contract Address

**Response:**
```json
{
  "nfts": [
    {
      "ca": "0xcontract1234567890abcdef1234567890abcdef",
      "id": "1",
      "tokenUrl": "https://api.example.com/metadata/1",
      "name": "NFT #1",
      "image": "https://example.com/nft/1.png",
      "creator": "0xabcdef1234567890abcdef1234567890abcdef12",
      "owner": "0x1234567890abcdef1234567890abcdef12345678",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

#### Get NFT

```http
GET /nfts/{ca}/{id}
```

**Parameters:**
- `ca` (path) - Contract Address
- `id` (path) - Token ID

**Response:**
```json
{
  "ca": "0xcontract1234567890abcdef1234567890abcdef",
  "id": "1",
  "tokenUrl": "https://api.example.com/metadata/1",
  "name": "NFT #1",
  "image": "https://example.com/nft/1.png",
  "creator": "0xabcdef1234567890abcdef1234567890abcdef12",
  "owner": "0x1234567890abcdef1234567890abcdef12345678",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### Create NFT

```http
POST /nfts
```

**Headers:**
- `Authorization: Bearer {wallet_address}` (required)

**Request Body:**
```json
{
  "ca": "0xcontract1234567890abcdef1234567890abcdef",
  "id": "1",
  "tokenUrl": "https://api.example.com/metadata/1",
  "name": "NFT #1",
  "image": "https://example.com/nft/1.png",
  "creator": "0xabcdef1234567890abcdef1234567890abcdef12",
  "owner": "0x1234567890abcdef1234567890abcdef12345678"
}
```

**Response:**
```json
{
  "ca": "0xcontract1234567890abcdef1234567890abcdef",
  "id": "1",
  "tokenUrl": "https://api.example.com/metadata/1",
  "name": "NFT #1",
  "image": "https://example.com/nft/1.png",
  "creator": "0xabcdef1234567890abcdef1234567890abcdef12",
  "owner": "0x1234567890abcdef1234567890abcdef12345678",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### Update NFT

```http
PUT /nfts/{ca}/{id}
```

**Headers:**
- `Authorization: Bearer {wallet_address}` (required)

**Parameters:**
- `ca` (path) - Contract Address
- `id` (path) - Token ID

**Request Body:**
```json
{
  "tokenUrl": "https://api.example.com/metadata/1-updated",
  "name": "Updated NFT #1",
  "image": "https://example.com/nft/1-updated.png",
  "owner": "0xnewowner234567890abcdef1234567890abcdef"
}
```

**Note:** `creator` cannot be updated after creation.

**Response:**
```json
{
  "ca": "0xcontract1234567890abcdef1234567890abcdef",
  "id": "1",
  "tokenUrl": "https://api.example.com/metadata/1-updated",
  "name": "Updated NFT #1",
  "image": "https://example.com/nft/1-updated.png",
  "creator": "0xabcdef1234567890abcdef1234567890abcdef12",
  "owner": "0xnewowner234567890abcdef1234567890abcdef",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### Delete NFT

```http
DELETE /nfts/{ca}/{id}
```

**Headers:**
- `Authorization: Bearer {wallet_address}` (required, admin only)

**Parameters:**
- `ca` (path) - Contract Address
- `id` (path) - Token ID

**Response:**
```
204 No Content
```

## Rate Limiting

The API implements AWS API Gateway default rate limiting:
- 10,000 requests per second (RPS)
- 5,000 burst capacity

## CORS

All endpoints support CORS with the following headers:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS`
- `Access-Control-Allow-Headers: Content-Type,Authorization`

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "message": "Request body is required"
}
```

#### 401 Unauthorized
```json
{
  "message": "Authorization header is required"
}
```

#### 403 Forbidden
```json
{
  "message": "You do not have permission to perform this action"
}
```

#### 404 Not Found
```json
{
  "message": "Folder not found"
}
```

#### 500 Internal Server Error
```json
{
  "message": "Internal server error",
  "error": "Detailed error message (non-production only)"
}
```

## SDK Examples

### JavaScript/TypeScript

```javascript
// Using the provided API service classes
import { FolderService, ContentService } from './services/api';

const folderService = new FolderService();
const contentService = new ContentService();

// List folders
const folders = await folderService.getFolders();

// Create content
const newContent = await contentService.create({
  folderId: 'folder-123',
  title: 'My Content',
  content: '# Hello World',
  contentType: 'text',
  status: 'draft'
});

// Update content
const updated = await contentService.update(newContent.id, {
  status: 'published'
});
```

### cURL Examples

```bash
# Get public folders
curl https://api.example.com/columns/public/folders

# Create folder (with auth)
curl -X POST https://api.example.com/columns/folders \
  -H "Authorization: Bearer 0x1234567890abcdef1234567890abcdef12345678" \
  -H "Content-Type: application/json" \
  -d '{"name":"My Folder","status":"public"}'

# Delete folder with cascade
curl -X DELETE https://api.example.com/columns/folders/folder-123?cascade=true \
  -H "Authorization: Bearer 0x1234567890abcdef1234567890abcdef12345678"
```

## Webhooks

Currently not implemented. Future versions will support webhooks for:
- Content published
- Content updated
- Folder created/deleted

## API Versioning

The API currently uses URL-based versioning. Future versions will be available at:
- `/v1/` - Current version
- `/v2/` - Future version (planned)