# Copilot Instructions for VS Code Roguelike Project

## Code Style

### Functions
- Prefer **small, focused functions** with well-defined inputs and outputs
- Functions should have clear, descriptive names that indicate their purpose
- Avoid large monolithic functions—break them down into smaller, testable units
- Anonymous/unnamed functions are acceptable for one-off callbacks, but use sparingly

### Comments
- **Public functions**: Always include a comment describing purpose, parameters, and return value
- **Complex logic**: Comment on interesting or non-obvious code sections
- **Section headers**: Use comments to delineate broader sections of code
- **Self-explanatory code**: No comments needed—the code should speak for itself
- Don't over-comment; prefer clear naming over excessive documentation

## Testing

- **Unit tests are required** as features are implemented
- Write tests alongside new code, not as an afterthought
- Small, well-defined functions make testing easier—design for testability

## Dependencies

- Keep the dependency list **minimal and intentional**
- **Always ask before adding a new dependency**—don't just add packages
- Prefer built-in/standard library solutions when reasonable
- If a dependency is needed, justify why it's the right choice

## TypeScript

- **Strict mode enabled**—all strict checking options should be on
- Keep the codebase clean: no `any` types unless absolutely necessary
- Use proper typing for function parameters and return values
- Fix type errors as they arise; don't accumulate technical debt

## Architecture

This project has three distinct components (see DESIGN.md):
1. **Core Engine** — No UI code, no game-specific logic
2. **Game Content** — Game-specific data and rules, no UI code
3. **VS Code Extension** — UI layer only, delegates to engine

Respect these boundaries when adding code.

## Web Extension Compatibility

This extension runs in **both VS Code Desktop and VS Code for the Web** (vscode.dev, github.dev). All code must remain web-compatible.

### Prohibited APIs
Do **not** use Node.js-specific APIs anywhere in the codebase:
- `fs` / `fs/promises` — Use `vscode.workspace.fs` instead
- `path` — Use `vscode.Uri` utilities or simple string manipulation
- `child_process` — Not available in web
- `os` — Not available in web
- `net` / `http` / `https` — Use the Fetch API if network access is needed
- `crypto` (Node version) — Use Web Crypto API
- `Buffer` — Use `Uint8Array` or `TextEncoder`/`TextDecoder`
- `process` — Limited availability; avoid relying on it
- `__dirname` / `__filename` — Use `context.extensionUri` instead

### Best Practices
- Use VS Code's `vscode.workspace.fs` API for any file operations
- Use `vscode.Uri` for path manipulation
- Prefer browser-compatible npm packages (check for "browser" field in package.json)
- Test changes in both desktop and web environments
- See [VS Code Web Extensions Guide](https://code.visualstudio.com/api/extension-guides/web-extensions) for details

## Documentation

- **Keep DESIGN.md files current** — When making design decisions during implementation, update the relevant DESIGN.md file(s)
- Update the root `DESIGN.md` for architectural or cross-cutting decisions
- Update package-level `DESIGN.md` files for package-specific design choices
- Document the "why" behind decisions, not just the "what"

## Roadmap & Planned Work

- **Consult `ROADMAP.md`** (at the repo root) before starting a new feature — it tracks candidate features, in-progress work, and shipped items, with pros/cons for each candidate.
- When the user asks "what should we build next?" or for feature ideas, **read `ROADMAP.md` first** and ground suggestions in its candidate list rather than inventing new ones from scratch.
- When a roadmap candidate is picked up, move it from "Candidate Features" to "In Progress" (link the tracking issue/PR). When it ships, move it to "Shipped" with a one-line summary and PR link.
- When new ideas come up mid-task that are out of scope, add them to "Candidate Features" with brief pros/cons so future contributors have context.
- Keep `ROADMAP.md` in sync with the `Planned` / `Implementation Status` sections of the package `DESIGN.md` files.

<instructions>
<instruction>
<description>Read this file to understand the overall project architecture, design decisions, and component boundaries for the VS Code Roguelike project. Load when working on cross-cutting concerns or architectural decisions.</description>
<file>DESIGN.md</file>
</instruction>
<instruction>
<description>Read this file when planning new features or answering questions about what to build next. It tracks candidate features (with pros/cons), in-progress work, and shipped items. Always check here before proposing new feature ideas.</description>
<file>ROADMAP.md</file>
</instruction>
<instruction>
<description>Read when working on the engine package to understand core systems, API design, and engine internals.</description>
<file>packages/engine/DESIGN.md</file>
</instruction>
<instruction>
<description>Read when working on the game content package to understand entity definitions, content formats, and game rules.</description>
<file>packages/game/DESIGN.md</file>
</instruction>
<instruction>
<description>Read when working on the VS Code extension to understand UI bindings, VS Code API usage, and rendering approach.</description>
<file>packages/extension/DESIGN.md</file>
</instruction>
</instructions>
