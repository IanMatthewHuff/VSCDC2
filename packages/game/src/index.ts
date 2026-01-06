/**
 * @vscdc/game - Game content module
 *
 * This package defines the specific game content: entities, items,
 * rules, and content. It depends on @vscdc/engine.
 */

import { ENGINE_VERSION, GameEngine, Enemy, NPC, Position, Environment } from "@vscdc/engine";
import { createTestLevel, isWalkable, Level } from "./level";
import { initializeNPCDialogs, createSage, resetNPCIdCounter } from "./npcs";
import { getDialogHandler } from "./dialog";
import { initializeEnvironmentEffects, createLavaEnvironment } from "./environments";

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
export type { Enemy, NPC, Position, Environment } from "@vscdc/engine";

// Re-export NPC and dialog types
export { createSage, initializeNPCDialogs } from "./npcs";
export { getDialogHandler } from "./dialog";
export type { DialogTree, DialogNode, DialogOption, DialogHandler } from "./dialog";

// Re-export environment types and utilities
export {
  EnvironmentType,
  createLavaEnvironment,
  initializeEnvironmentEffects,
  getEnvironmentEffect,
} from "./environments";
export type { EnvironmentEffect } from "./environments";

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
  actionType: "move" | "attack" | "blocked" | "interact";
  /** If an attack occurred, the target entity */
  attackTarget?: Enemy;
  /** If an attack occurred, was the target destroyed */
  targetDestroyed?: boolean;
  /** If an interaction occurred, the NPC that was interacted with */
  interactTarget?: NPC;
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
  /** Get all NPCs in the game */
  getNPCs: () => NPC[];
  /** Get NPC at a specific position */
  getNPCAt: (position: Position) => NPC | undefined;
  /** Get all environments in the game */
  getEnvironments: () => Environment[];
  /** Get environment at a specific position */
  getEnvironmentAt: (position: Position) => Environment | undefined;
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
  resetNPCIdCounter();

  // Initialize environment effects
  initializeEnvironmentEffects();

  // Initialize dialog handlers
  initializeNPCDialogs();

  // Create engine with dev tools disabled for production
  const engine = new GameEngine({ enableDevTools: false });
  const level = createTestLevel();

  // Set player to starting position
  engine.movePlayerTo(level.playerStart.x, level.playerStart.y);

  // Add a target dummy to the level at position (2, 2)
  const targetDummy = createTargetDummy({ x: 2, y: 2 });
  engine.addEntity(targetDummy);

  // Add the Sage NPC to the level at position (1, 2)
  // This position avoids the target dummy at (2,2) and movement test paths
  const sage = createSage({ x: 1, y: 2 });
  engine.addNPC(sage);

  // Add lava environments at positions (4, 1) and (4, 2)
  const lava1 = createLavaEnvironment({ x: 4, y: 1 });
  const lava2 = createLavaEnvironment({ x: 4, y: 2 });
  engine.addEnvironment(lava1);
  engine.addEnvironment(lava2);

  /**
   * Attempts to move the player by the given offset.
   * If an NPC is at the target position, interacts instead.
   * If an enemy is at the target position, attacks instead.
   * Returns the result of the action.
   */
  function movePlayer(dx: number, dy: number): ActionResult {
    const pos = engine.getPlayerPosition();
    const newX = pos.x + dx;
    const newY = pos.y + dy;
    const targetPosition = { x: newX, y: newY };

    // Check if there's an NPC at the target position
    const npcAtTarget = engine.getNPCAt(targetPosition);
    if (npcAtTarget) {
      // Interact with the NPC instead of moving
      // The NPC interaction is handled by the UI layer, not here
      return {
        success: true,
        actionType: "interact",
        interactTarget: npcAtTarget,
      };
    }

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

    // No enemy or NPC, try to move
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

  /**
   * Gets all NPCs in the game
   */
  function getNPCs(): NPC[] {
    return engine.getNPCs();
  }

  /**
   * Gets an NPC at a specific position
   */
  function getNPCAt(position: Position): NPC | undefined {
    return engine.getNPCAt(position);
  }

  /**
   * Gets all environments in the game
   */
  function getEnvironments(): Environment[] {
    return engine.getEnvironments();
  }

  /**
   * Gets an environment at a specific position
   */
  function getEnvironmentAt(position: Position): Environment | undefined {
    return engine.getEnvironmentAt(position);
  }

  return {
    engine,
    level,
    movePlayer,
    getPlayerStats,
    getEntities,
    getEntityAt,
    getNPCs,
    getNPCAt,
    getEnvironments,
    getEnvironmentAt,
  };
}
