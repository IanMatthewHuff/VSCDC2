# VS Code Extension Package Design

## Overview

The extension package is the UI layer—it binds the game engine to VS Code's native UI surfaces. All input handling and rendering happens here.

## Responsibilities

- Keyboard/command input handling
- Rendering game state to VS Code UI surfaces
- Managing VS Code extension lifecycle
- Bridging user interactions to engine actions

## VS Code UI Surface Mapping

| VS Code Surface | Game Usage |
|-----------------|------------|
| **Text Editor** (Virtual Document) | Main game view—dungeon map, entities |
| **Tree View** (Sidebar) | Character stats, inventory, equipment |
| **Output Channel** | Combat log, game messages |
| **Quick Pick** | Action menus, dialog choices |
| **Status Bar** | HP, dungeon level, quick stats |

## Design Principles

1. **No game logic** — Extension delegates all game decisions to engine
2. **No webviews** — Use only native VS Code UI surfaces
3. **Reactive** — UI updates in response to engine events
4. **VS Code native** — Feel like a natural part of the editor

## Key Implementation Details

### Virtual Document Provider
- Custom URI scheme: `roguelike://game`
- `TextDocumentContentProvider` returns rendered map
- Updates triggered via `onDidChange` event

### Input Handling
- Intercept keyboard in game document
- Translate keypresses to engine actions
- Support vim-style (`hjkl`) and arrow key movement

### Colorization
- `DocumentSemanticTokensProvider` for entity colors
- Token types: player, enemy, item, wall, floor, etc.
- Respects VS Code theme colors

### Decorations
- Background colors for terrain effects
- Highlights for selection, danger zones

## Extension Activation

- Activates on command: `roguelike.startGame`
- May also activate on `roguelike://` URI open
