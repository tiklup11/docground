// src/editor/extensions/textTaskItem.ts
import { mergeAttributes, Node, wrappingInputRule } from '@tiptap/core'

export interface TextTaskItemOptions {
  nested: boolean
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    textTaskItem: {
      /**
       * Toggle a task item
       */
      toggleTextTaskItem: () => ReturnType
    }
  }
}

export const inputRegex = /^\s*(\[([ x])\])\s$/

export const TextTaskItem = Node.create<TextTaskItemOptions>({
  name: 'textTaskItem',

  addOptions() {
    return {
      nested: false,
      HTMLAttributes: {},
    }
  },

  content() {
    return this.options.nested ? 'paragraph block*' : 'paragraph+'
  },

  defining: true,

  addAttributes() {
    return {
      checked: {
        default: false,
        keepOnSplit: false,
        parseHTML: element => element.getAttribute('data-checked') === 'true',
        renderHTML: attributes => ({
          'data-checked': attributes.checked,
        }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: `li[data-type="${this.name}"]`,
        priority: 51,
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    const checked = node.attrs.checked
    
    return [
      'li',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': this.name,
      }),
      [
        'span',
        { class: 'task-checkbox-text' },
        checked ? '[x] ' : '[ ] '
      ],
      [
        'div',
        { class: 'task-content' },
        0
      ]
    ]
  },

  addKeyboardShortcuts() {
    const shortcuts = {
      Enter: () => this.editor.commands.splitListItem(this.name),
      'Shift-Tab': () => this.editor.commands.liftListItem(this.name),
      'Mod-Enter': () => {
        // Toggle the current task item if cursor is in one
        const { state } = this.editor
        const { selection } = state
        const { $head } = selection
        
        // Find the task item node
        for (let depth = $head.depth; depth > 0; depth--) {
          const node = $head.node(depth)
          if (node.type === this.type) {
            const pos = $head.before(depth)
            const tr = state.tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              checked: !node.attrs.checked,
            })
            this.editor.view.dispatch(tr)
            return true
          }
        }
        return false
      },
    }

    if (!this.options.nested) {
      return shortcuts
    }

    return {
      ...shortcuts,
      Tab: () => this.editor.commands.sinkListItem(this.name),
    }
  },

  addNodeView() {
    const nodeType = this.type
    return ({ node, HTMLAttributes, getPos, editor }) => {
      const listItem = document.createElement('li')
      const checkboxSpan = document.createElement('span')
      const contentDiv = document.createElement('div')
      
      // Keep track of current node state
      let currentNode = node

      listItem.dataset.checked = String(node.attrs.checked)
      listItem.dataset.type = this.name
      listItem.style.display = 'flex'
      listItem.style.alignItems = 'flex-start'

      Object.entries(this.options.HTMLAttributes).forEach(([key, value]) => {
        listItem.setAttribute(key, value)
      })
      Object.entries(HTMLAttributes).forEach(([key, value]) => {
        listItem.setAttribute(key, value)
      })

      checkboxSpan.className = 'task-checkbox-text'
      checkboxSpan.textContent = node.attrs.checked ? '[x] ' : '[ ] '
      checkboxSpan.contentEditable = 'false'
      checkboxSpan.style.cursor = 'pointer'
      checkboxSpan.style.userSelect = 'none'
      checkboxSpan.style.marginRight = '0.5em'
      checkboxSpan.style.flexShrink = '0'
      
      checkboxSpan.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        
        if (typeof getPos === 'function') {
          const pos = getPos()
          const currentChecked = currentNode.attrs.checked
          const newChecked = !currentChecked
          
          // Update the editor state
          const transaction = editor.state.tr.setNodeMarkup(pos, undefined, {
            ...currentNode.attrs,
            checked: newChecked,
          })
          
          editor.view.dispatch(transaction)
        }
      })

      contentDiv.className = 'task-content'
      contentDiv.style.flexGrow = '1'
      contentDiv.style.minWidth = '0'

      listItem.append(checkboxSpan, contentDiv)

      return {
        dom: listItem,
        contentDOM: contentDiv,
        update: (updatedNode) => {
          if (updatedNode.type !== nodeType) {
            return false
          }

          // Update the tracked node reference
          currentNode = updatedNode
          listItem.dataset.checked = String(updatedNode.attrs.checked)
          checkboxSpan.textContent = updatedNode.attrs.checked ? '[x] ' : '[ ] '
          return true
        },
      }
    }
  },

  addInputRules() {
    return [
      wrappingInputRule({
        find: inputRegex,
        type: this.type,
        getAttributes: match => ({
          checked: match[2] === 'x',
        }),
      }),
    ]
  },

  addCommands() {
    return {
      toggleTextTaskItem: () => ({ commands }) => {
        return commands.toggleList(this.name, 'paragraph')
      },
    }
  },
})