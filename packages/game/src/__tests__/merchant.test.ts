import { describe, it, expect } from "vitest";
import {
  createGame,
  createMerchant,
  getMerchantShopItems,
  getMerchantShopItem,
  MERCHANT_NPC_TYPE,
} from "../index";

describe("Merchant NPC", () => {
  describe("createMerchant", () => {
    it("creates a Merchant NPC with the expected properties", () => {
      const merchant = createMerchant({ x: 4, y: 4 });

      expect(merchant.name).toBe("Merchant");
      expect(merchant.type).toBe(MERCHANT_NPC_TYPE);
      expect(merchant.displayChar).toBe("M");
      expect(merchant.canBeAttacked).toBe(false);
      expect(merchant.position).toEqual({ x: 4, y: 4 });
    });

    it("creates unique IDs for each Merchant", () => {
      const m1 = createMerchant({ x: 1, y: 1 });
      const m2 = createMerchant({ x: 2, y: 2 });
      expect(m1.id).not.toBe(m2.id);
    });
  });

  describe("shop catalog", () => {
    it("offers at least a healing potion in the MVP catalog", () => {
      const items = getMerchantShopItems();
      const potion = items.find((item) => item.id === "healing_potion");
      expect(potion).toBeDefined();
      expect(potion?.price).toBeGreaterThan(0);
    });

    it("looks up catalog items by id", () => {
      const potion = getMerchantShopItem("healing_potion");
      expect(potion?.name).toBe("Healing Potion");
    });

    it("returns undefined for unknown catalog items", () => {
      expect(getMerchantShopItem("nope")).toBeUndefined();
    });
  });

  describe("createGame with Merchant", () => {
    it("places a Merchant NPC in the test level at (5,3)", () => {
      const game = createGame();
      const merchant = game.getNPCAt({ x: 5, y: 3 });
      expect(merchant).toBeDefined();
      expect(merchant?.type).toBe(MERCHANT_NPC_TYPE);
    });

    it("gives the player starting gold so they can afford a potion", () => {
      const game = createGame();
      const stats = game.getPlayerStats();
      const potion = getMerchantShopItem("healing_potion")!;
      expect(stats.gold).toBeGreaterThanOrEqual(potion.price);
    });
  });

  describe("purchaseFromMerchant", () => {
    it("buys a healing potion: deducts gold and adds potion to inventory", () => {
      const game = createGame();
      const potion = getMerchantShopItem("healing_potion")!;

      const goldBefore = game.getPlayerStats().gold;
      const inventoryBefore = game.engine.getInventory().length;

      const result = game.purchaseFromMerchant("healing_potion");

      expect(result.success).toBe(true);
      expect(result.item?.id).toBe("healing_potion");
      expect(game.getPlayerStats().gold).toBe(goldBefore - potion.price);

      const inventory = game.engine.getInventory();
      expect(inventory.length).toBe(inventoryBefore + 1);
      expect(inventory[inventory.length - 1].name).toBe("Healing Potion");
    });

    it("fails with insufficient_gold when the player cannot afford the item", () => {
      const game = createGame();
      // Drain the player's gold.
      const stats = game.getPlayerStats();
      game.engine.spendPlayerGold(stats.gold);

      const result = game.purchaseFromMerchant("healing_potion");

      expect(result.success).toBe(false);
      expect(result.reason).toBe("insufficient_gold");
      expect(game.getPlayerStats().gold).toBe(0);
    });

    it("fails with unknown_item for an unknown catalog id", () => {
      const game = createGame();
      const result = game.purchaseFromMerchant("not_a_real_item");
      expect(result.success).toBe(false);
      expect(result.reason).toBe("unknown_item");
    });
  });
});
