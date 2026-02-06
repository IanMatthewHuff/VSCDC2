/**
 * Player slice - manages player state and movement
 */

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Player, Position, EquipmentItem, ConsumableItem, EquipmentSlot, DEFAULT_INVENTORY_CAPACITY } from "./types";

// ============================================
// Leveling Constants
// ============================================

/** Base XP required for level 2 (scales linearly: level N requires N * BASE_XP) */
export const BASE_XP_PER_LEVEL = 100;

/** Stat points granted per level up */
export const STAT_POINTS_PER_LEVEL = 2;

/** Max health increase per stat point spent on HP */
export const HP_PER_POINT = 5;

/** Attack increase per stat point spent on attack */
export const ATTACK_PER_POINT = 1;

/** Defense increase per stat point spent on defense */
export const DEFENSE_PER_POINT = 1;

/** Stats that can be upgraded with stat points */
export type StatType = "maxHealth" | "attack" | "defense";

/**
 * Calculate XP required to reach the next level
 * @param currentLevel The player's current level
 * @returns XP required to level up
 */
export function getXpForNextLevel(currentLevel: number): number {
  return currentLevel * BASE_XP_PER_LEVEL;
}

const initialPlayerState: Player = {
  id: "player",
  name: "Adventurer",
  position: { x: 5, y: 5 },
  displayChar: "@",
  color: "white",
  health: { current: 10, max: 10 },
  equipment: {
    armor: null,
    head: null,
    leftArm: null,
    rightArm: null,
    consumables: [null, null, null],
  },
  inventory: [],
  inventoryCapacity: DEFAULT_INVENTORY_CAPACITY,
  baseAttack: 1,
  baseDefense: 0,
  level: 1,
  experience: 0,
  statPoints: 0,
};

/**
 * Player slice handles all player-related state changes
 */
export const playerSlice = createSlice({
  name: "player",
  initialState: initialPlayerState,
  reducers: {
    /**
     * Move the player to a new position
     */
    movePlayer: (state, action: PayloadAction<Position>) => {
      state.position = action.payload;
    },
    /**
     * Move the player by a relative offset
     */
    movePlayerBy: (state, action: PayloadAction<{ dx: number; dy: number }>) => {
      state.position.x += action.payload.dx;
      state.position.y += action.payload.dy;
    },
    /**
     * Damage the player, reducing current health
     * Health will not go below 0
     */
    damagePlayer: (state, action: PayloadAction<{ amount: number }>) => {
      state.health.current = Math.max(0, state.health.current - action.payload.amount);
    },
    /**
     * Heal the player, increasing current health
     * Health will not exceed max health
     */
    healPlayer: (state, action: PayloadAction<{ amount: number }>) => {
      state.health.current = Math.min(state.health.max, state.health.current + action.payload.amount);
    },
    /**
     * Equip an armor item
     */
    equipArmor: (state, action: PayloadAction<{ item: EquipmentItem }>) => {
      state.equipment.armor = action.payload.item;
    },
    /**
     * Unequip armor
     */
    unequipArmor: (state) => {
      state.equipment.armor = null;
    },
    /**
     * Equip a head item
     */
    equipHead: (state, action: PayloadAction<{ item: EquipmentItem }>) => {
      state.equipment.head = action.payload.item;
    },
    /**
     * Unequip head item
     */
    unequipHead: (state) => {
      state.equipment.head = null;
    },
    /**
     * Equip a left arm item (shield)
     */
    equipLeftArm: (state, action: PayloadAction<{ item: EquipmentItem }>) => {
      state.equipment.leftArm = action.payload.item;
    },
    /**
     * Unequip left arm item
     */
    unequipLeftArm: (state) => {
      state.equipment.leftArm = null;
    },
    /**
     * Equip a right arm item (weapon)
     */
    equipRightArm: (state, action: PayloadAction<{ item: EquipmentItem }>) => {
      state.equipment.rightArm = action.payload.item;
    },
    /**
     * Unequip right arm item
     */
    unequipRightArm: (state) => {
      state.equipment.rightArm = null;
    },
    /**
     * Add an item to inventory (if not full)
     * Returns false if inventory is full
     */
    addToInventory: (state, action: PayloadAction<{ item: EquipmentItem | ConsumableItem }>) => {
      if (state.inventory.length < state.inventoryCapacity) {
        state.inventory.push(action.payload.item);
      }
    },
    /**
     * Remove an item from inventory by ID
     */
    removeFromInventory: (state, action: PayloadAction<{ itemId: string }>) => {
      state.inventory = state.inventory.filter(item => item.id !== action.payload.itemId);
    },
    /**
     * Set the inventory capacity
     */
    setInventoryCapacity: (state, action: PayloadAction<{ capacity: number }>) => {
      state.inventoryCapacity = action.payload.capacity;
    },
    /**
     * Add a consumable item to a specific slot (0-2)
     */
    addConsumable: (state, action: PayloadAction<{ item: ConsumableItem; slot: number }>) => {
      const { item, slot } = action.payload;
      if (slot >= 0 && slot < 3) {
        state.equipment.consumables[slot] = item;
      }
    },
    /**
     * Remove a consumable item from a specific slot (0-2)
     */
    removeConsumable: (state, action: PayloadAction<{ slot: number }>) => {
      const { slot } = action.payload;
      if (slot >= 0 && slot < 3) {
        state.equipment.consumables[slot] = null;
      }
    },
    /**
     * Grant experience points to the player
     * Handles level up if enough XP is accumulated (one level at a time)
     */
    grantExperience: (state, action: PayloadAction<{ amount: number }>) => {
      state.experience += action.payload.amount;
      
      // Check for level up (one level at a time)
      const xpForNextLevel = getXpForNextLevel(state.level);
      if (state.experience >= xpForNextLevel) {
        state.experience -= xpForNextLevel;
        state.level += 1;
        state.statPoints += STAT_POINTS_PER_LEVEL;
      }
    },
    /**
     * Spend a stat point to increase a stat
     */
    spendStatPoint: (state, action: PayloadAction<{ stat: StatType }>) => {
      if (state.statPoints <= 0) {
        return;
      }
      
      const { stat } = action.payload;
      switch (stat) {
        case "maxHealth":
          state.health.max += HP_PER_POINT;
          state.health.current += HP_PER_POINT; // Also heal when increasing max
          break;
        case "attack":
          state.baseAttack += ATTACK_PER_POINT;
          break;
        case "defense":
          state.baseDefense += DEFENSE_PER_POINT;
          break;
      }
      state.statPoints -= 1;
    },
  },
});

export const { 
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
} = playerSlice.actions;
export default playerSlice.reducer;
