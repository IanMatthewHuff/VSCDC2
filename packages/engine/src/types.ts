/**
 * Core type definitions for the game engine
 */

/**
 * A position in the 2D game world
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Represents a stat with current and maximum values
 */
export interface Stat {
  current: number;
  max: number;
}

/**
 * Equipment slot types
 */
export enum EquipmentSlot {
  Armor = "armor",
}

/**
 * Item types
 */
export enum ItemType {
  Consumable = "consumable",
  Equipment = "equipment",
}

/**
 * Effect that can be applied when using an item
 */
export interface ItemEffect {
  /** Type of effect (e.g., "heal") */
  type: string;
  /** Amount of the effect (e.g., healing amount) */
  amount?: number;
}

/**
 * Base item interface
 */
export interface Item {
  id: string;
  name: string;
  type: ItemType;
  description?: string;
}

/**
 * Consumable item that can be used once
 */
export interface ConsumableItem extends Item {
  type: ItemType.Consumable;
  /** Effect to apply when used */
  effect: ItemEffect;
}

/**
 * Equipment item that can be equipped
 */
export interface EquipmentItem extends Item {
  type: ItemType.Equipment;
  /** Slot this equipment goes in */
  slot: EquipmentSlot;
  /** Attack bonus provided by this equipment */
  attack?: number;
  /** Defense bonus provided by this equipment */
  defense?: number;
}

/**
 * Player equipment state
 */
export interface PlayerEquipment {
  /** Equipped armor item, if any */
  armor: EquipmentItem | null;
  /** Consumable items in quick slots (max 3) */
  consumables: (ConsumableItem | null)[];
}

/**
 * Represents the player character
 */
export interface Player {
  id: string;
  name: string;
  position: Position;
  displayChar: string;
  color: string;
  health: Stat;
  /** Player's equipment */
  equipment: PlayerEquipment;
  /** Base attack value (before equipment bonuses) */
  baseAttack: number;
  /** Base defense value (before equipment bonuses) */
  baseDefense: number;
}

/**
 * Base entity interface for all game entities
 */
export interface Entity {
  id: string;
  name: string;
  position: Position;
  displayChar: string;
  color: string;
}

/**
 * An entity that can participate in combat (has health)
 */
export interface CombatEntity extends Entity {
  health: Stat;
}

/**
 * An enemy entity that can be attacked by the player
 */
export interface Enemy extends CombatEntity {
  /** Type identifier for the enemy */
  type: string;
}

/**
 * An NPC entity that can interact with the player through dialog
 * NPCs are combat entities but cannot be directly attacked
 */
export interface NPC extends CombatEntity {
  /** Type identifier for the NPC */
  type: string;
  /** Whether this NPC can be attacked by the player */
  canBeAttacked: boolean;
}

/**
 * State for all entities in the game
 */
export interface EntityState {
  /** Map of entity IDs to enemy entities */
  entities: Record<string, Enemy>;
  /** Map of entity IDs to NPC entities */
  npcs: Record<string, NPC>;
}

/**
 * An environment effect that exists at a specific position
 */
export interface Environment {
  /** Unique identifier for this environment instance */
  id: string;
  /** Type of environment (e.g., "lava", "water", "poison") */
  type: string;
  /** Position where this environment exists */
  position: Position;
  /** Color for visual representation (used for UI highlighting/decorations) */
  color: string;
}

/**
 * State for all environments in the game
 */
export interface EnvironmentState {
  /** Map of position keys (x,y) to environment */
  environments: Record<string, Environment>;
}

/**
 * Game-specific state (not player)
 */
export interface Game {
  turnCount: number;
}

/**
 * Root game state managed by Redux
 */
export interface GameState {
  player: Player;
  game: Game;
  entities: EntityState;
  environments: EnvironmentState;
}
