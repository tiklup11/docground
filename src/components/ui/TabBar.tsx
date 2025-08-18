// src/components/ui/TabBar.tsx
import React from 'react';
import './TabBar.css';

export interface TabFile {
  id: string;
  name: string;
  path: string;
  content?: string;
  isDirty?: boolean;
  isGitHubFile?: boolean;
}

interface TabBarProps {
  tabs: TabFile[];
  activeTabId: string | null;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onNewTab: () => void;
  className?: string;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  onNewTab,
  className = '',
}) => {
  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
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
      default:
        return '';
    }
  };

  return (
    <div className={`tab-bar ${className}`}>
      <div className="tab-list">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`tab ${activeTabId === tab.id ? 'tab-active' : ''}`}
            onClick={() => onTabSelect(tab.id)}
          >
            {getFileIcon(tab.name) && <span className="tab-icon">{getFileIcon(tab.name)}</span>}
            <span className="tab-name">{tab.name}</span>
            {tab.isDirty && <span className="tab-dirty">*</span>}
            <button
              className="tab-close"
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              title="Close tab"
            >
              ×
            </button>
          </div>
        ))}
        <button className="tab-new" onClick={onNewTab} title="New file">
          +
        </button>
      </div>
    </div>
  );
};

export default TabBar;