// src/components/github/RepoSelector.tsx
import React, { useState, useEffect, useMemo } from 'react';
import type { Repository, Branch } from '../../services/github/types';
import { getGitHubRepositoryService } from '../../services/github/repositories';
import { getGitHubAuthService } from '../../services/github/auth';

interface RepoSelectorProps {
  selectedRepository: Repository | null;
  selectedBranch: string;
  onRepositorySelect: (repo: Repository) => void;
  onBranchSelect: (branch: string) => void;
  className?: string;
}

export const RepoSelector: React.FC<RepoSelectorProps> = ({
  selectedRepository,
  selectedBranch,
  onRepositorySelect,
  onBranchSelect,
  className = '',
}) => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showRepoDropdown, setShowRepoDropdown] = useState(false);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);

  const authService = getGitHubAuthService();
  const repositoryService = getGitHubRepositoryService(() => authService.getToken());

  // Filter repositories based on search query
  const filteredRepositories = useMemo(() => {
    if (!searchQuery.trim()) return repositories;
    
    const query = searchQuery.toLowerCase();
    return repositories.filter(repo => 
      repo.name.toLowerCase().includes(query) ||
      repo.full_name.toLowerCase().includes(query) ||
      repo.description?.toLowerCase().includes(query)
    );
  }, [repositories, searchQuery]);

  // Load repositories on component mount
  useEffect(() => {
    loadRepositories();
  }, []);

  // Load branches when repository changes
  useEffect(() => {
    if (selectedRepository) {
      loadBranches(selectedRepository.owner.login, selectedRepository.name);
    } else {
      setBranches([]);
    }
  }, [selectedRepository]);

  const loadRepositories = async () => {
    if (!authService.isAuthenticated()) return;

    setIsLoadingRepos(true);
    setError(null);

    try {
      const repos = await repositoryService.getUserRepositories({
        sort: 'updated',
        direction: 'desc',
        per_page: 100,
      });
      setRepositories(repos);
    } catch (err) {
      console.error('Failed to load repositories:', err);
      setError('Failed to load repositories');
    } finally {
      setIsLoadingRepos(false);
    }
  };

  const loadBranches = async (owner: string, repo: string) => {
    setIsLoadingBranches(true);
    setError(null);

    try {
      const branchList = await repositoryService.getBranches(owner, repo);
      setBranches(branchList);

      // Auto-select default branch if no branch is selected
      if (!selectedBranch && branchList.length > 0) {
        const defaultBranch = branchList.find(b => b.name === selectedRepository?.default_branch) || branchList[0];
        onBranchSelect(defaultBranch.name);
      }
    } catch (err) {
      console.error('Failed to load branches:', err);
      setError('Failed to load branches');
    } finally {
      setIsLoadingBranches(false);
    }
  };

  const handleRepositorySelect = (repo: Repository) => {
    onRepositorySelect(repo);
    setShowRepoDropdown(false);
    setSearchQuery('');
  };

  const handleBranchSelect = (branchName: string) => {
    onBranchSelect(branchName);
    setShowBranchDropdown(false);
  };

  const formatRepoName = (repo: Repository) => {
    if (repo.full_name.length > 40) {
      return `${repo.full_name.substring(0, 37)}...`;
    }
    return repo.full_name;
  };

  const formatBranchName = (branchName: string) => {
    if (branchName.length > 20) {
      return `${branchName.substring(0, 17)}...`;
    }
    return branchName;
  };

  return (
    <div className={`repo-selector ${className}`}>
      {/* Repository Selector */}
      <div className="repo-selector-section">
        <label className="repo-selector-label">Repository</label>
        <div className="repo-dropdown" data-testid="repository-dropdown">
          <button
            className="repo-dropdown-button"
            onClick={() => setShowRepoDropdown(!showRepoDropdown)}
            disabled={isLoadingRepos}
            title={selectedRepository?.full_name || 'Select repository'}
          >
            <span className="repo-button-content">
              {selectedRepository ? (
                <>
                  <span className="repo-icon">📁</span>
                  <span className="repo-name">{formatRepoName(selectedRepository)}</span>
                  {selectedRepository.private && <span className="repo-private-badge">Private</span>}
                </>
              ) : (
                <>
                  <span className="repo-icon">📁</span>
                  <span className="repo-placeholder">
                    {isLoadingRepos ? 'Loading...' : 'Select repository'}
                  </span>
                </>
              )}
            </span>
            <span className="dropdown-arrow">▼</span>
          </button>

          {showRepoDropdown && (
            <div className="repo-dropdown-menu">
              <div className="repo-search">
                <input
                  type="text"
                  placeholder="Search repositories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="repo-search-input"
                  autoFocus
                />
              </div>

              <div className="repo-list">
                {filteredRepositories.length === 0 ? (
                  <div className="repo-item-empty">
                    {searchQuery ? 'No repositories match your search' : 'No repositories found'}
                  </div>
                ) : (
                  filteredRepositories.map((repo) => (
                    <button
                      key={repo.id}
                      className={`repo-item ${selectedRepository?.id === repo.id ? 'selected' : ''}`}
                      onClick={() => handleRepositorySelect(repo)}
                      title={`${repo.full_name} - ${repo.description || 'No description'}`}
                    >
                      <div className="repo-item-main">
                        <span className="repo-item-name">{repo.full_name}</span>
                        <div className="repo-item-badges">
                          {repo.private && <span className="badge private">Private</span>}
                          {repo.language && <span className="badge language">{repo.language}</span>}
                        </div>
                      </div>
                      {repo.description && (
                        <div className="repo-item-description">{repo.description}</div>
                      )}
                      <div className="repo-item-stats">
                        <span className="stat">
                          <span className="stat-icon">⭐</span>
                          <span className="stat-value">{repo.stargazers_count}</span>
                        </span>
                        <span className="stat">
                          <span className="stat-icon">🍴</span>
                          <span className="stat-value">{repo.forks_count}</span>
                        </span>
                        <span className="stat">
                          <span className="stat-icon">📅</span>
                          <span className="stat-value">{new Date(repo.updated_at).toLocaleDateString()}</span>
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="repo-dropdown-footer">
                <button
                  className="refresh-button"
                  onClick={loadRepositories}
                  disabled={isLoadingRepos}
                >
                  {isLoadingRepos ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Branch Selector */}
      {selectedRepository && (
        <div className="branch-selector-section">
          <label className="repo-selector-label">Branch</label>
          <div className="branch-dropdown" data-testid="branch-dropdown">
            <button
              className="branch-dropdown-button"
              onClick={() => setShowBranchDropdown(!showBranchDropdown)}
              disabled={isLoadingBranches}
              title={selectedBranch || 'Select branch'}
            >
              <span className="branch-button-content">
                <span className="branch-icon">🌿</span>
                <span className="branch-name">
                  {selectedBranch ? formatBranchName(selectedBranch) : 'Select branch'}
                </span>
                {isLoadingBranches && <span className="loading-spinner">⟳</span>}
              </span>
              <span className="dropdown-arrow">▼</span>
            </button>

            {showBranchDropdown && (
              <div className="branch-dropdown-menu">
                <div className="branch-list">
                  {branches.length === 0 ? (
                    <div className="branch-item-empty">
                      {isLoadingBranches ? 'Loading branches...' : 'No branches found'}
                    </div>
                  ) : (
                    branches.map((branch) => (
                      <button
                        key={branch.name}
                        className={`branch-item ${selectedBranch === branch.name ? 'selected' : ''}`}
                        onClick={() => handleBranchSelect(branch.name)}
                        title={`${branch.name}${branch.protected ? ' (Protected)' : ''}`}
                      >
                        <span className="branch-item-name">{branch.name}</span>
                        <div className="branch-item-badges">
                          {branch.name === selectedRepository.default_branch && (
                            <span className="badge default">Default</span>
                          )}
                          {branch.protected && <span className="badge protected">Protected</span>}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="repo-selector-error" data-testid="error-message">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
          <button
            className="error-retry"
            onClick={() => {
              setError(null);
              if (!selectedRepository) {
                loadRepositories();
              } else {
                loadBranches(selectedRepository.owner.login, selectedRepository.name);
              }
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Repository Info */}
      {selectedRepository && (
        <div className="repo-info">
          <div className="repo-info-item">
            <span className="info-label">Owner:</span>
            <span className="info-value">{selectedRepository.owner.login}</span>
          </div>
          <div className="repo-info-item">
            <span className="info-label">Default Branch:</span>
            <span className="info-value">{selectedRepository.default_branch}</span>
          </div>
          <div className="repo-info-item">
            <span className="info-label">Last Updated:</span>
            <span className="info-value">
              {new Date(selectedRepository.updated_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepoSelector;