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
 * Creates an iron helmet equipment item
 * Provides +1 defense when equipped to the head slot
 * 
 * @returns A new iron helmet equipment item
 */
export function createIronHelmet(): EquipmentItem {
  return {
    id: generateItemId("iron_helmet"),
    name: "Iron Helmet",
    type: ItemTypeEnum.Equipment,
    slot: EquipmentSlotEnum.Head,
    description: "A sturdy iron helmet",
    defense: 1,
  };
}

/**
 * Creates a wooden shield equipment item
 * Provides +1 defense when equipped to the left arm slot
 * 
 * @returns A new wooden shield equipment item
 */
export function createWoodenShield(): EquipmentItem {
  return {
    id: generateItemId("wooden_shield"),
    name: "Wooden Shield",
    type: ItemTypeEnum.Equipment,
    slot: EquipmentSlotEnum.LeftArm,
    description: "A basic wooden shield",
    defense: 1,
  };
}

/**
 * Creates a basic iron sword equipment item
 * Provides +2 attack when equipped to the right arm slot
 * 
 * @returns A new iron sword equipment item
 */
export function createIronSword(): EquipmentItem {
  return {
    id: generateItemId("iron_sword"),
    name: "Iron Sword",
    type: ItemTypeEnum.Equipment,
    slot: EquipmentSlotEnum.RightArm,
    description: "A sturdy iron blade",
    attack: 2,
  };
}

/**
 * Creates a chain mail armor equipment item
 * Provides +2 defense when equipped
 * 
 * @returns A new chain mail armor equipment item
 */
export function createChainMailArmor(): EquipmentItem {
  return {
    id: generateItemId("chain_mail"),
    name: "Chain Mail",
    type: ItemTypeEnum.Equipment,
    slot: EquipmentSlotEnum.Armor,
    description: "Interlocking metal rings provide solid protection",
    defense: 2,
  };
}

/**
 * Creates a basic club equipment item
 * Provides +1 attack when equipped to the right arm slot
 * 
 * @returns A new basic club equipment item
 */
export function createBasicClub(): EquipmentItem {
  return {
    id: generateItemId("basic_club"),
    name: "Basic Club",
    type: ItemTypeEnum.Equipment,
    slot: EquipmentSlotEnum.RightArm,
    description: "A simple wooden club",
    attack: 1,
  };
}

/**
 * Reset the item ID counter (for tests)
 */
export function resetItemIdCounter(): void {
  itemIdCounter = 0;
}
