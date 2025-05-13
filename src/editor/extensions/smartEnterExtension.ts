// src/editor/extensions/SmartEnterExtension.ts
import { Extension } from "@tiptap/core";
import type { Editor } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state"; // Import TextSelection

export const SmartEnterExtension = Extension.create({
  name: "smartEnter", // Renamed extension

  addKeyboardShortcuts() {
    return {
      // Handle 'Enter' key press
      Enter: () => {
        const editor = this.editor as Editor; // Get the editor instance

        // Get current selection and state
        const { state } = editor;
        const { selection } = state;
        const { $head, empty } = selection;

        // If text is selected (not just a cursor), let default behavior handle it
        if (!empty) {
          console.log("[SmartEnter] Text selected, default Enter behavior.");
          return false;
        }

        // If the cursor is within a code_block, let the default Enter behavior take over.
        if ($head.parent.type.name === "codeBlock") {
          console.log("[SmartEnter] In code block, default Enter behavior.");
          return false;
        }

        // Check if the cursor is at the very end of the current block node's content
        const isAtEndOfBlock = $head.parentOffset === $head.parent.content.size;

        if (isAtEndOfBlock) {
          // Check if this block is the last child of the document
          const isLastChildInDocument = $head.parent === state.doc.lastChild;

          if (isLastChildInDocument) {
            console.log(
              "[SmartEnter] At end of last block. Appending new paragraph."
            );
            return editor
              .chain()
              .focus()
              .command(({ tr, dispatch }) => {
                if (dispatch) {
                  const paragraphNode =
                    state.schema.nodes.paragraph.createAndFill();
                  if (paragraphNode) {
                    const insertPosition = $head.after($head.depth);
                    tr.insert(insertPosition, paragraphNode);
                    const newSelectionPosition = tr.doc.resolve(
                      insertPosition + 1
                    );
                    tr.setSelection(TextSelection.near(newSelectionPosition));
                    return true;
                  }
                }
                return false;
              })
              .run();
          }
          // If at the end of a block, but not the last block in the document,
          // the default behavior of splitBlock().setParagraph() below is fine.
          console.log(
            "[SmartEnter] At end of a block (not last). Splitting and setting paragraph."
          );
        } else {
          console.log(
            "[SmartEnter] In middle of a block. Splitting and setting paragraph."
          );
        }

        // For all other cases (cursor in the middle of a block, or at the end of a block
        // that is not the last in the document):
        return editor.chain().focus().splitBlock().setParagraph().run();
      },
    };
  },
});
