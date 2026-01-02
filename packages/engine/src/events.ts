/**
 * Game event types that can be emitted by the engine
 */

export enum GameEventType {
  PLAYER_MOVED = "player_moved",
  TURN_ADVANCED = "turn_advanced",
  STATE_CHANGED = "state_changed",
  ATTACK = "attack",
  ENTITY_DESTROYED = "entity_destroyed",
  NPC_INTERACTION = "npc_interaction",
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
 * Event emitted when an attack occurs
 */
export interface AttackEvent extends GameEvent {
  type: GameEventType.ATTACK;
  attackerId: string;
  attackerName: string;
  targetId: string;
  targetName: string;
  damage: number;
  targetRemainingHp: number;
  targetMaxHp: number;
}

/**
 * Event emitted when an entity is destroyed
 */
export interface EntityDestroyedEvent extends GameEvent {
  type: GameEventType.ENTITY_DESTROYED;
  entityId: string;
  entityName: string;
  destroyedById: string;
  destroyedByName: string;
}

/**
 * Event emitted when the player interacts with an NPC
 */
export interface NPCInteractionEvent extends GameEvent {
  type: GameEventType.NPC_INTERACTION;
  playerId: string;
  playerName: string;
  npcId: string;
  npcName: string;
}

/**
 * Union type of all possible game events
 */
export type AnyGameEvent =
  | PlayerMovedEvent
  | TurnAdvancedEvent
  | StateChangedEvent
  | AttackEvent
  | EntityDestroyedEvent
  | NPCInteractionEvent;
