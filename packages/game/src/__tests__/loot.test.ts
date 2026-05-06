import { describe, it, expect, beforeEach } from "vitest";
import { GameEngine, SeededRandom, Rect, ItemTypeEnum } from "@vscdc/engine";
import {
  spawnDungeonLoot,
  MIN_LOOT_PER_FLOOR,
  MAX_LOOT_PER_FLOOR,
} from "../loot";
import { resetItemIdCounter } from "../items";
import { createGoblin, resetEnemyIdCounter } from "../enemies";
import { createLavaEnvironment } from "../environments";
import { initializeEnvironmentEffects } from "../environments";

function makeRooms(): Rect[] {
  // Three small rooms at distinct, non-overlapping coordinates
  return [
    { x: 0, y: 0, width: 4, height: 4 },
    { x: 10, y: 0, width: 4, height: 4 },
    { x: 0, y: 10, width: 4, height: 4 },
    { x: 10, y: 10, width: 4, height: 4 },
  ];
}

describe("spawnDungeonLoot", () => {
  beforeEach(() => {
    resetItemIdCounter();
    resetEnemyIdCounter();
    initializeEnvironmentEffects();
  });

  it("spawns between MIN_LOOT_PER_FLOOR and MAX_LOOT_PER_FLOOR items", () => {
    // Run many seeds and verify the count distribution is within bounds
    for (let seed = 1; seed <= 20; seed++) {
      const engine = new GameEngine();
      const rng = new SeededRandom(seed);
      const placed = spawnDungeonLoot(engine, {
        rooms: makeRooms(),
        excludedRoomIndices: [0],
        playerStart: { x: 1, y: 1 },
        rng,
      });
      expect(placed.length).toBeGreaterThanOrEqual(MIN_LOOT_PER_FLOOR);
      expect(placed.length).toBeLessThanOrEqual(MAX_LOOT_PER_FLOOR);
    }
  });

  it("does not spawn loot in excluded rooms", () => {
    const engine = new GameEngine();
    const rng = new SeededRandom(42);
    const rooms = makeRooms();
    spawnDungeonLoot(engine, {
      rooms,
      excludedRoomIndices: [0, 1],
      playerStart: { x: 1, y: 1 },
      rng,
      count: MAX_LOOT_PER_FLOOR,
    });

    const items = engine.getFloorItems();
    for (const fi of items) {
      // Each placed item should be inside one of the non-excluded rooms (2 or 3)
      const inRoom2 = within(fi.position, rooms[2]);
      const inRoom3 = within(fi.position, rooms[3]);
      expect(inRoom2 || inRoom3).toBe(true);
    }
  });

  it("does not place loot on the player start tile", () => {
    const engine = new GameEngine();
    const rng = new SeededRandom(7);
    const playerStart = { x: 11, y: 1 }; // Inside rooms[1]
    spawnDungeonLoot(engine, {
      rooms: makeRooms(),
      excludedRoomIndices: [0],
      playerStart,
      rng,
      count: MAX_LOOT_PER_FLOOR,
    });

    for (const fi of engine.getFloorItems()) {
      expect(fi.position).not.toEqual(playerStart);
    }
  });

  it("does not place loot on top of enemies or environments", () => {
    const engine = new GameEngine();

    // Place a goblin and lava deterministically inside rooms[1]
    const goblin = createGoblin({ x: 11, y: 1 });
    engine.addEntity(goblin);
    const lava = createLavaEnvironment({ x: 12, y: 2 });
    engine.addEnvironment(lava);

    const rng = new SeededRandom(99);
    spawnDungeonLoot(engine, {
      rooms: makeRooms(),
      excludedRoomIndices: [0],
      playerStart: { x: 1, y: 1 },
      rng,
      count: MAX_LOOT_PER_FLOOR,
    });

    for (const fi of engine.getFloorItems()) {
      expect(fi.position).not.toEqual({ x: 11, y: 1 });
      expect(fi.position).not.toEqual({ x: 12, y: 2 });
    }
  });

  it("is deterministic for a given seed", () => {
    const engine1 = new GameEngine();
    const engine2 = new GameEngine();
    const rooms = makeRooms();

    spawnDungeonLoot(engine1, {
      rooms,
      excludedRoomIndices: [0],
      playerStart: { x: 1, y: 1 },
      rng: new SeededRandom(1234),
    });

    // Reset id counters so item ids match between runs
    resetItemIdCounter();

    spawnDungeonLoot(engine2, {
      rooms,
      excludedRoomIndices: [0],
      playerStart: { x: 1, y: 1 },
      rng: new SeededRandom(1234),
    });

    const items1 = engine1.getFloorItems().map((f) => ({
      pos: f.position,
      itemId: f.item.id,
      itemType: f.item.type,
    }));
    const items2 = engine2.getFloorItems().map((f) => ({
      pos: f.position,
      itemId: f.item.id,
      itemType: f.item.type,
    }));
    expect(items1).toEqual(items2);
  });

  it("spawns a mix of item types over many seeds (sanity)", () => {
    const seenTypes = new Set<string>();
    for (let seed = 1; seed <= 30 && seenTypes.size < 2; seed++) {
      const engine = new GameEngine();
      resetItemIdCounter();
      spawnDungeonLoot(engine, {
        rooms: makeRooms(),
        excludedRoomIndices: [],
        playerStart: { x: 1, y: 1 },
        rng: new SeededRandom(seed),
        count: MAX_LOOT_PER_FLOOR,
      });
      for (const fi of engine.getFloorItems()) {
        seenTypes.add(fi.item.type);
      }
    }
    expect(seenTypes.has(ItemTypeEnum.Consumable) || seenTypes.has(ItemTypeEnum.Equipment)).toBe(true);
  });
});

function within(p: { x: number; y: number }, r: Rect): boolean {
  return p.x >= r.x && p.x < r.x + r.width && p.y >= r.y && p.y < r.y + r.height;
}
