/**
 * Level definitions for the game
 *
 * Coordinate system: (0,0) is top-left
 * X increases to the right, Y increases downward
 */

import {
  SeededRandom,
  generateDungeon,
  Rect,
  DungeonConfig,
} from "@vscdc/engine";

/**
 * Tile types that can appear in a level
 */
export enum TileType {
  Floor = "floor",
  Wall = "wall",
}

/**
 * A single tile in the level grid
 */
export interface Tile {
  type: TileType;
  /** ASCII character to display */
  displayChar: string;
}

/**
 * A game level - a 2D grid of tiles
 */
export interface Level {
  /** Level name/identifier */
  name: string;
  /** Width of the level in tiles */
  width: number;
  /** Height of the level in tiles */
  height: number;
  /** 2D grid of tiles, indexed as tiles[y][x] */
  tiles: Tile[][];
  /** Starting position for the player */
  playerStart: { x: number; y: number };
  /** List of rooms in the level (for procedurally generated levels) */
  rooms?: Rect[];
}

/**
 * Creates a tile of the specified type
 */
function createTile(type: TileType): Tile {
  switch (type) {
    case TileType.Wall:
      return { type: TileType.Wall, displayChar: "#" };
    case TileType.Floor:
      return { type: TileType.Floor, displayChar: "." };
  }
}

/**
 * Creates a 7x7 test level bounded by walls
 * The interior is 5x5 floor tiles where the player can move
 */
export function createTestLevel(): Level {
  const width = 7;
  const height = 7;
  const tiles: Tile[][] = [];

  for (let y = 0; y < height; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < width; x++) {
      // Walls on the perimeter, floor inside
      const isWall = x === 0 || x === width - 1 || y === 0 || y === height - 1;
      row.push(createTile(isWall ? TileType.Wall : TileType.Floor));
    }
    tiles.push(row);
  }

  return {
    name: "Test Level",
    width,
    height,
    tiles,
    // Player starts in the center of the room
    playerStart: { x: 3, y: 3 },
  };
}

/**
 * Checks if a position is within level bounds
 */
export function isInBounds(level: Level, x: number, y: number): boolean {
  return x >= 0 && x < level.width && y >= 0 && y < level.height;
}

/**
 * Gets the tile at a position, or undefined if out of bounds
 */
export function getTileAt(level: Level, x: number, y: number): Tile | undefined {
  if (!isInBounds(level, x, y)) {
    return undefined;
  }
  return level.tiles[y][x];
}

/**
 * Checks if a position is walkable (floor tile and in bounds)
 */
export function isWalkable(level: Level, x: number, y: number): boolean {
  const tile = getTileAt(level, x, y);
  return tile !== undefined && tile.type === TileType.Floor;
}

/** Default config for generated dungeons */
const DEFAULT_DUNGEON_CONFIG: DungeonConfig = {
  width: 40,
  height: 25,
  minRoomSize: 5,
  maxRoomSize: 10,
  maxDepth: 4,
};

/**
 * Creates a procedurally generated level using BSP dungeon generation
 *
 * @param seed Optional seed for deterministic generation. If omitted, uses Date.now().
 * @returns A Level with rooms populated
 */
export function createGeneratedLevel(seed?: number): Level {
  const rng = new SeededRandom(seed ?? Date.now());
  const dungeon = generateDungeon(DEFAULT_DUNGEON_CONFIG, rng);

  // Convert string tile types to Tile objects
  const tiles: Tile[][] = dungeon.tiles.map((row) =>
    row.map((tileType) => createTile(tileType === "floor" ? TileType.Floor : TileType.Wall))
  );

  // Player starts in the center of the first room
  const firstRoom = dungeon.rooms[0];
  const playerStart = {
    x: Math.floor(firstRoom.x + firstRoom.width / 2),
    y: Math.floor(firstRoom.y + firstRoom.height / 2),
  };

  return {
    name: "Dungeon Floor 1",
    width: dungeon.width,
    height: dungeon.height,
    tiles,
    playerStart,
    rooms: dungeon.rooms,
  };
}
