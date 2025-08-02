// src/editor/extensions/textTaskList.ts
import { mergeAttributes, Node } from '@tiptap/core'

export interface TextTaskListOptions {
  itemTypeName: string
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    textTaskList: {
      /**
       * Toggle a task list
       */
      toggleTextTaskList: () => ReturnType
    }
  }
}

export const TextTaskList = Node.create<TextTaskListOptions>({
  name: 'textTaskList',

  addOptions() {
    return {
      itemTypeName: 'textTaskItem',
      HTMLAttributes: {},
    }
  },

  group: 'block list',

  content() {
    return `${this.options.itemTypeName}+`
  },

  parseHTML() {
    return [
      {
        tag: `ul[data-type="${this.name}"]`,
        priority: 51,
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'ul',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': this.name,
      }),
      0,
    ]
  },

  addCommands() {
    return {
      toggleTextTaskList: () => ({ commands, editor }) => {
        if (editor.isActive(this.name)) {
          return commands.liftListItem(this.options.itemTypeName)
        }

        return commands.wrapInList(this.name)
      },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-9': () => this.editor.commands.toggleTextTaskList(),
    }
  },
})