import { describe, it, expect } from "vitest";
import { generateDungeon, DungeonConfig, GeneratedDungeon } from "../dungeonGenerator";
import { SeededRandom } from "../random";

const DEFAULT_CONFIG: DungeonConfig = {
  width: 40,
  height: 25,
  minRoomSize: 5,
  maxRoomSize: 10,
  maxDepth: 4,
};

function generate(seed: number = 42, config: DungeonConfig = DEFAULT_CONFIG): GeneratedDungeon {
  return generateDungeon(config, new SeededRandom(seed));
}

describe("generateDungeon", () => {
  describe("dimensions", () => {
    it("has correct width and height", () => {
      const dungeon = generate();
      expect(dungeon.width).toBe(40);
      expect(dungeon.height).toBe(25);
      expect(dungeon.tiles.length).toBe(25);
      expect(dungeon.tiles[0].length).toBe(40);
    });
  });

  describe("rooms", () => {
    it("generates at least one room", () => {
      const dungeon = generate();
      expect(dungeon.rooms.length).toBeGreaterThanOrEqual(1);
    });

    it("all rooms are within dungeon bounds", () => {
      const dungeon = generate();
      for (const room of dungeon.rooms) {
        expect(room.x).toBeGreaterThanOrEqual(0);
        expect(room.y).toBeGreaterThanOrEqual(0);
        expect(room.x + room.width).toBeLessThanOrEqual(dungeon.width);
        expect(room.y + room.height).toBeLessThanOrEqual(dungeon.height);
      }
    });

    it("rooms are carved as floor tiles", () => {
      const dungeon = generate();
      for (const room of dungeon.rooms) {
        for (let y = room.y; y < room.y + room.height; y++) {
          for (let x = room.x; x < room.x + room.width; x++) {
            expect(dungeon.tiles[y][x]).toBe("floor");
          }
        }
      }
    });

    it("room dimensions respect minRoomSize", () => {
      const dungeon = generate();
      for (const room of dungeon.rooms) {
        expect(room.width).toBeGreaterThanOrEqual(DEFAULT_CONFIG.minRoomSize);
        expect(room.height).toBeGreaterThanOrEqual(DEFAULT_CONFIG.minRoomSize);
      }
    });
  });

  describe("connectivity", () => {
    it("all rooms are reachable via flood fill", () => {
      const dungeon = generate();
      const { width, height, tiles, rooms } = dungeon;

      // Flood fill from the center of the first room
      const visited = Array.from({ length: height }, () =>
        Array.from({ length: width }, () => false)
      );
      const firstRoom = rooms[0];
      const startX = Math.floor(firstRoom.x + firstRoom.width / 2);
      const startY = Math.floor(firstRoom.y + firstRoom.height / 2);

      const stack: Array<[number, number]> = [[startX, startY]];
      while (stack.length > 0) {
        const [x, y] = stack.pop()!;
        if (x < 0 || x >= width || y < 0 || y >= height) continue;
        if (visited[y][x]) continue;
        if (tiles[y][x] !== "floor") continue;

        visited[y][x] = true;
        stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      }

      // Check that every room has at least one visited tile
      for (const room of rooms) {
        let roomReachable = false;
        for (let y = room.y; y < room.y + room.height && !roomReachable; y++) {
          for (let x = room.x; x < room.x + room.width && !roomReachable; x++) {
            if (visited[y][x]) {
              roomReachable = true;
            }
          }
        }
        expect(roomReachable).toBe(true);
      }
    });
  });

  describe("corridors", () => {
    it("corridors are carved as floor tiles", () => {
      const dungeon = generate();
      // Every floor tile is either in a room or is a corridor
      // We just verify that floor tiles exist outside rooms (corridors)
      let corridorFloorCount = 0;
      for (let y = 0; y < dungeon.height; y++) {
        for (let x = 0; x < dungeon.width; x++) {
          if (dungeon.tiles[y][x] === "floor") {
            const inAnyRoom = dungeon.rooms.some(
              (r) => x >= r.x && x < r.x + r.width && y >= r.y && y < r.y + r.height
            );
            if (!inAnyRoom) {
              corridorFloorCount++;
            }
          }
        }
      }
      // There should be corridor tiles connecting rooms (unless rooms happen to be adjacent)
      // With multiple rooms, corridors are expected
      if (dungeon.rooms.length > 1) {
        expect(corridorFloorCount).toBeGreaterThan(0);
      }
    });
  });

  describe("determinism", () => {
    it("same seed produces same dungeon", () => {
      const dungeon1 = generate(42);
      const dungeon2 = generate(42);

      expect(dungeon1.tiles).toEqual(dungeon2.tiles);
      expect(dungeon1.rooms).toEqual(dungeon2.rooms);
    });

    it("different seeds produce different dungeons", () => {
      const dungeon1 = generate(42);
      const dungeon2 = generate(99);

      // Tiles should differ (extremely unlikely to be identical)
      const tilesMatch = JSON.stringify(dungeon1.tiles) === JSON.stringify(dungeon2.tiles);
      expect(tilesMatch).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("minimum config values produce a valid dungeon", () => {
      const minConfig: DungeonConfig = {
        width: 20,
        height: 15,
        minRoomSize: 3,
        maxRoomSize: 5,
        maxDepth: 2,
      };
      const dungeon = generate(42, minConfig);
      expect(dungeon.width).toBe(20);
      expect(dungeon.height).toBe(15);
      expect(dungeon.rooms.length).toBeGreaterThanOrEqual(1);

      // All tiles are valid types
      for (let y = 0; y < dungeon.height; y++) {
        for (let x = 0; x < dungeon.width; x++) {
          expect(["wall", "floor"]).toContain(dungeon.tiles[y][x]);
        }
      }
    });

    it("maxDepth 1 produces a dungeon", () => {
      const config: DungeonConfig = {
        width: 30,
        height: 20,
        minRoomSize: 4,
        maxRoomSize: 8,
        maxDepth: 1,
      };
      const dungeon = generate(42, config);
      expect(dungeon.rooms.length).toBeGreaterThanOrEqual(1);
    });
  });
});
