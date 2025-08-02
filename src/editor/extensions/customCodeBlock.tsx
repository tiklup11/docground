// src/editor/extensions/customCodeBlock.tsx
import React, { useState, useRef, useEffect } from 'react';
import { NodeViewWrapper, NodeViewContent, NodeViewProps } from '@tiptap/react';

// Available languages for the dropdown
const LANGUAGES = [
  { value: '', label: 'Plain Text' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'scss', label: 'SCSS' },
  { value: 'json', label: 'JSON' },
  { value: 'xml', label: 'XML' },
  { value: 'yaml', label: 'YAML' },
  { value: 'sql', label: 'SQL' },
  { value: 'bash', label: 'Bash' },
  { value: 'sh', label: 'Shell' },
  { value: 'powershell', label: 'PowerShell' },
  { value: 'dockerfile', label: 'Dockerfile' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'latex', label: 'LaTeX' },
];

export const CustomCodeBlockComponent: React.FC<NodeViewProps> = ({ node, updateAttributes, extension }) => {
  const [showCopied, setShowCopied] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const contentRef = useRef<HTMLDivElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const copyToClipboard = async () => {
    if (preRef.current) {
      const text = preRef.current.textContent || '';
      try {
        await navigator.clipboard.writeText(text);
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    }
  };

  // Handle Ctrl+A to select only code block content
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
        // Check if the focus is within this code block
        const selection = window.getSelection();
        if (selection && preRef.current && preRef.current.contains(selection.anchorNode)) {
          event.preventDefault();
          event.stopPropagation();
          
          // Select all text within the code block
          const range = document.createRange();
          range.selectNodeContents(preRef.current);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    };

    if (preRef.current) {
      preRef.current.addEventListener('keydown', handleKeyDown, true);
      return () => {
        if (preRef.current) {
          preRef.current.removeEventListener('keydown', handleKeyDown, true);
        }
      };
    }
  }, []);

  const language = node.attrs.language || '';
  
  const handleLanguageSelect = (langValue: string) => {
    console.log('Language selected:', langValue);
    updateAttributes({ language: langValue });
    setShowDropdown(false);
  };

  const toggleDropdown = () => {
    if (!showDropdown && buttonRef.current) {
      // Calculate position when opening
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left
      });
    }
    setShowDropdown(!showDropdown);
  };

  const currentLanguageLabel = LANGUAGES.find(lang => lang.value === language)?.label || 'Plain Text';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Check if click is on the button or dropdown options
      if (buttonRef.current && buttonRef.current.contains(target)) {
        return; // Don't close if clicking on button
      }
      
      // Check if click is on any dropdown option
      const dropdownOptions = document.querySelector('.code-block-language-options');
      if (dropdownOptions && dropdownOptions.contains(target)) {
        return; // Don't close if clicking on dropdown options
      }
      
      // Close if clicking outside
      setShowDropdown(false);
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  return (
    <NodeViewWrapper className="code-block-wrapper">
      <div className="code-block-container">
        <div className="code-block-header">
          <div className="code-block-language-dropdown" ref={dropdownRef}>
            <button
              ref={buttonRef}
              className="code-block-language-button"
              onClick={toggleDropdown}
              title="Select language"
            >
              {currentLanguageLabel.toUpperCase()}
            </button>
          </div>
          <button
            className="code-block-copy-btn"
            onClick={copyToClipboard}
            title="Copy code"
          >
            {showCopied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <pre ref={preRef} className="hljs">
          <NodeViewContent ref={contentRef} as="code" />
        </pre>
      </div>
      
      {/* Render dropdown outside the container using a portal-like approach */}
      {showDropdown && (
        <div 
          className="code-block-language-options"
          style={{
            position: 'fixed',
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            zIndex: 9999
          }}
        >
          {LANGUAGES.map(lang => (
            <div
              key={lang.value}
              className={`code-block-language-option ${lang.value === language ? 'selected' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleLanguageSelect(lang.value);
              }}
            >
              {lang.label}
            </div>
          ))}
        </div>
      )}
    </NodeViewWrapper>
  );
};