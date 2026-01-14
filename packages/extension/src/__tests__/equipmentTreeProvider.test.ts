import { describe, it, expect, vi } from "vitest";
import { PlayerEquipment, ConsumableItem, EquipmentItem } from "@vscdc/game";
import { ItemTypeEnum, EquipmentSlotEnum } from "@vscdc/engine";

// Mock vscode module
vi.mock("vscode", () => {
  class MockEventEmitter<T> {
    event = vi.fn();
    fire = vi.fn();
    dispose = vi.fn();
  }

  class MockThemeIcon {
    constructor(
      public readonly id: string,
      public readonly color?: MockThemeColor
    ) {}
  }

  class MockThemeColor {
    constructor(public readonly id: string) {}
  }

  return {
    EventEmitter: MockEventEmitter,
    TreeItem: class {
      label: string;
      description?: string;
      collapsibleState?: number;
      iconPath?: MockThemeIcon;
      contextValue?: string;
      constructor(label: string, collapsibleState?: number) {
        this.label = label;
        this.collapsibleState = collapsibleState;
      }
    },
    TreeItemCollapsibleState: {
      None: 0,
      Collapsed: 1,
      Expanded: 2,
    },
    ThemeIcon: MockThemeIcon,
    ThemeColor: MockThemeColor,
  };
});

import { EquipmentTreeProvider } from "../equipmentTreeProvider";

describe("EquipmentTreeProvider", () => {
  function createTestEquipment(): PlayerEquipment {
    const armor: EquipmentItem = {
      id: "test_armor",
      name: "Test Armor",
      type: ItemTypeEnum.Equipment,
      slot: EquipmentSlotEnum.Armor,
      defense: 2,
    };

    const potion1: ConsumableItem = {
      id: "test_potion",
      name: "Test Potion",
      type: ItemTypeEnum.Consumable,
      effect: { type: "heal", amount: 5 },
    };

    const potion2: ConsumableItem = {
      id: "test_potion2",
      name: "Test Potion 2",
      type: ItemTypeEnum.Consumable,
      effect: { type: "heal", amount: 3 },
    };

    return {
      armor,
      head: null,
      leftArm: null,
      rightArm: null,
      consumables: [potion1, null, potion2],
    };
  }

  it("returns empty array when no equipment is set", async () => {
    const provider = new EquipmentTreeProvider();
    const children = await provider.getChildren();
    expect(children).toEqual([]);
  });

  it("shows armor slot", async () => {
    const provider = new EquipmentTreeProvider();
    const equipment = createTestEquipment();
    provider.setEquipment(equipment);

    const children = await provider.getChildren();
    expect(children.length).toBe(7); // 4 equipment slots + 3 consumable slots

    // Head is first, Armor is second
    const armorItem = children[1];
    expect(armorItem.label).toBe("Armor");
    expect(armorItem.description).toBe("Test Armor");
  });

  it("shows empty armor slot", async () => {
    const provider = new EquipmentTreeProvider();
    const equipment: PlayerEquipment = {
      armor: null,
      head: null,
      leftArm: null,
      rightArm: null,
      consumables: [null, null, null],
    };
    provider.setEquipment(equipment);

    const children = await provider.getChildren();
    // Head is at index 0, Armor is at index 1
    const armorItem = children[1];
    expect(armorItem.label).toBe("Armor");
    expect(armorItem.description).toBe("Empty");
  });

  it("shows consumable slots", async () => {
    const provider = new EquipmentTreeProvider();
    const equipment = createTestEquipment();
    provider.setEquipment(equipment);

    const children = await provider.getChildren();
    
    // Consumable slots start at index 4 (after Head, Armor, Left Arm, Right Arm)
    const slot1 = children[4];
    expect(slot1.label).toBe("Slot 1");
    expect(slot1.description).toBe("Test Potion");

    const slot2 = children[5];
    expect(slot2.label).toBe("Slot 2");
    expect(slot2.description).toBe("Empty");

    const slot3 = children[6];
    expect(slot3.label).toBe("Slot 3");
    expect(slot3.description).toBe("Test Potion 2");
  });

  it("sets context value for filled consumable slots", async () => {
    const provider = new EquipmentTreeProvider();
    const equipment = createTestEquipment();
    provider.setEquipment(equipment);

    const children = await provider.getChildren();
    
    // Consumable slots start at index 4
    const slot1 = children[4];
    expect(slot1.contextValue).toBe("consumableSlot0");

    const slot2 = children[5];
    expect(slot2.contextValue).toBeUndefined(); // Empty slot

    const slot3 = children[6];
    expect(slot3.contextValue).toBe("consumableSlot2");
  });

  it("returns empty array for child elements", async () => {
    const provider = new EquipmentTreeProvider();
    const equipment = createTestEquipment();
    provider.setEquipment(equipment);

    const children = await provider.getChildren();
    const armorItem = children[0];
    
    const armorChildren = await provider.getChildren(armorItem);
    expect(armorChildren).toEqual([]);
  });
});
