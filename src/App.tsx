// src/App.tsx
import { useState, useCallback } from "react";
import "./hacker-theme.css"; // Import the hacker theme CSS
import "./App.css"; // For TipTap editor specific styles and overrides

import LiveMarkdownEditor from "./components/liveMarkdown/editor";

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

  /**
   * Callback for LiveMarkdownEditor to update the central markdownText state.
   * This is triggered when TipTap's content changes and is serialized to Markdown.
   */
  const handleMarkdownUpdate = useCallback((newMarkdown: string) => {
    setMarkdownText(newMarkdown);
  }, []);

  return (
    <div className="app-container">
      <header className="app-header-placeholder">
        {/* Placeholder for site header, actual styling by hacker-theme.css */}
      </header>

      {/* The main content area where the live TipTap editor will reside.
          It needs the .container and #main_content structure for the hacker-theme
          to apply correctly to the overall page layout. The TipTap editor itself
          will be styled by .ProseMirror and rules in app.css.
      */}
      <div className="container editor-main-container">
        <section id="main_content" className="editor-section">
          <LiveMarkdownEditor
            initialContent={markdownText}
            onUpdate={handleMarkdownUpdate}
          />
        </section>
      </div>
    </div>
  );
}

export default App;
