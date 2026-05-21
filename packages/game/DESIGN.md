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
**Status: Implemented**

Entity definitions for enemies and NPCs:

**Enemies**:
- **Target Dummy**: Training entity at position (2,2)
  - HP 6, Attack 0, Defense 1
  - Display character: "D", color: brown
  - Stationary (does not move or attack)
  - Used for testing combat mechanics

- **Goblin**: Active enemy that moves and attacks
  - HP 5, Attack 3, Defense 0
  - Display character: "G", color: green
  - Moves greedily toward player using Manhattan distance
  - Attacks player when adjacent (damage calculated via combat formula)
  - Avoids damaging environments (e.g., lava)
  - Added to level when `createGame({ includeEnemies: true })`
  - Default position: (1, 1) in test level

**NPCs**:
- **Sage**: Wise advisor NPC at position (1,2)
  - 100 HP (not relevant as cannot be attacked)
  - Display character: "S", color: blue
  - `canBeAttacked: false` prevents combat
  - Provides branching dialog interactions

**Entity Factories**:
- `createTargetDummy(position)`: Creates stationary training dummy
- `createGoblin(position)`: Creates active goblin enemy
- `createSage(position)`: Creates NPC entity
- Each uses unique ID generation for tracking

### Enemy AI System
**Status: Implemented**

The enemy AI system handles autonomous enemy behavior during combat:

**Movement Algorithm**:
- **Greedy pathfinding**: Enemies move toward the player by selecting adjacent tiles that minimize Manhattan distance
- **4-directional movement**: Enemies can move North, South, East, or West
- **Collision avoidance**: Enemies don't move onto occupied tiles (other enemies, NPCs, or player)
- **Environment awareness**: Enemies avoid hazardous environments (e.g., lava)

**Combat Behavior**:
- **Melee attacks**: When adjacent to player (distance = 1), enemy attacks instead of moving
- **Fixed damage**: Each enemy attack deals 1 HP damage to the player
- **Attack events**: Combat actions emit events for UI logging

**Turn Processing**:
- `processEnemyTurn(enemy, engine, level)`: Processes a single enemy's turn
- `processAllEnemyTurns(engine, level)`: Processes all active enemies in order
- Called automatically after player actions (move or attack)
- Stationary enemies (like Target Dummy) are skipped

**Integration**:
- Enemy turns are processed in `movePlayer()` after successful player actions
- Only active enemy types participate in AI (checked by `type` field)
- NPC interactions do not trigger enemy turns

### Items
*TODO: Document item definition format*

### Dungeon Themes
*TODO: Document dungeon generation parameters*

### Combat Rules
**Status: Implemented**

Turn-based combat system using the engine's stat-based damage formula:

**Damage Formula** (implemented in engine):
`damage = attacker_attack - defender_defense` (minimum 0)

**Player Combat**:
- **Bump-to-attack**: Moving onto an enemy's tile triggers combat
- **Stat-based damage**: Player's total attack (base + equipment) minus enemy defense
- **Entity removal**: Entities are removed when health reaches 0
- **Combat events**: All combat actions are logged via event system

**Starting Player Stats** (with default equipment):
- Base Attack: 1, Base Defense: 0
- Starting equipment: Chain Mail (+2 def), Basic Club (+1 atk)
- **Effective totals**: Attack 2, Defense 2

**Enemy Combat**:
- **Autonomous behavior**: Enemies act automatically after player actions
- **Stat-based damage**: Enemy attack minus player's total defense
- **Turn-based**: Each enemy gets one action per player action
- **AI-driven movement**: Enemies use greedy pathfinding to approach player
- **Environmental awareness**: Enemies avoid hazardous tiles

**Balance Examples**:
- Goblin (Atk 3) vs armored player (Def 2) → 1 damage per hit
- Player (Atk 2) vs Goblin (Def 0) → 2 damage per hit, 3 hits to kill
- Player (Atk 2) vs Target Dummy (Def 1) → 1 damage per hit, 6 hits to kill

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

### Environment System
**Status: Implemented**

The environment system enables tiles to have environmental effects that can affect characters:

**Data Structure**:
- `Environment`: Defines an environment with type, position, display character, and color
- `EnvironmentEffect`: Defines what happens when a character interacts with an environment
- `EnvironmentType`: Enum of available environment types (e.g., "lava")

**Effect Handler Pattern**:
- Environment effects are registered in a module-level Map
- `registerEnvironmentEffect(type, effect)` maps types to their effects
- `getEnvironmentEffect(type)` retrieves the effect for applying it

**Effect Properties**:
- `damage`: Amount of damage to deal (if any)
- `triggersOnEntry`: Whether effect applies when entering the environment

**Environment Factories**:
- `createLavaEnvironment(position)`: Creates a lava environment
  - Deals 1 damage on entry
  - Color: "orange" (for UI highlighting/decorations)
  - No display character (rendered via UI decorations only)
  - Unique ID generation for tracking

**Initialization**:
- `initializeEnvironmentEffects()` registers all environment effects
- Called during game initialization before adding environments
- Currently registers lava (1 damage on entry)

**Current Environments**:
- **Lava**: Damaging environment at positions (4,1) and (4,2) in test level
  - Deals 1 HP damage when player enters
  - Visual: Orange background highlight (no character displayed)
  - Triggers environment events for UI logging

**Integration with Game Loop**:
1. Player attempts to move to a tile
2. If walkable, player moves
3. Game checks for environment at new position
4. If environment exists, gets its effect handler
5. If effect triggers on entry and has damage, applies it via engine
6. Engine emits environment events for UI consumption

### Items
**Status: Implemented (factories + floor spawning)**

Item factories (`items.ts`) produce `EquipmentItem` and `ConsumableItem` instances (e.g., `createHealingPotion`, `createIronSword`). These are then placed on the dungeon floor by the loot module so the player can pick them up by walking onto the tile.

**Loot Spawning** (`loot.ts`):
- `spawnDungeonLoot(engine, rooms, rng, playerStartRoomIdx)` selects 1–3 non-start rooms via Fisher-Yates shuffle, picks a random tile in each, and drops an item from a weighted table:
  - 50% consumable (healing potion)
  - ~25% defense gear (leather armor, iron helmet, wooden shield)
  - ~25% weapons (iron sword, basic club)
- Tiles already occupied by enemies, environments (lava), other floor items, or the player start are skipped. If a room has no free tile after several attempts, it is silently dropped.
- Determinism: the dungeon-crawl factory shares a single `SeededRandom` between goblin / lava / loot placement so the same seed reproduces the same world.

**Pickup Integration**:
- `buildGameSession.movePlayer` calls `engine.pickUpItemAt(targetPosition)` after a successful walkable move. The engine emits `ITEM_PICKED_UP` (success or `inventory_full`) so the extension can log to the Game Log channel.

