// src/components/LiveMarkdownEditor.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import type { Range, Editor } from "@tiptap/core"; // Import Node type
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
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
        codeBlock: {
          /* Using StarterKit's default codeBlock */
        },
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
      TaskList,
      TaskItem.configure({ nested: true }),
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
      if (typeof (currentEditor as any).getMarkdown === "function") {
        newMarkdown = (currentEditor as any).getMarkdown();
      } else if (
        currentEditor.storage &&
        typeof currentEditor.storage.markdown?.getMarkdown === "function"
      ) {
        newMarkdown = currentEditor.storage.markdown.getMarkdown();
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
      if (typeof (tiptapEditor as any).getMarkdown === "function") {
        currentEditorMarkdown = (tiptapEditor as any).getMarkdown();
      } else if (
        tiptapEditor.storage &&
        typeof tiptapEditor.storage.markdown?.getMarkdown === "function"
      ) {
        currentEditorMarkdown = tiptapEditor.storage.markdown.getMarkdown();
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
        currentEditor.chain().focus().deleteRange(slashMenuRange).run(); // Delete trigger text
        item.command({ editor: currentEditor, range: slashMenuRange }); // Execute command
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
    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
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
      {isSlashMenuOpen && slashMenuPosition && slashMenuProps && (
        <div
          style={{
            position: "fixed",
            top: `${slashMenuPosition.top + slashMenuPosition.height + 2}px`,
            left: `${slashMenuPosition.left}px`,
            zIndex: 100,
          }}
        >
          <SlashCommandMenu ref={slashCommandMenuRef} {...slashMenuProps} />
        </div>
      )}
      {/* Placeholder for TableControlBar - will be added next */}
      {/* {isTableControlBarVisible && tableControlBarPosition && tiptapEditor && (
        <TableControlBar editor={tiptapEditor} position={tableControlBarPosition} />
      )} */}
    </>
  );
};

export default LiveMarkdownEditor;
