# Copilot Instructions for Game Package

> These instructions extend the repository-level rules in `/.github/copilot-instructions.md`. Read those first.

## Package Purpose

The **Game Content** package (`@vscdc/game`) contains all game-specific data, entities, and rules. This is where the actual roguelike game is defined.

## Package-Specific Constraints

### Import Restrictions
- **Never import VS Code APIs** — this package must remain UI-agnostic
- **Only import from `@vscdc/engine`** for engine types and utilities
- **No browser or Node.js specific APIs** unless absolutely necessary

### Design Principles
- All game content should be **data-driven** where possible
- Use engine extension points rather than modifying engine code
- Keep game logic **testable** without requiring UI
- Separate content definitions from behavior logic

### What Belongs Here
- Entity definitions (monsters, NPCs, player classes)
- Item definitions and effects
- Ability/spell definitions
- Map generation parameters and dungeon themes
- Game balance numbers and progression curves
- Game-specific rules and win/lose conditions
- Content factories that create engine entities

### What Does NOT Belong Here
- UI rendering code
- VS Code extension APIs
- Core engine algorithms (those go in `@vscdc/engine`)
- Input handling or display logic
