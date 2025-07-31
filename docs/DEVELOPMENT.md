# Web3CMS Development Guide

## Getting Started

This guide will help you set up your local development environment for Web3CMS.

## Development Environment Setup

### Prerequisites

1. **Node.js v20.x or higher**
   ```bash
   # Install via nvm (recommended)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 20
   nvm use 20
   ```

2. **Git**
   ```bash
   git --version
   ```

3. **AWS CLI** (for deployment)
   ```bash
   # macOS
   brew install awscli
   
   # Others
   pip install awscli
   ```

4. **VS Code** (recommended) with extensions:
   - ESLint
   - Prettier
   - TypeScript and JavaScript
   - AWS Toolkit
   - GitLens

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/web3cms.git
   cd web3cms
   ```

2. **Install dependencies**
   ```bash
   # Install all dependencies
   npm run install:all
   
   # Or manually
   npm install
   cd frontend && npm install && cd ..
   cd backend && npm install && cd ..
   ```

3. **Set up environment variables**
   ```bash
   # Frontend (.env.development)
   cd frontend
   cp .env.example .env.development
   # Edit .env.development with your values
   
   # For local development, you can use:
   echo "VITE_API_ENDPOINT=http://localhost:3000" > .env.development
   ```

## Development Workflow

### Running the Application

#### Option 1: Full Stack Development

```bash
# Terminal 1: Watch TypeScript compilation
npm run watch

# Terminal 2: Run frontend dev server
cd frontend
npm run dev

# Terminal 3: Run local API (requires SAM CLI)
npm run start:api
```

#### Option 2: Frontend Only Development

```bash
cd frontend
npm run dev
```

Access the application at `http://localhost:5173`

### Code Structure

```
web3cms/
├── backend/                 # Lambda functions
│   ├── src/
│   │   ├── handlers/       # Lambda handlers
│   │   ├── constants.ts    # Shared constants
│   │   └── types.ts        # TypeScript types
│   ├── repositories/       # Data access layer
│   ├── utils/             # Utility functions
│   └── tests/             # Backend tests
├── frontend/               # React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom hooks
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── utils/         # Utilities
│   │   └── App.jsx        # Main app component
│   └── public/            # Static assets
├── lib/                    # CDK infrastructure
├── scripts/                # Utility scripts
└── shared/                 # Shared code
    └── constants/          # Shared constants
```

## Development Guidelines

### Code Style

#### TypeScript/JavaScript
- Use ESLint and Prettier for code formatting
- Follow existing code patterns
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

```typescript
/**
 * Creates a new folder in the system
 * @param data - Folder creation data
 * @returns Created folder object
 */
export async function createFolder(data: FolderInput): Promise<Folder> {
  // Implementation
}
```

#### React Components
- Use functional components with hooks
- Keep components small and focused
- Use proper prop types or TypeScript interfaces

```jsx
// Good example
const FolderCard = ({ folder, onEdit, onDelete }) => {
  return (
    <div className="folder-card">
      <h3>{folder.name}</h3>
      <p>{folder.description}</p>
      <button onClick={() => onEdit(folder.id)}>Edit</button>
      <button onClick={() => onDelete(folder.id)}>Delete</button>
    </div>
  );
};
```

### Git Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   ```bash
   # Make changes
   git add .
   git commit -m "feat: add new feature"
   ```

3. **Follow conventional commits**
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation changes
   - `style:` Code style changes
   - `refactor:` Code refactoring
   - `test:` Test changes
   - `chore:` Maintenance tasks

4. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## Testing

### Backend Testing

```bash
# Run all backend tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

#### Writing Backend Tests

```typescript
// backend/tests/handlers/crud.test.ts
import { handler } from '../../src/handlers/crud';

describe('CRUD Handler', () => {
  it('should return all items', async () => {
    const event = {
      httpMethod: 'GET',
      path: '/items',
      // ... other event properties
    };
    
    const response = await handler(event);
    
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toHaveProperty('items');
  });
});
```

### Frontend Testing

```bash
cd frontend

# Run tests
npm test

# Run with coverage
npm run test:coverage
```

#### Writing Frontend Tests

```jsx
// frontend/src/components/__tests__/FolderCard.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import FolderCard from '../FolderCard';

describe('FolderCard', () => {
  const mockFolder = {
    id: '123',
    name: 'Test Folder',
    description: 'Test Description'
  };

  it('renders folder information', () => {
    render(<FolderCard folder={mockFolder} />);
    
    expect(screen.getByText('Test Folder')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });
});
```

## Local Development Tools

### DynamoDB Local

For local DynamoDB development:

```bash
# Install DynamoDB Local
npm install -g dynamodb-local

# Start DynamoDB Local
dynamodb-local start --port 8000

# Create tables locally
aws dynamodb create-table \
  --table-name web3cms-items-dev \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url http://localhost:8000
```

### SAM Local

For local Lambda testing:

```bash
# Install SAM CLI
brew install aws-sam-cli

# Start local API
sam local start-api --template template.yaml
```

## Debugging

### VS Code Debug Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Lambda",
      "program": "${workspaceFolder}/backend/src/handlers/crud.ts",
      "preLaunchTask": "tsc: build - tsconfig.json",
      "outFiles": ["${workspaceFolder}/backend/dist/**/*.js"]
    },
    {
      "type": "chrome",
      "request": "launch",
      "name": "Debug Frontend",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/frontend/src"
    }
  ]
}
```

### Browser DevTools

1. **React DevTools**
   - Install React DevTools extension
   - Inspect component hierarchy and state

2. **Network Tab**
   - Monitor API calls
   - Check request/response headers
   - Verify authentication tokens

3. **Console Debugging**
   ```javascript
   // Add debug logs
   console.log('API Response:', response);
   console.debug('Component State:', state);
   ```

## Common Development Tasks

### Adding a New API Endpoint

1. **Create Lambda handler**
   ```typescript
   // backend/src/handlers/newFeature.ts
   export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
     // Implementation
   };
   ```

2. **Update CDK stack**
   ```typescript
   // lib/fullstack-serverless-cdk-stack.ts
   const newFeatureFunction = new NodejsFunction(this, 'NewFeatureFunction', {
     entry: path.join(__dirname, '../backend/src/handlers/newFeature.ts'),
     // ... configuration
   });
   ```

3. **Add API route**
   ```typescript
   const newFeatureResource = api.root.addResource('new-feature');
   newFeatureResource.addMethod('GET', new LambdaIntegration(newFeatureFunction));
   ```

### Adding a New Frontend Page

1. **Create page component**
   ```jsx
   // frontend/src/pages/NewPage.jsx
   const NewPage = () => {
     return (
       <div>
         <h1>New Page</h1>
       </div>
     );
   };
   export default NewPage;
   ```

2. **Add route**
   ```jsx
   // frontend/src/App.jsx
   import NewPage from './pages/NewPage';
   
   // In router
   <Route path="/new-page" element={<NewPage />} />
   ```

3. **Add navigation**
   ```jsx
   // frontend/src/components/Layout.jsx
   <Link to="/new-page">New Page</Link>
   ```

### Working with Web3

1. **Connect MetaMask**
   ```javascript
   const connectWallet = async () => {
     if (window.ethereum) {
       const accounts = await window.ethereum.request({ 
         method: 'eth_requestAccounts' 
       });
       setAccount(accounts[0]);
     }
   };
   ```

2. **Use Web3 Context**
   ```jsx
   import { useWeb3 } from '../contexts/Web3Context';
   
   const MyComponent = () => {
     const { account, isConnected, connectWallet } = useWeb3();
     
     return (
       <div>
         {isConnected ? (
           <p>Connected: {account}</p>
         ) : (
           <button onClick={connectWallet}>Connect Wallet</button>
         )}
       </div>
     );
   };
   ```

## Performance Optimization

### Frontend Performance

1. **Code Splitting**
   ```jsx
   // Lazy load heavy components
   const HeavyComponent = lazy(() => import('./HeavyComponent'));
   
   <Suspense fallback={<Loading />}>
     <HeavyComponent />
   </Suspense>
   ```

2. **Memoization**
   ```jsx
   const ExpensiveComponent = memo(({ data }) => {
     const processedData = useMemo(() => 
       processData(data), [data]
     );
     
     return <div>{processedData}</div>;
   });
   ```

3. **Image Optimization**
   ```jsx
   // Use appropriate image formats and lazy loading
   <img 
     src="image.webp" 
     loading="lazy" 
     alt="Description"
   />
   ```

### Backend Performance

1. **Batch Operations**
   ```typescript
   // Instead of multiple single operations
   const batchWrite = {
     RequestItems: {
       [tableName]: items.map(item => ({
         PutRequest: { Item: item }
       }))
     }
   };
   await docClient.batchWrite(batchWrite);
   ```

2. **Caching**
   ```typescript
   // Simple in-memory cache
   const cache = new Map();
   
   export const getCachedData = async (key: string) => {
     if (cache.has(key)) {
       return cache.get(key);
     }
     
     const data = await fetchData(key);
     cache.set(key, data);
     return data;
   };
   ```

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check API Gateway CORS configuration
   - Verify headers in Lambda responses
   - Check browser console for specific errors

2. **Authentication Issues**
   - Verify MetaMask is connected
   - Check authorization header format
   - Ensure wallet address is lowercase

3. **Build Errors**
   ```bash
   # Clear caches and reinstall
   rm -rf node_modules package-lock.json
   npm install
   
   # Clear TypeScript cache
   rm -rf backend/dist
   npm run build
   ```

4. **Hot Reload Not Working**
   ```bash
   # Restart Vite dev server
   cd frontend
   npm run dev -- --force
   ```

## Resources

### Documentation
- [React Documentation](https://react.dev/)
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [Vite Documentation](https://vitejs.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

### Tools
- [Postman](https://www.postman.com/) - API testing
- [AWS Toolkit for VS Code](https://aws.amazon.com/visualstudiocode/)
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [MetaMask](https://metamask.io/)

### Community
- GitHub Issues for bug reports
- GitHub Discussions for questions
- Discord/Slack for real-time help