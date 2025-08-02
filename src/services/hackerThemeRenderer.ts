// src/services/hackerThemeRenderer.ts
import { Marked } from "marked";
import type { MarkedExtension } from "marked";
import DOMPurify from "dompurify";

// Define the options for the Marked instance
// No custom renderer is used here; we rely on default Marked rendering.
const markedOptions: MarkedExtension = {
  gfm: true, // Enable GitHub Flavored Markdown (tables, strikethrough, task lists etc.)
  pedantic: false, // Don't be too strict to original markdown.pl.
  breaks: false, // Don't convert single line breaks to <br>. GFM handles this.
  // No 'sanitize', 'headerIds', or 'headerPrefix' here as they are handled by gfm or deprecated.
  // Marked will use its default renderer.
};

// Create the Marked instance with the defined options
const markedInstance = new Marked(markedOptions);

export const hackerThemeRenderer = {
  render: (markdown: string): string => {
    try {
      const rawHtml = markedInstance.parse(markdown) as string;

      // Sanitize HTML to prevent XSS attacks
      return DOMPurify.sanitize(rawHtml);
    } catch (error) {
      console.error("Error parsing Markdown:", error);
      return "<p>Error rendering Markdown.</p>";
    }
  },
};
