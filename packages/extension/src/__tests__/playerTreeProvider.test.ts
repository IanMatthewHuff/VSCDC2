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

    it("returns name, level, health, attack, and defense items when player stats set", async () => {
      provider.setPlayerStats({
        name: "Test Hero",
        health: { current: 8, max: 10 },
        attack: 3,
        defense: 1,
        equipment: {
          armor: null,
          consumables: [null, null, null],
        },
        level: 1,
        experience: 50,
        experienceToNextLevel: 100,
        statPoints: 0,
      });

      const children = await provider.getChildren();
      expect(children).toHaveLength(5);

      // Name stat
      expect(children[0].label).toBe("Name");
      expect(children[0].description).toBe("Test Hero");
      expect(children[0].iconPath).toBeDefined();
      expect((children[0].iconPath as any).id).toBe("account");

      // Level stat
      expect(children[1].label).toBe("Level");
      expect(children[1].description).toBe("1 (50/100 XP)");

      // Health stat with colored icon
      expect(children[2].label).toBe("Health");
      expect(children[2].description).toBe("8/10");
      expect(children[2].iconPath).toBeDefined();
      expect((children[2].iconPath as any).id).toBe("heart");
      expect((children[2].iconPath as any).color?.id).toBe("charts.red");

      // Attack stat
      expect(children[3].label).toBe("Attack");
      expect(children[3].description).toBe("3");

      // Defense stat
      expect(children[4].label).toBe("Defense");
      expect(children[4].description).toBe("1");
    });

    it("shows stat points item when points are available", async () => {
      provider.setPlayerStats({
        name: "Test Hero",
        health: { current: 10, max: 10 },
        attack: 1,
        defense: 0,
        equipment: {
          armor: null,
          consumables: [null, null, null],
        },
        level: 2,
        experience: 50,
        experienceToNextLevel: 200,
        statPoints: 3,
      });

      const children = await provider.getChildren();
      expect(children).toHaveLength(6); // 5 regular + 1 stat points

      // Stat points item should be last
      expect(children[5].label).toBe("Stat Points");
      expect(children[5].description).toBe("3 available");
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
        level: 1,
        experience: 0,
        experienceToNextLevel: 100,
        statPoints: 0,
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
        attack: 1,
        defense: 0,
        equipment: {
          armor: null,
          consumables: [null, null, null],
        },
        level: 1,
        experience: 0,
        experienceToNextLevel: 100,
        statPoints: 0,
      });

      // The event emitter's fire method should have been called
      expect((provider as any)._onDidChangeTreeData.fire).toHaveBeenCalled();
    });
  });
});
