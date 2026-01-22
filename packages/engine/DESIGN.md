# Engine Package Design

## Overview

The `@vscdc/engine` package is the core game engine—a reusable, turn-based roguelike engine with **no UI code** and **no game-specific logic**.

## State Management Architecture

The engine uses **Redux Toolkit** for state management, providing a predictable, testable, and event-driven architecture.

### Why Redux?

Redux was chosen for the following reasons:
- **Predictable state updates**: All state changes go through reducers, making the system deterministic and easy to reason about
- **Time-travel debugging**: Redux DevTools support (in development) allows stepping through actions
- **Event-driven architecture**: Middleware enables decoupled event emission without side effects in reducers
- **Serialization**: State is plain JavaScript objects, making save/load trivial
- **Testing**: Pure reducers and isolated actions are straightforward to test

### Store Structure

The Redux store is organized into slices:

```typescript
{
  player: {
    id: string,
    name: string,
    position: { x: number, y: number },
    displayChar: string,
    color: string,
    health: { current: number, max: number }
  },
  game: {
    turnCount: number
  },
  entities: {
    entities: Record<string, Enemy>,
    npcs: Record<string, NPC>
  },
  environments: {
    environments: Record<string, Environment>  // Keyed by "x,y"
  }
}
```

### Factory Function

The store is created via a factory function `createGameStore(options)`:
- Takes optional configuration (e.g., `enableDevTools` for development)
- Returns a configured Redux store with all reducers and middleware
- Encapsulates the store setup, preventing direct Redux dependencies in consuming code

**Production builds must pass `enableDevTools: false` to avoid dev tool overhead.**

### Event Middleware

The engine uses custom middleware to emit game events:
- Middleware compares previous and next state after each action
- Emits typed events (e.g., `PLAYER_MOVED`, `TURN_ADVANCED`)
- Event handlers are registered via the `GameEngine.onEvent()` API
- This decouples event consumers from the Redux store implementation

## Responsibilities

- Turn management and game loop orchestration
- Entity system for managing game objects
- Event bus for decoupled communication
- Map/spatial system for 2D grid management (planned)
- Action validation and execution
- State serialization/deserialization (planned)

## API Surface

The engine exposes a clean API for the UI layer via the `GameEngine` class:

**Player Management**:
- `onStateChanged(callback)` — Subscribe to state changes for rendering
- `onEvent(eventType, callback)` — Subscribe to specific game events
- `getState()` — Get the current game state
- `movePlayerTo(x, y)` — Move player to absolute position
- `movePlayerBy(dx, dy)` — Move player by relative offset
- `getPlayerPosition()` — Query player position
- `getPlayerName()` — Query player name
- `getPlayerHealth()` — Query player health stats
- `getTurnCount()` — Query current turn count

**Entity Management**:
- `addEntity(entity)` — Add an enemy to the game
- `getEntities()` — Get all enemies
- `getEntityAt(position)` — Get enemy at position
- `getEntityById(id)` — Get enemy by ID
- `removeEntity(id)` — Remove an enemy
- `moveEntity(id, position)` — Move an enemy to a new position
- `attack(targetId, damage)` — Player attacks an enemy
- `enemyAttackPlayer(attackerId, damage)` — Enemy attacks the player

**NPC Management**:
- `addNPC(npc)` — Add an NPC to the game
- `getNPCs()` — Get all NPCs
- `getNPCAt(position)` — Get NPC at position
- `getNPCById(id)` — Get NPC by ID
- `removeNPC(id)` — Remove an NPC

**Environment Management**:
- `addEnvironment(environment)` — Add an environment to the game at a specific position
- `getEnvironments()` — Get all environments
- `getEnvironmentAt(position)` — Get environment at position
- `removeEnvironment(position)` — Remove environment from position
- `applyEnvironmentDamage(type, damage)` — Apply environment damage to player

Future additions:
- `submitAction(action)` — Submit generic actions
- `getVisibleMap()` — Query visible map state
- `serialize() / deserialize()` — Save/load functionality

## Design Principles

1. **No UI dependencies** — Engine never imports from extension package
2. **No game-specific content** — Engine doesn't know what a "Goblin" is
3. **Event-driven** — Changes are communicated via events, not direct calls
4. **Testable** — All systems should be unit testable in isolation
5. **Factory pattern** — Store creation is encapsulated in a factory function

## Implementation Status

### Completed
- ✓ Redux Toolkit integration
- ✓ Store factory function with configuration options
- ✓ Player slice with movement actions and health tracking
- ✓ Game slice with turn management
- ✓ Entity slice with enemy and NPC management
- ✓ Entity movement actions for AI-controlled enemies
- ✓ Environment slice with environment management
- ✓ Event middleware for emitting game events
- ✓ GameEngine API wrapper with entity, NPC, and environment methods
- ✓ Combat system with attack and damage mechanics (player and enemy)
- ✓ Environment damage system
- ✓ NPC interaction event types
- ✓ Environment event types (ENVIRONMENT_ENTERED, ENVIRONMENT_DAMAGE)
- ✓ Comprehensive test suite for core functionality

### Planned
- Map system and spatial queries
- Action validation system
- State serialization/deserialization
- More event types and handlers
- Advanced combat mechanics

## Key Systems

### Turn Manager
*Implemented via `gameSlice` - tracks turn count and advances on player actions*

### Entity System
**Status: Implemented**

Manages all game entities (enemies and NPCs) through Redux:

**Entity Types**:
- `Enemy`: Attackable entities with health that can be destroyed
- `NPC`: Interactive entities that trigger dialog when approached
  - Have `canBeAttacked` flag to prevent combat
  - Trigger `NPC_INTERACTION` events when player moves onto their tile

**Entity Slice** (`entitySlice.ts`):
- Manages two separate collections: `entities` (enemies) and `npcs`
- Actions: `addEntity`, `damageEntity`, `removeEntity`, `moveEntity`, `addNPC`, `removeNPC`
- Selectors: `selectEntityAt`, `selectNPCAt`, `selectAllEntities`, `selectAllNPCs`
- Position-based queries for spatial lookups

**Enemy Movement**:
- `moveEntity(id, position)` action updates enemy position in state
- Movement is handled by game-level AI logic (not part of engine)
- Engine provides primitive movement capability, game layer implements pathfinding

**Entity Management Flow**:
1. Game package creates entity definitions (e.g., `createSage()`, `createGoblin()`)
2. Entities are added to engine via `addEntity()` or `addNPC()`
3. Engine stores entities in Redux state
4. Game layer implements AI to move enemies via `moveEntity()`
5. Extension queries entities for rendering and interaction

### Event Bus
**Status: Implemented**

Custom middleware that emits game events for UI consumption:

**Event Types**:
- `PLAYER_MOVED`: Emitted when player position changes
- `TURN_ADVANCED`: Emitted when game turn increments
- `STATE_CHANGED`: General state change notification
- `ATTACK`: Emitted when an attack occurs (includes damage details)
- `ENTITY_DESTROYED`: Emitted when an entity reaches 0 HP
- `NPC_INTERACTION`: Emitted when player interacts with an NPC
- `ENVIRONMENT_ENTERED`: Emitted when player enters an environment
- `ENVIRONMENT_DAMAGE`: Emitted when an environment deals damage to the player
- `EQUIPMENT_EQUIPPED`: Emitted when equipment is equipped to a slot
- `EQUIPMENT_UNEQUIPPED`: Emitted when equipment is removed from a slot

**Event Flow**:
1. Action dispatched to Redux store
2. Middleware intercepts action and compares prev/next state
3. Relevant events are emitted based on state changes
4. UI layer receives events via `engine.onEvent(eventType, handler)`
5. Event handlers update UI (e.g., combat log, notifications)

**Usage Pattern**:
```typescript
engine.onEvent(GameEventType.ATTACK, (event) => {
  console.log(`${event.attackerName} attacked ${event.targetName}`);
});
```

### Environment System
**Status: Implemented**

Manages environmental effects that exist at specific positions in the game world:

**Environment Slice** (`environmentSlice.ts`):
- Manages a collection of environments indexed by position (x,y)
- Actions: `addEnvironment`, `removeEnvironment`, `clearEnvironments`
- Selectors: `selectEnvironmentAt`, `selectAllEnvironments`
- Position-based storage for efficient spatial lookups

**Environment Structure**:
```typescript
interface Environment {
  id: string;              // Unique identifier
  type: string;            // Environment type (e.g., "lava")
  position: Position;      // Where the environment exists
  color: string;           // Color for UI highlighting/decorations (not rendered as character)
}
```

**Environment Management Flow**:
1. Game package defines environment types and effects
2. Environments are added to engine via `addEnvironment()`
3. When player moves, middleware checks for environments at new position
4. If environment found, `ENVIRONMENT_ENTERED` event is emitted
5. Game package applies environment effects via `applyEnvironmentDamage()`
6. `ENVIRONMENT_DAMAGE` event is emitted for UI logging

**Event Integration**:
- Middleware automatically detects when player enters environment
- Game layer is responsible for interpreting and applying effects
- UI layer logs environment interactions to combat log

### Map System
*Placeholder*

### Action System
*Partially implemented - Direct movement methods exist, generic action system planned*

### Combat System
**Status: Implemented**

The engine implements a stat-based damage formula for combat:

**Damage Formula**: `damage = attacker_attack - defender_defense` (minimum 0)

**Player Combat Stats**:
- `baseAttack`: Player's base attack value (default: 1)
- `baseDefense`: Player's base defense value (default: 0)
- Equipment bonuses are added to base values
- `getPlayerAttack()` and `getPlayerDefense()` return total values

**Entity Combat Stats**:
- `attack`: Optional attack stat for enemies (defaults to 0)
- `defense`: Optional defense stat for enemies (defaults to 0)
- `getEntityAttack(id)` and `getEntityDefense(id)` query entity stats

**Combat Methods**:
- `attack(targetId)`: Player attacks an entity, damage calculated automatically
- `enemyAttackPlayer(attackerId)`: Enemy attacks player, damage calculated automatically

**Key Behavior**:
- High defense can completely negate weak attacks (0 damage is valid)
- Combat events include calculated damage for UI logging
