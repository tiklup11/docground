// src/editor/extensions/customCodeBlockExtension.ts
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { CustomCodeBlockComponent } from './customCodeBlock';

export const CustomCodeBlockExtension = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CustomCodeBlockComponent);
  },
});