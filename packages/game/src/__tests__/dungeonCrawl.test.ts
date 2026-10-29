import { describe, it, expect } from "vitest";
import { createDungeonCrawl } from "../index";
import { TileType } from "../level";

function standOnStairs(game: ReturnType<typeof createDungeonCrawl>): void {
  const stairs = game.level.stairsDown;
  expect(stairs).toBeDefined();
  game.engine.movePlayerTo(stairs!.x, stairs!.y);
}

describe("createDungeonCrawl", () => {
  it("returns a valid GameSession", () => {
    const game = createDungeonCrawl({ seed: 42 });
    expect(game.engine).toBeDefined();
    expect(game.level).toBeDefined();
    expect(game.movePlayer).toBeDefined();
    expect(game.getPlayerStats).toBeDefined();
    expect(game.getEntities).toBeDefined();
    expect(game.getEntityAt).toBeDefined();
    expect(game.descendFloor).toBeDefined();
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

  it("places downward stairs on the generated floor", () => {
    const game = createDungeonCrawl({ seed: 42 });
    const stairs = game.level.stairsDown;

    expect(stairs).toBeDefined();
    expect(game.level.tiles[stairs!.y][stairs!.x].type).toBe(TileType.StairsDown);
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

  it("rejects descent away from stairs without changing state", () => {
    const game = createDungeonCrawl({ seed: 42 });
    const initialLevel = game.level;
    const initialTurn = game.engine.getTurnCount();

    expect(game.descendFloor()).toEqual({
      success: false,
      currentFloor: 1,
      reason: "not-on-stairs",
    });
    expect(game.level).toBe(initialLevel);
    expect(game.engine.getCurrentFloor()).toBe(1);
    expect(game.engine.getTurnCount()).toBe(initialTurn);
  });

  it("descends explicitly and replaces the active floor", () => {
    const game = createDungeonCrawl({ seed: 42 });
    const initialLevel = game.level;
    standOnStairs(game);
    const turnBeforeDescent = game.engine.getTurnCount();

    expect(game.engine.getCurrentFloor()).toBe(1);
    expect(game.descendFloor()).toEqual({
      success: true,
      currentFloor: 2,
    });
    expect(game.level).not.toBe(initialLevel);
    expect(game.level.name).toBe("Dungeon Floor 2");
    expect(game.engine.getCurrentFloor()).toBe(2);
    expect(game.engine.getTurnCount()).toBe(turnBeforeDescent + 1);
    expect(game.engine.getPlayerPosition()).toEqual(game.level.playerStart);
  });

  it("fully heals while preserving player progression and inventory", () => {
    const game = createDungeonCrawl({ seed: 42 });
    const equipment = game.engine.getPlayerEquipment();
    const inventory = game.engine.getInventory();
    game.engine.grantExperience(30, "test");
    game.engine.applyEnvironmentDamage("test", 4);
    standOnStairs(game);

    game.descendFloor();

    expect(game.engine.getPlayerHealth()).toEqual({ current: 10, max: 10 });
    expect(game.engine.getPlayerExperience()).toBe(30);
    expect(game.engine.getPlayerEquipment()).toEqual(equipment);
    expect(game.engine.getInventory()).toEqual(inventory);
  });

  it("clears old floor content and increases enemy count", () => {
    const game = createDungeonCrawl({ seed: 42 });
    const oldEntityIds = game.getEntities().map((entity) => entity.id);
    const oldEnvironmentIds = game.getEnvironments().map((environment) => environment.id);
    standOnStairs(game);

    game.descendFloor();

    expect(game.getEntities()).toHaveLength(2);
    expect(game.getEntities().every((entity) => !oldEntityIds.includes(entity.id))).toBe(true);
    expect(
      game.getEnvironments().every(
        (environment) => !oldEnvironmentIds.includes(environment.id)
      )
    ).toBe(true);

    const occupied = [
      ...game.getEntities().map((entity) => entity.position),
      ...game.getEnvironments().map((environment) => environment.position),
    ];
    const uniquePositions = new Set(occupied.map(({ x, y }) => `${x},${y}`));
    expect(uniquePositions.size).toBe(occupied.length);
    expect(occupied).not.toContainEqual(game.level.playerStart);
    expect(occupied).not.toContainEqual(game.level.stairsDown);
  });

  it("caps enemy count at available non-start, non-stair rooms", () => {
    const game = createDungeonCrawl({ seed: 42 });

    while (game.engine.getCurrentFloor() < 20) {
      standOnStairs(game);
      expect(game.descendFloor().success).toBe(true);
    }

    const availableRooms = Math.max(0, (game.level.rooms?.length ?? 0) - 2);
    expect(game.getEntities()).toHaveLength(
      Math.min(game.engine.getCurrentFloor(), availableRooms)
    );
  });

  it("generates the same multi-floor sequence for the same seed", () => {
    const game1 = createDungeonCrawl({ seed: 123 });
    const game2 = createDungeonCrawl({ seed: 123 });

    standOnStairs(game1);
    standOnStairs(game2);
    game1.descendFloor();
    game2.descendFloor();

    expect(game1.level.tiles).toEqual(game2.level.tiles);
    expect(game1.level.playerStart).toEqual(game2.level.playerStart);
    expect(game1.level.stairsDown).toEqual(game2.level.stairsDown);
    expect(game1.getEntities().map((entity) => entity.position)).toEqual(
      game2.getEntities().map((entity) => entity.position)
    );
  });
});
