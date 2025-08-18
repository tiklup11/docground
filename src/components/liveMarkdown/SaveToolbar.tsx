// src/components/liveMarkdown/SaveToolbar.tsx
import React, { useState } from 'react';
import type { FileContent, Repository } from '../../services/github/types';
import './SaveToolbar.css';

interface SaveToolbarProps {
  currentFile: FileContent | null;
  currentRepository: Repository | null;
  currentBranch: string;
  markdownContent: string;
  onSave: (commitMessage: string) => Promise<void>;
  isSaving?: boolean;
  lastSaved?: Date | null;
  saveError?: string | null;
  className?: string;
}

export const SaveToolbar: React.FC<SaveToolbarProps> = ({
  currentFile,
  currentRepository,
  currentBranch,
  markdownContent,
  onSave,
  isSaving = false,
  lastSaved = null,
  saveError = null,
  className = '',
}) => {
  const [showCommitDialog, setShowCommitDialog] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [isCommitting, setIsCommitting] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const handleSaveClick = () => {
    setShowCommitDialog(true);
    setDialogError(null);
    // Set default commit message based on file
    if (currentFile) {
      setCommitMessage(`Update ${currentFile.name}`);
    }
  };

  const handleCommitSubmit = async () => {
    if (!commitMessage.trim()) return;
    
    setIsCommitting(true);
    setDialogError(null);
    try {
      await onSave(commitMessage.trim());
      setShowCommitDialog(false);
      setCommitMessage('');
    } catch (error) {
      console.error('Save failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Handle specific GitHub API errors
      if (errorMessage.includes('409')) {
        setDialogError('File has been modified by someone else. Please refresh and try again.');
      } else if (errorMessage.includes('422')) {
        setDialogError('Invalid file content or commit message. Please check your changes.');
      } else if (errorMessage.includes('403')) {
        setDialogError('You do not have permission to modify this file.');
      } else if (errorMessage.includes('404')) {
        setDialogError('File or repository not found. It may have been deleted or moved.');
      } else if (errorMessage.includes('rate limit')) {
        setDialogError('GitHub API rate limit exceeded. Please wait a moment and try again.');
      } else {
        setDialogError(`Save failed: ${errorMessage}`);
      }
    } finally {
      setIsCommitting(false);
    }
  };

  const handleCommitCancel = () => {
    setShowCommitDialog(false);
    setCommitMessage('');
    setDialogError(null);
  };

  const canSave = currentFile && currentRepository && currentBranch && markdownContent !== undefined;
  const hasChanges = currentFile && markdownContent !== currentFile.content;

  return (
    <>
      <div className={`save-toolbar ${className}`}>
        <div className="save-toolbar-left">
          {currentFile && currentRepository && (
            <div className="current-file-info">
              <span className="file-path">
                {currentRepository.name}/{currentFile.path}
              </span>
              <span className="branch-name">
                on {currentBranch}
              </span>
              {hasChanges && <span className="unsaved-indicator">●</span>}
            </div>
          )}
        </div>

        <div className="save-toolbar-right">
          {saveError && (
            <span className="save-error" title={saveError}>
              ⚠️ Save failed
            </span>
          )}
          {lastSaved && !saveError && (
            <span className="last-saved">
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
          
          <button
            onClick={handleSaveClick}
            disabled={!canSave || !hasChanges || isSaving}
            className={`save-button ${hasChanges ? 'has-changes' : ''}`}
            title={
              !canSave 
                ? 'No file selected from GitHub'
                : !hasChanges 
                ? 'No changes to save'
                : 'Save to GitHub'
            }
          >
            {isSaving ? (
              <>
                <span className="spinner"></span>
                Saving...
              </>
            ) : (
              <>
                <span className="save-icon">💾</span>
                Save to GitHub
              </>
            )}
          </button>
        </div>
      </div>

      {/* Commit Message Dialog */}
      {showCommitDialog && (
        <div className="commit-dialog-overlay">
          <div className="commit-dialog">
            <div className="commit-dialog-header">
              <h3>Commit Changes</h3>
              <button 
                onClick={handleCommitCancel}
                className="close-button"
                type="button"
              >
                ×
              </button>
            </div>
            
            <div className="commit-dialog-content">
              <div className="file-info">
                <strong>File:</strong> {currentFile?.path}
              </div>
              
              <div className="commit-message-section">
                <label htmlFor="commit-message">Commit Message:</label>
                <textarea
                  id="commit-message"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="Describe your changes..."
                  rows={3}
                  autoFocus
                />
              </div>

              {dialogError && (
                <div className="commit-error">
                  <span className="error-icon">⚠️</span>
                  {dialogError}
                </div>
              )}
            </div>

            <div className="commit-dialog-actions">
              <button
                onClick={handleCommitCancel}
                className="cancel-button"
                type="button"
                disabled={isCommitting}
              >
                Cancel
              </button>
              <button
                onClick={handleCommitSubmit}
                className="commit-button"
                type="button"
                disabled={!commitMessage.trim() || isCommitting}
              >
                {isCommitting ? (
                  <>
                    <span className="spinner"></span>
                    Committing...
                  </>
                ) : (
                  'Commit & Save'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SaveToolbar;