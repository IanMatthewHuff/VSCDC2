/**
 * @vscdc/game - Game content module
 *
 * This package defines the specific game content: entities, items,
 * rules, and content. It depends on @vscdc/engine.
 */

import { ENGINE_VERSION, GameEngine } from "@vscdc/engine";
import { createTestLevel, isWalkable, Level } from "./level";

export const GAME_VERSION = "0.0.1";

// Re-export level types and utilities
export {
  TileType,
  createTestLevel,
  isInBounds,
  getTileAt,
  isWalkable,
} from "./level";
export type { Tile, Level } from "./level";

/** Verify engine dependency is working */
export function getEngineVersion(): string {
  return ENGINE_VERSION;
}

/**
 * Player stats exposed by the game session
 */
export interface PlayerStats {
  name: string;
  health: { current: number; max: number };
}

/**
 * Game session that combines the engine with a level
 */
export interface GameSession {
  engine: GameEngine;
  level: Level;
  /** Move player in a direction, respects wall collision */
  movePlayer: (dx: number, dy: number) => boolean;
  /** Get current player stats */
  getPlayerStats: () => PlayerStats;
}

/**
 * Creates a new game instance with the test level
 */
export function createGame(): GameSession {
  // Create engine with dev tools disabled for production
  const engine = new GameEngine({ enableDevTools: false });
  const level = createTestLevel();

  // Set player to starting position
  engine.movePlayerTo(level.playerStart.x, level.playerStart.y);

  /**
   * Attempts to move the player by the given offset.
   * Returns true if the move was successful, false if blocked.
   */
  function movePlayer(dx: number, dy: number): boolean {
    const pos = engine.getPlayerPosition();
    const newX = pos.x + dx;
    const newY = pos.y + dy;

    if (isWalkable(level, newX, newY)) {
      engine.movePlayerBy(dx, dy);
      return true;
    }
    return false;
  }

  /**
   * Gets the current player stats
   */
  function getPlayerStats(): PlayerStats {
    return {
      name: engine.getPlayerName(),
      health: engine.getPlayerHealth(),
    };
  }

  return {
    engine,
    level,
    movePlayer,
    getPlayerStats,
  };
}
