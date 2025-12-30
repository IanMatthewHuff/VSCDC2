# Copilot Instructions for Engine Package

> These instructions extend the repository-level rules in `/.github/copilot-instructions.md`. Read those first.

## Package Purpose

The **Core Engine** (`@vscdc/engine`) is a reusable turn-based roguelike engine. It provides the foundational systems that any roguelike game could use.

## Package-Specific Constraints

### Import Restrictions
- **Never import from `@vscdc/game`** — the engine must not depend on game-specific content
- **Never import VS Code APIs** — this package must remain UI-agnostic
- **No browser or Node.js specific APIs** unless absolutely necessary and clearly documented

### Design Principles
- All code must be **game-agnostic** — no hardcoded game content, items, or entity types
- Expose **extension points** (interfaces, abstract classes, callbacks) for game-specific behavior
- Prefer **pure functions** where possible for easier testing
- Entity-Component-System (ECS) patterns are preferred for game object management

### What Belongs Here
- Turn scheduling and action systems
- Map/grid data structures and algorithms (FOV, pathfinding)
- Entity management and component systems
- Event/message bus infrastructure
- Save/load serialization framework
- RNG utilities

### What Does NOT Belong Here
- Specific monster types, items, or abilities
- UI rendering code
- VS Code extension APIs
- Game balance numbers or content data

### Documentation
- **Update `DESIGN.md`** when making design decisions — document new systems, API changes, or architectural choices
- For decisions affecting the whole project, also update the root `DESIGN.md`

<instructions>
<instruction>
<description>Read this file to understand the engine package's internal architecture, systems, and API design when working on engine code.</description>
<file>DESIGN.md</file>
</instruction>
</instructions>
