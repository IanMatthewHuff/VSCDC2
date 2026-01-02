# Game Content Package Design

## Overview

The `@vscdc/game` package defines all game-specific content—entities, items, rules, and data. This is the "what" of the game, while the engine provides the "how."

## Responsibilities

- Entity definitions (player classes, enemies, NPCs)
- Item definitions (weapons, armor, consumables)
- Dungeon themes and generation parameters
- Combat rules and damage formulas
- Progression systems (XP, leveling)
- Dialog and quest content

## Design Principles

1. **No UI code** — Game content never imports from extension package
2. **Data-driven where possible** — Prefer declarative definitions over code
3. **Extensible** — Structure should support future content expansion
4. **Validated** — Content should be schema-validated at build time

## Content Categories

### Entities
**Status: Partially Implemented**

Entity definitions for enemies and NPCs:

**Enemies**:
- **Target Dummy**: Training entity at position (2,2)
  - 3 HP, can be attacked and destroyed
  - Display character: "D", color: brown
  - Used for testing combat mechanics

**NPCs**:
- **Sage**: Wise advisor NPC at position (1,2)
  - 100 HP (not relevant as cannot be attacked)
  - Display character: "S", color: blue
  - `canBeAttacked: false` prevents combat
  - Provides branching dialog interactions

**Entity Factories**:
- `createTargetDummy(position)`: Creates enemy entity
- `createSage(position)`: Creates NPC entity
- Each uses unique ID generation for tracking

### Items
*TODO: Document item definition format*

### Dungeon Themes
*TODO: Document dungeon generation parameters*

### Combat Rules
**Status: Basic Implementation**

Simple melee combat system:
- Bump-to-attack: Moving onto an enemy's tile triggers combat
- Fixed damage per attack (1 HP by default)
- Entities are removed when health reaches 0
- Combat events are logged to output channel

**NPC Interaction Rules**:
- Moving onto an NPC tile triggers dialog interaction instead of combat
- NPCs with `canBeAttacked: false` cannot be targeted
- Player does not move during NPC interactions

### Dialog System
**Status: Implemented**

The dialog system enables NPC interactions through branching conversation trees:

**Data Structure**:
- `DialogTree`: Complete conversation with start node and all nodes
- `DialogNode`: Single point in conversation with NPC text and player response options
- `DialogOption`: Player response option that can navigate to another node or end conversation
- `DialogHandler`: Function that returns a dialog tree for an NPC

**Registration Pattern**:
- Dialog handlers are registered by NPC type at game initialization
- `registerDialogHandler(npcType, handler)` maps NPC types to their dialog functions
- `getDialogHandler(npcType)` retrieves the handler for displaying dialog
- Handlers are stored in a module-level Map for fast lookup

**Example Dialog Tree Structure**:
```typescript
{
  startNodeId: "greeting",
  nodes: {
    greeting: {
      id: "greeting",
      text: "Greetings, adventurer...",
      options: [
        { text: "Tell me about this place", nextNodeId: "about_place" },
        { text: "Farewell", nextNodeId: null }  // null ends conversation
      ]
    },
    about_place: {
      id: "about_place",
      text: "This dungeon is ancient...",
      options: [
        { text: "Thank you", nextNodeId: null }
      ]
    }
  }
}
```

**Current NPCs**:
- **Sage**: Wise NPC at position (1,2) who provides guidance and lore
  - Cannot be attacked (`canBeAttacked: false`)
  - Multi-branch dialog tree with various conversation paths
  - Topics: treasure hunting, dungeon dangers, secrets, and wisdom

### Items
*TODO: Document item definition format*

Per DESIGN.md, we're starting minimal:
- Basic player character
- A couple of enemy types
- Simple melee combat
- One NPC with dialog

Expand only after the foundation is solid.
