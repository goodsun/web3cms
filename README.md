# Web3CMS

A modern, serverless Content Management System with Web3 wallet authentication, built on AWS infrastructure.

## Overview

Web3CMS is a fullstack application that combines traditional CMS features with Web3 capabilities. It provides a secure, scalable content management platform with Ethereum wallet-based authentication and NFT integration.

### Key Features

- 🔐 **Web3 Authentication**: MetaMask wallet integration for secure login
- 📝 **Content Management**: Hierarchical folder structure with rich content support
- 🚀 **Serverless Architecture**: Built on AWS Lambda, API Gateway, and DynamoDB
- 🌐 **Public & Private Content**: Flexible access control for content visibility
- 📱 **Mobile Optimized**: Responsive design with mobile wallet support
- ⚡ **High Performance**: CloudFront CDN and optimized API design
- 🔧 **Infrastructure as Code**: Complete AWS CDK setup

## Tech Stack

### Backend
- AWS Lambda (Node.js 20.x)
- AWS API Gateway
- DynamoDB
- AWS CDK (TypeScript)
- S3 + CloudFront

### Frontend
- React 19.1.0
- Vite
- MetaMask SDK
- ethers.js
- React Router

## Quick Start

### Prerequisites

- Node.js 20.x or higher
- AWS CLI configured with appropriate credentials
- AWS CDK CLI (`npm install -g aws-cdk`)
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/web3cms.git
cd web3cms
```

2. Install dependencies:
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# Install backend dependencies
cd backend
npm install
cd ..
```

3. Deploy to AWS:
```bash
# Deploy to development environment
npm run deploy:dev

# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:prod
```

4. Start local development:
```bash
# Terminal 1: Start backend watch mode
npm run watch

# Terminal 2: Start frontend dev server
cd frontend
npm run dev
```

## Project Structure

```
web3cms/
├── backend/                    # Lambda functions and backend code
│   ├── src/
│   │   ├── handlers/          # Lambda function handlers
│   │   │   ├── crud.ts       # Basic CRUD operations
│   │   │   ├── settings.ts   # Settings management
│   │   │   └── columns.ts    # CMS content operations
│   │   └── constants.ts      # Shared constants
│   ├── repositories/          # Data access layer
│   ├── utils/                 # Utility functions
│   └── tsconfig.json
├── frontend/                   # React frontend application
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API services
│   │   ├── contexts/         # React contexts
│   │   ├── hooks/            # Custom hooks
│   │   └── utils/            # Utility functions
│   └── vite.config.js
├── lib/                       # CDK infrastructure code
│   └── fullstack-serverless-cdk-stack.ts
├── scripts/                   # Deployment and utility scripts
├── shared/                    # Shared code between frontend and backend
│   └── constants/            # Shared constants
└── docs/                     # Documentation

```

## API Documentation

See [API.md](docs/API.md) for detailed API documentation.

### Quick API Reference

- `GET /items` - List all items
- `POST /items` - Create new item
- `GET /items/{id}` - Get specific item
- `PUT /items/{id}` - Update item
- `DELETE /items/{id}` - Delete item
- `GET /columns/folders` - List folders
- `POST /columns/folders` - Create folder
- `GET /columns/contents` - List contents
- `POST /columns/contents` - Create content

## Configuration

### Environment Variables

#### Backend (Lambda)
- `TABLE_NAME` - DynamoDB table for items
- `SETTINGS_TABLE_NAME` - DynamoDB table for settings
- `REGION` - AWS region
- `ENV` - Environment (dev/staging/prod)

#### Frontend
- `VITE_API_ENDPOINT` - API Gateway endpoint URL

### AWS Resources

The CDK stack creates the following resources:
- API Gateway REST API
- Lambda functions
- DynamoDB tables (3)
- S3 bucket for frontend
- CloudFront distribution
- IAM roles and policies

## Development

### Local Development

1. Start the backend in watch mode:
```bash
npm run watch
```

2. Start the frontend dev server:
```bash
cd frontend
npm run dev
```

3. Access the application at `http://localhost:5173`

### Testing

```bash
# Run backend tests
npm test

# Run frontend tests
cd frontend
npm test
```

### Code Quality

```bash
# Build TypeScript
npm run build

# Type check
npm run typecheck
```

## Deployment

### Automated Deployment

Use the provided npm scripts for deployment:

```bash
# Deploy to specific environment
npm run deploy:dev
npm run deploy:staging
npm run deploy:prod

# Deploy with automatic frontend config update
./scripts/deploy-with-config.sh dev
```

### Manual Deployment

1. Build the project:
```bash
npm run build
```

2. Deploy using CDK:
```bash
cdk deploy --context env=dev
```

3. Update frontend configuration:
```bash
./scripts/update-frontend-config.sh dev
```

## Architecture

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed architecture documentation.

### High-Level Overview

- **Frontend**: React SPA hosted on S3/CloudFront
- **API**: REST API via API Gateway
- **Backend**: Lambda functions for business logic
- **Database**: DynamoDB for data storage
- **Authentication**: MetaMask wallet-based auth

## Contributing

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for contribution guidelines.

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## Support

- Documentation: [docs/](docs/)
- Issues: [GitHub Issues](https://github.com/yourusername/web3cms/issues)
- Discussions: [GitHub Discussions](https://github.com/yourusername/web3cms/discussions)

## Roadmap

- [ ] Enhanced Web3 authentication with signature verification
- [ ] NFT-gated content
- [ ] Multi-chain support
- [ ] Real-time updates with WebSocket
- [ ] Advanced search with OpenSearch
- [ ] Internationalization (i18n)
- [ ] Plugin system
- [ ] GraphQL API option

## Acknowledgments

Built with modern web technologies and AWS serverless services.