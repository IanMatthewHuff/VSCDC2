/**
 * @vscdc/engine - Core roguelike game engine
 *
 * This package provides the core game engine with no UI code
 * and no game-specific logic.
 */

export const ENGINE_VERSION = "0.0.1";

// Export main engine class
export { GameEngine } from "./engine";

// Export types
export type { GameState, Player, Position, Stat } from "./types";
export type { CreateStoreOptions } from "./store";
export { GameEventType } from "./events";
export type {
  GameEvent,
  PlayerMovedEvent,
  TurnAdvancedEvent,
  StateChangedEvent,
  AnyGameEvent,
} from "./events";

// Export action creators for advanced usage
export { movePlayer, movePlayerBy } from "./playerSlice";
export { incrementTurn, resetTurn } from "./gameSlice";
