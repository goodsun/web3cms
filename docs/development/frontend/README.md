# Web3CMS Frontend

React-based frontend application for Web3CMS with MetaMask wallet integration and content management features.

## Tech Stack

- **React 19.1.0** - UI framework
- **Vite** - Build tool and dev server
- **MetaMask SDK** - Web3 wallet integration
- **ethers.js** - Ethereum library
- **React Router** - Client-side routing
- **React Markdown** - Markdown rendering
- **EasyMDE** - Markdown editor

## Project Structure

```
frontend/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── common/        # Generic components
│   │   ├── Layout.jsx     # App layout wrapper
│   │   ├── ItemCard.jsx   # Item display component
│   │   ├── FolderForm.jsx # Folder creation/edit form
│   │   └── ...
│   ├── contexts/          # React contexts
│   │   ├── Web3Context.jsx     # Web3 wallet state
│   │   ├── SettingsContext.jsx # App settings
│   │   └── I18nContext.jsx     # Internationalization
│   ├── hooks/             # Custom React hooks
│   │   └── useForm.js     # Form state management
│   ├── pages/             # Page components
│   │   ├── HomePage.jsx   # Landing page
│   │   ├── ColumnsPage.jsx # CMS interface
│   │   ├── NFTsPage.jsx   # NFT collection with tabs
│   │   ├── NFTDetailPage.jsx # NFT detail view
│   │   ├── NFTListPage.jsx # NFT list by creator/owner
│   │   ├── SettingsPage.jsx # User settings
│   │   ├── AdminSettingsPage.jsx # Admin configuration
│   │   ├── MintPage.jsx   # NFT minting
│   │   ├── SitemapPage.jsx # Sitemap editor
│   │   └── ...
│   ├── services/          # API and external services
│   │   ├── api/          # API service classes
│   │   ├── api.js        # API client
│   │   └── nftService.js # NFT operations
│   ├── styles/           # Shared styles
│   │   ├── common.css    # Common styles (forms, buttons, etc.)
│   │   └── nft-common.css # NFT page common styles
│   ├── utils/            # Utility functions
│   ├── App.jsx           # Root component
│   ├── App.css           # Global styles
│   └── main.jsx          # Entry point
├── public/               # Static assets
├── .env.example         # Environment variables template
├── vite.config.js       # Vite configuration
└── package.json         # Dependencies
```

## Features

### Content Management
- Hierarchical folder structure
- Rich content editor with Markdown support
- Public/private content control
- Content workflow states (draft, review, published)
- Real-time preview

### Web3 Integration
- MetaMask wallet connection
- Mobile wallet support
- Ethereum address authentication
- NFT display and management
- Multi-chain ready

### User Interface
- Responsive design
- Mobile-optimized
- Tab-based navigation
- Loading states with lazy loading
- Error handling
- Internationalization (i18n) support
- Instagram-style grid view on mobile

## Getting Started

### Prerequisites
- Node.js 20.x or higher
- MetaMask browser extension or mobile app

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.development
# Edit .env.development with your API endpoint
```

### Development

```bash
# Start development server
npm run dev

# Access at http://localhost:5173
```

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Configuration

### Environment Variables

Create `.env.development` for local development:

```env
VITE_API_ENDPOINT=http://localhost:3000
```

Create `.env.production` for production:

```env
VITE_API_ENDPOINT=https://api.example.com
```

### API Configuration

The API endpoint is automatically configured during deployment. For manual configuration:

```javascript
// src/services/api.js
const API_BASE_URL = import.meta.env.VITE_API_ENDPOINT || 'http://localhost:3001';
```

## Development Guidelines

### Component Structure

```jsx
// Example component structure
import { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';

const MyComponent = ({ prop1, prop2 }) => {
  const [state, setState] = useState(null);
  const { account } = useWeb3();

  useEffect(() => {
    // Side effects
  }, [dependency]);

  const handleAction = () => {
    // Event handler
  };

  return (
    <div className="my-component">
      {/* Component content */}
    </div>
  );
};

export default MyComponent;
```

### API Service Usage

```javascript
// Using the new service classes
import { FolderService } from './services/api';

const folderService = new FolderService();

// In component
const loadFolders = async () => {
  try {
    const folders = await folderService.getFolders();
    setFolders(folders);
  } catch (error) {
    console.error('Failed to load folders:', error);
  }
};
```

### State Management

The app uses React Context for global state:

- **Web3Context**: Wallet connection and blockchain state
- **SettingsContext**: Application settings and configuration
- **I18nContext**: Language switching and translations

### Routing

Routes are defined in `App.jsx`:

```jsx
<Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/columns/*" element={<ColumnsPage />} />
  <Route path="/nfts" element={<NFTsPage />} />
  <Route path="/nfts/:tokenId" element={<NFTDetailPage />} />
  <Route path="/nfts/creator/:address" element={<NFTListPage />} />
  <Route path="/nfts/owner/:address" element={<NFTListPage />} />
  <Route path="/mint" element={<MintPage />} />
  <Route path="/settings" element={<SettingsPage />} />
  <Route path="/admin" element={<AdminSettingsPage />} />
  <Route path="/sitemap" element={<SitemapPage />} />
  {/* ... other routes */}
</Routes>
```

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Build Optimization

The build is optimized for production with:
- Code splitting
- Tree shaking
- Minification
- Asset optimization
- Lazy loading for routes

### Bundle Analysis

```bash
# Analyze bundle size
npm run build -- --analyze
```

### Styling

The project uses a common CSS architecture:

- `src/styles/common.css` - Shared styles for forms, buttons, loading states, etc.
- Component-specific styles import common styles to avoid duplication
- CSS variables defined in `App.css` for consistent theming

```css
/* Import common styles in component CSS */
@import '../styles/common.css';
```

## Common Issues

### MetaMask Connection
- Ensure MetaMask is installed
- Check network settings
- Verify site permissions

### CORS Errors
- Check API endpoint configuration
- Verify CORS headers on backend
- Use proxy for local development if needed

### Build Issues
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

## Contributing

1. Follow the existing code style
2. Write meaningful commit messages
3. Add tests for new features
4. Update documentation as needed

## License

See main project LICENSE file.