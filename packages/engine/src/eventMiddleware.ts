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
  AnyGameEvent,
} from "./events";

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
 * Store for pending attack events (filled by action, emitted by middleware)
 */
let pendingAttacks: PendingAttack[] = [];

/**
 * Queue an attack event to be emitted after the action is processed
 */
export function queueAttackEvent(attack: PendingAttack): void {
  pendingAttacks.push(attack);
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

    // Emit attack events for any pending attacks
    for (const attack of pendingAttacks) {
      const targetEntity = nextState.entities.entities[attack.targetId];
      const attackEvent: AttackEvent = {
        type: GameEventType.ATTACK,
        timestamp: Date.now(),
        attackerId: attack.attackerId,
        attackerName: attack.attackerName,
        targetId: attack.targetId,
        targetName: attack.targetName,
        damage: attack.damage,
        targetRemainingHp: targetEntity?.health.current ?? 0,
        targetMaxHp: targetEntity?.health.max ?? 0,
      };
      emitEvent(eventHandlers, attackEvent);
    }
    pendingAttacks = [];

    // Check for destroyed entities (entities that were removed)
    for (const [entityId, entity] of Object.entries(prevEntities)) {
      if (!nextState.entities.entities[entityId]) {
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
