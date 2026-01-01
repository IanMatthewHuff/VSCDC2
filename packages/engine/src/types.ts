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
 * State for all entities in the game
 */
export interface EntityState {
  /** Map of entity IDs to entities */
  entities: Record<string, Enemy>;
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
}
