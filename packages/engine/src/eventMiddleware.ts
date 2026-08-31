/**
 * Event middleware - emits game events when state changes occur
 */

import { Middleware } from "@reduxjs/toolkit";
import { GameState, Enemy } from "./types";
import {
  GameEventType,
  PlayerMovedEvent,
  TurnAdvancedEvent,
  StateChangedEvent,
  AttackEvent,
  EntityDestroyedEvent,
  EnvironmentEnteredEvent,
  EnvironmentDamageEvent,
  EquipmentEquippedEvent,
  EquipmentUnequippedEvent,
  ExperienceGainedEvent,
  LevelUpEvent,
  StatPointSpentEvent,
  FloorDescendedEvent,
  AnyGameEvent,
} from "./events";
import { selectEnvironmentAt } from "./environmentSlice";

/**
 * Event handler callback type
 */
export type EventHandler = (event: AnyGameEvent) => void;

/**
 * Pending attack event to be emitted after state update
 */
interface PendingAttack {
  attackerId: string;
  attackerName: string;
  targetId: string;
  targetName: string;
  damage: number;
}

/**
 * Pending environment damage event to be emitted after state update
 */
interface PendingEnvironmentDamage {
  characterId: string;
  characterName: string;
  environmentType: string;
  damage: number;
}

/**
 * Pending experience gain event to be emitted after state update
 */
interface PendingExperienceGain {
  amount: number;
  source: string;
}

/**
 * Pending stat point spent event to be emitted after state update
 */
interface PendingStatPointSpent {
  stat: string;
}

/**
 * Store for pending attack events (filled by action, emitted by middleware)
 */
let pendingAttacks: PendingAttack[] = [];

/**
 * Store for pending environment damage events
 */
let pendingEnvironmentDamages: PendingEnvironmentDamage[] = [];

/**
 * Store for pending experience gain events
 */
let pendingExperienceGains: PendingExperienceGain[] = [];

/**
 * Store for pending stat point spent events
 */
let pendingStatPointsSpent: PendingStatPointSpent[] = [];

/**
 * Queue an attack event to be emitted after the action is processed
 */
export function queueAttackEvent(attack: PendingAttack): void {
  pendingAttacks.push(attack);
}

/**
 * Queue an environment damage event to be emitted after the action is processed
 */
export function queueEnvironmentDamageEvent(damage: PendingEnvironmentDamage): void {
  pendingEnvironmentDamages.push(damage);
}

/**
 * Queue an experience gain event to be emitted after the action is processed
 */
export function queueExperienceGainEvent(gain: PendingExperienceGain): void {
  pendingExperienceGains.push(gain);
}

/**
 * Queue a stat point spent event to be emitted after the action is processed
 */
export function queueStatPointSpentEvent(spent: PendingStatPointSpent): void {
  pendingStatPointsSpent.push(spent);
}

/**
 * Creates middleware that emits game events
 */
export function createEventMiddleware(
  eventHandlers: Map<GameEventType, Set<EventHandler>>
): Middleware<object, GameState> {
  return (store) => (next) => (action) => {
    const prevState = store.getState();
    
    // Track entities that existed before the action
    const prevEntities = { ...prevState.entities.entities };
    
    const result = next(action);
    const nextState = store.getState();
    const floorChanged = prevState.game.currentFloor !== nextState.game.currentFloor;

    // Emit player moved event
    if (
      prevState.player.position.x !== nextState.player.position.x ||
      prevState.player.position.y !== nextState.player.position.y
    ) {
      const event: PlayerMovedEvent = {
        type: GameEventType.PLAYER_MOVED,
        timestamp: Date.now(),
        oldPosition: { ...prevState.player.position },
        newPosition: { ...nextState.player.position },
      };
      emitEvent(eventHandlers, event);

      // Check if player entered an environment
      const environment = selectEnvironmentAt(
        nextState.environments,
        nextState.player.position
      );
      if (environment) {
        const envEnteredEvent: EnvironmentEnteredEvent = {
          type: GameEventType.ENVIRONMENT_ENTERED,
          timestamp: Date.now(),
          characterId: nextState.player.id,
          characterName: nextState.player.name,
          environmentId: environment.id,
          environmentType: environment.type,
          position: { ...nextState.player.position },
        };
        emitEvent(eventHandlers, envEnteredEvent);
      }
    }

    // Emit turn advanced event
    if (prevState.game.turnCount !== nextState.game.turnCount) {
      const event: TurnAdvancedEvent = {
        type: GameEventType.TURN_ADVANCED,
        timestamp: Date.now(),
        turnCount: nextState.game.turnCount,
      };
      emitEvent(eventHandlers, event);
    }

    // Emit floor descended event
    if (floorChanged) {
      const event: FloorDescendedEvent = {
        type: GameEventType.FLOOR_DESCENDED,
        timestamp: Date.now(),
        previousFloor: prevState.game.currentFloor,
        newFloor: nextState.game.currentFloor,
      };
      emitEvent(eventHandlers, event);
    }

    // Emit attack events for any pending attacks
    for (const attack of pendingAttacks) {
      // Check if target is an entity or the player
      const targetEntity = nextState.entities.entities[attack.targetId];
      const isTargetPlayer = attack.targetId === nextState.player.id;
      
      const attackEvent: AttackEvent = {
        type: GameEventType.ATTACK,
        timestamp: Date.now(),
        attackerId: attack.attackerId,
        attackerName: attack.attackerName,
        targetId: attack.targetId,
        targetName: attack.targetName,
        damage: attack.damage,
        targetRemainingHp: isTargetPlayer 
          ? nextState.player.health.current 
          : (targetEntity?.health.current ?? 0),
        targetMaxHp: isTargetPlayer 
          ? nextState.player.health.max 
          : (targetEntity?.health.max ?? 0),
      };
      emitEvent(eventHandlers, attackEvent);
    }
    pendingAttacks = [];

    // Emit environment damage events for any pending damage
    for (const envDamage of pendingEnvironmentDamages) {
      const damageEvent: EnvironmentDamageEvent = {
        type: GameEventType.ENVIRONMENT_DAMAGE,
        timestamp: Date.now(),
        characterId: envDamage.characterId,
        characterName: envDamage.characterName,
        environmentType: envDamage.environmentType,
        damage: envDamage.damage,
        remainingHp: nextState.player.health.current,
        maxHp: nextState.player.health.max,
      };
      emitEvent(eventHandlers, damageEvent);
    }
    pendingEnvironmentDamages = [];

    // Emit experience gain events for any pending gains
    for (const xpGain of pendingExperienceGains) {
      const xpEvent: ExperienceGainedEvent = {
        type: GameEventType.EXPERIENCE_GAINED,
        timestamp: Date.now(),
        amount: xpGain.amount,
        newTotal: nextState.player.experience,
        source: xpGain.source,
      };
      emitEvent(eventHandlers, xpEvent);
    }
    pendingExperienceGains = [];

    // Emit stat point spent events for any pending spends
    for (const statSpent of pendingStatPointsSpent) {
      let newValue: number;
      switch (statSpent.stat) {
        case "maxHealth":
          newValue = nextState.player.health.max;
          break;
        case "attack":
          newValue = nextState.player.baseAttack;
          break;
        case "defense":
          newValue = nextState.player.baseDefense;
          break;
        default:
          newValue = 0;
      }
      const statEvent: StatPointSpentEvent = {
        type: GameEventType.STAT_POINT_SPENT,
        timestamp: Date.now(),
        stat: statSpent.stat,
        newValue,
        remainingPoints: nextState.player.statPoints,
      };
      emitEvent(eventHandlers, statEvent);
    }
    pendingStatPointsSpent = [];

    // Emit level up event if level changed
    if (prevState.player.level !== nextState.player.level) {
      const levelUpEvent: LevelUpEvent = {
        type: GameEventType.LEVEL_UP,
        timestamp: Date.now(),
        newLevel: nextState.player.level,
        statPointsGained: nextState.player.statPoints - prevState.player.statPoints + 
          (prevState.player.statPoints > nextState.player.statPoints ? 0 : 0), // Points gained this level
      };
      emitEvent(eventHandlers, levelUpEvent);
    }

    // Check for destroyed entities (entities that were removed)
    for (const [entityId, entity] of Object.entries(prevEntities)) {
      if (!floorChanged && !nextState.entities.entities[entityId]) {
        // Entity was removed, check if it was destroyed (HP <= 0)
        // We emit this when entity is removed
        const destroyedEvent: EntityDestroyedEvent = {
          type: GameEventType.ENTITY_DESTROYED,
          timestamp: Date.now(),
          entityId: entityId,
          entityName: (entity as Enemy).name,
          // For now assume player destroyed it
          destroyedById: nextState.player.id,
          destroyedByName: nextState.player.name,
        };
        emitEvent(eventHandlers, destroyedEvent);
      }
    }

    // Check for equipment changes
    const prevEquipment = prevState.player.equipment;
    const nextEquipment = nextState.player.equipment;
    const slots = ["armor", "head", "leftArm", "rightArm"] as const;
    
    for (const slot of slots) {
      const prevItem = prevEquipment[slot];
      const nextItem = nextEquipment[slot];
      
      // Item was unequipped (had item before, doesn't now or different item)
      if (prevItem && (!nextItem || prevItem.id !== nextItem.id)) {
        const unequipEvent: EquipmentUnequippedEvent = {
          type: GameEventType.EQUIPMENT_UNEQUIPPED,
          timestamp: Date.now(),
          itemId: prevItem.id,
          itemName: prevItem.name,
          slot: slot,
        };
        emitEvent(eventHandlers, unequipEvent);
      }
      
      // Item was equipped (has item now, didn't before or different item)
      if (nextItem && (!prevItem || prevItem.id !== nextItem.id)) {
        const equipEvent: EquipmentEquippedEvent = {
          type: GameEventType.EQUIPMENT_EQUIPPED,
          timestamp: Date.now(),
          itemId: nextItem.id,
          itemName: nextItem.name,
          slot: slot,
        };
        emitEvent(eventHandlers, equipEvent);
      }
    }

    // Always emit state changed event
    const stateChangedEvent: StateChangedEvent = {
      type: GameEventType.STATE_CHANGED,
      timestamp: Date.now(),
    };
    emitEvent(eventHandlers, stateChangedEvent);

    return result;
  };
}

/**
 * Helper to emit an event to all registered handlers
 */
function emitEvent(
  eventHandlers: Map<GameEventType, Set<EventHandler>>,
  event: AnyGameEvent
): void {
  const handlers = eventHandlers.get(event.type);
  if (handlers) {
    handlers.forEach((handler) => handler(event));
  }
}
