// src/App.tsx
import { useState, useCallback } from "react";
import "./hacker-theme.css"; // Import the hacker theme CSS
import "./App.css"; // For TipTap editor specific styles and overrides

import LiveMarkdownEditor from "./components/liveMarkdown/editor";
import GitHubPanel from "./components/github/GitHubPanel";
import type { FileContent } from "./services/github/types";
import "./components/github/GitHubPanel.css";

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
  // markdownText remains the source of truth for persistence.
  // TipTap will be initialized with this and will update this state.
  const [markdownText, setMarkdownText] = useState<string>(
    initialMarkdownContent
  );
  const [showGitHubPanel, setShowGitHubPanel] = useState<boolean>(false);

  /**
   * Callback for LiveMarkdownEditor to update the central markdownText state.
   * This is triggered when TipTap's content changes and is serialized to Markdown.
   */
  const handleMarkdownUpdate = useCallback((newMarkdown: string) => {
    setMarkdownText(newMarkdown);
  }, []);

  /**
   * Handle file selection from GitHub
   */
  const handleGitHubFileSelect = useCallback((file: FileContent) => {
    setMarkdownText(file.content);
    // Optionally close the panel after file selection
    // setShowGitHubPanel(false);
  }, []);

  return (
    <div className="app-container">
      <header className="app-header-placeholder">
        {/* GitHub Panel Toggle */}
        <button
          className="github-toggle-button"
          onClick={() => setShowGitHubPanel(!showGitHubPanel)}
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 1000,
            background: 'rgba(181, 232, 83, 0.1)',
            border: '1px solid rgba(181, 232, 83, 0.3)',
            borderRadius: '4px',
            color: '#b5e853',
            padding: '8px 12px',
            fontFamily: 'Monaco, "Bitstream Vera Sans Mono", "Lucida Console", Terminal, monospace',
            fontSize: '11px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {showGitHubPanel ? 'Hide GitHub' : 'Show GitHub'}
        </button>
      </header>

      <div style={{ display: 'flex', height: '100vh' }}>
        {/* GitHub Panel */}
        {showGitHubPanel && (
          <div style={{
            width: '400px',
            flexShrink: 0,
            borderRight: '1px solid rgba(255, 255, 255, 0.15)',
            background: '#151515'
          }}>
            <GitHubPanel onFileSelect={handleGitHubFileSelect} />
          </div>
        )}

        {/* The main content area where the live TipTap editor will reside */}
        <div className="container editor-main-container" style={{ flex: 1 }}>
          <section id="main_content" className="editor-section">
            <LiveMarkdownEditor
              initialContent={markdownText}
              onUpdate={handleMarkdownUpdate}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

export default App;
