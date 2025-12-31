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

  return {
    EventEmitter: MockEventEmitter,
    TreeItem: class {
      label: string;
      description?: string;
      collapsibleState?: number;
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

    it("returns name and health items when player stats set", async () => {
      provider.setPlayerStats({
        name: "Test Hero",
        health: { current: 8, max: 10 },
      });

      const children = await provider.getChildren();
      expect(children).toHaveLength(2);
      expect(children[0].label).toBe("Name");
      expect(children[0].description).toBe("Test Hero");
      expect(children[1].label).toBe("$(heart) Health");
      expect(children[1].description).toBe("8/10");
    });

    it("returns empty array after clearing player stats", async () => {
      provider.setPlayerStats({
        name: "Test Hero",
        health: { current: 10, max: 10 },
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
