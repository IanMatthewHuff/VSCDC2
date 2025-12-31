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
    position: { x: number, y: number },
    displayChar: string,
    color: string
  },
  game: {
    turnCount: number
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

- `onStateChanged(callback)` — Subscribe to state changes for rendering
- `onEvent(eventType, callback)` — Subscribe to specific game events
- `getState()` — Get the current game state
- `movePlayerTo(x, y)` — Move player to absolute position
- `movePlayerBy(dx, dy)` — Move player by relative offset
- `getPlayerPosition()` — Query player position
- `getTurnCount()` — Query current turn count

Future additions:
- `submitAction(action)` — Submit generic actions
- `getVisibleMap()` — Query visible map state
- `getEntityData(id)` — Query entity details
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
- ✓ Player slice with movement actions
- ✓ Game slice with turn management
- ✓ Event middleware for emitting game events
- ✓ GameEngine API wrapper
- ✓ Basic position and player types

### Planned
- Map system and spatial queries
- Action validation system
- Full entity system
- State serialization/deserialization
- Comprehensive test suite

## Key Systems

### Turn Manager
*Implemented via `gameSlice` - tracks turn count and advances on player actions*

### Entity System
*Partially implemented - Player entity exists, full system planned*

### Event Bus
*Implemented via custom middleware - emits events on state changes*

### Map System
*Placeholder*

### Action System
*Partially implemented - Direct movement methods exist, generic action system planned*
