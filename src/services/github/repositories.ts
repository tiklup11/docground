// src/services/github/repositories.ts
import type {
  Repository,
  Branch,
  Commit,
  RepositorySearchParams,
  PaginatedResponse,
} from './types';
import { getGitHubApiClient } from './api';

export class GitHubRepositoryService {
  private getToken: () => string | null;

  constructor(getToken: () => string | null) {
    this.getToken = getToken;
  }

  /**
   * Get all repositories for the authenticated user
   */
  async getUserRepositories(params?: {
    visibility?: 'all' | 'public' | 'private';
    affiliation?: 'owner' | 'collaborator' | 'organization_member';
    type?: 'all' | 'owner' | 'public' | 'private' | 'member';
    sort?: 'created' | 'updated' | 'pushed' | 'full_name';
    direction?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
  }): Promise<Repository[]> {
    const apiClient = getGitHubApiClient(this.getToken);
    
    const queryParams = {
      visibility: 'all',
      affiliation: 'owner,collaborator,organization_member',
      sort: 'updated',
      direction: 'desc',
      per_page: 100,
      ...params,
    };

    try {
      const response = await apiClient.get<Repository[]>('/user/repos', queryParams);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user repositories:', error);
      throw new Error('Failed to load repositories');
    }
  }

  /**
   * Get repositories for a specific organization
   */
  async getOrganizationRepositories(org: string, params?: {
    type?: 'all' | 'public' | 'private' | 'forks' | 'sources' | 'member';
    sort?: 'created' | 'updated' | 'pushed' | 'full_name';
    direction?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
  }): Promise<Repository[]> {
    const apiClient = getGitHubApiClient(this.getToken);
    
    const queryParams = {
      type: 'all',
      sort: 'updated',
      direction: 'desc',
      per_page: 100,
      ...params,
    };

    try {
      const response = await apiClient.get<Repository[]>(`/orgs/${org}/repos`, queryParams);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch repositories for organization ${org}:`, error);
      throw new Error(`Failed to load repositories for ${org}`);
    }
  }

  /**
   * Get a specific repository
   */
  async getRepository(owner: string, repo: string): Promise<Repository> {
    const apiClient = getGitHubApiClient(this.getToken);

    try {
      const response = await apiClient.get<Repository>(`/repos/${owner}/${repo}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch repository ${owner}/${repo}:`, error);
      throw new Error(`Repository ${owner}/${repo} not found`);
    }
  }

  /**
   * Search repositories
   */
  async searchRepositories(query: string, params?: RepositorySearchParams): Promise<PaginatedResponse<Repository>> {
    const apiClient = getGitHubApiClient(this.getToken);
    
    const queryParams = {
      q: query,
      sort: 'updated',
      order: 'desc',
      per_page: 30,
      page: 1,
      ...params,
    };

    try {
      const response = await apiClient.get<{
        total_count: number;
        incomplete_results: boolean;
        items: Repository[];
      }>('/search/repositories', queryParams);

      return {
        items: response.data.items,
        pagination: {
          page: queryParams.page,
          per_page: queryParams.per_page,
          total_count: response.data.total_count,
          has_next: response.data.items.length === queryParams.per_page,
          has_prev: queryParams.page > 1,
        },
      };
    } catch (error) {
      console.error('Failed to search repositories:', error);
      throw new Error('Repository search failed');
    }
  }

  /**
   * Get branches for a repository
   */
  async getBranches(owner: string, repo: string): Promise<Branch[]> {
    const apiClient = getGitHubApiClient(this.getToken);

    try {
      const response = await apiClient.get<Branch[]>(`/repos/${owner}/${repo}/branches`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch branches for ${owner}/${repo}:`, error);
      throw new Error('Failed to load repository branches');
    }
  }

  /**
   * Get a specific branch
   */
  async getBranch(owner: string, repo: string, branch: string): Promise<Branch> {
    const apiClient = getGitHubApiClient(this.getToken);

    try {
      const response = await apiClient.get<Branch>(`/repos/${owner}/${repo}/branches/${branch}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch branch ${branch} for ${owner}/${repo}:`, error);
      throw new Error(`Branch ${branch} not found`);
    }
  }

  /**
   * Create a new branch
   */
  async createBranch(owner: string, repo: string, branchName: string, sourceSha: string): Promise<void> {
    const apiClient = getGitHubApiClient(this.getToken);

    try {
      await apiClient.post(`/repos/${owner}/${repo}/git/refs`, {
        ref: `refs/heads/${branchName}`,
        sha: sourceSha,
      });
    } catch (error) {
      console.error(`Failed to create branch ${branchName}:`, error);
      throw new Error(`Failed to create branch ${branchName}`);
    }
  }

  /**
   * Get commit history for a repository
   */
  async getCommitHistory(
    owner: string, 
    repo: string, 
    params?: {
      sha?: string;
      path?: string;
      author?: string;
      since?: string;
      until?: string;
      per_page?: number;
      page?: number;
    }
  ): Promise<Commit[]> {
    const apiClient = getGitHubApiClient(this.getToken);

    const queryParams = {
      per_page: 30,
      page: 1,
      ...params,
    };

    try {
      const response = await apiClient.get<Commit[]>(`/repos/${owner}/${repo}/commits`, queryParams);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch commit history for ${owner}/${repo}:`, error);
      throw new Error('Failed to load commit history');
    }
  }

  /**
   * Get a specific commit
   */
  async getCommit(owner: string, repo: string, sha: string): Promise<Commit> {
    const apiClient = getGitHubApiClient(this.getToken);

    try {
      const response = await apiClient.get<Commit>(`/repos/${owner}/${repo}/commits/${sha}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch commit ${sha}:`, error);
      throw new Error(`Commit ${sha} not found`);
    }
  }

  /**
   * Get repository statistics
   */
  async getRepositoryStats(owner: string, repo: string): Promise<{
    languages: Record<string, number>;
    contributors: Array<{ login: string; contributions: number; avatar_url: string }>;
    traffic?: {
      count: number;
      uniques: number;
    };
  }> {
    const apiClient = getGitHubApiClient(this.getToken);

    try {
      const [languagesResponse, contributorsResponse] = await Promise.all([
        apiClient.get<Record<string, number>>(`/repos/${owner}/${repo}/languages`),
        apiClient.get<Array<{ login: string; contributions: number; avatar_url: string }>>(
          `/repos/${owner}/${repo}/contributors`
        ),
      ]);

      // Try to get traffic data (requires push access)
      let traffic;
      try {
        const trafficResponse = await apiClient.get<{
          count: number;
          uniques: number;
        }>(`/repos/${owner}/${repo}/traffic/views`);
        traffic = trafficResponse.data;
      } catch {
        // Traffic data not available (insufficient permissions)
        traffic = undefined;
      }

      return {
        languages: languagesResponse.data,
        contributors: contributorsResponse.data,
        traffic,
      };
    } catch (error) {
      console.error(`Failed to fetch repository stats for ${owner}/${repo}:`, error);
      throw new Error('Failed to load repository statistics');
    }
  }

  /**
   * Check if user has specific permission on repository
   */
  async checkRepositoryPermissions(owner: string, repo: string): Promise<{
    permission: 'admin' | 'write' | 'read' | 'none';
    canRead: boolean;
    canWrite: boolean;
    canAdmin: boolean;
  }> {
    const apiClient = getGitHubApiClient(this.getToken);

    try {
      const response = await apiClient.get<Repository>(`/repos/${owner}/${repo}`);
      const permissions = response.data.permissions || { admin: false, push: false, pull: false };

      let permission: 'admin' | 'write' | 'read' | 'none' = 'none';
      if (permissions.admin) permission = 'admin';
      else if (permissions.push) permission = 'write';
      else if (permissions.pull) permission = 'read';

      return {
        permission,
        canRead: permissions.pull,
        canWrite: permissions.push,
        canAdmin: permissions.admin,
      };
    } catch (error) {
      console.error(`Failed to check permissions for ${owner}/${repo}:`, error);
      return {
        permission: 'none',
        canRead: false,
        canWrite: false,
        canAdmin: false,
      };
    }
  }

  /**
   * Fork a repository
   */
  async forkRepository(owner: string, repo: string, organization?: string): Promise<Repository> {
    const apiClient = getGitHubApiClient(this.getToken);

    const data = organization ? { organization } : {};

    try {
      const response = await apiClient.post<Repository>(`/repos/${owner}/${repo}/forks`, data);
      return response.data;
    } catch (error) {
      console.error(`Failed to fork repository ${owner}/${repo}:`, error);
      throw new Error('Failed to fork repository');
    }
  }

  /**
   * Star a repository
   */
  async starRepository(owner: string, repo: string): Promise<void> {
    const apiClient = getGitHubApiClient(this.getToken);

    try {
      await apiClient.put(`/user/starred/${owner}/${repo}`);
    } catch (error) {
      console.error(`Failed to star repository ${owner}/${repo}:`, error);
      throw new Error('Failed to star repository');
    }
  }

  /**
   * Unstar a repository
   */
  async unstarRepository(owner: string, repo: string): Promise<void> {
    const apiClient = getGitHubApiClient(this.getToken);

    try {
      await apiClient.delete(`/user/starred/${owner}/${repo}`);
    } catch (error) {
      console.error(`Failed to unstar repository ${owner}/${repo}:`, error);
      throw new Error('Failed to unstar repository');
    }
  }

  /**
   * Check if repository is starred by current user
   */
  async isRepositoryStarred(owner: string, repo: string): Promise<boolean> {
    const apiClient = getGitHubApiClient(this.getToken);

    try {
      await apiClient.get(`/user/starred/${owner}/${repo}`);
      return true;
    } catch (error) {
      return false;
    }
  }
}

/**
 * Create GitHub repository service
 */
export function createGitHubRepositoryService(getToken: () => string | null): GitHubRepositoryService {
  return new GitHubRepositoryService(getToken);
}

/**
 * Singleton instance for global use
 */
let repositoryServiceInstance: GitHubRepositoryService | null = null;

export function getGitHubRepositoryService(getToken?: () => string | null): GitHubRepositoryService {
  if (!repositoryServiceInstance) {
    if (!getToken) {
      throw new Error('GitHub repository service not initialized. Provide getToken function.');
    }
    repositoryServiceInstance = createGitHubRepositoryService(getToken);
  }
  return repositoryServiceInstance;
}