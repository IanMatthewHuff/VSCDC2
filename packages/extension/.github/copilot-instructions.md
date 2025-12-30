# Copilot Instructions for Extension Package

> These instructions extend the repository-level rules in `/.github/copilot-instructions.md`. Read those first.

## Package Purpose

The **VS Code Extension** package is the UI layer that presents the game to players within VS Code. It handles all rendering, input, and VS Code integration.

## Package-Specific Constraints

### Import Restrictions
- **Import from `@vscdc/engine`** for engine types and game state management
- **Import from `@vscdc/game`** to instantiate game content
- **VS Code APIs are expected and encouraged** in this package

### Design Principles
- This is a **thin UI layer** — delegate all game logic to the engine
- **No game rules or content** should be defined here
- Keep VS Code-specific code isolated from portable display logic where reasonable
- Handle all user input and translate to engine actions

### What Belongs Here
- VS Code extension activation and lifecycle
- Webview panels for game display
- Keyboard/mouse input handling
- Rendering game state to the display
- VS Code commands and keybindings
- Extension settings and configuration UI
- Save/load file dialogs and persistence UI

### What Does NOT Belong Here
- Game rules or mechanics (use `@vscdc/engine`)
- Content definitions like monsters or items (use `@vscdc/game`)
- Core algorithms like pathfinding or FOV (use `@vscdc/engine`)

### VS Code Patterns
- Use `vscode.workspace.fs` for file operations
- Register commands via `vscode.commands.registerCommand`
- Use `Disposable` patterns and clean up in `deactivate()`
- Prefer webview panels over custom editors for the game display
