import { describe, it, expect } from "vitest";
import {
  createTestLevel,
  createGeneratedLevel,
  TileType,
  isInBounds,
  getTileAt,
  isWalkable,
} from "../level";

describe("level", () => {
  describe("createTestLevel", () => {
    it("creates a 7x7 level", () => {
      const level = createTestLevel();
      expect(level.width).toBe(7);
      expect(level.height).toBe(7);
      expect(level.tiles.length).toBe(7);
      expect(level.tiles[0].length).toBe(7);
    });

    it("has walls on the perimeter", () => {
      const level = createTestLevel();
      // Top row
      for (let x = 0; x < 7; x++) {
        expect(level.tiles[0][x].type).toBe(TileType.Wall);
      }
      // Bottom row
      for (let x = 0; x < 7; x++) {
        expect(level.tiles[6][x].type).toBe(TileType.Wall);
      }
      // Left column
      for (let y = 0; y < 7; y++) {
        expect(level.tiles[y][0].type).toBe(TileType.Wall);
      }
      // Right column
      for (let y = 0; y < 7; y++) {
        expect(level.tiles[y][6].type).toBe(TileType.Wall);
      }
    });

    it("has floor tiles in the interior", () => {
      const level = createTestLevel();
      // Interior 5x5 area should be floor
      for (let y = 1; y <= 5; y++) {
        for (let x = 1; x <= 5; x++) {
          expect(level.tiles[y][x].type).toBe(TileType.Floor);
        }
      }
    });

    it("has correct display characters", () => {
      const level = createTestLevel();
      expect(level.tiles[0][0].displayChar).toBe("#"); // Wall
      expect(level.tiles[1][1].displayChar).toBe("."); // Floor
    });

    it("sets player start in the center", () => {
      const level = createTestLevel();
      expect(level.playerStart).toEqual({ x: 3, y: 3 });
    });
  });

  describe("isInBounds", () => {
    const level = createTestLevel();

    it("returns true for valid positions", () => {
      expect(isInBounds(level, 0, 0)).toBe(true);
      expect(isInBounds(level, 6, 6)).toBe(true);
      expect(isInBounds(level, 3, 3)).toBe(true);
    });

    it("returns false for out of bounds positions", () => {
      expect(isInBounds(level, -1, 0)).toBe(false);
      expect(isInBounds(level, 0, -1)).toBe(false);
      expect(isInBounds(level, 7, 0)).toBe(false);
      expect(isInBounds(level, 0, 7)).toBe(false);
    });
  });

  describe("getTileAt", () => {
    const level = createTestLevel();

    it("returns the tile at a valid position", () => {
      const tile = getTileAt(level, 0, 0);
      expect(tile?.type).toBe(TileType.Wall);
    });

    it("returns undefined for out of bounds", () => {
      expect(getTileAt(level, -1, 0)).toBeUndefined();
      expect(getTileAt(level, 7, 0)).toBeUndefined();
    });
  });

  describe("isWalkable", () => {
    const level = createTestLevel();

    it("returns true for floor tiles", () => {
      expect(isWalkable(level, 1, 1)).toBe(true);
      expect(isWalkable(level, 3, 3)).toBe(true);
    });

    it("returns false for wall tiles", () => {
      expect(isWalkable(level, 0, 0)).toBe(false);
      expect(isWalkable(level, 6, 6)).toBe(false);
    });

    it("returns false for out of bounds", () => {
      expect(isWalkable(level, -1, 0)).toBe(false);
      expect(isWalkable(level, 7, 0)).toBe(false);
    });
  });

  describe("createGeneratedLevel", () => {
    it("creates a level with correct dimensions", () => {
      const level = createGeneratedLevel(42);
      expect(level.width).toBe(40);
      expect(level.height).toBe(25);
      expect(level.tiles.length).toBe(25);
      expect(level.tiles[0].length).toBe(40);
    });

    it("has rooms populated", () => {
      const level = createGeneratedLevel(42);
      expect(level.rooms).toBeDefined();
      expect(level.rooms!.length).toBeGreaterThanOrEqual(1);
    });

    it("playerStart is on a floor tile", () => {
      const level = createGeneratedLevel(42);
      const tile = getTileAt(level, level.playerStart.x, level.playerStart.y);
      expect(tile).toBeDefined();
      expect(tile!.type).toBe(TileType.Floor);
    });

    it("all tiles are valid Tile objects", () => {
      const level = createGeneratedLevel(42);
      for (let y = 0; y < level.height; y++) {
        for (let x = 0; x < level.width; x++) {
          const tile = level.tiles[y][x];
          expect([TileType.Floor, TileType.Wall]).toContain(tile.type);
          expect(typeof tile.displayChar).toBe("string");
        }
      }
    });

    it("same seed produces same level", () => {
      const level1 = createGeneratedLevel(42);
      const level2 = createGeneratedLevel(42);
      expect(level1.playerStart).toEqual(level2.playerStart);
      expect(level1.rooms).toEqual(level2.rooms);
    });
  });
});
