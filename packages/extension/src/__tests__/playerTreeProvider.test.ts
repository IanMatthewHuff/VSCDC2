/**
 * Unit tests for PlayerTreeProvider
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

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

import { PlayerTreeProvider, PlayerStatItem } from "../playerTreeProvider";

describe("PlayerTreeProvider", () => {
  let provider: PlayerTreeProvider;

  beforeEach(() => {
    provider = new PlayerTreeProvider();
  });

  describe("getChildren", () => {
    it("returns empty array when no player stats set", async () => {
      const children = await provider.getChildren();
      expect(children).toEqual([]);
    });

    it("returns name, health, attack, and defense items when player stats set", async () => {
      provider.setPlayerStats({
        name: "Test Hero",
        health: { current: 8, max: 10 },
        attack: 3,
        defense: 1,
        equipment: {
          armor: null,
          consumables: [null, null, null],
        },
      });

      const children = await provider.getChildren();
      expect(children).toHaveLength(4);

      // Name stat
      expect(children[0].label).toBe("Name");
      expect(children[0].description).toBe("Test Hero");
      expect(children[0].iconPath).toBeDefined();
      expect((children[0].iconPath as any).id).toBe("account");

      // Health stat with colored icon
      expect(children[1].label).toBe("Health");
      expect(children[1].description).toBe("8/10");
      expect(children[1].iconPath).toBeDefined();
      expect((children[1].iconPath as any).id).toBe("heart");
      expect((children[1].iconPath as any).color?.id).toBe("charts.red");

      // Attack stat
      expect(children[2].label).toBe("Attack");
      expect(children[2].description).toBe("3");

      // Defense stat
      expect(children[3].label).toBe("Defense");
      expect(children[3].description).toBe("1");
    });

    it("returns empty array after clearing player stats", async () => {
      provider.setPlayerStats({
        name: "Test Hero",
        health: { current: 10, max: 10 },
        attack: 1,
        defense: 0,
        equipment: {
          armor: null,
          consumables: [null, null, null],
        },
      });
      provider.setPlayerStats(null);

      const children = await provider.getChildren();
      expect(children).toEqual([]);
    });
  });

  describe("getTreeItem", () => {
    it("returns the element as-is", () => {
      const item = new PlayerStatItem("Test", "Value");
      expect(provider.getTreeItem(item)).toBe(item);
    });
  });

  describe("setPlayerStats", () => {
    it("fires onDidChangeTreeData event", () => {
      provider.setPlayerStats({
        name: "Hero",
        health: { current: 10, max: 10 },
      });

      // The event emitter's fire method should have been called
      expect((provider as any)._onDidChangeTreeData.fire).toHaveBeenCalled();
    });
  });
});
