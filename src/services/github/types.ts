// src/services/github/types.ts

// User and Authentication Types
export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
  html_url: string;
  type: 'User' | 'Organization';
  public_repos: number;
  followers: number;
  following: number;
}

export interface GitHubAuthToken {
  access_token: string;
  token_type: string;
  scope: string;
  refresh_token?: string;
  expires_in?: number;
  expires_at?: number;
}

export interface OAuthConfig {
  clientId: string;
  redirectUri: string;
  scope: string[];
}

// Repository Types
export interface Repository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
    type: 'User' | 'Organization';
  };
  description: string | null;
  private: boolean;
  html_url: string;
  clone_url: string;
  ssh_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  size: number;
  default_branch: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  permissions: {
    admin: boolean;
    push: boolean;
    pull: boolean;
  };
}

export interface Branch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

// File and Directory Types
export interface FileContent {
  type: 'file';
  encoding: 'base64' | 'utf-8';
  size: number;
  name: string;
  path: string;
  content: string;
  sha: string;
  url: string;
  git_url: string;
  html_url: string;
  download_url: string;
}

export interface DirectoryContent {
  type: 'dir';
  size: number;
  name: string;
  path: string;
  sha: string;
  url: string;
  git_url: string;
  html_url: string;
}

export type DirectoryItem = FileContent | DirectoryContent;

export interface FileMetadata {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: 'file' | 'dir';
  download_url?: string;
}

// Commit Types
export interface Commit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    committer: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  author: GitHubUser | null;
  committer: GitHubUser | null;
  parents: Array<{
    sha: string;
    url: string;
  }>;
  html_url: string;
}

export interface CreateFileRequest {
  message: string;
  content: string;
  branch?: string;
  committer?: {
    name: string;
    email: string;
  };
  author?: {
    name: string;
    email: string;
  };
}

export interface UpdateFileRequest extends CreateFileRequest {
  sha: string;
}

export interface DeleteFileRequest {
  message: string;
  sha: string;
  branch?: string;
  committer?: {
    name: string;
    email: string;
  };
  author?: {
    name: string;
    email: string;
  };
}

// API Response Types
export interface GitHubApiResponse<T> {
  data: T;
  status: number;
  headers: Record<string, string>;
  url: string;
}

export interface GitHubError {
  message: string;
  errors?: Array<{
    field: string;
    code: string;
    message?: string;
  }>;
  documentation_url?: string;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  used: number;
  resource: string;
}

// Request/Response Wrappers
export interface ApiRequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: any;
  timeout?: number;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

// Search and Filter Types
export interface RepositorySearchParams {
  q?: string;
  sort?: 'stars' | 'forks' | 'help-wanted-issues' | 'updated';
  order?: 'desc' | 'asc';
  per_page?: number;
  page?: number;
}

export interface FileSearchParams {
  owner: string;
  repo: string;
  path?: string;
  ref?: string;
}

// Pagination Types
export interface PaginationInfo {
  page: number;
  per_page: number;
  total_count?: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationInfo;
}

// Editor Integration Types
export interface EditorFile {
  repository: Repository;
  path: string;
  content: string;
  sha: string;
  lastModified: Date;
  isDirty: boolean;
  isLoading: boolean;
}

export interface SyncStatus {
  status: 'idle' | 'saving' | 'saved' | 'error' | 'conflict';
  message?: string;
  lastSaved?: Date;
  error?: GitHubError;
}

export interface ConflictInfo {
  current: FileContent;
  incoming: FileContent;
  base?: FileContent;
  resolved?: boolean;
}

// Application State Types
export interface GitHubState {
  // Authentication
  isAuthenticated: boolean;
  user: GitHubUser | null;
  token: string | null;
  
  // Repository
  repositories: Repository[];
  selectedRepository: Repository | null;
  branches: Branch[];
  selectedBranch: string;
  
  // Files
  currentFile: EditorFile | null;
  directoryContents: DirectoryItem[];
  
  // UI State
  isLoading: boolean;
  syncStatus: SyncStatus;
  error: GitHubError | null;
  
  // Rate Limiting
  rateLimit: RateLimitInfo | null;
}

// Event Types
export interface GitHubEvent {
  type: 'auth' | 'repository' | 'file' | 'sync' | 'error';
  payload: any;
  timestamp: Date;
}

// Configuration Types
export interface GitHubConfig {
  oauth: OAuthConfig;
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
  };
  cache: {
    ttl: number;
    maxSize: number;
  };
  features: {
    autoSave: boolean;
    autoSaveInterval: number;
    conflictResolution: boolean;
    offlineSupport: boolean;
  };
}

// Utility Types
export type RepositoryPermission = 'read' | 'write' | 'admin';

export interface RepositoryAccess {
  permission: RepositoryPermission;
  canRead: boolean;
  canWrite: boolean;
  canAdmin: boolean;
}

// Hook Return Types
export interface UseGitHubAuthReturn {
  isAuthenticated: boolean;
  user: GitHubUser | null;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  error: GitHubError | null;
}

export interface UseRepositoriesReturn {
  repositories: Repository[];
  selectedRepository: Repository | null;
  branches: Branch[];
  selectedBranch: string;
  isLoading: boolean;
  error: GitHubError | null;
  selectRepository: (repo: Repository) => void;
  selectBranch: (branch: string) => void;
  refreshRepositories: () => Promise<void>;
}

export interface UseFileOperationsReturn {
  currentFile: EditorFile | null;
  directoryContents: DirectoryItem[];
  syncStatus: SyncStatus;
  isLoading: boolean;
  error: GitHubError | null;
  openFile: (path: string) => Promise<void>;
  saveFile: (content: string, message?: string) => Promise<void>;
  createFile: (path: string, content: string, message?: string) => Promise<void>;
  deleteFile: (path: string, message?: string) => Promise<void>;
  refreshDirectory: (path?: string) => Promise<void>;
}