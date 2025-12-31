import { describe, it, expect } from "vitest";
import { createGame } from "../index";

describe("createGame", () => {
  it("creates a game session with engine and level", () => {
    const game = createGame();
    expect(game.engine).toBeDefined();
    expect(game.level).toBeDefined();
    expect(game.movePlayer).toBeDefined();
  });

  it("places player at level start position", () => {
    const game = createGame();
    const pos = game.engine.getPlayerPosition();
    expect(pos).toEqual({ x: 3, y: 3 });
  });

  describe("movePlayer", () => {
    it("allows movement to floor tiles", () => {
      const game = createGame();
      // Move left (from 3,3 to 2,3)
      const result = game.movePlayer(-1, 0);
      expect(result).toBe(true);
      expect(game.engine.getPlayerPosition()).toEqual({ x: 2, y: 3 });
    });

    it("blocks movement into walls", () => {
      const game = createGame();
      // Move to edge first (1,1)
      game.movePlayer(-2, -2);
      // Try to move into wall
      const result = game.movePlayer(-1, 0);
      expect(result).toBe(false);
      // Position should be unchanged
      expect(game.engine.getPlayerPosition()).toEqual({ x: 1, y: 1 });
    });

    it("supports all four directions", () => {
      const game = createGame();
      // Start at 3,3
      expect(game.movePlayer(0, -1)).toBe(true); // up to 3,2
      expect(game.engine.getPlayerPosition()).toEqual({ x: 3, y: 2 });

      expect(game.movePlayer(1, 0)).toBe(true); // right to 4,2
      expect(game.engine.getPlayerPosition()).toEqual({ x: 4, y: 2 });

      expect(game.movePlayer(0, 1)).toBe(true); // down to 4,3
      expect(game.engine.getPlayerPosition()).toEqual({ x: 4, y: 3 });

      expect(game.movePlayer(-1, 0)).toBe(true); // left to 3,3
      expect(game.engine.getPlayerPosition()).toEqual({ x: 3, y: 3 });
    });

    it("blocks movement at all walls", () => {
      const game = createGame();
      // Move to top-left corner (1,1)
      game.movePlayer(-2, -2);
      expect(game.movePlayer(-1, 0)).toBe(false); // left wall
      expect(game.movePlayer(0, -1)).toBe(false); // top wall

      // Move to bottom-right corner (4,4)
      game.movePlayer(3, 3);
      expect(game.movePlayer(1, 0)).toBe(false); // right wall
      expect(game.movePlayer(0, 1)).toBe(false); // bottom wall
    });
  });
});
