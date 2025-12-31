/**
 * @vscdc/game - Game content module
 *
 * This package defines the specific game content: entities, items,
 * rules, and content. It depends on @vscdc/engine.
 */

import { ENGINE_VERSION, GameEngine } from "@vscdc/engine";

export const GAME_VERSION = "0.0.1";

/** Verify engine dependency is working */
export function getEngineVersion(): string {
  return ENGINE_VERSION;
}

/**
 * Creates a new game instance with the engine configured
 */
export function createGame(): GameEngine {
  // Create engine with dev tools disabled for production
  const engine = new GameEngine({ enableDevTools: false });
  
  return engine;
}
