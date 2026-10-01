/**
 * Merchant NPC and shop catalog.
 *
 * MVP scope: a single merchant type that sells consumables. The shop UI is
 * driven by `getMerchantShopItems()` so the extension can render a Quick Pick
 * without depending on specific item factories. Purchase logic lives in the
 * game-session layer (see `purchaseFromMerchant`).
 */

import { ConsumableItem, EquipmentItem, NPC, Position } from "@vscdc/engine";
import { createHealingPotion } from "./items";

/**
 * Type identifier used to look up merchant NPCs.
 */
export const MERCHANT_NPC_TYPE = "merchant";

/**
 * A single entry in a merchant's shop catalog.
 */
export interface MerchantShopItem {
  /** Stable identifier referenced when purchasing */
  id: string;
  /** Display name shown in the shop UI */
  name: string;
  /** Short description of what the item does */
  description: string;
  /** Price in gold */
  price: number;
  /** Factory that creates a fresh instance of the item when purchased */
  create: () => ConsumableItem | EquipmentItem;
}

/**
 * The MVP shop catalog. Kept intentionally tiny — additional items can be
 * added here without touching the dialog/UI plumbing.
 */
const MERCHANT_SHOP_CATALOG: readonly MerchantShopItem[] = [
  {
    id: "healing_potion",
    name: "Healing Potion",
    description: "Restores 5 HP when consumed",
    price: 5,
    create: createHealingPotion,
  },
];

/**
 * Returns the merchant's shop catalog (read-only).
 */
export function getMerchantShopItems(): readonly MerchantShopItem[] {
  return MERCHANT_SHOP_CATALOG;
}

/**
 * Look up a shop item by its catalog ID.
 */
export function getMerchantShopItem(itemId: string): MerchantShopItem | undefined {
  return MERCHANT_SHOP_CATALOG.find((entry) => entry.id === itemId);
}

let merchantIdCounter = 0;

/**
 * Reset the merchant ID counter (for tests).
 */
export function resetMerchantIdCounter(): void {
  merchantIdCounter = 0;
}

/**
 * Creates a Merchant NPC at the specified position.
 * The Merchant offers consumables (and later equipment) for gold.
 *
 * @param position The position to place the Merchant
 * @returns A new Merchant NPC entity
 */
export function createMerchant(position: Position): NPC {
  return {
    id: `merchant_${++merchantIdCounter}`,
    name: "Merchant",
    type: MERCHANT_NPC_TYPE,
    position: { ...position },
    displayChar: "M",
    color: "yellow",
    health: { current: 100, max: 100 },
    canBeAttacked: false,
  };
}
