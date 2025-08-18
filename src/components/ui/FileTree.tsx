// src/components/ui/FileTree.tsx
import React, { useState, useEffect, useCallback } from 'react';
import type { Repository, DirectoryItem, FileContent } from '../../services/github/types';
import { getGitHubContentsService } from '../../services/github/contents';
import { getGitHubAuthService } from '../../services/github/auth';
import './FileTree.css';

interface FileTreeProps {
  repository: Repository | null;
  branch: string;
  onFileSelect: (file: FileContent, repository: Repository, branch: string) => void;
  className?: string;
}

interface TreeNode {
  item: DirectoryItem;
  isExpanded: boolean;
  level: number;
  children: TreeNode[];
}

export const FileTree: React.FC<FileTreeProps> = ({
  repository,
  branch,
  onFileSelect,
  className = '',
}) => {
  const [treeNodes, setTreeNodes] = useState<TreeNode[]>([]);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['']));
  const [loadingPaths, setLoadingPaths] = useState<Set<string>>(new Set());
  const [selectedPath, setSelectedPath] = useState<string>('');

  const authService = getGitHubAuthService();
  const contentsService = getGitHubContentsService(() => authService.getToken());

  const getFileIcon = (item: DirectoryItem) => {
    if (item.type === 'dir') {
      return expandedPaths.has(item.path) ? '' : '';
    }
    
    const ext = item.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'md':
      case 'markdown':
        return '';
      case 'js':
      case 'jsx':
        return '';
      case 'ts':
      case 'tsx':
        return '';
      case 'json':
        return '';
      case 'css':
        return '';
      case 'html':
        return '';
      case 'py':
        return '';
      case 'lua':
        return '';
      case 'vim':
      case 'nvim':
        return '';
      case 'git':
        return '';
      case 'gitignore':
        return '';
      case 'lock':
        return '';
      case 'yml':
      case 'yaml':
        return '';
      case 'go':
        return '';
      case 'rs':
        return '';
      case 'java':
        return '';
      case 'php':
        return '';
      case 'rb':
        return '';
      case 'c':
        return '';
      case 'cpp':
        return '';
      case 'h':
        return '';
      default:
        return '';
    }
  };

  const getGitStatusIcon = (name: string) => {
    // Simulate git status - in real app would come from git API
    if (name.startsWith('.git')) return '';
    if (name === 'README.md') return 'README';
    if (name === 'package.json') return 'PKG';
    if (name === 'LICENSE') return 'LIC';
    return '';
  };

  const updateTreeNodes = useCallback((nodes: TreeNode[], targetPath: string, newChildren: TreeNode[]): TreeNode[] => {
    return nodes.map(node => {
      if (node.item.path === targetPath) {
        return { ...node, children: newChildren, isExpanded: true };
      }
      if (node.children.length > 0) {
        return { ...node, children: updateTreeNodes(node.children, targetPath, newChildren) };
      }
      return node;
    });
  }, []);

  const loadDirectoryContents = useCallback(async (path: string = '') => {
    if (!repository || loadingPaths.has(path)) return;

    setLoadingPaths(prev => new Set(prev).add(path));
    
    try {
      const contents = await contentsService.getDirectoryContents(
        repository.owner.login,
        repository.name,
        path,
        branch
      );

      // Sort: directories first, then files, both alphabetically
      const sorted = contents.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'dir' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

      const level = path ? path.split('/').length : 0;
      const newNodes: TreeNode[] = sorted.map(item => ({
        item,
        isExpanded: false,
        level,
        children: []
      }));

      if (path === '') {
        setTreeNodes(newNodes);
      } else {
        // Update specific path's children
        setTreeNodes(prevNodes => updateTreeNodes(prevNodes, path, newNodes));
      }
    } catch (error) {
      console.error('Failed to load directory:', error);
    } finally {
      setLoadingPaths(prev => {
        const newSet = new Set(prev);
        newSet.delete(path);
        return newSet;
      });
    }
  }, [repository, branch, contentsService, updateTreeNodes]);

  const toggleDirectory = async (node: TreeNode) => {
    const path = node.item.path;
    
    if (expandedPaths.has(path)) {
      // Collapse
      setExpandedPaths(prev => {
        const newSet = new Set(prev);
        newSet.delete(path);
        return newSet;
      });
      setTreeNodes(prevNodes => collapseNode(prevNodes, path));
    } else {
      // Expand
      setExpandedPaths(prev => new Set(prev).add(path));
      if (node.children.length === 0) {
        await loadDirectoryContents(path);
      } else {
        setTreeNodes(prevNodes => expandNode(prevNodes, path));
      }
    }
  };

  const collapseNode = (nodes: TreeNode[], targetPath: string): TreeNode[] => {
    return nodes.map(node => {
      if (node.item.path === targetPath) {
        return { ...node, isExpanded: false };
      }
      if (node.children.length > 0) {
        return { ...node, children: collapseNode(node.children, targetPath) };
      }
      return node;
    });
  };

  const expandNode = (nodes: TreeNode[], targetPath: string): TreeNode[] => {
    return nodes.map(node => {
      if (node.item.path === targetPath) {
        return { ...node, isExpanded: true };
      }
      if (node.children.length > 0) {
        return { ...node, children: expandNode(node.children, targetPath) };
      }
      return node;
    });
  };

  const handleFileClick = async (item: DirectoryItem) => {
    if (item.type === 'dir') return;

    setSelectedPath(item.path);
    
    try {
      const fileContent = await contentsService.getFileContent(
        repository!.owner.login,
        repository!.name,
        item.path,
        branch
      );
      onFileSelect(fileContent, repository!, branch);
    } catch (error) {
      console.error('Failed to load file:', error);
    }
  };

  const renderTreeNode = (node: TreeNode): React.ReactNode => {
    const isDirectory = node.item.type === 'dir';
    const isExpanded = expandedPaths.has(node.item.path);
    const isSelected = selectedPath === node.item.path;
    const isLoading = loadingPaths.has(node.item.path);

    return (
      <div key={node.item.path}>
        <div
          className={`tree-node ${isSelected ? 'tree-node-selected' : ''} ${isDirectory ? 'tree-node-directory' : 'tree-node-file'}`}
          style={{ paddingLeft: `${node.level * 20 + 8}px` }}
          onClick={() => isDirectory ? toggleDirectory(node) : handleFileClick(node.item)}
        >
          <div className="tree-node-content">
            {isDirectory && (
              <span className="tree-node-arrow">
                {isLoading ? '' : isExpanded ? '' : ''}
              </span>
            )}
            <span className={`tree-node-icon ${isDirectory ? 'tree-node-dir-icon' : ''}`}>
              {getFileIcon(node.item)}
            </span>
            <span className="tree-node-name">
              {node.item.name}
            </span>
            <span className="tree-node-git-status">
              {getGitStatusIcon(node.item.name)}
            </span>
          </div>
        </div>
        {isDirectory && isExpanded && node.children.map(child => renderTreeNode(child))}
      </div>
    );
  };

  useEffect(() => {
    if (repository && branch) {
      setTreeNodes([]);
      setExpandedPaths(new Set(['']));
      setSelectedPath('');
      loadDirectoryContents('');
    }
  }, [repository, branch, loadDirectoryContents]);

  if (!repository) {
    return (
      <div className={`file-tree ${className}`}>
        <div className="file-tree-header">
          <span className="file-tree-title">No Repository</span>
        </div>
        <div className="file-tree-empty">
          <p>Select a repository to browse files</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`file-tree ${className}`}>
      <div className="file-tree-header">
        <span className="file-tree-title">{repository.name}</span>
        <span className="file-tree-branch">{branch}</span>
      </div>
      <div className="file-tree-content">
        {treeNodes.map(node => renderTreeNode(node))}
      </div>
    </div>
  );
};

export default FileTree;