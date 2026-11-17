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
| **Output Channels** | Game Log (all), Combat Log (attacks/damage), Dialog Log (conversations), Other Log (equipment, misc) |
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

## Multi-Floor Descent

**Status: Implemented**

- `vscdc.descendFloor` is bound to `Shift+.` (`>`) while the game editor is active.
- The command delegates validation and transition behavior to `GameSession`.
- Invalid use reports whether the current level has no stairs or the player must
  first stand on `>`.
- Successful descent is logged to the Other and combined Game logs, reports the
  new floor and restored health, and refreshes the document, player view, cursor
  location, inventory/equipment views, and environment decorations.
- The game document level heading carries the current floor name without changing
  the map's editor-line offset.

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
- NPC's dialog text appears as a non-selectable separator header at the top
- A "Your response:" separator divides NPC text from player choices
- Player response options are shown as selectable items below
- Selecting an option navigates to the next dialog node or ends the conversation

**Interaction Flow**:
1. Player moves onto an NPC tile (bumps into NPC)
2. Game session returns `actionType: "interact"` with the target NPC
3. `GameController.handleNPCInteraction()` retrieves the dialog handler
4. `runDialog()` traverses the dialog tree, collecting player choices
5. Dialog is logged to the Dialog Log output channel
6. Results are returned as a path of choices made (or `null` if cancelled)

**Implementation**:
```typescript
// Quick Pick items with separator header
const items: DialogQuickPickItem[] = [
  { label: node.text, kind: QuickPickItemKind.Separator },  // NPC text (non-selectable)
  { label: "Your response:", kind: QuickPickItemKind.Separator },  // Divider
  ...options  // Player choices
];

const selected = await vscode.window.showQuickPick(items, {
  title: `Talking to ${npcName}`,
  ignoreFocusOut: true
});
```

**User Experience**:
- Clear visual hierarchy: NPC text at top, player choices below
- Non-blocking: Dialog is async, doesn't freeze the editor
- Dismissible: Pressing Escape cancels the dialog (returns `null`)
- Logged: All dialog interactions appear in the Dialog Log

## Output Channels

The extension maintains four output channels for game logging:

| Channel | Purpose | Contents |
|---------|---------|----------|
| **Game Log** | Combined log of all events | Prefixed entries from all other channels |
| **Combat Log** | Combat-specific events | Attack damage, entity deaths, environment damage |
| **Dialog Log** | NPC conversation events | Dialog start/end, NPC text, player choices |
| **Other Log** | Miscellaneous events | Equipment changes, future misc events |

**Logging Implementation**:
```typescript
// Helper methods write to both specific and combined channels
private logCombat(message: string): void {
  this.outputChannels.combatLog.appendLine(message);
  this.outputChannels.gameLog.appendLine(`[Combat] ${message}`);
}

private logDialog(message: string): void {
  this.outputChannels.dialogLog.appendLine(message);
  this.outputChannels.gameLog.appendLine(`[Dialog] ${message}`);
}

private logOther(message: string): void {
  this.outputChannels.otherLog.appendLine(message);
  this.outputChannels.gameLog.appendLine(`[Other] ${message}`);
}
```

**Event Subscriptions**:
- Combat events: `ATTACK`, `ENTITY_DESTROYED`, `ENVIRONMENT_ENTERED`, `ENVIRONMENT_DAMAGE`
- Equipment events: `EQUIPMENT_EQUIPPED`, `EQUIPMENT_UNEQUIPPED`
- Dialog is logged directly during NPC interaction flow

## Extension Activation

- Activates on command: `roguelike.startGame`
- May also activate on `roguelike://` URI open
