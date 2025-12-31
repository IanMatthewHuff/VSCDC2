/**
 * Game event types that can be emitted by the engine
 */

export enum GameEventType {
  PLAYER_MOVED = "player_moved",
  TURN_ADVANCED = "turn_advanced",
  STATE_CHANGED = "state_changed",
}

/**
 * Base game event interface
 */
export interface GameEvent {
  type: GameEventType;
  timestamp: number;
}

/**
 * Event emitted when the player moves
 */
export interface PlayerMovedEvent extends GameEvent {
  type: GameEventType.PLAYER_MOVED;
  oldPosition: { x: number; y: number };
  newPosition: { x: number; y: number };
}

/**
 * Event emitted when a turn advances
 */
export interface TurnAdvancedEvent extends GameEvent {
  type: GameEventType.TURN_ADVANCED;
  turnCount: number;
}

/**
 * Event emitted when state changes
 */
export interface StateChangedEvent extends GameEvent {
  type: GameEventType.STATE_CHANGED;
}

/**
 * Union type of all possible game events
 */
export type AnyGameEvent = PlayerMovedEvent | TurnAdvancedEvent | StateChangedEvent;
