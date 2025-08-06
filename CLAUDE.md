# [CLAUDE.md](http://CLAUDE.md)

This is docground live testing. \
This file provides guidance to Claude Code ([claude.ai/code](http://claude.ai/code)) when working with code in this repository.

A

<table style="min-width: 75px">
<colgroup><col style="min-width: 25px"><col style="min-width: 25px"><col style="min-width: 25px"></colgroup><tbody><tr><th colspan="1" rowspan="1"><p>api</p></th><th colspan="1" rowspan="1"><p>req body</p></th><th colspan="1" rowspan="1"><p>response body</p></th></tr><tr><td colspan="1" rowspan="1"><p>GET /users/v1</p></td><td colspan="1" rowspan="1"><pre class="hljs"><code class="language-javascript">{
    "user":"usr_id"
}</code></pre></td><td colspan="1" rowspan="1"><pre class="hljs"><code class="language-javascript">{
   success:true
}</code></pre><p></p></td></tr><tr><td colspan="1" rowspan="1"><p></p></td><td colspan="1" rowspan="1"><p></p></td><td colspan="1" rowspan="1"><p></p></td></tr></tbody>
</table>

## Development Commands

- `npm run dev` - Start development server with Vite HMR
- `npm run build` - Build for production (runs TypeScript compiler then Vite build)
- `npm run lint` - Run ESLint on the codebase
- `npm run preview` - Preview production build locally

## Architecture Overview

This is a React + TypeScript application built with Vite that implements a live markdown editor using TipTap. The core architecture centers around:

**Main Editor Component**: `src/components/liveMarkdown/editor.tsx` - The primary TipTap-based markdown editor with real-time rendering, slash commands, and table support.

**Slash Command System**: Located in `src/editor/slashCommands/`, this provides an extensible command palette triggered by typing "/" in the editor. Commands are configured in `slashCommand.config.ts` and include headings, lists, tables, code blocks, etc.

**TipTap Extensions**: The editor uses multiple TipTap extensions including StarterKit, Markdown serialization, Placeholder, TaskList/TaskItem, and Table extensions for rich editing features.

**State Management**: Simple React state in `App.tsx` manages the markdown content as the single source of truth, with the TipTap editor updating this state on changes.

**Theming**: Uses a custom "hacker theme" CSS (`src/hacker-theme.css`) with additional TipTap-specific styles in `src/App.css`.

## Key Implementation Details

- The editor serializes to/from markdown using the `tiptap-markdown` extension
- Slash commands are activated by typing "/" and filtered by query
- Smart Enter extension (`src/editor/extensions/smartEnterExtension.ts`) handles intelligent paragraph creation
- Table functionality is implemented but table control bar is planned (commented out in editor)
- No test framework is currently configured in this project

## File Structure

- `/src/components/liveMarkdown/` - Main editor component and styles
- `/src/editor/` - TipTap extensions and slash command system
- `/src/services/` - Utility services (theme renderer)
- `/src/doc/` - Documentation content