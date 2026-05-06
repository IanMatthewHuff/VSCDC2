import { describe, it, expect, vi } from "vitest";
import {
  GameEngine,
  GameEventType,
  ConsumableItem,
  EquipmentItem,
  ItemTypeEnum,
  EquipmentSlotEnum,
  ItemPickedUpEvent,
} from "../index";

function makePotion(id = "p1"): ConsumableItem {
  return {
    id,
    name: "Healing Potion",
    type: ItemTypeEnum.Consumable,
    effect: { type: "heal", amount: 5 },
  };
}

function makeSword(id = "s1"): EquipmentItem {
  return {
    id,
    name: "Iron Sword",
    type: ItemTypeEnum.Equipment,
    slot: EquipmentSlotEnum.RightArm,
    attack: 2,
  };
}

describe("GameEngine — floor items & pickup", () => {
  it("starts with no floor items", () => {
    const engine = new GameEngine();
    expect(engine.getFloorItems()).toEqual([]);
  });

  it("addFloorItem places an item at a position", () => {
    const engine = new GameEngine();
    const id = engine.addFloorItem(makePotion(), { x: 3, y: 4 });
    expect(engine.getFloorItems()).toHaveLength(1);
    expect(engine.getFloorItemAt({ x: 3, y: 4 })?.id).toBe(id);
    expect(engine.getFloorItemAt({ x: 0, y: 0 })).toBeUndefined();
  });

  it("removeFloorItem removes by id", () => {
    const engine = new GameEngine();
    const id = engine.addFloorItem(makePotion(), { x: 3, y: 4 });
    engine.removeFloorItem(id);
    expect(engine.getFloorItems()).toEqual([]);
  });

  describe("pickUpItemAt", () => {
    it("returns no_item when no floor item is at the position", () => {
      const engine = new GameEngine();
      const handler = vi.fn();
      engine.onEvent(GameEventType.ITEM_PICKED_UP, handler);

      const result = engine.pickUpItemAt({ x: 0, y: 0 });

      expect(result.picked).toBe(false);
      expect(result.reason).toBe("no_item");
      expect(handler).not.toHaveBeenCalled();
    });

    it("adds the item to inventory and removes it from the floor on success", () => {
      const engine = new GameEngine();
      const potion = makePotion();
      engine.addFloorItem(potion, { x: 2, y: 2 });
      const handler = vi.fn();
      engine.onEvent(GameEventType.ITEM_PICKED_UP, handler);

      const initialInvLen = engine.getInventory().length;
      const result = engine.pickUpItemAt({ x: 2, y: 2 });

      expect(result.picked).toBe(true);
      expect(result.reason).toBeUndefined();
      expect(engine.getFloorItemAt({ x: 2, y: 2 })).toBeUndefined();
      expect(engine.getInventory().length).toBe(initialInvLen + 1);
      expect(engine.getInventory().map((i) => i.id)).toContain(potion.id);

      // Event was emitted with picked=true
      expect(handler).toHaveBeenCalled();
      const event = handler.mock.calls[0][0] as ItemPickedUpEvent;
      expect(event.type).toBe(GameEventType.ITEM_PICKED_UP);
      expect(event.picked).toBe(true);
      expect(event.itemId).toBe(potion.id);
      expect(event.itemName).toBe("Healing Potion");
      expect(event.itemType).toBe(ItemTypeEnum.Consumable);
      expect(event.position).toEqual({ x: 2, y: 2 });
    });

    it("returns inventory_full when inventory is full and leaves item on the floor", () => {
      const engine = new GameEngine();
      // Set capacity to 1 and fill it
      engine.setInventoryCapacity(1);
      engine.addToInventory(makePotion("existing"));
      expect(engine.isInventoryFull()).toBe(true);

      const sword = makeSword();
      engine.addFloorItem(sword, { x: 5, y: 5 });

      const handler = vi.fn();
      engine.onEvent(GameEventType.ITEM_PICKED_UP, handler);

      const result = engine.pickUpItemAt({ x: 5, y: 5 });

      expect(result.picked).toBe(false);
      expect(result.reason).toBe("inventory_full");
      // Item still on the floor
      expect(engine.getFloorItemAt({ x: 5, y: 5 })?.item.id).toBe(sword.id);

      // Event was emitted with picked=false and inventory_full reason
      expect(handler).toHaveBeenCalledTimes(1);
      const event = handler.mock.calls[0][0] as ItemPickedUpEvent;
      expect(event.picked).toBe(false);
      expect(event.reason).toBe("inventory_full");
      expect(event.itemId).toBe(sword.id);
      expect(event.itemType).toBe(ItemTypeEnum.Equipment);
    });
  });
});
