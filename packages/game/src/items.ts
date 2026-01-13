/**
 * Item definitions for the game
 */

import { ConsumableItem, EquipmentItem, ItemTypeEnum, EquipmentSlotEnum } from "@vscdc/engine";

let itemIdCounter = 0;

/**
 * Creates a unique item ID
 */
function generateItemId(prefix: string): string {
  return `${prefix}_${++itemIdCounter}`;
}

/**
 * Creates a simple healing potion consumable item
 * Heals the player for 5 HP when used
 * 
 * @returns A new healing potion consumable item
 */
export function createHealingPotion(): ConsumableItem {
  return {
    id: generateItemId("heal_potion"),
    name: "Healing Potion",
    type: ItemTypeEnum.Consumable,
    description: "Restores 5 HP when consumed",
    effect: {
      type: "heal",
      amount: 5,
    },
  };
}

/**
 * Creates a basic leather armor equipment item
 * Provides +1 defense when equipped
 * 
 * @returns A new leather armor equipment item
 */
export function createLeatherArmor(): EquipmentItem {
  return {
    id: generateItemId("leather_armor"),
    name: "Leather Armor",
    type: ItemTypeEnum.Equipment,
    slot: EquipmentSlotEnum.Armor,
    description: "Basic leather protection",
    defense: 1,
  };
}

/**
 * Creates a basic iron sword equipment item
 * Provides +2 attack when equipped
 * 
 * Note: Currently using armor slot since we only have one equipment slot.
 * In the future, this should use a weapon-specific slot.
 * 
 * @returns A new iron sword equipment item
 */
export function createIronSword(): EquipmentItem {
  return {
    id: generateItemId("iron_sword"),
    name: "Iron Sword",
    type: ItemTypeEnum.Equipment,
    slot: EquipmentSlotEnum.Armor, // TODO: Create weapon slot
    description: "A sturdy iron blade",
    attack: 2,
  };
}

/**
 * Reset the item ID counter (for tests)
 */
export function resetItemIdCounter(): void {
  itemIdCounter = 0;
}
