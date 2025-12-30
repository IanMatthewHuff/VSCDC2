# Engine Package Design

## Overview

The `@vscdc/engine` package is the core game engine—a reusable, turn-based roguelike engine with **no UI code** and **no game-specific logic**.

## Responsibilities

- Turn management and game loop orchestration
- Entity system for managing game objects
- Event bus for decoupled communication
- Map/spatial system for 2D grid management
- Action validation and execution
- State serialization/deserialization

## API Surface

The engine exposes a clean API for the UI layer:

- `onStateChanged(callback)` — Subscribe to state changes for rendering
- `onEvent(eventType, callback)` — Subscribe to specific game events
- `submitAction(action)` — Submit player actions
- `getVisibleMap()` — Query visible map state
- `getEntityData(id)` — Query entity details
- `serialize() / deserialize()` — Save/load functionality

## Design Principles

1. **No UI dependencies** — Engine never imports from extension package
2. **No game-specific content** — Engine doesn't know what a "Goblin" is
3. **Event-driven** — Changes are communicated via events, not direct calls
4. **Testable** — All systems should be unit testable in isolation

## Key Systems

*TODO: Document each system as it's implemented*

### Turn Manager
*Placeholder*

### Entity System
*Placeholder*

### Event Bus
*Placeholder*

### Map System
*Placeholder*

### Action System
*Placeholder*
