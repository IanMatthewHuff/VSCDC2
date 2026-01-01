/**
 * @vscdc/game - Game content module
 *
 * This package defines the specific game content: entities, items,
 * rules, and content. It depends on @vscdc/engine.
 */

import { ENGINE_VERSION, GameEngine, Enemy, Position } from "@vscdc/engine";
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

// Re-export entity types from engine
export type { Enemy, Position } from "@vscdc/engine";

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
 * Result of a player action
 */
export interface ActionResult {
  /** Whether any action occurred */
  success: boolean;
  /** Type of action that occurred */
  actionType: "move" | "attack" | "blocked";
  /** If an attack occurred, the target entity */
  attackTarget?: Enemy;
  /** If an attack occurred, was the target destroyed */
  targetDestroyed?: boolean;
}

/**
 * Game session that combines the engine with a level
 */
export interface GameSession {
  engine: GameEngine;
  level: Level;
  /** Move player in a direction, respects wall collision and attacks enemies */
  movePlayer: (dx: number, dy: number) => ActionResult;
  /** Get current player stats */
  getPlayerStats: () => PlayerStats;
  /** Get all entities in the game */
  getEntities: () => Enemy[];
  /** Get entity at a specific position */
  getEntityAt: (position: Position) => Enemy | undefined;
}

// ============================================
// Entity Factories
// ============================================

let entityIdCounter = 0;

/**
 * Creates a unique entity ID
 */
function generateEntityId(prefix: string): string {
  return `${prefix}_${++entityIdCounter}`;
}

/**
 * Creates a target dummy enemy at the specified position
 * Target dummies are stationary enemies used for testing combat
 * 
 * @param position The position to place the target dummy
 * @returns A new target dummy enemy entity
 */
export function createTargetDummy(position: Position): Enemy {
  return {
    id: generateEntityId("target_dummy"),
    name: "Target Dummy",
    type: "target_dummy",
    position: { ...position },
    displayChar: "D",
    color: "brown",
    health: { current: 3, max: 3 },
  };
}

/**
 * Creates a new game instance with the test level
 */
export function createGame(): GameSession {
  // Reset entity ID counter for consistent IDs in tests
  entityIdCounter = 0;

  // Create engine with dev tools disabled for production
  const engine = new GameEngine({ enableDevTools: false });
  const level = createTestLevel();

  // Set player to starting position
  engine.movePlayerTo(level.playerStart.x, level.playerStart.y);

  // Add a target dummy to the level at position (2, 2)
  const targetDummy = createTargetDummy({ x: 2, y: 2 });
  engine.addEntity(targetDummy);

  /**
   * Attempts to move the player by the given offset.
   * If an enemy is at the target position, attacks instead.
   * Returns the result of the action.
   */
  function movePlayer(dx: number, dy: number): ActionResult {
    const pos = engine.getPlayerPosition();
    const newX = pos.x + dx;
    const newY = pos.y + dy;
    const targetPosition = { x: newX, y: newY };

    // Check if there's an enemy at the target position
    const entityAtTarget = engine.getEntityAt(targetPosition);
    if (entityAtTarget) {
      // Attack the entity instead of moving
      const attackResult = engine.attack(entityAtTarget.id);
      return {
        success: attackResult.hit,
        actionType: "attack",
        attackTarget: entityAtTarget,
        targetDestroyed: attackResult.targetDestroyed,
      };
    }

    // No enemy, try to move
    if (isWalkable(level, newX, newY)) {
      engine.movePlayerBy(dx, dy);
      return {
        success: true,
        actionType: "move",
      };
    }

    // Blocked by wall or out of bounds
    return {
      success: false,
      actionType: "blocked",
    };
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

  /**
   * Gets all entities in the game
   */
  function getEntities(): Enemy[] {
    return engine.getEntities();
  }

  /**
   * Gets an entity at a specific position
   */
  function getEntityAt(position: Position): Enemy | undefined {
    return engine.getEntityAt(position);
  }

  return {
    engine,
    level,
    movePlayer,
    getPlayerStats,
    getEntities,
    getEntityAt,
  };
}
