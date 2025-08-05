# GitHub Integration Documentation

## Overview

This document outlines the integration of GitHub repository read/write functionality into the TipTap markdown editor, enabling users to seamlessly work with their GitHub repositories directly from the editor interface.

## Architecture Decision

### Frontend-First Approach with Optional Backend Proxy

We've chosen a **hybrid architecture** that starts frontend-only for development and adds a backend proxy for production optimization:

**Phase 1: Frontend-Only (MVP)**
- Direct GitHub API calls from browser
- Client-side OAuth flow
- Local token storage
- CORS limitations accepted for development

**Phase 2: Production Backend Proxy**
- Simple Node.js/Express proxy server
- Handles CORS issues
- Secure token storage
- Rate limiting protection

### Why This Architecture?

1. **Faster Development**: Start building immediately without backend setup
2. **Security**: OAuth flow keeps sensitive operations on GitHub's servers
3. **Scalability**: Can add backend features incrementally
4. **Cost-Effective**: Minimal infrastructure requirements
5. **User Experience**: Direct API calls provide immediate feedback

## Authentication Strategy

### GitHub OAuth App (Recommended)

**Why OAuth App over Personal Access Tokens:**

| Feature | OAuth App | Personal Access Token |
|---------|-----------|----------------------|
| User Experience | Seamless login flow | Manual token management |
| Security | Automatic token refresh | Manual rotation required |
| Permissions | Fine-grained, repository-specific | Broad account-level access |
| Scalability | Handles multiple users | Per-user setup required |
| Rate Limits | Higher limits, scales with repos | Lower, fixed limits |

**OAuth Flow Implementation:**
```
1. User clicks "Connect to GitHub"
2. Redirect to GitHub OAuth authorization
3. GitHub redirects back with authorization code
4. Exchange code for access token
5. Store token securely in browser
6. Use token for API calls
```

## GitHub API Integration

### Core API Endpoints Used

**Repository Operations:**
- `GET /user/repos` - List user repositories
- `GET /repos/{owner}/{repo}` - Get repository details
- `GET /repos/{owner}/{repo}/branches` - List branches

**File Operations:**
- `GET /repos/{owner}/{repo}/contents/{path}` - Read file/directory
- `PUT /repos/{owner}/{repo}/contents/{path}` - Create/update file
- `DELETE /repos/{owner}/{repo}/contents/{path}` - Delete file

**Metadata Operations:**
- `GET /repos/{owner}/{repo}/commits` - Commit history
- `GET /repos/{owner}/{repo}/git/trees/{sha}` - Directory tree

### API Rate Limits

| Authentication Type | Rate Limit | Notes |
|-------------------|------------|-------|
| OAuth App | 5,000 requests/hour | Per authenticated user |
| Personal Access Token | 5,000 requests/hour | Per token |
| Unauthenticated | 60 requests/hour | IP-based |

**Rate Limit Handling Strategy:**
- Implement exponential backoff
- Cache repository and file metadata
- Show rate limit status to users
- Queue non-urgent requests

## Technical Implementation

### File Structure
```
src/
├── services/
│   └── github/
│       ├── auth.ts           # OAuth authentication flow
│       ├── api.ts            # Base GitHub API client
│       ├── repositories.ts   # Repository operations
│       ├── contents.ts       # File CRUD operations
│       └── types.ts          # TypeScript interfaces
├── components/
│   └── github/
│       ├── AuthButton.tsx    # Login/logout functionality
│       ├── RepoSelector.tsx  # Repository browser
│       ├── FileBrowser.tsx   # File navigation tree
│       ├── SyncStatus.tsx    # Real-time sync indicators
│       └── ConflictResolver.tsx # Handle merge conflicts
├── hooks/
│   ├── useGitHubAuth.ts      # Authentication state management
│   ├── useRepositories.ts    # Repository data fetching
│   └── useFileOperations.ts  # File CRUD operations
└── stores/
    ├── githubStore.ts        # Global GitHub state
    └── editorStore.ts        # Editor-GitHub integration state
```

### Core Services

#### 1. Authentication Service (`auth.ts`)

```typescript
interface GitHubAuthService {
  // OAuth flow
  initiateLogin(): Promise<void>
  handleCallback(code: string): Promise<string>
  
  // Token management
  getToken(): string | null
  refreshToken(): Promise<string>
  logout(): void
  
  // User info
  getCurrentUser(): Promise<GitHubUser>
}
```

#### 2. Repository Service (`repositories.ts`)

```typescript
interface RepositoryService {
  // Repository listing
  getUserRepositories(): Promise<Repository[]>
  getRepository(owner: string, repo: string): Promise<Repository>
  
  // Branch operations
  getBranches(owner: string, repo: string): Promise<Branch[]>
  createBranch(owner: string, repo: string, branchName: string): Promise<Branch>
  
  // Repository metadata
  getCommitHistory(owner: string, repo: string): Promise<Commit[]>
}
```

#### 3. Contents Service (`contents.ts`)

```typescript
interface ContentsService {
  // File operations
  getFileContent(owner: string, repo: string, path: string): Promise<FileContent>
  createFile(owner: string, repo: string, path: string, content: string, message: string): Promise<void>
  updateFile(owner: string, repo: string, path: string, content: string, sha: string, message: string): Promise<void>
  deleteFile(owner: string, repo: string, path: string, sha: string, message: string): Promise<void>
  
  // Directory operations
  getDirectoryContents(owner: string, repo: string, path: string): Promise<DirectoryItem[]>
}
```

## User Interface Components

### 1. Authentication Flow

**AuthButton Component:**
- Shows "Connect to GitHub" when not authenticated
- Displays user avatar and name when authenticated
- Provides logout functionality
- Handles OAuth callback processing

### 2. Repository Selection

**RepoSelector Component:**
- Lists user's repositories with search/filter
- Shows repository metadata (stars, forks, language)
- Allows switching between repositories
- Displays current branch with branch switcher

### 3. File Browser

**FileBrowser Component:**
- Tree view of repository structure
- Supports nested folders and files
- File type icons and syntax highlighting indicators
- Right-click context menu for file operations
- Drag-and-drop for file organization

### 4. Editor Integration

**Enhanced Editor Features:**
- "Open from GitHub" toolbar button
- "Save to GitHub" with commit message input
- Real-time sync status indicator
- Conflict resolution dialog
- Auto-save with configurable intervals

## Data Flow Architecture

### 1. User Authentication
```
User → AuthButton → GitHub OAuth → Token Storage → API Client Setup
```

### 2. Repository Selection
```
User → RepoSelector → Repository API → Cache → UI Update
```

### 3. File Operations
```
User Action → Editor → Contents API → GitHub → Local State Update → UI Refresh
```

### 4. Real-time Sync
```
Editor Changes → Debounced Save → GitHub API → Commit Creation → Status Update
```

## Security Considerations

### Token Security

**Storage Strategy:**
- Use `sessionStorage` for temporary sessions
- Use `localStorage` with encryption for persistent sessions
- Never log tokens in console or network requests
- Clear tokens on logout or page close

**Token Permissions:**
- Request minimal required scopes: `repo` for private repos, `public_repo` for public
- Use fine-grained personal access tokens when available
- Implement token refresh before expiration

### Content Security

**Input Validation:**
- Sanitize file paths to prevent directory traversal
- Validate commit messages for malicious content
- Limit file size uploads (GitHub limit: 100MB)
- Validate file types for security

### CORS and Network Security

**Development Considerations:**
- GitHub API has CORS restrictions for browser requests
- Use development proxy for local testing
- Implement proper error handling for network failures

**Production Solutions:**
- Deploy backend proxy for CORS handling
- Use secure token exchange mechanisms
- Implement request signing for sensitive operations

## Error Handling

### API Error Categories

1. **Authentication Errors (401)**
   - Token expired or invalid
   - Insufficient permissions
   - User action: Re-authenticate

2. **Authorization Errors (403)**
   - Repository access denied
   - Rate limit exceeded
   - User action: Check permissions or wait

3. **Not Found Errors (404)**
   - Repository doesn't exist
   - File not found
   - User action: Verify path/permissions

4. **Conflict Errors (409)**
   - File has been modified by another user
   - Branch conflicts
   - User action: Resolve conflicts manually

### Error Recovery Strategies

**Automatic Retry:**
- Network timeouts: 3 retries with exponential backoff
- Rate limits: Wait and retry based on `X-RateLimit-Reset` header
- Temporary failures: Queue operations for later execution

**User Notification:**
- Toast notifications for minor errors
- Modal dialogs for conflicts requiring user input
- Status indicators for background operations

## Performance Optimization

### Caching Strategy

**Repository Metadata:**
- Cache for 5 minutes
- Invalidate on user actions
- Use browser storage for persistence

**File Contents:**
- Cache during editing session
- Invalidate on external changes
- Use memory storage for speed

**Directory Listings:**
- Cache for 2 minutes
- Update incrementally on changes
- Lazy load large directories

### Network Optimization

**Request Batching:**
- Batch multiple file operations
- Use GraphQL API for complex queries
- Implement request deduplication

**Lazy Loading:**
- Load repository contents on demand
- Virtual scrolling for large file lists
- Progressive loading of commit history

## Monitoring and Analytics

### Performance Metrics

- API response times
- Error rates by operation type
- User engagement with GitHub features
- Cache hit/miss ratios

### Error Tracking

- Failed API requests with context
- Authentication flow failures
- File operation conflicts
- Network connectivity issues

## Deployment Considerations

### Environment Configuration

**Development:**
```env
VITE_GITHUB_CLIENT_ID=your_dev_client_id
VITE_GITHUB_REDIRECT_URI=http://localhost:5173/auth/callback
VITE_GITHUB_API_BASE_URL=https://api.github.com
```

**Production:**
```env
VITE_GITHUB_CLIENT_ID=your_prod_client_id
VITE_GITHUB_REDIRECT_URI=https://yourdomain.com/auth/callback
VITE_GITHUB_API_BASE_URL=https://your-proxy.com/api/github
```

### Backend Proxy (Optional)

**When to Implement:**
- CORS issues in production
- Need for server-side token storage
- Advanced security requirements
- Rate limiting beyond GitHub's limits

**Simple Express Proxy:**
```javascript
// Basic CORS proxy for GitHub API
app.use('/api/github/*', (req, res) => {
  const githubUrl = `https://api.github.com${req.path}`;
  // Forward request with proper headers
  // Add CORS headers to response
});
```

## Testing Strategy

### Unit Tests
- Service layer functions
- API response parsing
- Error handling logic
- Token management utilities

### Integration Tests
- GitHub OAuth flow
- File CRUD operations
- Repository browsing
- Conflict resolution

### End-to-End Tests
- Complete user workflows
- Authentication scenarios
- Cross-browser compatibility
- Network failure handling

## Future Enhancements

### Phase 2 Features

1. **Collaboration:**
   - Real-time collaborative editing
   - Presence indicators
   - Live cursor positions
   - Comment and review system

2. **Advanced Git Operations:**
   - Pull request creation
   - Merge conflict resolution
   - Branch management UI
   - Commit history visualization

3. **Workflow Integration:**
   - GitHub Actions integration
   - Issue linking
   - Project board integration
   - Wiki editing support

### Phase 3 Features

1. **Enterprise Features:**
   - GitHub Enterprise support
   - Team management
   - Advanced permissions
   - Audit logging

2. **Developer Tools:**
   - Code review interface
   - Diff visualization
   - Merge tools
   - Git blame integration

## Troubleshooting Guide

### Common Issues

**"Authentication Failed" Error:**
- Check GitHub OAuth app configuration
- Verify redirect URI matches exactly
- Ensure app has correct permissions

**"File Not Found" When Opening:**
- Verify user has repository access
- Check if file was moved/deleted
- Refresh repository cache

**"Conflict Detected" During Save:**
- File was modified by another user
- Show conflict resolution interface
- Allow user to choose resolution strategy

**Rate Limit Exceeded:**
- Show user-friendly message with reset time
- Queue operations for automatic retry
- Suggest authentication if using anonymous access

### Debug Mode

Enable debug logging:
```javascript
localStorage.setItem('github-debug', 'true');
```

This enables:
- API request/response logging
- Authentication state tracking
- Cache operation monitoring
- Performance timing data

## Conclusion

This GitHub integration provides a comprehensive solution for repository-based markdown editing while maintaining security, performance, and user experience standards. The phased implementation approach allows for rapid development while planning for production scalability.

The architecture supports both individual users and collaborative workflows, with extensibility for future enterprise features and advanced Git operations.