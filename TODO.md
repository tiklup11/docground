# TODO: TipTap Markdown Editor Improvements

## 🚨 CRITICAL ISSUES (Fix Immediately)

### Security Vulnerabilities
- [x] **XSS Vulnerability in Markdown Renderer** 
  - **File:** `src/services/hackerThemeRenderer.ts:29`
  - **Issue:** Raw HTML output without sanitization: `return rawHtml;`
  - **Impact:** Code injection attacks possible
  - **Fix:** ✅ Implemented DOMPurify sanitization before returning HTML

- [ ] **Unsafe HTML Configuration** 
  - **File:** `src/components/liveMarkdown/editor.tsx:103`
  - **Issue:** `html: true` allows raw HTML in markdown
  - **Fix:** Set to `false` or implement proper sanitization pipeline

### Build-Breaking Issues
- [x] **TypeScript Error - Unused Parameter**
  - **File:** `src/editor/slashCommands/slashCommand.config.ts:110`
  - **Issue:** `'range' is declared but never used` causing build failure
  - **Fix:** ✅ Removed unused parameter from table slash command

- [ ] **TypeScript `any` Types Breaking Type Safety**
  - **File:** `src/components/liveMarkdown/editor.tsx:179, 180, 227, 228`
  - **Issue:** `Unexpected any. Specify a different type`
  - **Fix:** Define proper interfaces for TipTap markdown methods

## 🔥 HIGH PRIORITY FIXES

### UI/UX Critical Issues
- [x] **Fix Checkbox Rendering (User Request)**
  - **Current:** HTML checkboxes `<input type="checkbox">`
  - **Requested:** Text-based format `[ ]` and `[x]`
  - **Files:** TaskItem configuration and CSS styling
  - **Fix:** ✅ Created custom TextTaskItem extension with text-based checkboxes

- [ ] **Slash Menu Persistence Bug**
  - **File:** `src/doc/doc.md:6` (documented issue)
  - **Issue:** Slash "/" remains visible after selecting menu item
  - **Fix:** Ensure proper cleanup of trigger text after command execution

- [ ] **Editor Unusable Padding**
  - **File:** `src/App.css:49`
  - **Issue:** Extreme horizontal padding (325px) making editor narrow
  - **Fix:** Reduce to reasonable padding (20-40px)

### Architecture Issues
- [ ] **React Hook Dependency Warning**
  - **File:** `src/editor/slashCommands/slashCommandMenu.tsx:79`
  - **Issue:** Missing dependency 'props' in useEffect
  - **Fix:** Destructure props or fix dependency array

- [ ] **Unused SmartEnterExtension**
  - **File:** `src/editor/extensions/smartEnterExtension.ts`
  - **Issue:** Extension created but never imported/used
  - **Fix:** Either integrate into editor or remove file

## 📋 MEDIUM PRIORITY IMPROVEMENTS

### Code Quality
- [ ] **Remove Dead Code**
  - **File:** `src/main.tsx:14-28`
  - **Issue:** Commented HTML template code
  - **Fix:** Clean up unused code

- [ ] **Fix CSS Architecture**
  - **Files:** `src/App.css` and `src/components/liveMarkdown/styles.css`
  - **Issue:** Overlapping and conflicting `.ProseMirror` styles
  - **Fix:** Consolidate into single CSS file with proper organization

- [ ] **Complete Table Implementation**
  - **Issue:** Table extensions imported but no table controls UI
  - **Missing:** Add/delete rows/columns functionality
  - **Fix:** Implement table control bar as commented in editor.tsx:331-334

### Performance & Memory
- [ ] **Fix Memory Leaks**
  - **File:** `src/components/liveMarkdown/editor.tsx`
  - **Issue:** Event listeners not properly cleaned up
  - **Fix:** Add proper cleanup in useEffect returns

- [ ] **Add Auto-save Functionality**
  - **Issue:** No persistence of editor content
  - **Fix:** Implement localStorage or IndexedDB persistence

## 🚀 NOTION-LIKE FEATURES TO ADD

### Block-Level Operations
- [ ] **Block Selection System**
  - Add visual block handles for selection
  - Implement multi-block selection
  - Add block-level keyboard shortcuts

- [ ] **Drag & Drop Reordering**
  - Add drag handles to blocks
  - Implement drag & drop for reordering content
  - Add visual feedback during drag operations

- [ ] **Block Duplication**
  - Add duplicate block functionality
  - Implement copy/paste for blocks
  - Add block templates

### Advanced Formatting
- [ ] **Code Syntax Highlighting**
  - **File:** `src/components/liveMarkdown/editor.tsx:25`
  - **Issue:** Lowlight imported but not properly configured
  - **Fix:** Configure CodeBlockLowlight extension with language support

- [ ] **Callouts/Admonitions**
  - Add callout block types (info, warning, error, success)
  - Implement callout slash commands
  - Style callouts with proper colors and icons

- [ ] **Enhanced Lists**
  - Add toggle lists (collapsible)
  - Implement nested task lists with progress
  - Add different bullet styles

- [ ] **Inline Enhancements**
  - Add inline math/LaTeX support
  - Implement mention system (@username)
  - Add emoji picker functionality
  - Support for inline code with language hints

### Content Organization
- [ ] **Search Functionality**
  - Add full-text search across content
  - Implement search highlighting
  - Add search keyboard shortcuts

- [ ] **Table of Contents**
  - Auto-generate TOC from headings
  - Add floating TOC navigation
  - Implement heading anchor links

- [ ] **Tagging System**
  - Add #tags support
  - Implement tag-based filtering
  - Add tag autocomplete

### User Experience
- [ ] **Export Options**
  - Add PDF export functionality
  - Implement Markdown export
  - Add HTML export with styling

- [ ] **Theme System**
  - Add dark/light theme toggle
  - Implement proper GitHub Pages hacker theme
  - Add theme persistence

- [ ] **Keyboard Shortcuts**
  - Add comprehensive keyboard shortcut system
  - Implement vim-like navigation (optional)
  - Add shortcut help overlay

## 🛠️ TECHNICAL DEBT & POLISH

### Accessibility
- [ ] **ARIA Labels & Screen Reader Support**
  - Add proper ARIA attributes to slash menu
  - Implement keyboard navigation for all features
  - Add focus management and indicators

- [ ] **Focus Management**
  - Add focus trap in slash menu
  - Implement proper focus indicators
  - Add skip links for navigation

### Bundle Optimization
- [ ] **Dependency Cleanup**
  - Remove unused dependencies from package.json
  - Implement tree-shaking optimization
  - Add code splitting for better performance

### Testing & Documentation
- [ ] **Add Test Framework**
  - Set up Jest/Vitest for unit testing
  - Add component testing for editor
  - Implement E2E tests for critical paths

- [ ] **Documentation**
  - Add comprehensive README
  - Document keyboard shortcuts
  - Add development setup guide

## 📝 NOTES

- **Priority Order:** Address Critical → High → Medium → Features → Polish
- **Testing:** Each fix should be tested before moving to next item
- **User Feedback:** Checkbox text format is specifically requested by user
- **Performance:** Consider lazy loading for advanced features
- **Accessibility:** Keep screen reader users in mind for all UI changes