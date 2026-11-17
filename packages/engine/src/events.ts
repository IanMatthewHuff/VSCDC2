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
  ENVIRONMENT_ENTERED = "environment_entered",
  ENVIRONMENT_DAMAGE = "environment_damage",
  EQUIPMENT_EQUIPPED = "equipment_equipped",
  EQUIPMENT_UNEQUIPPED = "equipment_unequipped",
  EXPERIENCE_GAINED = "experience_gained",
  LEVEL_UP = "level_up",
  STAT_POINT_SPENT = "stat_point_spent",
  FLOOR_DESCENDED = "floor_descended",
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
 * Event emitted when a character enters an environment
 */
export interface EnvironmentEnteredEvent extends GameEvent {
  type: GameEventType.ENVIRONMENT_ENTERED;
  characterId: string;
  characterName: string;
  environmentId: string;
  environmentType: string;
  position: { x: number; y: number };
}

/**
 * Event emitted when an environment deals damage to a character
 */
export interface EnvironmentDamageEvent extends GameEvent {
  type: GameEventType.ENVIRONMENT_DAMAGE;
  characterId: string;
  characterName: string;
  environmentType: string;
  damage: number;
  remainingHp: number;
  maxHp: number;
}

/**
 * Event emitted when equipment is equipped
 */
export interface EquipmentEquippedEvent extends GameEvent {
  type: GameEventType.EQUIPMENT_EQUIPPED;
  itemId: string;
  itemName: string;
  slot: string;
}

/**
 * Event emitted when equipment is unequipped
 */
export interface EquipmentUnequippedEvent extends GameEvent {
  type: GameEventType.EQUIPMENT_UNEQUIPPED;
  itemId: string;
  itemName: string;
  slot: string;
}

/**
 * Event emitted when experience is gained
 */
export interface ExperienceGainedEvent extends GameEvent {
  type: GameEventType.EXPERIENCE_GAINED;
  amount: number;
  newTotal: number;
  source: string;
}

/**
 * Event emitted when the player levels up
 */
export interface LevelUpEvent extends GameEvent {
  type: GameEventType.LEVEL_UP;
  newLevel: number;
  statPointsGained: number;
}

/**
 * Event emitted when a stat point is spent
 */
export interface StatPointSpentEvent extends GameEvent {
  type: GameEventType.STAT_POINT_SPENT;
  stat: string;
  newValue: number;
  remainingPoints: number;
}

/**
 * Event emitted when the player transitions to the next dungeon floor.
 */
export interface FloorDescendedEvent extends GameEvent {
  type: GameEventType.FLOOR_DESCENDED;
  previousFloor: number;
  newFloor: number;
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
  | NPCInteractionEvent
  | EnvironmentEnteredEvent
  | EnvironmentDamageEvent
  | EquipmentEquippedEvent
  | EquipmentUnequippedEvent
  | ExperienceGainedEvent
  | LevelUpEvent
  | StatPointSpentEvent
  | FloorDescendedEvent;
