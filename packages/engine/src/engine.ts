/**
 * Game Engine - Main API for the roguelike engine
 */

import { Store } from "@reduxjs/toolkit";
import { createGameStore, CreateStoreOptions } from "./store";
import { GameState } from "./types";
import { movePlayer, movePlayerBy } from "./playerSlice";
import { incrementTurn } from "./gameSlice";
import { GameEventType, AnyGameEvent } from "./events";
import { EventHandler } from "./eventMiddleware";

/**
 * Main game engine class
 * Provides a clean API for interacting with the game state
 */
export class GameEngine {
  private store: Store<GameState>;
  private eventHandlers: Map<GameEventType, Set<EventHandler>>;

  constructor(options: CreateStoreOptions = {}) {
    this.store = createGameStore(options);
    // Access event handlers from store
    this.eventHandlers = (this.store as any)._eventHandlers;
  }

  /**
   * Subscribe to state changes
   * @param callback Function called whenever state changes
   * @returns Unsubscribe function
   */
  public onStateChanged(callback: (state: GameState) => void): () => void {
    return this.store.subscribe(() => {
      callback(this.store.getState());
    });
  }

  /**
   * Subscribe to specific game events
   * @param eventType The type of event to listen for
   * @param handler Function called when the event occurs
   * @returns Unsubscribe function
   */
  public onEvent(eventType: GameEventType, handler: EventHandler): () => void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.add(handler);
      return () => {
        handlers.delete(handler);
      };
    }
    return () => {};
  }

  /**
   * Get the current game state
   */
  public getState(): GameState {
    return this.store.getState();
  }

  /**
   * Move the player to a specific position
   */
  public movePlayerTo(x: number, y: number): void {
    this.store.dispatch(movePlayer({ x, y }));
    this.store.dispatch(incrementTurn());
  }

  /**
   * Move the player by a relative offset
   */
  public movePlayerBy(dx: number, dy: number): void {
    this.store.dispatch(movePlayerBy({ dx, dy }));
    this.store.dispatch(incrementTurn());
  }

  /**
   * Get the player's current position
   */
  public getPlayerPosition(): { x: number; y: number } {
    return { ...this.store.getState().player.position };
  }

  /**
   * Get the current turn count
   */
  public getTurnCount(): number {
    return this.store.getState().game.turnCount;
  }

  /**
   * Get the player's name
   */
  public getPlayerName(): string {
    return this.store.getState().player.name;
  }

  /**
   * Get the player's health stats
   */
  public getPlayerHealth(): { current: number; max: number } {
    const health = this.store.getState().player.health;
    return { current: health.current, max: health.max };
  }
}
