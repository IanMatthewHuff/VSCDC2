/**
 * Game Engine - Main API for the roguelike engine
 */

import { Store } from "@reduxjs/toolkit";
import { createGameStore, CreateStoreOptions } from "./store";
import { GameState, Enemy, NPC, Position, Environment, EquipmentItem, ConsumableItem, PlayerEquipment, FloorItem } from "./types";
import { 
  movePlayer, 
  movePlayerBy, 
  damagePlayer, 
  healPlayer,
  equipArmor,
  unequipArmor,
  equipHead,
  unequipHead,
  equipLeftArm,
  unequipLeftArm,
  equipRightArm,
  unequipRightArm,
  addToInventory,
  removeFromInventory,
  setInventoryCapacity,
  addConsumable,
  removeConsumable,
  grantExperience,
  spendStatPoint,
  getXpForNextLevel,
  StatType,
} from "./playerSlice";
import { incrementTurn } from "./gameSlice";
import {
  addEntity,
  damageEntity,
  removeEntity,
  moveEntity,
  selectEntityAt,
  selectAllEntities,
  selectEntityById,
  addNPC,
  removeNPC,
  selectNPCAt,
  selectAllNPCs,
  selectNPCById,
} from "./entitySlice";
import {
  addEnvironment,
  removeEnvironment,
  selectEnvironmentAt,
  selectAllEnvironments,
} from "./environmentSlice";
import {
  addFloorItem,
  removeFloorItem,
  pickupAttempted,
  selectFloorItemAt,
  selectAllFloorItems,
  selectFloorItemById,
} from "./itemSlice";
import { GameEventType, AnyGameEvent } from "./events";
import { EventHandler, queueAttackEvent, queueEnvironmentDamageEvent, queueExperienceGainEvent, queueStatPointSpentEvent, queueItemPickupEvent } from "./eventMiddleware";

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
 * Result of attempting to pick up an item from the floor at a position.
 */
export interface PickUpResult {
  /** Whether an item was added to the player's inventory */
  picked: boolean;
  /** Reason a pickup attempt did not add the item to inventory */
  reason?: "no_item" | "inventory_full";
  /** The floor item that was at the position, if any */
  floorItem?: FloorItem;
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

  /**
   * Get the player's equipment
   */
  public getPlayerEquipment(): PlayerEquipment {
    return this.store.getState().player.equipment;
  }

  /**
   * Get the player's total attack (base + equipment bonuses)
   */
  public getPlayerAttack(): number {
    const player = this.store.getState().player;
    const armorBonus = player.equipment.armor?.attack || 0;
    const headBonus = player.equipment.head?.attack || 0;
    const leftArmBonus = player.equipment.leftArm?.attack || 0;
    const rightArmBonus = player.equipment.rightArm?.attack || 0;
    return player.baseAttack + armorBonus + headBonus + leftArmBonus + rightArmBonus;
  }

  /**
   * Get the player's total defense (base + equipment bonuses)
   */
  public getPlayerDefense(): number {
    const player = this.store.getState().player;
    const armorBonus = player.equipment.armor?.defense || 0;
    const headBonus = player.equipment.head?.defense || 0;
    const leftArmBonus = player.equipment.leftArm?.defense || 0;
    const rightArmBonus = player.equipment.rightArm?.defense || 0;
    return player.baseDefense + armorBonus + headBonus + leftArmBonus + rightArmBonus;
  }

  /**
   * Get an entity's attack value (defaults to 0 if not set)
   */
  public getEntityAttack(entityId: string): number {
    const entity = this.getEntityById(entityId);
    return entity?.attack ?? 0;
  }

  /**
   * Get an entity's defense value (defaults to 0 if not set)
   */
  public getEntityDefense(entityId: string): number {
    const entity = this.getEntityById(entityId);
    return entity?.defense ?? 0;
  }

  /**
   * Heal the player by the specified amount
   */
  public healPlayerBy(amount: number): void {
    this.store.dispatch(healPlayer({ amount }));
  }

  /**
   * Equip an armor item
   */
  public equipArmorItem(item: EquipmentItem): void {
    this.store.dispatch(equipArmor({ item }));
  }

  /**
   * Unequip the current armor
   */
  public unequipArmorItem(): void {
    this.store.dispatch(unequipArmor());
  }

  /**
   * Equip a head item
   */
  public equipHeadItem(item: EquipmentItem): void {
    this.store.dispatch(equipHead({ item }));
  }

  /**
   * Unequip the current head item
   */
  public unequipHeadItem(): void {
    this.store.dispatch(unequipHead());
  }

  /**
   * Equip a left arm item (shield)
   */
  public equipLeftArmItem(item: EquipmentItem): void {
    this.store.dispatch(equipLeftArm({ item }));
  }

  /**
   * Unequip the current left arm item
   */
  public unequipLeftArmItem(): void {
    this.store.dispatch(unequipLeftArm());
  }

  /**
   * Equip a right arm item (weapon)
   */
  public equipRightArmItem(item: EquipmentItem): void {
    this.store.dispatch(equipRightArm({ item }));
  }

  /**
   * Unequip the current right arm item
   */
  public unequipRightArmItem(): void {
    this.store.dispatch(unequipRightArm());
  }

  // ============================================
  // Inventory Management
  // ============================================

  /**
   * Get the player's inventory
   */
  public getInventory(): (EquipmentItem | ConsumableItem)[] {
    return this.store.getState().player.inventory;
  }

  /**
   * Get the player's inventory capacity
   */
  public getInventoryCapacity(): number {
    return this.store.getState().player.inventoryCapacity;
  }

  /**
   * Check if the inventory is full
   */
  public isInventoryFull(): boolean {
    const player = this.store.getState().player;
    return player.inventory.length >= player.inventoryCapacity;
  }

  /**
   * Add an item to the player's inventory
   * @returns true if added successfully, false if inventory is full
   */
  public addToInventory(item: EquipmentItem | ConsumableItem): boolean {
    if (this.isInventoryFull()) {
      return false;
    }
    this.store.dispatch(addToInventory({ item }));
    return true;
  }

  /**
   * Remove an item from the player's inventory by ID
   */
  public removeFromInventory(itemId: string): void {
    this.store.dispatch(removeFromInventory({ itemId }));
  }

  /**
   * Set the inventory capacity
   */
  public setInventoryCapacity(capacity: number): void {
    this.store.dispatch(setInventoryCapacity({ capacity }));
  }

  /**
   * Add a consumable item to a specific slot (0-2)
   */
  public addConsumableItem(item: ConsumableItem, slot: number): void {
    this.store.dispatch(addConsumable({ item, slot }));
  }

  /**
   * Remove a consumable item from a specific slot (0-2)
   */
  public removeConsumableItem(slot: number): void {
    this.store.dispatch(removeConsumable({ slot }));
  }

  /**
   * Use a consumable item from a specific slot (0-2)
   * Applies the item's effect and removes it from the slot
   */
  public useConsumableItem(slot: number): void {
    const equipment = this.getPlayerEquipment();
    const item = equipment.consumables[slot];
    
    if (!item) {
      return;
    }

    // Apply the item's effect
    if (item.effect.type === "heal" && typeof item.effect.amount === "number") {
      this.healPlayerBy(item.effect.amount);
    }

    // Remove the item from the slot
    this.removeConsumableItem(slot);
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

  /**
   * Move an entity to a new position
   */
  public moveEntity(id: string, position: Position): void {
    this.store.dispatch(moveEntity({ id, position }));
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
   * Damage is calculated as: attacker_attack - target_defense (minimum 0)
   * @param targetId The ID of the entity to attack
   * @returns Result of the attack
   */
  public attack(targetId: string): AttackResult {
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
    
    // Calculate damage: player attack - target defense (minimum 0)
    const playerAttack = this.getPlayerAttack();
    const targetDefense = this.getEntityDefense(targetId);
    const damage = Math.max(0, playerAttack - targetDefense);

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

  /**
   * Enemy attacks the player
   * Damage is calculated as: attacker_attack - player_defense (minimum 0)
   * @param attackerId The ID of the attacking enemy
   */
  public enemyAttackPlayer(attackerId: string): void {
    const attacker = this.getEntityById(attackerId);
    const player = this.store.getState().player;

    if (!attacker) {
      return;
    }

    // Calculate damage: enemy attack - player defense (minimum 0)
    const attackerAttack = this.getEntityAttack(attackerId);
    const playerDefense = this.getPlayerDefense();
    const damage = Math.max(0, attackerAttack - playerDefense);

    // Queue the attack event
    queueAttackEvent({
      attackerId: attacker.id,
      attackerName: attacker.name,
      targetId: player.id,
      targetName: player.name,
      damage: damage,
    });

    // Deal damage to player
    this.store.dispatch(damagePlayer({ amount: damage }));
  }

  // ============================================
  // Environment Management
  // ============================================

  /**
   * Add an environment to the game at a specific position
   */
  public addEnvironment(environment: Environment): void {
    this.store.dispatch(addEnvironment({ environment }));
  }

  /**
   * Get all environments in the game
   */
  public getEnvironments(): Environment[] {
    return selectAllEnvironments(this.store.getState().environments);
  }

  /**
   * Get an environment at a specific position
   */
  public getEnvironmentAt(position: Position): Environment | undefined {
    return selectEnvironmentAt(this.store.getState().environments, position);
  }

  /**
   * Remove an environment from a specific position
   */
  public removeEnvironment(position: Position): void {
    this.store.dispatch(removeEnvironment({ position }));
  }

  /**
   * Apply environment damage to the player
   * Used when player enters a damaging environment
   * @param environmentType The type of environment dealing damage
   * @param damage The amount of damage to deal
   */
  public applyEnvironmentDamage(environmentType: string, damage: number): void {
    const player = this.store.getState().player;

    // Queue the environment damage event
    queueEnvironmentDamageEvent({
      characterId: player.id,
      characterName: player.name,
      environmentType,
      damage,
    });

    // Apply damage to player
    this.store.dispatch(damagePlayer({ amount: damage }));
  }

  // ============================================
  // Floor Items (loot lying on the map)
  // ============================================

  /**
   * Place an item on the floor at a specific position.
   *
   * @param item The item to place (consumable or equipment)
   * @param position Where to place the item
   * @param id Optional id for the floor-item placement; auto-generated if omitted
   * @returns The id of the placed floor item
   */
  public addFloorItem(
    item: EquipmentItem | ConsumableItem,
    position: Position,
    id?: string
  ): string {
    const floorItemId = id ?? `floor_item_${item.id}`;
    this.store.dispatch(
      addFloorItem({
        floorItem: { id: floorItemId, item, position: { ...position } },
      })
    );
    return floorItemId;
  }

  /**
   * Remove a floor item by its id
   */
  public removeFloorItem(id: string): void {
    this.store.dispatch(removeFloorItem({ id }));
  }

  /**
   * Get all floor items currently in the world
   */
  public getFloorItems(): FloorItem[] {
    return selectAllFloorItems(this.store.getState().items);
  }

  /**
   * Get the floor item at a specific position, if any
   */
  public getFloorItemAt(position: Position): FloorItem | undefined {
    return selectFloorItemAt(this.store.getState().items, position);
  }

  /**
   * Get a floor item by id
   */
  public getFloorItemById(id: string): FloorItem | undefined {
    return selectFloorItemById(this.store.getState().items, id);
  }

  /**
   * Attempt to pick up an item at the given position.
   *
   * - If no floor item is present, returns { picked: false, reason: "no_item" }
   *   and emits no event.
   * - If the inventory is full, the item stays on the floor and returns
   *   { picked: false, reason: "inventory_full" }; an ITEM_PICKED_UP event with
   *   picked=false is emitted so the UI can surface the failure.
   * - Otherwise the item is added to the player's inventory, removed from the
   *   floor, and an ITEM_PICKED_UP event with picked=true is emitted.
   */
  public pickUpItemAt(position: Position): PickUpResult {
    const floorItem = this.getFloorItemAt(position);
    if (!floorItem) {
      return { picked: false, reason: "no_item" };
    }

    if (this.isInventoryFull()) {
      // Inventory full: queue the event and dispatch the pickupAttempted
      // no-op action so the middleware drains and emits it. State is
      // unchanged; the floor item stays put.
      queueItemPickupEvent({
        picked: false,
        reason: "inventory_full",
        itemId: floorItem.item.id,
        itemName: floorItem.item.name,
        itemType: floorItem.item.type,
        position: { ...position },
      });
      this.store.dispatch(pickupAttempted());
      return { picked: false, reason: "inventory_full", floorItem };
    }

    // Successful pickup: queue event, then update state in two dispatches
    queueItemPickupEvent({
      picked: true,
      itemId: floorItem.item.id,
      itemName: floorItem.item.name,
      itemType: floorItem.item.type,
      position: { ...position },
    });
    this.store.dispatch(addToInventory({ item: floorItem.item }));
    this.store.dispatch(removeFloorItem({ id: floorItem.id }));

    return { picked: true, floorItem };
  }

  // ============================================
  // Leveling System
  // ============================================

  /**
   * Get the player's current level
   */
  public getPlayerLevel(): number {
    return this.store.getState().player.level;
  }

  /**
   * Get the player's current experience points
   */
  public getPlayerExperience(): number {
    return this.store.getState().player.experience;
  }

  /**
   * Get the XP required for the player to reach the next level
   */
  public getXpForNextLevel(): number {
    return getXpForNextLevel(this.store.getState().player.level);
  }

  /**
   * Get the player's unspent stat points
   */
  public getPlayerStatPoints(): number {
    return this.store.getState().player.statPoints;
  }

  /**
   * Grant experience points to the player
   * @param amount Amount of XP to grant
   * @param source Description of XP source (e.g., "Defeated Goblin")
   */
  public grantExperience(amount: number, source: string): void {
    // Queue the experience gain event
    queueExperienceGainEvent({ amount, source });
    
    // Grant the experience (may trigger level up)
    this.store.dispatch(grantExperience({ amount }));
  }

  /**
   * Spend a stat point to increase a stat
   * @param stat The stat to increase ("maxHealth", "attack", or "defense")
   * @returns true if point was spent, false if no points available
   */
  public spendStatPoint(stat: StatType): boolean {
    if (this.getPlayerStatPoints() <= 0) {
      return false;
    }

    // Queue the stat point spent event
    queueStatPointSpentEvent({ stat });

    // Spend the point
    this.store.dispatch(spendStatPoint({ stat }));
    return true;
  }

  /**
   * Check if the player can level up (has pending stat points)
   */
  public canSpendStatPoints(): boolean {
    return this.getPlayerStatPoints() > 0;
  }
}
