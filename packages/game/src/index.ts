/**
 * @vscdc/game - Game content module
 *
 * This package defines the specific game content: entities, items,
 * rules, and content. It depends on @vscdc/engine.
 */

import { 
  ENGINE_VERSION, 
  GameEngine, 
  Enemy, 
  NPC, 
  Position, 
  Environment,
  ConsumableItem,
} from "@vscdc/engine";
import { createTestLevel, isWalkable, Level } from "./level";
import { initializeNPCDialogs, createSage, resetNPCIdCounter } from "./npcs";
import { getDialogHandler } from "./dialog";
import { initializeEnvironmentEffects, createLavaEnvironment, getEnvironmentEffect } from "./environments";
import { createGoblin, resetEnemyIdCounter } from "./enemies";
import { processAllEnemyTurns } from "./enemyAI";
import { 
  createHealingPotion, 
  createIronSword, 
  createChainMailArmor, 
  createBasicClub, 
  resetItemIdCounter 
} from "./items";

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
export type { 
  Enemy, 
  NPC, 
  Position, 
  Environment,
  ConsumableItem,
  EquipmentItem,
  PlayerEquipment,
} from "@vscdc/engine";
export { EquipmentSlotEnum, ItemTypeEnum } from "@vscdc/engine";

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

// Re-export enemy types and utilities
export { createGoblin } from "./enemies";

// Re-export item types and utilities
export { 
  createHealingPotion,
  createLeatherArmor,
  createIronSword,
  createIronHelmet,
  createWoodenShield,
  createChainMailArmor,
  createBasicClub,
} from "./items";

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
  attack: number;
  defense: number;
  equipment: {
    armor: string | null;
    consumables: (string | null)[];
  };
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
  /** Use a consumable item from a specific slot (0-2) */
  useConsumable: (slot: number) => void;
  /** Remove a consumable item from a specific slot (0-2) */
  removeConsumable: (slot: number) => void;
  /** Called after equipment changes to advance world state (triggers enemy turns) */
  onEquipmentChanged: () => void;
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
 * HP 6, Attack 0, Defense 1
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
    health: { current: 6, max: 6 },
    attack: 0,
    defense: 1,
  };
}

/**
 * Options for creating a game session
 */
export interface CreateGameOptions {
  /** Whether to exclude enemies that move and attack (default: false, enemies are included) */
  excludeEnemies?: boolean;
}

/**
 * Creates a new game instance with the test level
 */
export function createGame(options: CreateGameOptions = {}): GameSession {
  // Reset entity ID counters for consistent IDs in tests
  entityIdCounter = 0;
  resetNPCIdCounter();
  resetEnemyIdCounter();
  resetItemIdCounter();

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

  // Add a Goblin enemy unless excluded
  // Goblin is placed at (1, 1) in the top-left corner
  if (!options.excludeEnemies) {
    const goblin = createGoblin({ x: 1, y: 1 });
    engine.addEntity(goblin);
  }

  // Add the Sage NPC to the level at position (1, 2)
  // This position avoids the target dummy at (2,2) and movement test paths
  const sage = createSage({ x: 1, y: 2 });
  engine.addNPC(sage);

  // Add lava environment at position (4, 1)
  // This avoids the Sage (1,2), Target Dummy (2,2), and Player Start (3,3)
  const lava = createLavaEnvironment({ x: 4, y: 1 });
  engine.addEnvironment(lava);

  // Add starting equipment to the player
  // Chain mail armor equipped
  const chainMail = createChainMailArmor();
  engine.equipArmorItem(chainMail);

  // Basic club equipped in right hand
  const club = createBasicClub();
  engine.equipRightArmItem(club);

  // Add some starting items to the player's consumable slots
  // Add a healing potion to slot 0
  const healingPotion = createHealingPotion();
  engine.addConsumableItem(healingPotion, 0);

  // Add items to inventory
  // Iron sword (unequipped)
  const ironSword = createIronSword();
  engine.addToInventory(ironSword);

  // Two healing potions (unequipped)
  const inventoryPotion1 = createHealingPotion();
  const inventoryPotion2 = createHealingPotion();
  engine.addToInventory(inventoryPotion1);
  engine.addToInventory(inventoryPotion2);

  /**
   * Attempts to move the player by the given offset.
   * If an NPC is at the target position, interacts instead.
   * If an enemy is at the target position, attacks instead.
   * After a successful action, processes enemy turns.
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
      // NPC interaction does not trigger enemy turns
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
      
      // Process enemy turns after player attack
      processAllEnemyTurns(engine, level);
      
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

      // Check if player entered an environment and apply its effects
      const environment = engine.getEnvironmentAt(targetPosition);
      if (environment) {
        const effect = getEnvironmentEffect(environment.type);
        if (effect && effect.triggersOnEntry && typeof effect.damage === "number") {
          engine.applyEnvironmentDamage(environment.type, effect.damage);
        }
      }

      // Process enemy turns after player movement
      processAllEnemyTurns(engine, level);

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
    const equipment = engine.getPlayerEquipment();
    return {
      name: engine.getPlayerName(),
      health: engine.getPlayerHealth(),
      attack: engine.getPlayerAttack(),
      defense: engine.getPlayerDefense(),
      equipment: {
        armor: equipment.armor?.name || null,
        consumables: equipment.consumables.map((item) => item?.name || null),
      },
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

  /**
   * Uses a consumable item from a specific slot (0-2)
   */
  function useConsumable(slot: number): void {
    engine.useConsumableItem(slot);
  }

  /**
   * Removes a consumable item from a specific slot (0-2)
   */
  function removeConsumable(slot: number): void {
    engine.removeConsumableItem(slot);
  }

  /**
   * Called after any equipment change to advance the game world.
   * Equipment changes count as a player action, giving enemies a turn to respond.
   */
  function onEquipmentChanged(): void {
    processAllEnemyTurns(engine, level);
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
    useConsumable,
    removeConsumable,
    onEquipmentChanged,
  };
}
