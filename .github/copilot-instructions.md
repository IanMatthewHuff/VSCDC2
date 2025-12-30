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

## Documentation

- **Keep DESIGN.md files current** — When making design decisions during implementation, update the relevant DESIGN.md file(s)
- Update the root `DESIGN.md` for architectural or cross-cutting decisions
- Update package-level `DESIGN.md` files for package-specific design choices
- Document the "why" behind decisions, not just the "what"

<instructions>
<instruction>
<description>Read this file to understand the overall project architecture, design decisions, and component boundaries for the VS Code Roguelike project. Load when working on cross-cutting concerns or architectural decisions.</description>
<file>DESIGN.md</file>
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
