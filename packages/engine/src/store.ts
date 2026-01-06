/**
 * Store factory - creates and configures the Redux store
 */

import { configureStore, Store } from "@reduxjs/toolkit";
import playerReducer from "./playerSlice";
import gameReducer from "./gameSlice";
import entityReducer from "./entitySlice";
import environmentReducer from "./environmentSlice";
import { GameState } from "./types";
import { createEventMiddleware, EventHandler } from "./eventMiddleware";
import { GameEventType } from "./events";

/**
 * Options for creating a game store
 */
export interface CreateStoreOptions {
  /**
   * Whether to enable Redux DevTools
   * Should be false in production builds
   */
  enableDevTools?: boolean;
}

/**
 * Creates a new game store with all reducers and middleware configured
 * 
 * @param options Configuration options for the store
 * @returns Configured Redux store
 */
export function createGameStore(
  options: CreateStoreOptions = {}
): Store<GameState> {
  const { enableDevTools = false } = options;

  // Create event handler registry
  const eventHandlers = new Map<GameEventType, Set<EventHandler>>();

  // Initialize handler sets for all event types
  Object.values(GameEventType).forEach((eventType) => {
    eventHandlers.set(eventType, new Set());
  });

  const store = configureStore({
    reducer: {
      player: playerReducer,
      game: gameReducer,
      entities: entityReducer,
      environments: environmentReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(createEventMiddleware(eventHandlers)),
    devTools: enableDevTools,
  });

  // Attach event handler registry to store for external access
  (store as any)._eventHandlers = eventHandlers;

  return store;
}

/**
 * Helper type to extract the store type
 */
export type GameStore = ReturnType<typeof createGameStore>;

/**
 * Helper type to extract the dispatch type
 */
export type AppDispatch = GameStore["dispatch"];
