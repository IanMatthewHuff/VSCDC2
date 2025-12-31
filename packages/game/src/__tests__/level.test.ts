import { describe, it, expect } from "vitest";
import {
  createTestLevel,
  TileType,
  isInBounds,
  getTileAt,
  isWalkable,
} from "../level";

describe("level", () => {
  describe("createTestLevel", () => {
    it("creates a 6x6 level", () => {
      const level = createTestLevel();
      expect(level.width).toBe(6);
      expect(level.height).toBe(6);
      expect(level.tiles.length).toBe(6);
      expect(level.tiles[0].length).toBe(6);
    });

    it("has walls on the perimeter", () => {
      const level = createTestLevel();
      // Top row
      for (let x = 0; x < 6; x++) {
        expect(level.tiles[0][x].type).toBe(TileType.Wall);
      }
      // Bottom row
      for (let x = 0; x < 6; x++) {
        expect(level.tiles[5][x].type).toBe(TileType.Wall);
      }
      // Left column
      for (let y = 0; y < 6; y++) {
        expect(level.tiles[y][0].type).toBe(TileType.Wall);
      }
      // Right column
      for (let y = 0; y < 6; y++) {
        expect(level.tiles[y][5].type).toBe(TileType.Wall);
      }
    });

    it("has floor tiles in the interior", () => {
      const level = createTestLevel();
      // Interior 4x4 area should be floor
      for (let y = 1; y <= 4; y++) {
        for (let x = 1; x <= 4; x++) {
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
      expect(isInBounds(level, 5, 5)).toBe(true);
      expect(isInBounds(level, 3, 3)).toBe(true);
    });

    it("returns false for out of bounds positions", () => {
      expect(isInBounds(level, -1, 0)).toBe(false);
      expect(isInBounds(level, 0, -1)).toBe(false);
      expect(isInBounds(level, 6, 0)).toBe(false);
      expect(isInBounds(level, 0, 6)).toBe(false);
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
      expect(getTileAt(level, 6, 0)).toBeUndefined();
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
      expect(isWalkable(level, 5, 5)).toBe(false);
    });

    it("returns false for out of bounds", () => {
      expect(isWalkable(level, -1, 0)).toBe(false);
      expect(isWalkable(level, 6, 0)).toBe(false);
    });
  });
});
