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
 * Represents the player character
 */
export interface Player {
  id: string;
  name: string;
  position: Position;
  displayChar: string;
  color: string;
  health: Stat;
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
  /** Display character for rendering */
  displayChar: string;
  /** Color for visual representation */
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
