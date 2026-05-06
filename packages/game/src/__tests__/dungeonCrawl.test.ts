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

  it("spawns floor items in the dungeon", () => {
    const game = createDungeonCrawl({ seed: 42 });
    const items = game.getFloorItems();
    expect(items.length).toBeGreaterThan(0);
  });

  it("does not spawn loot on the player start tile", () => {
    const game = createDungeonCrawl({ seed: 42 });
    const start = game.engine.getPlayerPosition();
    expect(game.getFloorItemAt(start)).toBeUndefined();
  });

  it("walking onto a floor item picks it up", () => {
    const game = createDungeonCrawl({ seed: 42 });

    // Find any floor item and place player adjacent to it on a walkable tile
    const items = game.getFloorItems();
    expect(items.length).toBeGreaterThan(0);

    const target = items[0];
    const dirs = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 },
    ];

    // Find a neighbour of the target tile that is a floor tile
    let neighbour: { x: number; y: number } | null = null;
    for (const d of dirs) {
      const nx = target.position.x + d.dx;
      const ny = target.position.y + d.dy;
      if (
        nx >= 0 &&
        nx < game.level.width &&
        ny >= 0 &&
        ny < game.level.height &&
        game.level.tiles[ny][nx].type === TileType.Floor &&
        !game.getEntityAt({ x: nx, y: ny }) &&
        !game.getNPCAt({ x: nx, y: ny }) &&
        !game.getFloorItemAt({ x: nx, y: ny }) &&
        !game.getEnvironmentAt({ x: nx, y: ny })
      ) {
        neighbour = { x: nx, y: ny };
        break;
      }
    }
    expect(neighbour).not.toBeNull();

    // Move player to the neighbour
    game.engine.movePlayerTo(neighbour!.x, neighbour!.y);

    // Step onto the item
    const dx = target.position.x - neighbour!.x;
    const dy = target.position.y - neighbour!.y;
    const inventoryBefore = game.engine.getInventory().length;
    const itemsBefore = game.getFloorItems().length;

    const result = game.movePlayer(dx, dy);

    expect(result.actionType).toBe("move");
    expect(game.engine.getInventory().length).toBe(inventoryBefore + 1);
    expect(game.getFloorItems().length).toBe(itemsBefore - 1);
    expect(game.getFloorItemAt(target.position)).toBeUndefined();
  });

  it("walking onto a floor item with full inventory leaves it behind", () => {
    const game = createDungeonCrawl({ seed: 42 });

    // Fill the inventory to capacity
    const cap = game.engine.getInventoryCapacity();
    while (game.engine.getInventory().length < cap) {
      game.engine.addToInventory({
        id: `filler_${game.engine.getInventory().length}`,
        name: "Filler",
        // Cast through unknown to avoid importing the type just for the cast
        type: "consumable",
        effect: { type: "heal", amount: 1 },
      } as never);
    }
    expect(game.engine.isInventoryFull()).toBe(true);

    // Walk onto a floor item
    const items = game.getFloorItems();
    expect(items.length).toBeGreaterThan(0);
    const target = items[0];

    // Place player adjacent
    const start = { x: target.position.x - 1, y: target.position.y };
    if (
      start.x < 0 ||
      game.level.tiles[start.y][start.x].type !== TileType.Floor
    ) {
      // Fall back to a different neighbour if needed
      start.x = target.position.x + 1;
    }
    game.engine.movePlayerTo(start.x, start.y);
    const dx = target.position.x - start.x;
    const dy = target.position.y - start.y;

    const itemsBefore = game.getFloorItems().length;
    const result = game.movePlayer(dx, dy);

    expect(result.actionType).toBe("move");
    // Item still on the floor
    expect(game.getFloorItems().length).toBe(itemsBefore);
    expect(game.getFloorItemAt(target.position)?.id).toBe(target.id);
  });
});
