/**
 * @vscdc/engine - Core roguelike game engine
 *
 * This package provides the core game engine with no UI code
 * and no game-specific logic.
 */

export const ENGINE_VERSION = "0.0.1";

// Export main engine class
export { GameEngine } from "./engine";
export type { AttackResult } from "./engine";

// Export types
export type {
  GameState,
  Player,
  Position,
  Stat,
  Entity,
  CombatEntity,
  Enemy,
  NPC,
  EntityState,
  Environment,
  EnvironmentState,
  Item,
  ItemType,
  ItemEffect,
  ConsumableItem,
  EquipmentItem,
  EquipmentSlot,
  PlayerEquipment,
} from "./types";
export { ItemType as ItemTypeEnum, EquipmentSlot as EquipmentSlotEnum, DEFAULT_INVENTORY_CAPACITY } from "./types";
export type { CreateStoreOptions } from "./store";
export { GameEventType } from "./events";
export type {
  GameEvent,
  PlayerMovedEvent,
  TurnAdvancedEvent,
  StateChangedEvent,
  AttackEvent,
  EntityDestroyedEvent,
  NPCInteractionEvent,
  EnvironmentEnteredEvent,
  EnvironmentDamageEvent,
  EquipmentEquippedEvent,
  EquipmentUnequippedEvent,
  ExperienceGainedEvent,
  LevelUpEvent,
  StatPointSpentEvent,
  AnyGameEvent,
} from "./events";

// Export action creators for advanced usage
export { 
  movePlayer, 
  movePlayerBy, 
  damagePlayer, 
  healPlayer,
  equipArmor,
  unequipArmor,
  equipHead,
  unequipHead,
  equipLeftArm,
  unequipLeftArm,
  equipRightArm,
  unequipRightArm,
  addToInventory,
  removeFromInventory,
  setInventoryCapacity,
  addConsumable,
  removeConsumable,
  grantExperience,
  spendStatPoint,
  getXpForNextLevel,
  BASE_XP_PER_LEVEL,
  STAT_POINTS_PER_LEVEL,
  HP_PER_POINT,
  ATTACK_PER_POINT,
  DEFENSE_PER_POINT,
} from "./playerSlice";
export type { StatType } from "./playerSlice";
export { incrementTurn, resetTurn } from "./gameSlice";
export { addEntity, damageEntity, removeEntity, clearEntities, addNPC, removeNPC, clearNPCs } from "./entitySlice";
export { addEnvironment, removeEnvironment, clearEnvironments } from "./environmentSlice";

// Export seeded random
export { SeededRandom } from "./random";

// Export dungeon generator
export { generateDungeon } from "./dungeonGenerator";
export type { Rect, DungeonConfig, GeneratedDungeon } from "./dungeonGenerator";
