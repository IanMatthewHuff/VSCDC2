import { describe, it, expect } from "vitest";
import { createDungeonCrawl } from "../index";
import { TileType } from "../level";

describe("createDungeonCrawl", () => {
  it("returns a valid GameSession", () => {
    const game = createDungeonCrawl({ seed: 42 });
    expect(game.engine).toBeDefined();
    expect(game.level).toBeDefined();
    expect(game.movePlayer).toBeDefined();
    expect(game.getPlayerStats).toBeDefined();
    expect(game.getEntities).toBeDefined();
    expect(game.getEntityAt).toBeDefined();
  });

  it("creates a level larger than the test level", () => {
    const game = createDungeonCrawl({ seed: 42 });
    expect(game.level.width).toBe(40);
    expect(game.level.height).toBe(25);
  });

  it("player starts on a floor tile", () => {
    const game = createDungeonCrawl({ seed: 42 });
    const pos = game.engine.getPlayerPosition();
    const tile = game.level.tiles[pos.y][pos.x];
    expect(tile.type).toBe(TileType.Floor);
  });

  it("has rooms in the level", () => {
    const game = createDungeonCrawl({ seed: 42 });
    expect(game.level.rooms).toBeDefined();
    expect(game.level.rooms!.length).toBeGreaterThanOrEqual(2);
  });

  it("places a goblin enemy", () => {
    const game = createDungeonCrawl({ seed: 42 });
    const entities = game.getEntities();
    const goblin = entities.find((e) => e.type === "goblin");
    expect(goblin).toBeDefined();
  });

  it("goblin is on a floor tile", () => {
    const game = createDungeonCrawl({ seed: 42 });
    const goblin = game.getEntities().find((e) => e.type === "goblin");
    expect(goblin).toBeDefined();
    const tile = game.level.tiles[goblin!.position.y][goblin!.position.x];
    expect(tile.type).toBe(TileType.Floor);
  });

  it("player has starting equipment", () => {
    const game = createDungeonCrawl({ seed: 42 });
    const stats = game.getPlayerStats();
    expect(stats.equipment.armor).toBe("Chain Mail");
    expect(stats.name).toBe("Adventurer");
  });

  it("movement works in the generated dungeon", () => {
    const game = createDungeonCrawl({ seed: 42 });
    const startPos = game.engine.getPlayerPosition();

    // Try moving in all four directions - at least one should work
    // since the player starts in the center of a room
    const results = [
      game.movePlayer(1, 0),
      game.movePlayer(-1, 0),
      game.movePlayer(0, 1),
      game.movePlayer(0, -1),
    ];

    const anyMoved = results.some((r) => r.actionType === "move");
    expect(anyMoved).toBe(true);
  });

  it("same seed produces same layout", () => {
    const game1 = createDungeonCrawl({ seed: 123 });
    const game2 = createDungeonCrawl({ seed: 123 });

    expect(game1.level.rooms).toEqual(game2.level.rooms);
    expect(game1.engine.getPlayerPosition()).toEqual(game2.engine.getPlayerPosition());
  });

  it("different seeds produce different layouts", () => {
    const game1 = createDungeonCrawl({ seed: 42 });
    const game2 = createDungeonCrawl({ seed: 99 });

    // Rooms should differ (extremely unlikely to match)
    expect(game1.level.rooms).not.toEqual(game2.level.rooms);
  });
});
