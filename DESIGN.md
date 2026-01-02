# VS Code Roguelike Dungeon Crawler - Design Document

## 1. Overview

A turn-based roguelike dungeon crawler game (inspired by NetHack and Rogue) that runs entirely within the VS Code editor. The game uses VS Code's native UI surfaces—text editor for the game world, tree views for character info, output panels for logs, and dialogs for interactions.

### Core Pillars
- **Classic roguelike gameplay**: Turn-based, procedural dungeons, permadeath, discovery through experimentation
- **Native VS Code integration**: Feels like a natural part of the editor, not a web game embedded in it
- **Modular architecture**: Clear separation between engine, game content, and UI presentation

---

## 2. Architecture

### 2.1 Project Structure — Monorepo with npm Workspaces

The three components live in a single repository as separate npm packages:

```
/VSCDC2
├── packages/
│   ├── engine/           ← @vscdc/engine (Core Game Engine)
│   ├── game/             ← @vscdc/game (Game Content Module)
│   └── extension/        ← VS Code Extension
├── package.json          ← Root workspace configuration
└── tsconfig.base.json    ← Shared TypeScript config
```

**Why this structure**:
- **Enforced boundaries**: Packages can only import declared dependencies—engine literally cannot import from extension
- **Clean imports**: `import { TurnManager } from '@vscdc/engine'` instead of fragile relative paths
- **Separate concerns**: Each package has its own tests, types, and build config
- **Simple tooling**: npm workspaces (built-in, no extra dependencies)

The VS Code extension bundles all packages together at build time for distribution.

### 2.2 Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    VS Code Extension (UI Layer)                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐│
│  │ Text Editor  │ │  Tree Views  │ │ Output Panel / Dialogs   ││
│  │ (Game World) │ │ (Inventory)  │ │ (Combat Log / Choices)   ││
│  └──────┬───────┘ └──────┬───────┘ └────────────┬─────────────┘│
│         │                │                      │              │
│         └────────────────┼──────────────────────┘              │
│                          │                                     │
│                   ┌──────▼───────┐                             │
│                   │  UI Bindings │ (Input handlers, Renderers) │
│                   └──────┬───────┘                             │
└──────────────────────────┼─────────────────────────────────────┘
                           │
              ┌────────────▼────────────┐
              │     Core Game Engine    │
              │  ┌────────────────────┐ │
              │  │ Turn Manager       │ │
              │  │ Entity System      │ │
              │  │ Event Bus          │ │
              │  │ Map/Spatial System │ │
              │  └────────────────────┘ │
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │   Game Content Module   │
              │  ┌────────────────────┐ │
              │  │ Entity Definitions │ │
              │  │ Items & Equipment  │ │
              │  │ Dungeon Generators │ │
              │  │ Combat Rules       │ │
              │  │ Dialog/Story Data  │ │
              │  └────────────────────┘ │
              └─────────────────────────┘
```

---

## 3. Component Details

### 3.1 Core Game Engine

**Purpose**: A reusable turn-based roguelike engine with no UI code and no game-specific logic.

**Key Systems**:

| System | Responsibility |
|--------|----------------|
| **Turn Manager** | Orchestrates the turn cycle: player action → world tick → enemy actions → events resolve |
| **Entity System** | Manages all game objects (player, enemies, items, terrain) with a component-based or trait-based approach |
| **Event Bus** | Decoupled communication—game events (damage dealt, item picked up, door opened) are published for UI/systems to react |
| **Map System** | 2D grid management, spatial queries (what's at tile X,Y?), fog of war, line of sight |
| **Action System** | Validates and executes actions (move, attack, use item, wait). Actions are game-agnostic primitives |
| **State Manager** | Game state serialization/deserialization for save/load functionality |

**Engine API Surface** (what it exposes to UI):
- `onStateChanged(callback)` — Full render state when something changes
- `onEvent(eventType, callback)` — Subscribe to specific game events
- `submitAction(action)` — Player submits their action for the turn
- `getVisibleMap()` — Returns the current visible portion of the map
- `getEntityData(id)` — Query entity details (for UI panels)
- `serialize() / deserialize()` — Save/load game state

**What Engine Does NOT Do**:
- Define what a "Goblin" is or how much damage a "Sword" deals
- Render anything to screen
- Handle keyboard/mouse input directly

---

### 3.2 Game Content Module

**Purpose**: Defines the specific game—all entities, items, rules, and content. Swappable for different games.

**Content Types**:

| Content | Examples |
|---------|----------|
| **Entities** | Player classes, enemy types (Goblin, Dragon), NPCs |
| **Items** | Weapons, armor, potions, scrolls, food |
| **Dungeon Themes** | Cave, castle, crypt—each with generation rules and enemy pools |
| **Combat Rules** | Damage formulas, status effects, death handling |
| **Progression** | XP curves, level-up bonuses, skill trees |
| **Dialog/Quests** | NPC conversations, quest triggers and objectives |

**Data Format Considerations**:
- Entity and item definitions could be JSON/YAML for easy modding
- Complex behaviors (AI, special abilities) in TypeScript
- Consider a simple scripting layer for dialog trees

**Example Entity Definition** (conceptual):
```
Goblin:
  display: "g"
  color: "green"
  hp: 8
  attack: 1d6
  behavior: "aggressive-melee"
  loot_table: "goblin_loot"
```

---

### 3.3 VS Code Extension (UI Layer)

**Purpose**: Binds the engine to VS Code's UI surfaces. Handles all input and rendering.

**UI Surface Mapping**:

| VS Code Surface | Game Usage |
|-----------------|------------|
| **Text Editor** (Virtual Document) | Main game view—dungeon map, entities, ASCII art |
| **Tree View** (Sidebar) | Character stats, inventory, equipment slots |
| **Output Channel** | Combat log, game messages, history |
| **Quick Pick** | Action menus, dialog choices, inventory selection |
| **Information Messages** | Important alerts, level-up notifications |
| **Status Bar** | HP, dungeon level, quick stats |

**No Webviews**: We're intentionally avoiding webview panels. While they'd allow for richer custom UI (graphics, complex layouts), they're essentially embedded web pages—not "real" VS Code UI. The constraint of using native VS Code surfaces is part of the project's identity and challenge.

**Input Handling**:
- Keyboard commands (vim-style: `hjkl` movement, or arrow keys)
- Type-to-command system (`:` prefix for complex commands)
- Quick pick for context menus (examine, inventory management)

**Rendering Strategy**:
- Virtual document provider that generates text content from game state
- Semantic token provider for colorizing different entity types
- Decorations for highlighting (selected tile, danger zones)

---

## 4. Turn Flow

```
1. [WAIT FOR INPUT] Player presses a key
                     ↓
2. [PARSE INPUT]     UI translates keypress to Action
                     ↓
3. [SUBMIT ACTION]   UI calls engine.submitAction(action)
                     ↓
4. [VALIDATE]        Engine checks if action is legal
                     ↓
5. [EXECUTE]         Engine executes player action
                     ↓
6. [WORLD TICK]      Environment effects (poison, fire, etc.)
                     ↓
7. [ENEMY TURNS]     Each enemy takes their action
                     ↓
8. [EMIT EVENTS]     All events from this turn are dispatched
                     ↓
9. [RENDER]          UI receives state change, updates all surfaces
                     ↓
                     → Back to step 1
```

---

## 5. Key Design Decisions

### 5.1 Entity System — DECIDED: Keep It Simple
We're going with a **lightweight, straightforward approach**:
- Simple base `Entity` class with common properties (id, position, display character, color)
- Entities own their data directly—no component registries or system processors
- Use interfaces/types to define capabilities (e.g., `Combatant`, `InventoryHolder`, `Interactive`)
- Composition through object properties, not complex inheritance hierarchies

**What we're NOT doing**:
- No full Entity-Component-System framework
- No component registries or entity queries
- No runtime component attachment/detachment

This keeps the codebase readable and debuggable without sacrificing flexibility for a roguelike's needs.

### 5.2 State Management — DECIDED: Redux Toolkit

We're using **Redux Toolkit** for state management in the engine.

**Why Redux?**
- **Predictable state updates**: All state changes go through reducers, making the game deterministic
- **Event-driven architecture**: Middleware enables clean event emission without coupling
- **Serialization**: Plain JavaScript objects make save/load trivial
- **Debugging**: Redux DevTools support (in development builds) enables time-travel debugging
- **Testing**: Pure reducers are easy to test in isolation

**Implementation approach**:
- **Factory function pattern**: `createGameStore(options)` encapsulates store creation
- **Production optimization**: DevTools disabled in production via `enableDevTools: false`
- **Event middleware**: Custom middleware emits game events (e.g., PLAYER_MOVED, TURN_ADVANCED) by comparing state before/after actions
- **Clean API**: `GameEngine` class wraps Redux, exposing only what the UI needs

**Store structure**:
```typescript
{
  player: { id, position, displayChar, color },
  game: { turnCount }
}
```

**What we're NOT doing**:
- No complex sagas or async thunks (yet)—the game is turn-based, all actions are synchronous
- No normalized state (yet)—we'll add it when we have multiple entity types
- No external state persistence (yet)—Redux state lives in memory until we implement save/load

This gives us a solid foundation for the turn-based roguelike while keeping complexity minimal.

### 5.3 Map Representation
- 2D array of tiles (simple, fast)
- Each tile has: terrain type, entity references, item stack
- Fog of war as separate visibility layer

### 5.4 Save/Load Strategy
- Serialize full game state to JSON
- Store in VS Code's `globalState` or workspace storage
- One save slot per workspace? Multiple save slots?

### 5.5 Content Loading
- Bundled with extension (simplest)
- External content packs (future expansion)
- Consider validation schema for content files

---

## 6. VS Code-Specific Considerations

### 6.1 Virtual Document Approach
- Register a custom URI scheme (e.g., `roguelike://game`)
- Provide `TextDocumentContentProvider` that returns the rendered map
- Trigger updates via `onDidChange` event

### 6.2 Preventing Editing
- Document is read-only by nature (content provider)
- Intercept and prevent standard edit commands
- All "typing" is interpreted as game commands

### 6.3 Colorization
- Use `DocumentSemanticTokensProvider` for entity coloring
- Define token types: player, enemy, item, wall, floor, water, etc.
- Respect VS Code themes (define semantic token colors in package.json)

### 6.4 Extension Activation
- Activate on command (`roguelike.startGame`)
- Consider activation on opening `roguelike://` URI

---

## 7. Open Questions

### Resolved

**1. Scope of initial game — DECIDED: Minimal Proof-of-Concept**
We're starting with a **single-level demo** to validate the engine and VS Code integration:
- One static level (no procedural generation yet)
- Player character with basic movement and combat
- A couple of enemies to fight
- One NPC with dialog to demonstrate conversation system

**Goal**: Prove the engine works, prove the VS Code UI integration is solid, prove the three-component architecture holds up. We do NOT expand gameplay scope until we're happy with the foundation.

**2. Complexity level — DECIDED: Minimal for Now**
No hunger, no item identification, no complex systems initially. Just:
- Movement
- Basic melee combat (attack, take damage, die)
- Simple dialog interaction

We can layer in complexity once the core loop feels good.

**4. Multiplayer — DECIDED: Not Planned**
Single player only. No shared state, no networking considerations in the architecture.

**5. Accessibility — DECIDED: Not a Focus for Now**
No specific accessibility support initially. Standard VS Code accessibility features may help passively, but we're not designing for screen readers or high contrast modes.

**6. Dialog System — DECIDED: Tree-Based with Quick Pick UI**

We've implemented a dialog system for NPC interactions:
- **Dialog trees**: Branching conversations defined as nodes with text and response options
- **Handler-based**: Each NPC type registers a dialog handler function at game initialization
- **Quick Pick UI**: Dialogs are displayed using VS Code's Quick Pick interface
  - The NPC's dialog text appears in the placeholder (at the top)
  - Player response options are shown as selectable items
  - Navigation through the dialog tree is handled by selecting options
- **Non-blocking interactions**: Moving onto an NPC tile triggers interaction without moving the player
- **Protected NPCs**: NPCs can be marked as non-attackable (`canBeAttacked: false`)

**Implementation details**:
- Dialog handlers live in the game package and are registered at initialization
- The engine manages NPC entities separately from enemies
- The extension handles the UI presentation of dialogs
- Dialog trees are defined in TypeScript for the initial implementation
- Future expansion: Dialog trees could be externalized to JSON/YAML for modding

### Resolved

**3. Visual style — DECIDED: ASCII + Decorations + Codicons**

**In the Text Editor (Map View)**:
- Pure ASCII characters for reliability across all monospace fonts
- `@` = player, `g` = goblin, `#` = wall, `.` = floor, etc.
- **Text decorations** for visual effects—background colors, underlines, borders on character cells
  - Example: Lava tiles could show a light red background behind the floor character
  - Example: Poison clouds could have a green tint
  - This adds visual richness without breaking monospace alignment

**In Tree Views, Status Bar, Quick Picks**:
- Codicons freely used (`$(heart)` for HP, `$(sword)` for attack, etc.)
- Emoji allowed where appropriate
- These VS Code UI surfaces render icons properly
