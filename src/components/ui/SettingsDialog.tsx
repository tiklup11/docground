// src/components/ui/SettingsDialog.tsx
import React, { useState } from 'react';
import { useTheme } from '../../themes/ThemeContext';
import { fontOptions } from '../../themes/themes';
import AuthButton from '../github/AuthButton';
import RepoSelector from '../github/RepoSelector';
import FileBrowser from '../github/FileBrowser';
import type { Repository, GitHubUser, FileContent } from '../../services/github/types';
import './SettingsDialog.css';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect?: (file: FileContent, repository: Repository, branch: string) => void;
  onRepoSelect?: (repository: Repository | null, branch: string) => void;
  onAuthChange?: (authenticated: boolean) => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ 
  isOpen, 
  onClose, 
  onFileSelect,
  onRepoSelect,
  onAuthChange
}) => {
  const { currentTheme, setTheme, availableThemes, fontConfig, setFontConfig } = useTheme();
  const [activeTab, setActiveTab] = useState<'theme' | 'fonts' | 'github'>('theme');
  
  // GitHub integration state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [selectedRepository, setSelectedRepository] = useState<Repository | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>('');

  if (!isOpen) return null;

  const handleThemeSelect = (themeId: string) => {
    setTheme(themeId);
  };

  const handleFontChange = (fontType: keyof typeof fontConfig, fontValue: string) => {
    setFontConfig({
      ...fontConfig,
      [fontType]: fontValue,
    });
  };

  // GitHub handlers
  const handleAuthChange = (authenticated: boolean, gitHubUser: GitHubUser | null) => {
    setIsAuthenticated(authenticated);
    setUser(gitHubUser);
    if (!authenticated) {
      setSelectedRepository(null);
      setSelectedBranch('');
    }
    // Notify parent component
    if (onAuthChange) {
      onAuthChange(authenticated);
    }
  };

  const handleRepositorySelect = (repository: Repository) => {
    setSelectedRepository(repository);
    if (onRepoSelect) {
      onRepoSelect(repository, selectedBranch);
    }
  };

  const handleBranchSelect = (branch: string) => {
    setSelectedBranch(branch);
    if (onRepoSelect && selectedRepository) {
      onRepoSelect(selectedRepository, branch);
    }
  };

  const handleFileSelect = (file: FileContent) => {
    if (selectedRepository && selectedBranch && onFileSelect) {
      onFileSelect(file, selectedRepository, selectedBranch);
      onClose(); // Close settings after selecting a file
    }
  };


  return (
    <>
      <div className="settings-backdrop" onClick={onClose} />
      <div className="settings-dialog">
        <div className="settings-header">
          <h2 className="settings-title">Settings</h2>
          <button className="settings-close" onClick={onClose}>×</button>
        </div>

        <div className="settings-tabs">
          <button 
            className={`settings-tab ${activeTab === 'theme' ? 'settings-tab-active' : ''}`}
            onClick={() => setActiveTab('theme')}
          >
            🎨 Themes
          </button>
          <button 
            className={`settings-tab ${activeTab === 'fonts' ? 'settings-tab-active' : ''}`}
            onClick={() => setActiveTab('fonts')}
          >
            🔤 Fonts
          </button>
          <button 
            className={`settings-tab ${activeTab === 'github' ? 'settings-tab-active' : ''}`}
            onClick={() => setActiveTab('github')}
          >
            🐙 GitHub
          </button>
        </div>

        <div className="settings-content">
          {activeTab === 'theme' && (
            <div className="settings-section">
              <h3 className="settings-section-title">Color Theme</h3>
              <p className="settings-section-description">
                Choose a color theme for the editor interface
              </p>
              
              <div className="theme-grid">
                {availableThemes.map((theme) => (
                  <button
                    key={theme.id}
                    className={`theme-card ${currentTheme.id === theme.id ? 'theme-card-active' : ''}`}
                    onClick={() => handleThemeSelect(theme.id)}
                  >
                    <div className="theme-card-preview">
                      <div className="theme-preview-row">
                        <div 
                          className="theme-preview-block" 
                          style={{ backgroundColor: theme.colors.bg }}
                        />
                        <div 
                          className="theme-preview-block" 
                          style={{ backgroundColor: theme.colors.surface }}
                        />
                      </div>
                      <div className="theme-preview-row">
                        <div 
                          className="theme-preview-block" 
                          style={{ backgroundColor: theme.colors.primary }}
                        />
                        <div 
                          className="theme-preview-block" 
                          style={{ backgroundColor: theme.colors.success }}
                        />
                      </div>
                    </div>
                    <div className="theme-card-info">
                      <div className="theme-card-name">{theme.name}</div>
                      <div className="theme-card-type">{theme.type}</div>
                    </div>
                    {currentTheme.id === theme.id && (
                      <div className="theme-card-check">✓</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'fonts' && (
            <div className="settings-section">
              <h3 className="settings-section-title">Font Configuration</h3>
              <p className="settings-section-description">
                Configure fonts for different parts of the interface
              </p>

              <div className="font-config-group">
                <label className="font-config-label">
                  <span className="font-config-title">UI Font</span>
                  <span className="font-config-description">Used for menus, tabs, and interface elements</span>
                  <select 
                    className="font-config-select"
                    value={fontConfig.uiFont}
                    onChange={(e) => handleFontChange('uiFont', e.target.value)}
                  >
                    {fontOptions.ui.map((font) => (
                      <option key={font.value} value={font.value}>
                        {font.name}
                      </option>
                    ))}
                  </select>
                  <div className="font-preview" style={{ fontFamily: fontConfig.uiFont }}>
                    The quick brown fox jumps over the lazy dog
                  </div>
                </label>
              </div>

              <div className="font-config-group">
                <label className="font-config-label">
                  <span className="font-config-title">Code Font</span>
                  <span className="font-config-description">Used for inline code and code blocks</span>
                  <select 
                    className="font-config-select"
                    value={fontConfig.codeFont}
                    onChange={(e) => handleFontChange('codeFont', e.target.value)}
                  >
                    {fontOptions.code.map((font) => (
                      <option key={font.value} value={font.value}>
                        {font.name}
                      </option>
                    ))}
                  </select>
                  <div className="font-preview code-preview" style={{ fontFamily: fontConfig.codeFont }}>
                    function example() &#123; return "Hello World"; &#125;
                  </div>
                </label>
              </div>

              <div className="font-config-group">
                <label className="font-config-label">
                  <span className="font-config-title">Markdown Font</span>
                  <span className="font-config-description">Used for headers, paragraphs, and other markdown content</span>
                  <select 
                    className="font-config-select"
                    value={fontConfig.markdownFont}
                    onChange={(e) => handleFontChange('markdownFont', e.target.value)}
                  >
                    {fontOptions.markdown.map((font) => (
                      <option key={font.value} value={font.value}>
                        {font.name}
                      </option>
                    ))}
                  </select>
                  <div className="font-preview markdown-preview" style={{ fontFamily: fontConfig.markdownFont }}>
                    # Heading 1<br />
                    This is a paragraph with **bold** and *italic* text.
                  </div>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'github' && (
            <div className="settings-section">
              <h3 className="settings-section-title">GitHub Integration</h3>
              <p className="settings-section-description">
                Connect to GitHub to browse and edit your repositories
              </p>

              <div className="github-auth-section">
                <AuthButton 
                  onAuthChange={handleAuthChange}
                  className="github-settings-auth"
                />
              </div>

              {isAuthenticated && user && (
                <>
                  <div className="github-repo-section">
                    <h4 className="github-subsection-title">Repository Selection</h4>
                    <RepoSelector
                      selectedRepository={selectedRepository}
                      selectedBranch={selectedBranch}
                      onRepositorySelect={handleRepositorySelect}
                      onBranchSelect={handleBranchSelect}
                    />
                  </div>

                  {selectedRepository && selectedBranch && (
                    <div className="github-files-section">
                      <h4 className="github-subsection-title">
                        Files in {selectedRepository.name} ({selectedBranch})
                      </h4>
                      <div className="github-file-browser-container">
                        <FileBrowser
                          repository={selectedRepository}
                          branch={selectedBranch}
                          onFileSelect={handleFileSelect}
                        />
                      </div>
                    </div>
                  )}

                  {selectedRepository && !selectedBranch && (
                    <div className="github-info-message">
                      <p>Select a branch to browse files</p>
                    </div>
                  )}

                  {!selectedRepository && (
                    <div className="github-info-message">
                      <p>Select a repository to get started</p>
                    </div>
                  )}
                </>
              )}

              {!isAuthenticated && (
                <div className="github-unauthenticated-message">
                  <p>Sign in with GitHub to access your repositories and files</p>
                  <ul>
                    <li>Browse your public and private repositories</li>
                    <li>Open and edit files directly in the editor</li>
                    <li>Commit changes back to GitHub</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="settings-footer">
          <div className="settings-footer-info">
            Current theme: <strong>{currentTheme.name}</strong>
          </div>
          <button className="settings-done-btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </>
  );
};