import { describe, it, expect } from "vitest";
import { GameEngine, ItemTypeEnum, EquipmentSlotEnum, ConsumableItem, EquipmentItem } from "../index";

describe("GameEngine equipment", () => {
  function createTestConsumable(): ConsumableItem {
    return {
      id: "test_potion",
      name: "Test Potion",
      type: ItemTypeEnum.Consumable,
      effect: {
        type: "heal",
        amount: 5,
      },
    };
  }

  function createTestArmor(): EquipmentItem {
    return {
      id: "test_armor",
      name: "Test Armor",
      type: ItemTypeEnum.Equipment,
      slot: EquipmentSlotEnum.Armor,
      defense: 2,
    };
  }

  describe("player equipment", () => {
    it("starts with empty equipment", () => {
      const engine = new GameEngine();
      const equipment = engine.getPlayerEquipment();

      expect(equipment.armor).toBeNull();
      expect(equipment.consumables).toEqual([null, null, null]);
    });

    it("can equip armor", () => {
      const engine = new GameEngine();
      const armor = createTestArmor();

      engine.equipArmorItem(armor);

      const equipment = engine.getPlayerEquipment();
      expect(equipment.armor).toEqual(armor);
    });

    it("can unequip armor", () => {
      const engine = new GameEngine();
      const armor = createTestArmor();

      engine.equipArmorItem(armor);
      engine.unequipArmorItem();

      const equipment = engine.getPlayerEquipment();
      expect(equipment.armor).toBeNull();
    });

    it("can add consumable to slot", () => {
      const engine = new GameEngine();
      const potion = createTestConsumable();

      engine.addConsumableItem(potion, 0);

      const equipment = engine.getPlayerEquipment();
      expect(equipment.consumables[0]).toEqual(potion);
      expect(equipment.consumables[1]).toBeNull();
      expect(equipment.consumables[2]).toBeNull();
    });

    it("can add consumables to multiple slots", () => {
      const engine = new GameEngine();
      const potion1 = { ...createTestConsumable(), id: "potion_1" };
      const potion2 = { ...createTestConsumable(), id: "potion_2" };

      engine.addConsumableItem(potion1, 0);
      engine.addConsumableItem(potion2, 2);

      const equipment = engine.getPlayerEquipment();
      expect(equipment.consumables[0]).toEqual(potion1);
      expect(equipment.consumables[1]).toBeNull();
      expect(equipment.consumables[2]).toEqual(potion2);
    });

    it("can remove consumable from slot", () => {
      const engine = new GameEngine();
      const potion = createTestConsumable();

      engine.addConsumableItem(potion, 1);
      engine.removeConsumableItem(1);

      const equipment = engine.getPlayerEquipment();
      expect(equipment.consumables[1]).toBeNull();
    });
  });

  describe("player stats with equipment", () => {
    it("returns base attack when no equipment", () => {
      const engine = new GameEngine();
      expect(engine.getPlayerAttack()).toBe(1);
    });

    it("returns base defense when no equipment", () => {
      const engine = new GameEngine();
      expect(engine.getPlayerDefense()).toBe(0);
    });

    it("adds armor defense bonus to base defense", () => {
      const engine = new GameEngine();
      const armor = createTestArmor();

      engine.equipArmorItem(armor);

      expect(engine.getPlayerDefense()).toBe(2); // 0 base + 2 from armor
    });

    it("adds armor attack bonus to base attack", () => {
      const engine = new GameEngine();
      const weapon: EquipmentItem = {
        id: "sword",
        name: "Sword",
        type: ItemTypeEnum.Equipment,
        slot: EquipmentSlotEnum.Armor,
        attack: 3,
      };

      engine.equipArmorItem(weapon);

      expect(engine.getPlayerAttack()).toBe(4); // 1 base + 3 from weapon
    });

    it("returns base stats after unequipping", () => {
      const engine = new GameEngine();
      const armor = createTestArmor();

      engine.equipArmorItem(armor);
      engine.unequipArmorItem();

      expect(engine.getPlayerDefense()).toBe(0);
      expect(engine.getPlayerAttack()).toBe(1);
    });
  });

  describe("consumable usage", () => {
    it("heals player when using healing potion", () => {
      const engine = new GameEngine();
      const potion = createTestConsumable();

      // Damage player first by using the engine's attack on a non-existent target
      // This will damage the player indirectly by using enemyAttackPlayer
      const testEnemy: any = {
        id: "test_enemy",
        name: "Test Enemy",
        type: "test",
        position: { x: 1, y: 1 },
        displayChar: "E",
        color: "red",
        health: { current: 5, max: 5 },
        attack: 5, // Attack that will deal 5 damage (5 - 0 player defense)
        defense: 0,
      };
      engine.addEntity(testEnemy);
      engine.enemyAttackPlayer("test_enemy");

      engine.addConsumableItem(potion, 0);
      engine.useConsumableItem(0);

      const health = engine.getPlayerHealth();
      expect(health.current).toBe(10); // 5 + 5 healing
    });

    it("removes consumable after use", () => {
      const engine = new GameEngine();
      const potion = createTestConsumable();

      engine.addConsumableItem(potion, 0);
      engine.useConsumableItem(0);

      const equipment = engine.getPlayerEquipment();
      expect(equipment.consumables[0]).toBeNull();
    });

    it("does not heal beyond max health", () => {
      const engine = new GameEngine();
      const potion = createTestConsumable();

      engine.addConsumableItem(potion, 0);
      engine.useConsumableItem(0);

      const health = engine.getPlayerHealth();
      expect(health.current).toBe(10); // Already at max
      expect(health.max).toBe(10);
    });

    it("does nothing when using empty slot", () => {
      const engine = new GameEngine();

      engine.useConsumableItem(0);

      const health = engine.getPlayerHealth();
      expect(health.current).toBe(10);
    });
  });

  describe("healing", () => {
    it("can heal player", () => {
      const engine = new GameEngine();
      
      // Damage player first using enemyAttackPlayer
      // Enemy needs attack stat to deal damage with the new combat formula
      const testEnemy: any = {
        id: "test_enemy",
        name: "Test Enemy",
        type: "test",
        position: { x: 1, y: 1 },
        displayChar: "E",
        color: "red",
        health: { current: 5, max: 5 },
        attack: 5, // Attack that will deal 5 damage (5 - 0 player defense)
        defense: 0,
      };
      engine.addEntity(testEnemy);
      engine.enemyAttackPlayer("test_enemy");

      engine.healPlayerBy(3);

      const health = engine.getPlayerHealth();
      expect(health.current).toBe(8); // 10 - 5 + 3 = 8
    });

    it("does not exceed max health when healing", () => {
      const engine = new GameEngine();

      engine.healPlayerBy(100);

      const health = engine.getPlayerHealth();
      expect(health.current).toBe(10);
      expect(health.max).toBe(10);
    });
  });
});
