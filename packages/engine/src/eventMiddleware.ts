/**
 * Event middleware - emits game events when state changes occur
 */

import { Middleware } from "@reduxjs/toolkit";
import { GameState } from "./types";
import {
  GameEventType,
  PlayerMovedEvent,
  TurnAdvancedEvent,
  StateChangedEvent,
  AnyGameEvent,
} from "./events";

/**
 * Event handler callback type
 */
export type EventHandler = (event: AnyGameEvent) => void;

/**
 * Creates middleware that emits game events
 */
export function createEventMiddleware(
  eventHandlers: Map<GameEventType, Set<EventHandler>>
): Middleware<{}, GameState> {
  return (store) => (next) => (action) => {
    const prevState = store.getState();
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
