/**
 * Game Engine - Main API for the roguelike engine
 */

import { Store } from "@reduxjs/toolkit";
import { createGameStore, CreateStoreOptions } from "./store";
import { GameState, Enemy, NPC, Position } from "./types";
import { movePlayer, movePlayerBy } from "./playerSlice";
import { incrementTurn } from "./gameSlice";
import {
  addEntity,
  damageEntity,
  removeEntity,
  selectEntityAt,
  selectAllEntities,
  selectEntityById,
  addNPC,
  removeNPC,
  selectNPCAt,
  selectAllNPCs,
  selectNPCById,
} from "./entitySlice";
import { GameEventType, AnyGameEvent } from "./events";
import { EventHandler, queueAttackEvent } from "./eventMiddleware";

/**
 * Result of an attack action
 */
export interface AttackResult {
  /** Whether the attack was successful */
  hit: boolean;
  /** Amount of damage dealt */
  damage: number;
  /** Whether the target was destroyed */
  targetDestroyed: boolean;
  /** The target that was attacked */
  target: Enemy | undefined;
}

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

  // ============================================
  // Entity Management
  // ============================================

  /**
   * Add an enemy entity to the game
   */
  public addEntity(entity: Enemy): void {
    this.store.dispatch(addEntity({ entity }));
  }

  /**
   * Get all entities in the game
   */
  public getEntities(): Enemy[] {
    return selectAllEntities(this.store.getState().entities);
  }

  /**
   * Get an entity at a specific position
   */
  public getEntityAt(position: Position): Enemy | undefined {
    return selectEntityAt(this.store.getState().entities, position);
  }

  /**
   * Get an entity by its ID
   */
  public getEntityById(id: string): Enemy | undefined {
    return selectEntityById(this.store.getState().entities, id);
  }

  /**
   * Remove an entity from the game
   */
  public removeEntity(id: string): void {
    this.store.dispatch(removeEntity({ id }));
  }

  // ============================================
  // NPC Management
  // ============================================

  /**
   * Add an NPC entity to the game
   */
  public addNPC(npc: NPC): void {
    this.store.dispatch(addNPC({ npc }));
  }

  /**
   * Get all NPCs in the game
   */
  public getNPCs(): NPC[] {
    return selectAllNPCs(this.store.getState().entities);
  }

  /**
   * Get an NPC at a specific position
   */
  public getNPCAt(position: Position): NPC | undefined {
    return selectNPCAt(this.store.getState().entities, position);
  }

  /**
   * Get an NPC by its ID
   */
  public getNPCById(id: string): NPC | undefined {
    return selectNPCById(this.store.getState().entities, id);
  }

  /**
   * Remove an NPC from the game
   */
  public removeNPC(id: string): void {
    this.store.dispatch(removeNPC({ id }));
  }

  // ============================================
  // Combat
  // ============================================

  /**
   * Attack an entity by ID
   * @param targetId The ID of the entity to attack
   * @param damage The amount of damage to deal (default: 1)
   * @returns Result of the attack
   */
  public attack(targetId: string, damage: number = 1): AttackResult {
    const target = this.getEntityById(targetId);

    if (!target) {
      return {
        hit: false,
        damage: 0,
        targetDestroyed: false,
        target: undefined,
      };
    }

    const player = this.store.getState().player;

    // Queue the attack event before dispatching
    queueAttackEvent({
      attackerId: player.id,
      attackerName: player.name,
      targetId: target.id,
      targetName: target.name,
      damage: damage,
    });

    // Deal damage
    this.store.dispatch(damageEntity({ id: targetId, amount: damage }));

    // Check if target was destroyed
    const updatedTarget = this.getEntityById(targetId);
    const targetDestroyed = updatedTarget !== undefined && updatedTarget.health.current <= 0;

    // Remove destroyed entities
    if (targetDestroyed) {
      this.store.dispatch(removeEntity({ id: targetId }));
    }

    // Advance turn
    this.store.dispatch(incrementTurn());

    return {
      hit: true,
      damage,
      targetDestroyed,
      target: updatedTarget,
    };
  }
}
