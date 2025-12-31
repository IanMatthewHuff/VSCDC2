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
 * Represents the player character
 */
export interface Player {
  id: string;
  position: Position;
  displayChar: string;
  color: string;
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
}
