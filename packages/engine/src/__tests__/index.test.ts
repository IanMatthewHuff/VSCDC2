import { describe, it, expect } from "vitest";
import { ENGINE_VERSION, GameEngine } from "../index";

describe("engine", () => {
  it("exports ENGINE_VERSION", () => {
    expect(ENGINE_VERSION).toBe("0.0.1");
  });
});

describe("GameEngine", () => {
  describe("player stats", () => {
    it("returns default player name", () => {
      const engine = new GameEngine();
      expect(engine.getPlayerName()).toBe("Adventurer");
    });

    it("returns player health with current and max values", () => {
      const engine = new GameEngine();
      const health = engine.getPlayerHealth();
      expect(health).toEqual({ current: 10, max: 10 });
    });
  });
});
