import { describe, it, expect } from "vitest";
import itemReducer, {
  addFloorItem,
  removeFloorItem,
  clearFloorItems,
  selectFloorItemAt,
  selectAllFloorItems,
  selectFloorItemById,
} from "../itemSlice";
import { ConsumableItem, EquipmentItem, FloorItem, ItemState, ItemType, EquipmentSlot } from "../types";

function makeConsumable(id = "potion_1"): ConsumableItem {
  return {
    id,
    name: "Test Potion",
    type: ItemType.Consumable,
    effect: { type: "heal", amount: 5 },
  };
}

function makeEquipment(id = "sword_1"): EquipmentItem {
  return {
    id,
    name: "Test Sword",
    type: ItemType.Equipment,
    slot: EquipmentSlot.RightArm,
    attack: 2,
  };
}

function makeFloorItem(overrides: Partial<FloorItem> = {}): FloorItem {
  return {
    id: "floor_item_1",
    item: makeConsumable(),
    position: { x: 4, y: 5 },
    ...overrides,
  };
}

describe("itemSlice", () => {
  describe("reducer", () => {
    it("starts with empty floor items", () => {
      const state = itemReducer(undefined, { type: "@@INIT" });
      expect(state.floorItems).toEqual({});
    });

    it("adds a floor item at the correct position key", () => {
      const fi = makeFloorItem();
      const state = itemReducer(undefined, addFloorItem({ floorItem: fi }));
      expect(state.floorItems["4,5"]).toEqual(fi);
      expect(Object.keys(state.floorItems)).toHaveLength(1);
    });

    it("replaces a floor item if one already exists at the same position", () => {
      const fi1 = makeFloorItem({ id: "floor_item_a", item: makeConsumable("a") });
      const fi2 = makeFloorItem({ id: "floor_item_b", item: makeEquipment("b") });
      let state = itemReducer(undefined, addFloorItem({ floorItem: fi1 }));
      state = itemReducer(state, addFloorItem({ floorItem: fi2 }));

      expect(Object.keys(state.floorItems)).toHaveLength(1);
      expect(state.floorItems["4,5"]).toEqual(fi2);
    });

    it("adds multiple floor items at different positions", () => {
      const fi1 = makeFloorItem({ id: "a", position: { x: 1, y: 1 } });
      const fi2 = makeFloorItem({ id: "b", position: { x: 2, y: 2 } });
      let state = itemReducer(undefined, addFloorItem({ floorItem: fi1 }));
      state = itemReducer(state, addFloorItem({ floorItem: fi2 }));

      expect(Object.keys(state.floorItems)).toHaveLength(2);
    });

    it("removes a floor item by id", () => {
      const fi1 = makeFloorItem({ id: "a", position: { x: 1, y: 1 } });
      const fi2 = makeFloorItem({ id: "b", position: { x: 2, y: 2 } });
      let state = itemReducer(undefined, addFloorItem({ floorItem: fi1 }));
      state = itemReducer(state, addFloorItem({ floorItem: fi2 }));
      state = itemReducer(state, removeFloorItem({ id: "a" }));

      expect(Object.keys(state.floorItems)).toHaveLength(1);
      expect(state.floorItems["2,2"]).toEqual(fi2);
    });

    it("removeFloorItem with unknown id is a no-op", () => {
      const fi = makeFloorItem();
      let state = itemReducer(undefined, addFloorItem({ floorItem: fi }));
      state = itemReducer(state, removeFloorItem({ id: "does_not_exist" }));

      expect(Object.keys(state.floorItems)).toHaveLength(1);
    });

    it("clearFloorItems empties state", () => {
      const fi1 = makeFloorItem({ id: "a", position: { x: 1, y: 1 } });
      const fi2 = makeFloorItem({ id: "b", position: { x: 2, y: 2 } });
      let state = itemReducer(undefined, addFloorItem({ floorItem: fi1 }));
      state = itemReducer(state, addFloorItem({ floorItem: fi2 }));
      state = itemReducer(state, clearFloorItems());

      expect(state.floorItems).toEqual({});
    });
  });

  describe("selectors", () => {
    function buildState(items: FloorItem[]): ItemState {
      const byKey: Record<string, FloorItem> = {};
      for (const it of items) {
        byKey[`${it.position.x},${it.position.y}`] = it;
      }
      return { floorItems: byKey };
    }

    it("selectFloorItemAt returns the item at a position", () => {
      const fi = makeFloorItem();
      const state = buildState([fi]);
      expect(selectFloorItemAt(state, { x: 4, y: 5 })).toEqual(fi);
    });

    it("selectFloorItemAt returns undefined when no item exists at position", () => {
      const state = buildState([]);
      expect(selectFloorItemAt(state, { x: 0, y: 0 })).toBeUndefined();
    });

    it("selectAllFloorItems returns all items", () => {
      const fi1 = makeFloorItem({ id: "a", position: { x: 1, y: 1 } });
      const fi2 = makeFloorItem({ id: "b", position: { x: 2, y: 2 } });
      const state = buildState([fi1, fi2]);
      expect(selectAllFloorItems(state)).toHaveLength(2);
    });

    it("selectFloorItemById finds an item by id", () => {
      const fi = makeFloorItem({ id: "find_me" });
      const state = buildState([fi]);
      expect(selectFloorItemById(state, "find_me")).toEqual(fi);
      expect(selectFloorItemById(state, "missing")).toBeUndefined();
    });
  });
});
