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
| **Text Editor** (Virtual Document) | Main game view—dungeon map, entities, NPCs |
| **Tree View** (Sidebar) | Character stats, inventory, equipment, cursor location |
| **Output Channel** | Combat log, game messages |
| **Quick Pick** | Action menus, **NPC dialog choices** |
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

## Tree Views

### Player Stats View
- Displays player name and health
- Updates automatically when player stats change
- Uses codicons for visual representation

### Cursor Location View
- Shows information about the current square (player's position)
- Displays:
  - Position coordinates (x, y)
  - Terrain type (floor, wall, etc.)
  - Entities at the location (enemies and NPCs)
- Updates automatically when player moves or cursor moves
- Handles multiple entities per square

## NPC Dialog System

**Status: Implemented**

The extension handles NPC dialog interactions using VS Code's Quick Pick interface:

**Dialog Display**:
- NPC's dialog text appears in the Quick Pick placeholder (at the top)
- Player response options are shown as selectable items below
- Selecting an option navigates to the next dialog node or ends the conversation

**Interaction Flow**:
1. Player moves onto an NPC tile
2. Game session returns `actionType: "interact"` with the target NPC
3. `GameController.handleNPCInteraction()` retrieves the dialog handler
4. Dialog tree is displayed via `showDialogNode()` recursive function
5. Player selects responses, navigating through the tree
6. Dialog ends when an option with `nextNodeId: null` is selected

**Implementation**:
```typescript
// Show dialog with NPC text at the top
const selected = await vscode.window.showQuickPick(options, {
  placeHolder: node.text,  // NPC's dialog
  title: "Dialog"
});

// Navigate to next node if selected
if (selected?.nextNodeId) {
  await this.showDialogNode(dialogTree, selected.nextNodeId);
}
```

**User Experience**:
- Non-blocking: Dialog is async, doesn't freeze the editor
- Dismissible: Clicking away or pressing Escape cancels the dialog
- Clear context: "Dialog" title and NPC text provide context

## Extension Activation

- Activates on command: `roguelike.startGame`
- May also activate on `roguelike://` URI open
