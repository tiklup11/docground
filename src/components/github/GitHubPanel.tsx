// src/components/github/GitHubPanel.tsx
import React, { useState } from 'react';
import type { Repository, GitHubUser, FileContent } from '../../services/github/types';
import AuthButton from './AuthButton';
import RepoSelector from './RepoSelector';
import FileBrowser from './FileBrowser';
import './GitHubPanel.css';
import './RepoSelector.css';
import './FileBrowser.css';

interface GitHubPanelProps {
  onFileSelect?: (file: FileContent, repository: Repository, branch: string) => void;
  onRepoSelect?: (repository: Repository | null, branch: string) => void;
  onAuthChange?: (authenticated: boolean, user: GitHubUser | null) => void;
  onClose?: () => void;
  className?: string;
}

export const GitHubPanel: React.FC<GitHubPanelProps> = ({
  onFileSelect,
  onRepoSelect,
  onAuthChange,
  onClose,
  className = '',
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [, setUser] = useState<GitHubUser | null>(null);
  const [selectedRepository, setSelectedRepository] = useState<Repository | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [currentPath, setCurrentPath] = useState<string>('');

  const handleAuthChange = (authenticated: boolean, currentUser: GitHubUser | null) => {
    setIsAuthenticated(authenticated);
    setUser(currentUser);
    
    // Notify parent component
    if (onAuthChange) {
      onAuthChange(authenticated, currentUser);
    }
    
    // Reset selections when auth changes
    if (!authenticated) {
      setSelectedRepository(null);
      setSelectedBranch('');
      setCurrentPath('');
      // Notify parent that repository is cleared
      if (onRepoSelect) {
        onRepoSelect(null, '');
      }
    }
  };

  const handleRepositorySelect = (repo: Repository) => {
    setSelectedRepository(repo);
    setCurrentPath(''); // Reset path when changing repository
    // Notify parent of repository selection
    if (onRepoSelect) {
      onRepoSelect(repo, selectedBranch);
    }
  };

  const handleBranchSelect = (branch: string) => {
    setSelectedBranch(branch);
    setCurrentPath(''); // Reset path when changing branch
    // Notify parent of branch selection
    if (onRepoSelect && selectedRepository) {
      onRepoSelect(selectedRepository, branch);
    }
  };

  const handleFileSelect = (file: FileContent) => {
    if (onFileSelect && selectedRepository && selectedBranch) {
      onFileSelect(file, selectedRepository, selectedBranch);
    }
  };

  const handlePathChange = (path: string) => {
    setCurrentPath(path);
  };

  return (
    <div className={`github-panel ${className}`}>
      <div className="github-panel-header">
        <h3 className="panel-title">GitHub Integration</h3>
        <div className="github-panel-header-actions">
          <AuthButton onAuthChange={handleAuthChange} />
          {onClose && (
            <button className="github-panel-close-header" onClick={onClose} title="Close">
              ×
            </button>
          )}
        </div>
      </div>

      {!isAuthenticated ? (
        <div className="github-panel-content unauthenticated">
          <div className="auth-prompt">
            <div className="auth-prompt-icon">🐙</div>
            <h4>Connect to GitHub</h4>
            <p>Sign in with your GitHub account to access your repositories and files.</p>
            <ul className="feature-list">
              <li>✅ Browse your repositories</li>
              <li>✅ Open and edit files</li>
              <li>✅ Save changes back to GitHub</li>
              <li>✅ Work with branches</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="github-panel-content authenticated">
          <div className="repository-section">
            <RepoSelector
              selectedRepository={selectedRepository}
              selectedBranch={selectedBranch}
              onRepositorySelect={handleRepositorySelect}
              onBranchSelect={handleBranchSelect}
            />
          </div>

          {selectedRepository && selectedBranch && (
            <div className="file-browser-section">
              <FileBrowser
                repository={selectedRepository}
                branch={selectedBranch}
                currentPath={currentPath}
                onFileSelect={handleFileSelect}
                onPathChange={handlePathChange}
              />
            </div>
          )}

          {!selectedRepository && (
            <div className="no-repo-selected">
              <div className="no-repo-icon">📁</div>
              <p>Select a repository to browse files</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GitHubPanel;