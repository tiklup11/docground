// src/services/github/contents.ts
import type {
  FileContent,
  DirectoryContent,
  DirectoryItem,
  CreateFileRequest,
  UpdateFileRequest,
  DeleteFileRequest,
  FileSearchParams,
} from './types';
import { getGitHubApiClient } from './api';

export class GitHubContentsService {
  private getToken: () => string | null;

  constructor(getToken: () => string | null) {
    this.getToken = getToken;
  }

  /**
   * Get file content from repository
   */
  async getFileContent(owner: string, repo: string, path: string, ref?: string): Promise<FileContent> {
    const apiClient = getGitHubApiClient(this.getToken);

    const params = ref ? { ref } : {};

    try {
      const response = await apiClient.get<FileContent>(`/repos/${owner}/${repo}/contents/${path}`, params);
      
      if (response.data.type !== 'file') {
        throw new Error(`Path ${path} is not a file`);
      }

      // Decode Base64 content if it's encoded
      if (response.data.encoding === 'base64' && response.data.content) {
        response.data.content = this.decodeBase64Content(response.data.content);
      }

      return response.data;
    } catch (error) {
      console.error(`Failed to fetch file ${path} from ${owner}/${repo}:`, error);
      throw new Error(`File ${path} not found`);
    }
  }

  /**
   * Get directory contents
   */
  async getDirectoryContents(owner: string, repo: string, path: string = '', ref?: string): Promise<DirectoryItem[]> {
    const apiClient = getGitHubApiClient(this.getToken);

    const params = ref ? { ref } : {};

    try {
      const response = await apiClient.get<DirectoryItem[]>(`/repos/${owner}/${repo}/contents/${path}`, params);
      
      if (!Array.isArray(response.data)) {
        throw new Error(`Path ${path} is not a directory`);
      }

      return response.data;
    } catch (error) {
      console.error(`Failed to fetch directory ${path} from ${owner}/${repo}:`, error);
      throw new Error(`Directory ${path} not found`);
    }
  }

  /**
   * Create a new file
   */
  async createFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    branch?: string,
    author?: { name: string; email: string }
  ): Promise<{ commit: any; content: FileContent }> {
    const apiClient = getGitHubApiClient(this.getToken);

    const data: CreateFileRequest = {
      message,
      content: this.encodeBase64Content(content),
      branch,
      author,
    };

    try {
      const response = await apiClient.put<{
        commit: any;
        content: FileContent;
      }>(`/repos/${owner}/${repo}/contents/${path}`, data);

      return response.data;
    } catch (error) {
      console.error(`Failed to create file ${path} in ${owner}/${repo}:`, error);
      throw new Error(`Failed to create file ${path}`);
    }
  }

  /**
   * Update an existing file
   */
  async updateFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    sha: string,
    branch?: string,
    author?: { name: string; email: string }
  ): Promise<{ commit: any; content: FileContent }> {
    const apiClient = getGitHubApiClient(this.getToken);

    const data: UpdateFileRequest = {
      message,
      content: this.encodeBase64Content(content),
      sha,
      branch,
      author,
    };

    try {
      const response = await apiClient.put<{
        commit: any;
        content: FileContent;
      }>(`/repos/${owner}/${repo}/contents/${path}`, data);

      return response.data;
    } catch (error) {
      console.error(`Failed to update file ${path} in ${owner}/${repo}:`, error);
      throw new Error(`Failed to update file ${path}`);
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(
    owner: string,
    repo: string,
    path: string,
    message: string,
    sha: string,
    branch?: string,
    author?: { name: string; email: string }
  ): Promise<{ commit: any }> {
    const apiClient = getGitHubApiClient(this.getToken);

    const data: DeleteFileRequest = {
      message,
      sha,
      branch,
      author,
    };

    try {
      const response = await apiClient.delete<{ commit: any }>(`/repos/${owner}/${repo}/contents/${path}`, {
        'Content-Type': 'application/json',
      });

      // For DELETE requests, we need to send the data as JSON in the request body
      const deleteResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!deleteResponse.ok) {
        throw new Error(`HTTP ${deleteResponse.status}: ${deleteResponse.statusText}`);
      }

      const result = await deleteResponse.json();
      return result;
    } catch (error) {
      console.error(`Failed to delete file ${path} from ${owner}/${repo}:`, error);
      throw new Error(`Failed to delete file ${path}`);
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(owner: string, repo: string, path: string, ref?: string): Promise<boolean> {
    try {
      await this.getFileContent(owner, repo, path, ref);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file metadata without content
   */
  async getFileMetadata(owner: string, repo: string, path: string, ref?: string): Promise<{
    name: string;
    path: string;
    sha: string;
    size: number;
    type: 'file' | 'dir';
    download_url?: string;
  }> {
    const apiClient = getGitHubApiClient(this.getToken);

    const params = ref ? { ref } : {};

    try {
      const response = await apiClient.get<FileContent | DirectoryContent>(
        `/repos/${owner}/${repo}/contents/${path}`,
        params
      );

      return {
        name: response.data.name,
        path: response.data.path,
        sha: response.data.sha,
        size: response.data.size,
        type: response.data.type,
        download_url: response.data.type === 'file' ? (response.data as FileContent).download_url : undefined,
      };
    } catch (error) {
      console.error(`Failed to fetch metadata for ${path} from ${owner}/${repo}:`, error);
      throw new Error(`File or directory ${path} not found`);
    }
  }

  /**
   * Search for files in repository
   */
  async searchFiles(
    owner: string,
    repo: string,
    query: string,
    params?: {
      path?: string;
      filename?: string;
      extension?: string;
      size?: string;
      language?: string;
    }
  ): Promise<Array<{
    name: string;
    path: string;
    sha: string;
    url: string;
    git_url: string;
    html_url: string;
    repository: any;
    score: number;
  }>> {
    const apiClient = getGitHubApiClient(this.getToken);

    let searchQuery = `${query} repo:${owner}/${repo}`;

    if (params?.path) searchQuery += ` path:${params.path}`;
    if (params?.filename) searchQuery += ` filename:${params.filename}`;
    if (params?.extension) searchQuery += ` extension:${params.extension}`;
    if (params?.size) searchQuery += ` size:${params.size}`;
    if (params?.language) searchQuery += ` language:${params.language}`;

    try {
      const response = await apiClient.get<{
        total_count: number;
        incomplete_results: boolean;
        items: Array<{
          name: string;
          path: string;
          sha: string;
          url: string;
          git_url: string;
          html_url: string;
          repository: any;
          score: number;
        }>;
      }>('/search/code', { q: searchQuery });

      return response.data.items;
    } catch (error) {
      console.error(`Failed to search files in ${owner}/${repo}:`, error);
      throw new Error('File search failed');
    }
  }

  /**
   * Get repository tree (recursive directory listing)
   */
  async getRepositoryTree(
    owner: string,
    repo: string,
    treeSha: string,
    recursive: boolean = false
  ): Promise<{
    sha: string;
    url: string;
    tree: Array<{
      path: string;
      mode: string;
      type: 'blob' | 'tree';
      sha: string;
      size?: number;
      url: string;
    }>;
    truncated: boolean;
  }> {
    const apiClient = getGitHubApiClient(this.getToken);

    const params = recursive ? { recursive: '1' } : {};

    try {
      const response = await apiClient.get<{
        sha: string;
        url: string;
        tree: Array<{
          path: string;
          mode: string;
          type: 'blob' | 'tree';
          sha: string;
          size?: number;
          url: string;
        }>;
        truncated: boolean;
      }>(`/repos/${owner}/${repo}/git/trees/${treeSha}`, params);

      return response.data;
    } catch (error) {
      console.error(`Failed to fetch repository tree for ${owner}/${repo}:`, error);
      throw new Error('Failed to load repository tree');
    }
  }

  /**
   * Create or update multiple files in a single commit
   */
  async createOrUpdateFiles(
    owner: string,
    repo: string,
    files: Array<{
      path: string;
      content: string;
      mode?: '100644' | '100755' | '040000' | '160000' | '120000';
    }>,
    message: string,
    branch: string = 'main',
    author?: { name: string; email: string }
  ): Promise<{ commit: any }> {
    const apiClient = getGitHubApiClient(this.getToken);

    try {
      // Get the current branch reference
      const branchResponse = await apiClient.get<{ object: { sha: string } }>(
        `/repos/${owner}/${repo}/git/ref/heads/${branch}`
      );
      const baseSha = branchResponse.data.object.sha;

      // Get the base tree
      const baseTreeResponse = await apiClient.get<{ sha: string }>(
        `/repos/${owner}/${repo}/git/commits/${baseSha}`
      );
      const baseTreeSha = baseTreeResponse.data.sha;

      // Create tree with new files
      const tree = files.map(file => ({
        path: file.path,
        mode: file.mode || '100644',
        type: 'blob' as const,
        content: file.content,
      }));

      const treeResponse = await apiClient.post<{ sha: string }>(
        `/repos/${owner}/${repo}/git/trees`,
        {
          base_tree: baseTreeSha,
          tree,
        }
      );

      // Create commit
      const commitResponse = await apiClient.post<{ sha: string; commit: any }>(
        `/repos/${owner}/${repo}/git/commits`,
        {
          message,
          tree: treeResponse.data.sha,
          parents: [baseSha],
          author,
        }
      );

      // Update branch reference
      await apiClient.post(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
        sha: commitResponse.data.sha,
      });

      return { commit: commitResponse.data.commit };
    } catch (error) {
      console.error(`Failed to create/update multiple files in ${owner}/${repo}:`, error);
      throw new Error('Failed to create/update files');
    }
  }

  /**
   * Encode content to Base64 for GitHub API
   */
  private encodeBase64Content(content: string): string {
    return btoa(unescape(encodeURIComponent(content)));
  }

  /**
   * Decode Base64 content from GitHub API
   */
  private decodeBase64Content(content: string): string {
    try {
      // Remove any whitespace and newlines from base64 string
      const cleanContent = content.replace(/\s/g, '');
      return decodeURIComponent(escape(atob(cleanContent)));
    } catch (error) {
      console.error('Failed to decode Base64 content:', error);
      throw new Error('Invalid Base64 content');
    }
  }

  /**
   * Get file download URL
   */
  getFileDownloadUrl(owner: string, repo: string, path: string, ref?: string): string {
    const baseUrl = 'https://raw.githubusercontent.com';
    const branch = ref || 'main';
    return `${baseUrl}/${owner}/${repo}/${branch}/${path}`;
  }

  /**
   * Check if path is a valid file path
   */
  isValidFilePath(path: string): boolean {
    // Basic validation for file paths
    if (!path || path.trim() === '') return false;
    if (path.startsWith('/') || path.endsWith('/')) return false;
    if (path.includes('//') || path.includes('..')) return false;
    if (path.length > 4096) return false; // GitHub path limit
    
    return true;
  }

  /**
   * Get file extension from path
   */
  getFileExtension(path: string): string {
    const parts = path.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  /**
   * Check if file is binary based on extension
   */
  isBinaryFile(path: string): boolean {
    const binaryExtensions = [
      'jpg', 'jpeg', 'png', 'gif', 'bmp', 'ico', 'svg',
      'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
      'zip', 'tar', 'gz', 'rar', '7z',
      'exe', 'dll', 'so', 'dylib',
      'mp3', 'mp4', 'avi', 'mov', 'wmv',
      'ttf', 'otf', 'woff', 'woff2'
    ];
    
    const extension = this.getFileExtension(path);
    return binaryExtensions.includes(extension);
  }
}

/**
 * Create GitHub contents service
 */
export function createGitHubContentsService(getToken: () => string | null): GitHubContentsService {
  return new GitHubContentsService(getToken);
}

/**
 * Singleton instance for global use
 */
let contentsServiceInstance: GitHubContentsService | null = null;

export function getGitHubContentsService(getToken?: () => string | null): GitHubContentsService {
  if (!contentsServiceInstance) {
    if (!getToken) {
      throw new Error('GitHub contents service not initialized. Provide getToken function.');
    }
    contentsServiceInstance = createGitHubContentsService(getToken);
  }
  return contentsServiceInstance;
}