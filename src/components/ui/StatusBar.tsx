// src/components/ui/StatusBar.tsx
import React, { useState } from 'react';
import type { Repository } from '../../services/github/types';
import './StatusBar.css';

interface StatusBarProps {
  repository: Repository | null;
  branch: string;
  currentFile: string | null;
  hasUnsavedChanges: boolean;
  isAuthenticated: boolean;
  onCommit: (message: string) => Promise<void>;
  className?: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  repository,
  branch,
  currentFile,
  hasUnsavedChanges,
  isAuthenticated,
  onCommit,
  className = '',
}) => {
  const [showCommitInput, setShowCommitInput] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [isCommitting, setIsCommitting] = useState(false);

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMode = () => {
    if (!isAuthenticated) return 'OFFLINE';
    if (hasUnsavedChanges) return 'MODIFIED';
    return 'NORMAL';
  };

  const getModeColor = () => {
    const mode = getMode();
    switch (mode) {
      case 'OFFLINE': return '#e55e5e';
      case 'MODIFIED': return '#d4a574';
      case 'NORMAL': return '#b5e853';
      default: return '#b5e853';
    }
  };

  const handleCommitClick = () => {
    if (!hasUnsavedChanges || !repository) return;
    setShowCommitInput(true);
    setCommitMessage(currentFile ? `Update ${currentFile.split('/').pop()}` : 'Update files');
  };

  const handleCommitSubmit = async () => {
    if (!commitMessage.trim()) return;
    
    setIsCommitting(true);
    try {
      await onCommit(commitMessage.trim());
      setShowCommitInput(false);
      setCommitMessage('');
    } catch (error) {
      console.error('Commit failed:', error);
    } finally {
      setIsCommitting(false);
    }
  };

  const handleCommitCancel = () => {
    setShowCommitInput(false);
    setCommitMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCommitSubmit();
    } else if (e.key === 'Escape') {
      handleCommitCancel();
    }
  };

  return (
    <div className={`status-bar ${className}`}>
      <div className="status-left">
        <div className="status-section">
          <span className="status-label">NvimTree_1</span>
          <span className="status-separator">[-]</span>
        </div>
        
        <div className="status-section">
          <span className="status-time">{getCurrentTime()}</span>
        </div>
        
        <div 
          className="status-mode"
          style={{ backgroundColor: getModeColor() }}
        >
          {getMode()}
        </div>
      </div>

      <div className="status-center">
        {showCommitInput ? (
          <div className="commit-input-container">
            <span className="commit-icon">SAVE</span>
            <input
              type="text"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Enter commit message..."
              className="commit-input"
              autoFocus
              disabled={isCommitting}
            />
            <button 
              onClick={handleCommitSubmit}
              disabled={!commitMessage.trim() || isCommitting}
              className="commit-submit"
            >
              {isCommitting ? '...' : 'OK'}
            </button>
            <button 
              onClick={handleCommitCancel}
              disabled={isCommitting}
              className="commit-cancel"
            >
              ESC
            </button>
          </div>
        ) : (
          <div className="status-info">
            {repository && (
              <>
                <span className="status-git">{branch}</span>
                <span className="status-separator">•</span>
                <span className="status-repo">{repository.name}</span>
                {hasUnsavedChanges && (
                  <>
                    <span className="status-separator">•</span>
                    <button 
                      onClick={handleCommitClick}
                      className="status-commit-btn"
                      disabled={!isAuthenticated}
                    >
                      Commit
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="status-right">
        <div className="status-section">
          <span className="status-cursor">main</span>
        </div>
        
        <div className="status-section">
          {currentFile && (
            <span className="status-file">
              {currentFile.split('/').pop()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatusBar;