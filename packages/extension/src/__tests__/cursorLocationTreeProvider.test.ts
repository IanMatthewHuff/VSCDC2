/**
 * Unit tests for CursorLocationTreeProvider
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { TileType } from "@vscdc/game";

// Mock vscode module
vi.mock("vscode", () => {
  class MockEventEmitter<T> {
    event = vi.fn();
    fire = vi.fn();
    dispose = vi.fn();
  }

  class MockThemeIcon {
    constructor(public readonly id: string) {}
  }

  return {
    EventEmitter: MockEventEmitter,
    TreeItem: class {
      label: string;
      description?: string;
      collapsibleState?: number;
      iconPath?: MockThemeIcon;
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
  };
});

import { CursorLocationTreeProvider, LocationInfoItem } from "../cursorLocationTreeProvider";

describe("CursorLocationTreeProvider", () => {
  let provider: CursorLocationTreeProvider;

  beforeEach(() => {
    provider = new CursorLocationTreeProvider();
  });

  describe("getChildren", () => {
    it("returns empty array when no location info set", async () => {
      const children = await provider.getChildren();
      expect(children).toEqual([]);
    });

    it("returns location items when location info set with no entities", async () => {
      provider.setLocationInfo({
        position: { x: 3, y: 4 },
        tile: { type: TileType.Floor, displayChar: "." },
        entities: [],
      });

      const children = await provider.getChildren();
      expect(children).toHaveLength(3);

      // Position
      expect(children[0].label).toBe("Position");
      expect(children[0].description).toBe("(3, 4)");
      expect((children[0].iconPath as any).id).toBe("location");

      // Terrain
      expect(children[1].label).toBe("Terrain");
      expect(children[1].description).toBe(TileType.Floor);
      expect((children[1].iconPath as any).id).toBe("symbol-field");

      // Entities (none)
      expect(children[2].label).toBe("Entities");
      expect(children[2].description).toBe("None");
      expect((children[2].iconPath as any).id).toBe("circle-slash");
    });

    it("returns location items when location info set with entities", async () => {
      provider.setLocationInfo({
        position: { x: 2, y: 2 },
        tile: { type: TileType.Floor, displayChar: "." },
        entities: [
          {
            name: "Goblin",
            health: { current: 10, max: 10 },
          },
        ],
      });

      const children = await provider.getChildren();
      expect(children).toHaveLength(3);

      // Position
      expect(children[0].label).toBe("Position");
      expect(children[0].description).toBe("(2, 2)");

      // Terrain
      expect(children[1].label).toBe("Terrain");
      expect(children[1].description).toBe(TileType.Floor);

      // Entities (present with HP)
      expect(children[2].label).toBe("Entities");
      expect(children[2].description).toBe("Goblin (10/10 HP)");
      expect((children[2].iconPath as any).id).toBe("symbol-misc");
    });

    it("handles multiple entities at the same location", async () => {
      provider.setLocationInfo({
        position: { x: 1, y: 1 },
        tile: { type: TileType.Floor, displayChar: "." },
        entities: [
          {
            name: "Goblin",
            health: { current: 10, max: 10 },
          },
          {
            name: "Orc",
            health: { current: 15, max: 15 },
          },
        ],
      });

      const children = await provider.getChildren();
      expect(children).toHaveLength(3);

      // Entities (multiple with HP)
      expect(children[2].label).toBe("Entities");
      expect(children[2].description).toBe("Goblin (10/10 HP), Orc (15/15 HP)");
    });

    it("returns empty array after clearing location info", async () => {
      provider.setLocationInfo({
        position: { x: 3, y: 4 },
        tile: { type: TileType.Floor, displayChar: "." },
        entities: [],
      });
      provider.setLocationInfo(null);

      const children = await provider.getChildren();
      expect(children).toEqual([]);
    });
  });

  describe("getTreeItem", () => {
    it("returns the element as-is", () => {
      const item = new LocationInfoItem("Test", "Value");
      expect(provider.getTreeItem(item)).toBe(item);
    });
  });

  describe("setLocationInfo", () => {
    it("fires onDidChangeTreeData event", () => {
      provider.setLocationInfo({
        position: { x: 1, y: 1 },
        tile: { type: TileType.Floor, displayChar: "." },
        entities: [],
      });

      // The event emitter's fire method should have been called
      expect((provider as any)._onDidChangeTreeData.fire).toHaveBeenCalled();
    });
  });
});
