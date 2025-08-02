// src/components/LiveMarkdownEditor.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import type { Range, Editor } from "@tiptap/core"; // Import Node type

import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import { createLowlight } from 'lowlight';
import { inputRules, textblockTypeInputRule, Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { CustomCodeBlockExtension } from '../../editor/extensions/customCodeBlockExtension';

// Import common languages for syntax highlighting
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import css from 'highlight.js/lib/languages/css';
import html from 'highlight.js/lib/languages/xml';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';

// Create lowlight instance
const lowlight = createLowlight();

// Register languages
lowlight.register('javascript', javascript);
lowlight.register('js', javascript);
lowlight.register('typescript', typescript);
lowlight.register('ts', typescript);
lowlight.register('python', python);
lowlight.register('py', python);
lowlight.register('css', css);
lowlight.register('html', html);
lowlight.register('xml', html);
lowlight.register('json', json);
lowlight.register('bash', bash);
lowlight.register('sh', bash);

// Custom extension for immediate codeblock trigger
const InstantCodeBlock = Extension.create({
  name: 'instantCodeBlock',
  
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('instantCodeBlock'),
        appendTransaction(transactions, oldState, newState) {
          const tr = newState.tr;
          let modified = false;
          
          transactions.forEach(transaction => {
            if (!transaction.docChanged) return;
            
            transaction.steps.forEach(step => {
              if (step.jsonID === 'replace' || step.jsonID === 'replaceAround') {
                const { from, to } = step as any;
                const insertedText = step.slice?.content?.textBetween(0, step.slice.content.size) || '';
                
                // Check if we just typed the third backtick
                if (insertedText === '`') {
                  const textBefore = newState.doc.textBetween(Math.max(0, from - 2), from);
                  if (textBefore === '``') {
                    // We have ```, convert to codeblock
                    const codeBlockType = newState.schema.nodes.codeBlock;
                    if (codeBlockType) {
                      tr.delete(from - 2, from + 1);
                      tr.setBlockType(from - 2, from - 2, codeBlockType);
                      modified = true;
                    }
                  }
                }
              }
            });
          });
          
          return modified ? tr : null;
        },
      }),
    ];
  },
});

import { TextTaskList } from "../../editor/extensions/textTaskList";
import { TextTaskItem } from "../../editor/extensions/textTaskItem";
import {
  SlashCommandItem,
  slashCommands,
  SlashCommandMenuComponentProps,
} from "../../editor/slashCommands/slashCommand.config";
import {
  SlashCommandActivationProps,
  SlashCommandExtension,
} from "../../editor/slashCommands/slashCommandInputRule";
import SlashCommandMenu, {
  SlashCommandMenuRef,
} from "../../editor/slashCommands/slashCommandMenu";
import "./styles.css";

// Table Extension Imports
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";

// Slash Command Imports

// Define interface for Editor with markdown capabilities
interface EditorWithMarkdown extends Editor {
  getMarkdown?: () => string;
  storage: {
    markdown?: {
      getMarkdown: () => string;
    };
  } & Editor['storage'];
}

interface LiveMarkdownEditorProps {
  initialContent: string;
  onUpdate: (markdown: string) => void;
}

const LiveMarkdownEditor: React.FC<LiveMarkdownEditorProps> = ({
  initialContent,
  onUpdate,
}) => {
  const slashCommandMenuRef = useRef<SlashCommandMenuRef>(null);
  const editorRef = useRef<Editor | null>(null);
  const slashMenuContainerRef = useRef<HTMLDivElement>(null);

  const [isSlashMenuOpen, setIsSlashMenuOpen] = useState(false);
  const [slashMenuQuery, setSlashMenuQuery] = useState("");
  const [slashMenuRange, setSlashMenuRange] = useState<Range | null>(null);
  const [slashMenuPosition, setSlashMenuPosition] = useState<{
    top: number;
    left: number;
    height: number;
  } | null>(null);
  const [slashMenuItems, setSlashMenuItems] = useState<SlashCommandItem[]>([]);

  // State for TableControlBar (will be added later)
  // const [isTableControlBarVisible, setIsTableControlBarVisible] = useState(false);
  // const [tableControlBarPosition, setTableControlBarPosition] = useState<{ top: number; left: number; width?: number } | null>(null);

  const isSlashMenuOpenRef = useRef(isSlashMenuOpen);
  useEffect(() => {
    isSlashMenuOpenRef.current = isSlashMenuOpen;
  }, [isSlashMenuOpen]);

  const openSlashMenu = useCallback((props: SlashCommandActivationProps) => {
    setIsSlashMenuOpen(true);
    setSlashMenuQuery(props.query);
    setSlashMenuRange(props.range);
    setSlashMenuPosition(props.position);
    const filtered = slashCommands
      .filter(
        (item) =>
          item.title.toLowerCase().includes(props.query.toLowerCase()) ||
          item.aliases?.some((alias) =>
            alias.toLowerCase().includes(props.query.toLowerCase())
          )
      )
      .slice(0, 10);
    setSlashMenuItems(filtered);
  }, []);

  const closeSlashMenuAndFocusEditor = useCallback(() => {
    if (!isSlashMenuOpenRef.current) return;
    setIsSlashMenuOpen(false);
    setSlashMenuQuery("");
    setSlashMenuRange(null);
    setSlashMenuPosition(null);
    setSlashMenuItems([]);
    setTimeout(() => {
      editorRef.current?.commands.focus();
    }, 0);
  }, []);

  const tiptapEditor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        codeBlock: false, // Disable StarterKit's basic codeBlock
        // StarterKit includes paragraph, text, bold, italic, strike, horizontalRule, etc.
        // It also includes BulletList, OrderedList, ListItem by default.
      }),
      Markdown.configure({
        html: true,
        tightLists: true,
        linkify: true,
        breaks: false,
        transformPastedText: true,
      }),
      Placeholder.configure({
        emptyEditorClass: "is-editor-empty",
        emptyNodeClass: "is-empty",
        placeholder: ({ node, editor, hasAnchor }) => {
          if (editor.isEmpty) {
            return "Type '/' for commands, or just start writing...";
          }
          if (
            node.type.name === "paragraph" &&
            node.content.size === 0 &&
            hasAnchor
          ) {
            return "Type '/' for commands...";
          }
          if (
            node.type.name === "heading" &&
            node.content.size === 0 &&
            hasAnchor
          ) {
            return `Heading ${node.attrs.level}`;
          }
          if (
            node.type.name === "listItem" &&
            node.content.size === 0 &&
            hasAnchor
          ) {
            const firstChild = node.firstChild;
            if (
              firstChild &&
              firstChild.type.name === "paragraph" &&
              firstChild.content.size === 0
            ) {
              return "List item";
            }
          }
          if (
            node.type.name === "blockquote" &&
            node.content.size === 0 &&
            hasAnchor
          ) {
            return "Quote";
          }
          if (
            node.type.name === "codeBlock" &&
            node.content.size === 0 &&
            hasAnchor
          ) {
            return "Code block";
          }
          return "";
        },
        includeChildren: true,
      }),
      Link.configure({
        openOnClick: true, // Allow links to be clicked
        HTMLAttributes: {
          class: 'editor-link',
          target: '_blank', // Open in new tab
          rel: 'noopener noreferrer', // Security attributes
        },
        protocols: ['http', 'https', 'mailto'],
        autolink: true, // Auto-convert URLs to links
        linkOnPaste: true, // Convert URLs in pasted content to links
      }),
      CustomCodeBlockExtension.configure({
        lowlight,
        HTMLAttributes: {
          class: 'hljs', // For syntax highlighting styles
        },
        // Add keyboard shortcuts and input rules
        addKeyboardShortcuts() {
          return {
            'Mod-Alt-c': () => this.editor.commands.toggleCodeBlock(),
          };
        },
        addInputRules() {
          return [
            // Trigger on ``` followed by space
            textblockTypeInputRule({
              find: /^```\s$/,
              type: this.type,
            }),
            // Also try to catch ``` at end of line
            textblockTypeInputRule({
              find: /^```$/,
              type: this.type,
            }),
          ];
        },
      }),
      InstantCodeBlock,
      TextTaskList.configure({
        itemTypeName: 'textTaskItem',
        HTMLAttributes: {
          class: 'text-task-list',
        },
      }),
      TextTaskItem.configure({ 
        nested: true,
        HTMLAttributes: {
          class: 'task-item-text-based',
        },
      }),
      SlashCommandExtension.configure({
        onActivate: openSlashMenu,
      }),
      // Add Table Extensions
      Table.configure({
        resizable: true, // Enable column resizing
        // cellMinWidth: 50, // Optional: set a minimum width for cells
      }),
      TableRow,
      TableHeader, // For <th> cells
      TableCell, // For <td> cells
    ],
    content: initialContent,
    onUpdate: ({ editor: currentEditor }) => {
      let newMarkdown = "";
      const editorWithMarkdown = currentEditor as EditorWithMarkdown;
      if (typeof editorWithMarkdown.getMarkdown === "function") {
        newMarkdown = editorWithMarkdown.getMarkdown();
      } else if (
        editorWithMarkdown.storage &&
        typeof editorWithMarkdown.storage.markdown?.getMarkdown === "function"
      ) {
        newMarkdown = editorWithMarkdown.storage.markdown.getMarkdown();
      }
      onUpdate(newMarkdown);

      // Logic for closing slash menu if trigger text is modified
      if (isSlashMenuOpenRef.current && slashMenuRange && currentEditor) {
        // ... (existing logic)
      }
    },
    // onSelectionUpdate will be used later for the TableControlBar
    // onSelectionUpdate: ({ editor }) => {
    //   if (editor.isActive('table')) {
    //     // Logic to show and position TableControlBar
    //   } else {
    //     // Logic to hide TableControlBar
    //   }
    // },
  });

  useEffect(() => {
    editorRef.current = tiptapEditor;
  }, [tiptapEditor]);

  useEffect(() => {
    if (isSlashMenuOpen) {
      const currentQuery = slashMenuQuery;
      const filtered = slashCommands
        .filter(
          (item) =>
            item.title.toLowerCase().includes(currentQuery.toLowerCase()) ||
            item.aliases?.some((alias) =>
              alias.toLowerCase().includes(currentQuery.toLowerCase())
            )
        )
        .slice(0, 10);
      setSlashMenuItems(filtered);
    }
  }, [slashMenuQuery, isSlashMenuOpen]);

  useEffect(() => {
    if (tiptapEditor) {
      let currentEditorMarkdown = "";
      const editorWithMarkdown = tiptapEditor as EditorWithMarkdown;
      if (typeof editorWithMarkdown.getMarkdown === "function") {
        currentEditorMarkdown = editorWithMarkdown.getMarkdown();
      } else if (
        editorWithMarkdown.storage &&
        typeof editorWithMarkdown.storage.markdown?.getMarkdown === "function"
      ) {
        currentEditorMarkdown = editorWithMarkdown.storage.markdown.getMarkdown();
      }
      if (initialContent !== currentEditorMarkdown) {
        tiptapEditor.commands.setContent(initialContent, true);
      }
    }
  }, [initialContent, tiptapEditor]);

  const handleCommandSelection = useCallback(
    (item: SlashCommandItem) => {
      const currentEditor = editorRef.current;
      if (currentEditor && slashMenuRange) {
        // Ensure we delete the full trigger text including the "/"
        const fullRange = {
          from: slashMenuRange.from,
          to: slashMenuRange.to
        };
        
        // Check if there's a "/" at the start position and include it in deletion
        const textAtRange = currentEditor.state.doc.textBetween(fullRange.from - 1, fullRange.to);
        if (textAtRange.startsWith('/')) {
          fullRange.from = fullRange.from - 1;
        }
        
        currentEditor.chain().focus().deleteRange(fullRange).run(); // Delete trigger text including "/"
        item.command({ editor: currentEditor, range: fullRange }); // Execute command
      }
      closeSlashMenuAndFocusEditor();
    },
    [slashMenuRange, closeSlashMenuAndFocusEditor]
  );

  useEffect(() => {
    if (!isSlashMenuOpen || !tiptapEditor) {
      return;
    }
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isSlashMenuOpenRef.current) {
        return;
      }
      if (slashCommandMenuRef.current?.onKeyDown(event)) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closeSlashMenuAndFocusEditor();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      console.log('Click detected, menu open:', isSlashMenuOpenRef.current);
      if (!isSlashMenuOpenRef.current) {
        return;
      }
      
      const target = event.target as Node;
      console.log('Click target:', target);
      
      // Check if the click target is inside the slash menu container
      let isInsideSlashMenu = false;
      if (slashMenuContainerRef.current && target) {
        isInsideSlashMenu = slashMenuContainerRef.current.contains(target);
      }
      
      console.log('Inside slash menu:', isInsideSlashMenu);
      
      // If click is outside slash menu, close it
      if (!isInsideSlashMenu) {
        console.log('Closing slash menu due to outside click');
        closeSlashMenuAndFocusEditor();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("mousedown", handleClickOutside, true);
    
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("mousedown", handleClickOutside, true);
    };
  }, [isSlashMenuOpen, tiptapEditor, closeSlashMenuAndFocusEditor]);

  if (!tiptapEditor) {
    return <div className="editor-loading">Loading Editor...</div>;
  }

  const currentValidEditor = editorRef.current || tiptapEditor;
  const slashMenuProps: SlashCommandMenuComponentProps | null =
    isSlashMenuOpen && slashMenuPosition && currentValidEditor
      ? {
          editor: currentValidEditor,
          items: slashMenuItems,
          command: handleCommandSelection,
          range: slashMenuRange || { from: 0, to: 0 },
          query: slashMenuQuery,
          text: `/${slashMenuQuery}`,
          decorationNode: null,
          clientRect: () => {
            if (slashMenuPosition) {
              return {
                width: 0,
                height: slashMenuPosition.height,
                top: slashMenuPosition.top,
                bottom: slashMenuPosition.top + slashMenuPosition.height,
                left: slashMenuPosition.left,
                right: slashMenuPosition.left,
                x: slashMenuPosition.left,
                y: slashMenuPosition.top,
                toJSON: () => ({}),
              } as DOMRect;
            }
            return null;
          },
          onClose: closeSlashMenuAndFocusEditor,
        }
      : null;

  return (
    <>
      <EditorContent
        editor={tiptapEditor}
        className="live-editor-tiptap-container"
      />
      {isSlashMenuOpen && slashMenuPosition && slashMenuProps && (() => {
        const menuHeight = 300; // Max height from CSS
        const viewportHeight = window.innerHeight;
        const spaceBelow = viewportHeight - (slashMenuPosition.top + slashMenuPosition.height);
        const spaceAbove = slashMenuPosition.top;
        
        // Calculate optimal position
        const shouldPositionAbove = spaceBelow < menuHeight && spaceAbove > menuHeight;
        const topPosition = shouldPositionAbove
          ? slashMenuPosition.top - menuHeight - 2
          : slashMenuPosition.top + slashMenuPosition.height + 2;
        
        return (
          <div
            ref={slashMenuContainerRef}
            style={{
              position: "fixed",
              top: `${topPosition}px`,
              left: `${slashMenuPosition.left}px`,
              zIndex: 100,
            }}
          >
            <SlashCommandMenu ref={slashCommandMenuRef} {...slashMenuProps} />
          </div>
        );
      })()}
      {/* Placeholder for TableControlBar - will be added next */}
      {/* {isTableControlBarVisible && tableControlBarPosition && tiptapEditor && (
        <TableControlBar editor={tiptapEditor} position={tableControlBarPosition} />
      )} */}
    </>
  );
};

export default LiveMarkdownEditor;
