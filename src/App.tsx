// src/App.tsx
import { useState, useCallback } from "react";
import "./neovim-theme.css"; // Import the Neovim theme CSS
import "./App.css"; // For TipTap editor specific styles and overrides

import LiveMarkdownEditor from "./components/liveMarkdown/editor";
import TabBar, { TabFile } from "./components/ui/TabBar";
import FileTree from "./components/ui/FileTree";
import StatusBar from "./components/ui/StatusBar";
import { SettingsDialog } from "./components/ui/SettingsDialog";
import type { FileContent, Repository } from "./services/github/types";
import { getGitHubContentsService } from "./services/github/contents";
import { getGitHubAuthService } from "./services/github/auth";

// Initial Markdown content for the editor
const initialMarkdownContent = `# Welcome to Your Hacker Editor!

Powered by **TipTap**. Type your Markdown here.

- Item 1
- Item 2
  - Nested Item A
  - Nested Item B
- [ ] A task to do
- [x] A completed task

> This is a blockquote. It should be styled according to the hacker theme.

\`\`\`javascript
// This is a JavaScript code block
function helloWorld(name) {
  console.log("Hello, " + name + "!");
}
helloWorld("Developer");
\`\`\`

\`Inline code\` looks like this.

---

A horizontal rule.

Pasting Markdown content should also work! Try pasting some from another source.
`;

function App() {
  // Tab system state
  const [tabs, setTabs] = useState<TabFile[]>([
    {
      id: 'welcome',
      name: 'Welcome.md',
      path: 'Welcome.md',
      content: initialMarkdownContent,
      isDirty: false,
      isGitHubFile: false,
    }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('welcome');
  
  // GitHub integration state
  const [currentRepository, setCurrentRepository] = useState<Repository | null>(null);
  const [currentBranch, setCurrentBranch] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  // UI state
  const [showSettingsDialog, setShowSettingsDialog] = useState<boolean>(false);
  
  // Save state
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Get current tab
  const currentTab = tabs.find(tab => tab.id === activeTabId);
  const markdownText = currentTab?.content || '';
  
  // Suppress unused variable warnings for now
  void isSaving;
  void saveError;

  /**
   * Callback for LiveMarkdownEditor to update the current tab content.
   */
  const handleMarkdownUpdate = useCallback((newMarkdown: string) => {
    if (!activeTabId) return;
    
    setTabs(prevTabs => 
      prevTabs.map(tab => 
        tab.id === activeTabId 
          ? { ...tab, content: newMarkdown, isDirty: true }
          : tab
      )
    );
  }, [activeTabId]);

  /**
   * Handle repository and branch selection from GitHub Panel
   */
  const handleGitHubRepoSelect = useCallback((repository: Repository | null, branch: string) => {
    setCurrentRepository(repository);
    setCurrentBranch(branch);
  }, []);

  /**
   * Handle authentication state changes from GitHub integration
   */
  const handleAuthStateChange = useCallback((authenticated: boolean) => {
    setIsAuthenticated(authenticated);
    if (!authenticated) {
      setCurrentRepository(null);
      setCurrentBranch('');
    }
  }, []);

  /**
   * Handle file selection from GitHub - opens in new tab
   */
  const handleGitHubFileSelect = useCallback((file: FileContent, repository: Repository, branch: string) => {
    const tabId = `github-${file.path}`;
    
    // Check if file is already open
    const existingTab = tabs.find(tab => tab.id === tabId);
    if (existingTab) {
      setActiveTabId(tabId);
      return;
    }

    // Create new tab for GitHub file
    const newTab: TabFile = {
      id: tabId,
      name: file.name,
      path: file.path,
      content: file.content,
      isDirty: false,
      isGitHubFile: true,
    };

    setTabs(prevTabs => [...prevTabs, newTab]);
    setActiveTabId(tabId);
    setCurrentRepository(repository);
    setCurrentBranch(branch);
    setSaveError(null);
  }, [tabs]);

  /**
   * Tab management functions
   */
  const handleTabSelect = useCallback((tabId: string) => {
    setActiveTabId(tabId);
  }, []);

  const handleTabClose = useCallback((tabId: string) => {
    setTabs(prevTabs => {
      const filtered = prevTabs.filter(tab => tab.id !== tabId);
      
      // If closing active tab, switch to another tab
      if (tabId === activeTabId) {
        const currentIndex = prevTabs.findIndex(tab => tab.id === tabId);
        const nextTab = filtered[currentIndex] || filtered[currentIndex - 1] || filtered[0];
        setActiveTabId(nextTab?.id || '');
      }
      
      return filtered;
    });
  }, [activeTabId]);

  const handleNewTab = useCallback(() => {
    const newTabId = `untitled-${Date.now()}`;
    const newTab: TabFile = {
      id: newTabId,
      name: 'Untitled.md',
      path: 'Untitled.md',
      content: '# New Document\n\nStart typing...',
      isDirty: false,
      isGitHubFile: false,
    };

    setTabs(prevTabs => [...prevTabs, newTab]);
    setActiveTabId(newTabId);
  }, []);

  /**
   * Handle saving current content to GitHub
   */
  const handleSaveToGitHub = useCallback(async (commitMessage: string) => {
    if (!currentTab?.isGitHubFile || !currentRepository || !currentBranch) {
      throw new Error('No GitHub file selected for saving');
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      const authService = getGitHubAuthService();
      const contentsService = getGitHubContentsService(() => authService.getToken());
      
      const result = await contentsService.updateFile(
        currentRepository.owner.login,
        currentRepository.name,
        currentTab.path,
        currentTab.content || '',
        commitMessage,
        '', // SHA should be stored in tab metadata
        currentBranch
      );

      // Update tab to mark as saved
      setTabs(prevTabs => 
        prevTabs.map(tab => 
          tab.id === activeTabId 
            ? { ...tab, isDirty: false }
            : tab
        )
      );
      
      console.log('File saved successfully:', result);
    } catch (error) {
      console.error('Failed to save file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setSaveError(errorMessage);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [currentTab, currentRepository, currentBranch, activeTabId]);

  return (
    <div className="nvim-app">

      {/* Main Neovim-style Layout */}
      <div className="nvim-layout">
        {/* Left Sidebar - File Tree */}
        <div className="nvim-sidebar">
          <FileTree
            repository={currentRepository}
            branch={currentBranch}
            onFileSelect={handleGitHubFileSelect}
          />
        </div>

        {/* Main Content Area */}
        <div className="nvim-main">
          {/* Tab Bar */}
          <TabBar
            tabs={tabs}
            activeTabId={activeTabId}
            onTabSelect={handleTabSelect}
            onTabClose={handleTabClose}
            onNewTab={handleNewTab}
          />

          {/* Editor */}
          <div className="nvim-editor">
            <LiveMarkdownEditor
              key={activeTabId} // Force re-render when tab changes
              initialContent={markdownText}
              onUpdate={handleMarkdownUpdate}
            />
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar
        repository={currentRepository}
        branch={currentBranch}
        currentFile={currentTab?.path || null}
        hasUnsavedChanges={currentTab?.isDirty || false}
        isAuthenticated={isAuthenticated}
        onCommit={handleSaveToGitHub}
      />

      {/* Floating Controls */}
      <div className="floating-controls">
        <button
          className="settings-toggle-floating"
          onClick={() => setShowSettingsDialog(true)}
          title="Settings"
        >
          ⚙️
        </button>
      </div>

      {/* Settings Dialog */}
      <SettingsDialog
        isOpen={showSettingsDialog}
        onClose={() => setShowSettingsDialog(false)}
        onFileSelect={handleGitHubFileSelect}
        onRepoSelect={handleGitHubRepoSelect}
        onAuthChange={handleAuthStateChange}
      />
    </div>
  );
}

export default App;
