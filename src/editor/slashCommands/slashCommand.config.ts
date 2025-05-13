// src/editor/slashCommands/slashCommand.config.ts
import { Editor, Range } from "@tiptap/core";
import type { SuggestionProps } from "@tiptap/suggestion";
import { JSX } from "react";

// Define the structure for a command item
export interface SlashCommandItem {
  id: string;
  title: string;
  aliases?: string[];
  description?: string;
  icon?: JSX.Element;
  command: ({ editor, range }: { editor: Editor; range: Range }) => void;
}

// This type defines the props our SlashCommandMenu component will receive.
export interface SlashCommandMenuComponentProps
  extends SuggestionProps<SlashCommandItem> {
  onClose: () => void; // Callback to signal the menu should be closed
}

// Define our initial set of slash commands
export const slashCommands: SlashCommandItem[] = [
  {
    id: "heading1",
    title: "Heading 1",
    aliases: ["h1"],
    description: "Large section heading",
    command: ({ editor }) => {
      editor.chain().focus().setNode("heading", { level: 1 }).run();
    },
  },
  {
    id: "heading2",
    title: "Heading 2",
    aliases: ["h2"],
    description: "Medium section heading",
    command: ({ editor }) => {
      editor.chain().focus().setNode("heading", { level: 2 }).run();
    },
  },
  {
    id: "heading3",
    title: "Heading 3",
    aliases: ["h3"],
    description: "Small section heading",
    command: ({ editor }) => {
      editor.chain().focus().setNode("heading", { level: 3 }).run();
    },
  },
  {
    id: "bulletList",
    title: "Bulleted list",
    aliases: ["ul", "list"],
    description: "Create a simple bulleted list",
    command: ({ editor }) => {
      editor.chain().focus().toggleBulletList().run();
    },
  },
  {
    id: "numberedList",
    title: "Numbered list",
    aliases: ["ol"],
    description: "Create a list with numbering",
    command: ({ editor }) => {
      editor.chain().focus().toggleOrderedList().run();
    },
  },
  {
    id: "taskList",
    title: "Task list",
    aliases: ["todo", "task"],
    description: "Track tasks with a checklist",
    command: ({ editor }) => {
      editor.chain().focus().toggleTaskList().run();
    },
  },
  {
    id: "blockquote",
    title: "Blockquote",
    aliases: ["quote"],
    description: "Capture a quote",
    command: ({ editor }) => {
      editor.chain().focus().toggleBlockquote().run();
    },
  },
  {
    id: "codeBlock",
    title: "Code block",
    aliases: ["code"],
    description: "Capture a code snippet",
    command: ({ editor }) => {
      editor.chain().focus().toggleCodeBlock().run();
    },
  },
  {
    id: "horizontalRule",
    title: "Horizontal rule",
    aliases: ["hr", "divider"],
    description: "Visually divide sections",
    command: ({ editor }) => {
      editor.chain().focus().setHorizontalRule().run();
    },
  },
  {
    id: "table",
    title: "Table",
    aliases: ["tbl"],
    description: "Create a simple table",
    command: ({ editor, range }) => {
      // Keep range here as insertTable might benefit from it or for consistency
      editor
        .chain()
        .focus()
        // .deleteRange(range) // Deletion is now handled by LiveMarkdownEditor.tsx before this command
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        // .focus() // insertTable usually handles focus
        .run();
    },
  },
  {
    id: "paragraph",
    title: "Paragraph",
    aliases: ["p", "text"],
    description: "Plain text",
    command: ({ editor }) => {
      editor.chain().focus().setParagraph().run();
    },
  },
];
