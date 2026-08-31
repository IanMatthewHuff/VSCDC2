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
  GameEventType,
  EntityDestroyedEvent,
  SeededRandom,
  Rect,
} from "@vscdc/engine";
import { createTestLevel, createGeneratedLevel, isWalkable, Level } from "./level";
import { initializeNPCDialogs, createSage, resetNPCIdCounter } from "./npcs";
import { getDialogHandler } from "./dialog";
import { initializeEnvironmentEffects, createLavaEnvironment, getEnvironmentEffect } from "./environments";
import { createGoblin, resetEnemyIdCounter, getEnemyXpReward } from "./enemies";
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
  createGeneratedLevel,
  isInBounds,
  getTileAt,
  isWalkable,
} from "./level";
export type { Tile, Level } from "./level";

// Re-export engine dungeon types
export type { Rect } from "@vscdc/engine";

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
export { createGoblin, getEnemyXpReward, BASE_ENEMY_XP } from "./enemies";

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
  /** Player's current level */
  level: number;
  /** Current experience points */
  experience: number;
  /** XP required for next level */
  experienceToNextLevel: number;
  /** Unspent stat points available */
  statPoints: number;
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
 * Result of attempting to descend to the next dungeon floor.
 */
export interface DescendFloorResult {
  /** Whether the floor transition occurred */
  success: boolean;
  /** Current floor after the attempt */
  currentFloor: number;
  /** Why descent failed */
  reason?: "not-on-stairs" | "unavailable";
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
  /** Descend when standing on downward stairs */
  descendFloor: () => DescendFloorResult;
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
    level: 1,
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
 * Options for creating a dungeon crawl session
 */
export interface CreateDungeonCrawlOptions {
  /** Seed for deterministic dungeon generation */
  seed?: number;
}

interface FloorTransition {
  createLevel: (floorNumber: number) => Level;
  populateLevel: (level: Level, floorNumber: number) => void;
}

/**
 * Builds a GameSession from an engine and level.
 * Shared by both createGame() and createDungeonCrawl().
 */
function buildGameSession(
  engine: GameEngine,
  initialLevel: Level,
  floorTransition?: FloorTransition
): GameSession {
  let currentLevel = initialLevel;

  function movePlayer(dx: number, dy: number): ActionResult {
    const pos = engine.getPlayerPosition();
    const newX = pos.x + dx;
    const newY = pos.y + dy;
    const targetPosition = { x: newX, y: newY };

    // Check if there's an NPC at the target position
    const npcAtTarget = engine.getNPCAt(targetPosition);
    if (npcAtTarget) {
      return {
        success: true,
        actionType: "interact",
        interactTarget: npcAtTarget,
      };
    }

    // Check if there's an enemy at the target position
    const entityAtTarget = engine.getEntityAt(targetPosition);
    if (entityAtTarget) {
      const attackResult = engine.attack(entityAtTarget.id);

      if (attackResult.targetDestroyed) {
        const xpReward = getEnemyXpReward(entityAtTarget);
        engine.grantExperience(xpReward, `Defeated ${entityAtTarget.name}`);
      }

      processAllEnemyTurns(engine, currentLevel);

      return {
        success: attackResult.hit,
        actionType: "attack",
        attackTarget: entityAtTarget,
        targetDestroyed: attackResult.targetDestroyed,
      };
    }

    // No enemy or NPC, try to move
    if (isWalkable(currentLevel, newX, newY)) {
      engine.movePlayerBy(dx, dy);

      const environment = engine.getEnvironmentAt(targetPosition);
      if (environment) {
        const effect = getEnvironmentEffect(environment.type);
        if (effect && effect.triggersOnEntry && typeof effect.damage === "number") {
          engine.applyEnvironmentDamage(environment.type, effect.damage);
        }
      }

      processAllEnemyTurns(engine, currentLevel);

      return {
        success: true,
        actionType: "move",
      };
    }

    return {
      success: false,
      actionType: "blocked",
    };
  }

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
      level: engine.getPlayerLevel(),
      experience: engine.getPlayerExperience(),
      experienceToNextLevel: engine.getXpForNextLevel(),
      statPoints: engine.getPlayerStatPoints(),
    };
  }

  function getEntities(): Enemy[] {
    return engine.getEntities();
  }

  function getEntityAt(position: Position): Enemy | undefined {
    return engine.getEntityAt(position);
  }

  function getNPCs(): NPC[] {
    return engine.getNPCs();
  }

  function getNPCAt(position: Position): NPC | undefined {
    return engine.getNPCAt(position);
  }

  function getEnvironments(): Environment[] {
    return engine.getEnvironments();
  }

  function getEnvironmentAt(position: Position): Environment | undefined {
    return engine.getEnvironmentAt(position);
  }

  function useConsumable(slot: number): void {
    engine.useConsumableItem(slot);
  }

  function removeConsumable(slot: number): void {
    engine.removeConsumableItem(slot);
  }

  function onEquipmentChanged(): void {
    processAllEnemyTurns(engine, currentLevel);
  }

  function descendToNextFloor(): DescendFloorResult {
    const stairsDown = currentLevel.stairsDown;
    if (!floorTransition || !stairsDown) {
      return {
        success: false,
        currentFloor: engine.getCurrentFloor(),
        reason: "unavailable",
      };
    }

    const playerPosition = engine.getPlayerPosition();
    if (
      playerPosition.x !== stairsDown.x ||
      playerPosition.y !== stairsDown.y
    ) {
      return {
        success: false,
        currentFloor: engine.getCurrentFloor(),
        reason: "not-on-stairs",
      };
    }

    const nextFloorNumber = engine.getCurrentFloor() + 1;
    const nextLevel = floorTransition.createLevel(nextFloorNumber);

    currentLevel = nextLevel;
    engine.healPlayerBy(engine.getPlayerHealth().max);
    engine.descendFloor(nextLevel.playerStart);
    floorTransition.populateLevel(nextLevel, nextFloorNumber);

    return {
      success: true,
      currentFloor: nextFloorNumber,
    };
  }

  return {
    engine,
    get level(): Level {
      return currentLevel;
    },
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
    descendFloor: descendToNextFloor,
  };
}

const FLOOR_SEED_INCREMENT = 0x9e3779b9;
const PLACEMENT_SEED_MASK = 0x51f15e5d;

function deriveFloorSeed(baseSeed: number, floorNumber: number): number {
  return (baseSeed + Math.imul(floorNumber - 1, FLOOR_SEED_INCREMENT)) | 0;
}

function positionsEqual(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y;
}

function roomCenter(room: Rect): Position {
  return {
    x: Math.floor(room.x + room.width / 2),
    y: Math.floor(room.y + room.height / 2),
  };
}

function shufflePositions(positions: Position[], rng: SeededRandom): Position[] {
  const shuffled = positions.map((position) => ({ ...position }));
  for (let index = shuffled.length - 1; index > 0; index--) {
    const swapIndex = rng.nextInt(0, index);
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }
  return shuffled;
}

function populateDungeonFloor(
  engine: GameEngine,
  level: Level,
  floorNumber: number,
  floorSeed: number
): void {
  const stairsDown = level.stairsDown;
  const availablePositions = (level.rooms ?? [])
    .map(roomCenter)
    .filter((position) => !positionsEqual(position, level.playerStart))
    .filter((position) => !stairsDown || !positionsEqual(position, stairsDown));
  const placementRng = new SeededRandom(floorSeed ^ PLACEMENT_SEED_MASK);
  const shuffledPositions = shufflePositions(availablePositions, placementRng);
  const enemyCount = Math.min(floorNumber, shuffledPositions.length);

  for (const position of shuffledPositions.slice(0, enemyCount)) {
    engine.addEntity(createGoblin(position));
  }

  const lavaPosition = shuffledPositions[enemyCount];
  if (lavaPosition) {
    engine.addEnvironment(createLavaEnvironment(lavaPosition));
  }
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

  // Give player starting XP so killing the goblin triggers a level up
  // Goblin gives 20 XP, player needs 100 XP to level up, so start with 80 XP
  engine.grantExperience(80, "Starting experience");

  return buildGameSession(engine, level);
}

/**
 * Creates a new dungeon crawl session with a procedurally generated level
 */
export function createDungeonCrawl(options: CreateDungeonCrawlOptions = {}): GameSession {
  // Reset entity ID counters
  entityIdCounter = 0;
  resetNPCIdCounter();
  resetEnemyIdCounter();
  resetItemIdCounter();

  // Initialize environment effects
  initializeEnvironmentEffects();

  // Initialize dialog handlers
  initializeNPCDialogs();

  const baseSeed = options.seed ?? Date.now();
  const createFloor = (floorNumber: number): Level => {
    const floorSeed = deriveFloorSeed(baseSeed, floorNumber);
    return createGeneratedLevel(floorSeed, floorNumber);
  };
  const engine = new GameEngine({ enableDevTools: false });
  const level = createFloor(1);

  // Set player to the generated dungeon entry.
  engine.movePlayerTo(level.playerStart.x, level.playerStart.y);
  populateDungeonFloor(engine, level, 1, deriveFloorSeed(baseSeed, 1));

  // Give player the same starting equipment as createGame()
  const chainMail = createChainMailArmor();
  engine.equipArmorItem(chainMail);

  const club = createBasicClub();
  engine.equipRightArmItem(club);

  const healingPotion = createHealingPotion();
  engine.addConsumableItem(healingPotion, 0);

  const ironSword = createIronSword();
  engine.addToInventory(ironSword);

  const inventoryPotion1 = createHealingPotion();
  const inventoryPotion2 = createHealingPotion();
  engine.addToInventory(inventoryPotion1);
  engine.addToInventory(inventoryPotion2);

  return buildGameSession(engine, level, {
    createLevel: createFloor,
    populateLevel: (nextLevel, floorNumber) => {
      populateDungeonFloor(
        engine,
        nextLevel,
        floorNumber,
        deriveFloorSeed(baseSeed, floorNumber)
      );
    },
  });
}
