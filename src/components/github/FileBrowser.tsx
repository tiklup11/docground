// src/components/github/FileBrowser.tsx
import React, { useState, useEffect, useMemo } from 'react';
import type { Repository, DirectoryItem, FileContent } from '../../services/github/types';
import { getGitHubContentsService } from '../../services/github/contents';
import { getGitHubAuthService } from '../../services/github/auth';

interface FileBrowserProps {
  repository: Repository;
  branch: string;
  currentPath?: string;
  onFileSelect: (file: FileContent) => void;
  onPathChange?: (path: string) => void;
  className?: string;
}

interface FileTreeNode {
  item: DirectoryItem;
  isExpanded: boolean;
  children: FileTreeNode[];
  level: number;
}

export const FileBrowser: React.FC<FileBrowserProps> = ({
  repository,
  branch,
  currentPath = '',
  onFileSelect,
  onPathChange,
  className = '',
}) => {
  const [directoryContents, setDirectoryContents] = useState<DirectoryItem[]>([]);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['']));
  const [loadingPaths, setLoadingPaths] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const authService = getGitHubAuthService();
  const contentsService = getGitHubContentsService(() => authService.getToken());

  // Load directory contents
  const loadDirectory = async (path: string = '') => {
    if (loadingPaths.has(path)) return;

    setLoadingPaths(prev => new Set(prev).add(path));
    setError(null);

    try {
      const contents = await contentsService.getDirectoryContents(
        repository.owner.login,
        repository.name,
        path,
        branch
      );

      // Sort contents: directories first, then files, both alphabetically
      const sortedContents = contents.sort((a, b) => {
        if (a.type === b.type) {
          return a.name.localeCompare(b.name);
        }
        return a.type === 'dir' ? -1 : 1;
      });

      if (path === '') {
        setDirectoryContents(sortedContents);
      } else {
        // Update directory contents for nested paths
        setDirectoryContents(prev => {
          const updated = [...prev];
          // This is a simplified approach - in a full implementation,
          // you'd maintain a tree structure
          return updated;
        });
      }
    } catch (err) {
      console.error(`Failed to load directory ${path}:`, err);
      setError(`Failed to load directory: ${path || 'root'}`);
    } finally {
      setLoadingPaths(prev => {
        const updated = new Set(prev);
        updated.delete(path);
        return updated;
      });
    }
  };

  // Build file tree structure
  const fileTree = useMemo(() => {
    const buildTree = (items: DirectoryItem[], level: number = 0): FileTreeNode[] => {
      return items.map(item => ({
        item,
        isExpanded: expandedPaths.has(item.path),
        children: [], // In a full implementation, this would contain loaded children
        level,
      }));
    };

    return buildTree(directoryContents);
  }, [directoryContents, expandedPaths]);

  // Load root directory on mount or when repository/branch changes
  useEffect(() => {
    if (repository && branch) {
      setIsLoading(true);
      loadDirectory('')
        .finally(() => setIsLoading(false));
    }
  }, [repository, branch]);

  // Handle directory expansion/collapse
  const toggleDirectory = async (path: string) => {
    if (expandedPaths.has(path)) {
      // Collapse directory
      setExpandedPaths(prev => {
        const updated = new Set(prev);
        updated.delete(path);
        return updated;
      });
    } else {
      // Expand directory
      setExpandedPaths(prev => new Set(prev).add(path));
      // Load directory contents if not already loaded
      await loadDirectory(path);
    }
  };

  // Handle file selection
  const handleFileClick = async (item: DirectoryItem) => {
    if (item.type === 'dir') {
      await toggleDirectory(item.path);
      if (onPathChange) {
        onPathChange(item.path);
      }
    } else {
      try {
        setSelectedFile(item.path);
        const fileContent = await contentsService.getFileContent(
          repository.owner.login,
          repository.name,
          item.path,
          branch
        );
        onFileSelect(fileContent);
        if (onPathChange) {
          onPathChange(item.path);
        }
      } catch (err) {
        console.error(`Failed to load file ${item.path}:`, err);
        setError(`Failed to load file: ${item.name}`);
      }
    }
  };

  // Get file icon based on extension or type
  const getFileIcon = (item: DirectoryItem): string => {
    if (item.type === 'dir') {
      return expandedPaths.has(item.path) ? '📂' : '📁';
    }

    const extension = item.name.split('.').pop()?.toLowerCase();
    
    const iconMap: Record<string, string> = {
      // Documents
      'md': '📄',
      'txt': '📄',
      'pdf': '📕',
      'doc': '📘',
      'docx': '📘',
      
      // Code files
      'js': '📜',
      'ts': '📜',
      'jsx': '⚛️',
      'tsx': '⚛️',
      'py': '🐍',
      'java': '☕',
      'cpp': '⚙️',
      'c': '⚙️',
      'cs': '🔷',
      'go': '🐹',
      'rs': '🦀',
      'php': '🐘',
      'rb': '💎',
      'swift': '🐦',
      
      // Web files
      'html': '🌐',
      'css': '🎨',
      'scss': '🎨',
      'sass': '🎨',
      'less': '🎨',
      
      // Data files
      'json': '📋',
      'xml': '📋',
      'yaml': '📋',
      'yml': '📋',
      'csv': '📊',
      
      // Images
      'png': '🖼️',
      'jpg': '🖼️',
      'jpeg': '🖼️',
      'gif': '🖼️',
      'svg': '🖼️',
      'ico': '🖼️',
      
      // Config files
      'config': '⚙️',
      'conf': '⚙️',
      'env': '⚙️',
      'gitignore': '🙈',
      'dockerfile': '🐳',
      
      // Archives
      'zip': '🗜️',
      'tar': '🗜️',
      'gz': '🗜️',
      'rar': '🗜️',
    };

    return iconMap[extension || ''] || '📄';
  };

  // Get file size display
  const formatFileSize = (size: number): string => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Navigate up to parent directory
  const navigateUp = () => {
    if (currentPath) {
      const parentPath = currentPath.split('/').slice(0, -1).join('/');
      if (onPathChange) {
        onPathChange(parentPath);
      }
    }
  };

  return (
    <div className={`file-browser ${className}`}>
      {/* Header */}
      <div className="file-browser-header">
        <div className="breadcrumb">
          <button
            className="breadcrumb-item root"
            onClick={() => onPathChange?.('')}
            title="Go to root"
          >
            📁 {repository.name}
          </button>
          {currentPath && (
            <>
              <span className="breadcrumb-separator">/</span>
              {currentPath.split('/').map((segment, index, array) => {
                const path = array.slice(0, index + 1).join('/');
                const isLast = index === array.length - 1;
                
                return (
                  <React.Fragment key={path}>
                    <button
                      className={`breadcrumb-item ${isLast ? 'current' : ''}`}
                      onClick={() => onPathChange?.(path)}
                      title={isLast ? 'Current directory' : `Go to ${segment}`}
                    >
                      {segment}
                    </button>
                    {!isLast && <span className="breadcrumb-separator">/</span>}
                  </React.Fragment>
                );
              })}
            </>
          )}
        </div>
        
        <div className="file-browser-actions">
          <button
            className="action-button"
            onClick={() => loadDirectory(currentPath)}
            disabled={isLoading}
            title="Refresh directory"
          >
            {isLoading ? '⟳' : '🔄'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="file-browser-error">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
          <button
            className="error-retry"
            onClick={() => {
              setError(null);
              loadDirectory(currentPath);
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* File Tree */}
      <div className="file-tree">
        {isLoading && directoryContents.length === 0 ? (
          <div className="loading-state">
            <span className="loading-spinner">⟳</span>
            <span>Loading directory...</span>
          </div>
        ) : directoryContents.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <span>This directory is empty</span>
          </div>
        ) : (
          <div className="file-list">
            {fileTree.map((node) => (
              <div
                key={node.item.path}
                className={`file-item ${node.item.type} ${
                  selectedFile === node.item.path ? 'selected' : ''
                } ${loadingPaths.has(node.item.path) ? 'loading' : ''}`}
                onClick={() => handleFileClick(node.item)}
                title={`${node.item.name} ${
                  node.item.type === 'file' ? `(${formatFileSize(node.item.size)})` : ''
                }`}
              >
                <div className="file-item-content">
                  <span className="file-icon">
                    {getFileIcon(node.item)}
                  </span>
                  <span className="file-name">{node.item.name}</span>
                  {loadingPaths.has(node.item.path) && (
                    <span className="file-loading">⟳</span>
                  )}
                </div>
                
                {node.item.type === 'file' && (
                  <div className="file-metadata">
                    <span className="file-size">{formatFileSize(node.item.size)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="file-browser-footer">
        <div className="status-info">
          <span className="item-count">
            {directoryContents.length} item{directoryContents.length !== 1 ? 's' : ''}
          </span>
          <span className="branch-info">
            Branch: <strong>{branch}</strong>
          </span>
        </div>
      </div>
    </div>
  );
};

export default FileBrowser;