import { describe, it, expect, beforeEach } from "vitest";
import { 
  createHealingPotion, 
  createLeatherArmor, 
  createIronSword,
  resetItemIdCounter,
} from "../items";
import { ItemTypeEnum, EquipmentSlotEnum } from "@vscdc/engine";

describe("items", () => {
  beforeEach(() => {
    resetItemIdCounter();
  });

  describe("createHealingPotion", () => {
    it("creates a healing potion with correct properties", () => {
      const potion = createHealingPotion();

      expect(potion.id).toBe("heal_potion_1");
      expect(potion.name).toBe("Healing Potion");
      expect(potion.type).toBe(ItemTypeEnum.Consumable);
      expect(potion.description).toBe("Restores 5 HP when consumed");
      expect(potion.effect.type).toBe("heal");
      expect(potion.effect.amount).toBe(5);
    });

    it("creates unique IDs for multiple potions", () => {
      const potion1 = createHealingPotion();
      const potion2 = createHealingPotion();

      expect(potion1.id).toBe("heal_potion_1");
      expect(potion2.id).toBe("heal_potion_2");
    });
  });

  describe("createLeatherArmor", () => {
    it("creates leather armor with correct properties", () => {
      const armor = createLeatherArmor();

      expect(armor.id).toBe("leather_armor_1");
      expect(armor.name).toBe("Leather Armor");
      expect(armor.type).toBe(ItemTypeEnum.Equipment);
      expect(armor.slot).toBe(EquipmentSlotEnum.Armor);
      expect(armor.description).toBe("Basic leather protection");
      expect(armor.defense).toBe(1);
      expect(armor.attack).toBeUndefined();
    });
  });

  describe("createIronSword", () => {
    it("creates iron sword with correct properties", () => {
      const sword = createIronSword();

      expect(sword.id).toBe("iron_sword_1");
      expect(sword.name).toBe("Iron Sword");
      expect(sword.type).toBe(ItemTypeEnum.Equipment);
      expect(sword.slot).toBe(EquipmentSlotEnum.Armor);
      expect(sword.description).toBe("A sturdy iron blade");
      expect(sword.attack).toBe(2);
      expect(sword.defense).toBeUndefined();
    });
  });
});
