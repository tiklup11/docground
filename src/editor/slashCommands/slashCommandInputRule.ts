// src/editor/slashCommands/slashCommandInputRule.ts
import { InputRule, InputRuleFinder, Extension } from "@tiptap/core";
import type { Editor, Range } from "@tiptap/core";

// Define the type for the callback that the input rule will trigger
export type SlashCommandActivationProps = {
  editor: Editor;
  query: string;
  range: Range; // TipTap's Range type
  text: string; // The full text matched by the regex
  position: { top: number; left: number; height: number }; // Position for the menu
};

export type SlashCommandActivationHandler = (
  props: SlashCommandActivationProps
) => void;

// Define options for our custom extension
export interface SlashCommandExtensionOptions {
  onActivate: SlashCommandActivationHandler;
  // We could add regex or other configurations here if needed later
}

/**
 * Creates an InputRule for activating the slash command menu.
 * This function will be called by our custom TipTap extension's addInputRules hook.
 * @param onActivate - Callback function to execute when the rule matches.
 * @param editor - The TipTap editor instance.
 */
function createInternalSlashCommandInputRule(
  onActivate: SlashCommandActivationHandler,
  editor: Editor // Accept editor instance as an argument
): InputRule {
  const slashCommandRegex: InputRuleFinder = /(?:^|\s)\/([\w]*)$/;

  return new InputRule({
    find: slashCommandRegex,
    // The handler's props do not include 'editor' directly.
    // We use the 'editor' instance passed to createInternalSlashCommandInputRule.
    handler: ({ state, range, match }) => {
      const query = match[1] || ""; // The captured query (text after '/')
      const textMatched = match[0]; // The full matched text (e.g., " /query" or "/query")

      // Calculate the start position of the actual "/query" part, excluding the leading space if present
      let triggerStartPosition = range.from;
      if (textMatched.startsWith(" /")) {
        triggerStartPosition = range.from + 1; // Adjust if there's a leading space
      }

      const triggerRange = {
        from: triggerStartPosition,
        to: range.to,
      };

      const { from } = state.selection;
      // Use the editor instance passed into this function's scope
      const coords = editor.view.coordsAtPos(from);

      onActivate({
        editor, // Pass the editor instance
        query,
        range: triggerRange,
        text: textMatched.trimStart(),
        position: {
          top: coords.bottom,
          left: coords.left,
          height: coords.bottom - coords.top,
        },
      });
    },
  });
}

// Create the custom TipTap Extension
export const SlashCommandExtension =
  Extension.create<SlashCommandExtensionOptions>({
    name: "slashCommand", // Unique name for the extension

    // Default options for the extension
    addOptions() {
      return {
        onActivate: (props: SlashCommandActivationProps) => {
          // Default empty handler
          console.warn(
            "SlashCommandExtension: onActivate handler not provided!",
            props
          );
        },
      };
    },

    // Use addInputRules to add input rules
    addInputRules() {
      // `this.options` refers to the options passed when configuring the extension
      // `this.editor` refers to the current editor instance within an extension method
      const onActivateHandler = this.options.onActivate;

      return [
        // This method must return an array of InputRule instances
        // Pass `this.editor` to the function that creates the InputRule
        createInternalSlashCommandInputRule(onActivateHandler, this.editor),
      ];
    },
  });
