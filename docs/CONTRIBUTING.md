# Contributing to Web3CMS

Thank you for your interest in contributing to Web3CMS! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

1. **Clear title and description**
2. **Steps to reproduce**
3. **Expected behavior**
4. **Actual behavior**
5. **Screenshots** (if applicable)
6. **Environment details**:
   - OS and version
   - Node.js version
   - Browser and version
   - Web3CMS version/commit

### Suggesting Enhancements

Enhancement suggestions are welcome! Please provide:

1. **Use case** - Why is this enhancement needed?
2. **Proposed solution** - How should it work?
3. **Alternatives considered** - What other solutions did you consider?
4. **Additional context** - Any other relevant information

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Follow the coding standards** (see below)
3. **Write tests** for new functionality
4. **Update documentation** as needed
5. **Ensure all tests pass**
6. **Submit a pull request**

## Development Process

### 1. Setting Up Your Development Environment

```bash
# Fork and clone the repository
git clone https://github.com/yourusername/web3cms.git
cd web3cms

# Add upstream remote
git remote add upstream https://github.com/originalowner/web3cms.git

# Install dependencies
npm run install:all
```

### 2. Creating a Feature Branch

```bash
# Update your fork
git fetch upstream
git checkout main
git merge upstream/main

# Create a feature branch
git checkout -b feature/your-feature-name
```

### 3. Making Changes

Follow these guidelines:

- Write clean, readable code
- Add comments for complex logic
- Keep functions small and focused
- Use meaningful variable names
- Follow existing patterns

### 4. Committing Changes

We use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format: <type>(<scope>): <subject>

# Examples:
git commit -m "feat(api): add user authentication"
git commit -m "fix(frontend): resolve wallet connection issue"
git commit -m "docs: update API documentation"
git commit -m "style: format code with prettier"
git commit -m "refactor(backend): extract common utilities"
git commit -m "test: add unit tests for folder service"
git commit -m "chore: update dependencies"
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### 5. Testing

```bash
# Run all tests
npm test

# Run backend tests
npm run test:backend

# Run frontend tests
cd frontend && npm test

# Check code coverage
npm run test:coverage
```

### 6. Submitting a Pull Request

1. Push your branch to your fork
2. Go to the original repository on GitHub
3. Click "New Pull Request"
4. Select your branch
5. Fill out the PR template
6. Submit the PR

#### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
```

## Coding Standards

### TypeScript/JavaScript

```typescript
// Use meaningful names
const getUserById = async (userId: string) => {
  // Good
};

const func = async (id: string) => {
  // Bad
};

// Use proper types
interface User {
  id: string;
  name: string;
  email: string;
}

// Document complex functions
/**
 * Processes user data and returns formatted result
 * @param userData - Raw user data from API
 * @returns Formatted user object
 */
function processUserData(userData: RawUser): User {
  // Implementation
}
```

### React Components

```jsx
// Use functional components with hooks
const UserProfile = ({ userId }) => {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    loadUser(userId);
  }, [userId]);
  
  return (
    <div className="user-profile">
      {/* Component content */}
    </div>
  );
};

// PropTypes or TypeScript interfaces
UserProfile.propTypes = {
  userId: PropTypes.string.isRequired,
};
```

### CSS/Styling

```css
/* Use descriptive class names */
.user-profile-header {
  /* Good */
}

.header {
  /* Too generic */
}

/* Follow BEM naming when applicable */
.folder-card__title {
  /* Block__Element */
}

.folder-card--active {
  /* Block--Modifier */
}
```

## Project Structure Guidelines

### Adding New Features

1. **Backend Handler**
   - Create in `backend/src/handlers/`
   - Follow existing handler patterns
   - Add error handling

2. **Frontend Component**
   - Create in appropriate directory
   - Include tests
   - Update exports

3. **API Service**
   - Extend base service class
   - Add to service index
   - Document methods

4. **Database Schema**
   - Update TypeScript interfaces
   - Document in ARCHITECTURE.md
   - Consider migrations

## Documentation

### When to Update Documentation

Update documentation when you:
- Add new features
- Change API endpoints
- Modify configuration
- Update dependencies
- Change deployment process

### Documentation Standards

- Use clear, concise language
- Include code examples
- Keep it up-to-date
- Use proper markdown formatting

## Review Process

### What We Look For

1. **Code Quality**
   - Clean, readable code
   - Proper error handling
   - No code duplication
   - Performance considerations

2. **Testing**
   - Adequate test coverage
   - Tests pass
   - Edge cases covered

3. **Documentation**
   - Code is commented
   - README updated if needed
   - API docs updated

4. **Security**
   - No exposed secrets
   - Input validation
   - Proper authentication

### Review Timeline

- Initial review: 2-3 business days
- Follow-up reviews: 1-2 business days
- Feel free to ping if no response after 5 days

## Getting Help

### Resources

- [Development Guide](DEVELOPMENT.md)
- [Architecture Documentation](ARCHITECTURE.md)
- [API Documentation](API.md)
- GitHub Issues
- GitHub Discussions

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and discussions
- **Pull Requests**: Code contributions

## Recognition

Contributors will be:
- Added to the Contributors list
- Mentioned in release notes
- Credited in the documentation

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.

## Thank You!

Your contributions make Web3CMS better for everyone. We appreciate your time and effort!