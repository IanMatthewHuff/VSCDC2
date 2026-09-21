/**
 * BSP (Binary Space Partitioning) dungeon generator
 *
 * Generates a dungeon layout by recursively splitting a rectangle into
 * smaller partitions, carving a room in each leaf, and connecting
 * sibling rooms with L-shaped corridors.
 *
 * This module is game-agnostic - it has no knowledge of enemies, items, etc.
 */

import { SeededRandom } from "./random";
import { Position } from "./types";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DungeonConfig {
  width: number;
  height: number;
  minRoomSize: number;
  maxRoomSize: number;
  maxDepth: number;
}

export interface GeneratedDungeon {
  width: number;
  height: number;
  /** 2D grid of tile type strings: "wall" | "floor" */
  tiles: string[][];
  /** List of carved rooms (useful for entity placement) */
  rooms: Rect[];
  /** Starting position in the first generated room */
  entryPosition: Position;
  /** Reachable position selected for the floor exit */
  exitPosition: Position;
}

interface BSPNode {
  bounds: Rect;
  left: BSPNode | null;
  right: BSPNode | null;
  room: Rect | null;
}

/**
 * Create a 2D grid filled with walls
 */
function createGrid(width: number, height: number): string[][] {
  const grid: string[][] = [];
  for (let y = 0; y < height; y++) {
    const row: string[] = [];
    for (let x = 0; x < width; x++) {
      row.push("wall");
    }
    grid.push(row);
  }
  return grid;
}

/**
 * Recursively split a rectangle using BSP
 */
function splitBSP(
  bounds: Rect,
  depth: number,
  maxDepth: number,
  minRoomSize: number,
  rng: SeededRandom
): BSPNode {
  const node: BSPNode = { bounds, left: null, right: null, room: null };

  if (depth >= maxDepth) {
    return node;
  }

  // Need room for: wall padding (1 on each side) + minRoomSize in each child
  const minSplitSize = minRoomSize + 2; // room + 1 tile padding on each side

  const canSplitH = bounds.height >= minSplitSize * 2;
  const canSplitV = bounds.width >= minSplitSize * 2;

  if (!canSplitH && !canSplitV) {
    return node; // Too small to split
  }

  // Choose split direction
  let splitHorizontal: boolean;
  if (canSplitH && canSplitV) {
    // Alternate based on depth, with some randomness
    splitHorizontal = rng.next() < 0.5;
  } else {
    splitHorizontal = canSplitH;
  }

  if (splitHorizontal) {
    // Split horizontally (top/bottom)
    const minSplit = bounds.y + minSplitSize;
    const maxSplit = bounds.y + bounds.height - minSplitSize;
    if (minSplit > maxSplit) return node;

    const splitY = rng.nextInt(minSplit, maxSplit);

    const topBounds: Rect = {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: splitY - bounds.y,
    };
    const bottomBounds: Rect = {
      x: bounds.x,
      y: splitY,
      width: bounds.width,
      height: bounds.height - (splitY - bounds.y),
    };

    node.left = splitBSP(topBounds, depth + 1, maxDepth, minRoomSize, rng);
    node.right = splitBSP(bottomBounds, depth + 1, maxDepth, minRoomSize, rng);
  } else {
    // Split vertically (left/right)
    const minSplit = bounds.x + minSplitSize;
    const maxSplit = bounds.x + bounds.width - minSplitSize;
    if (minSplit > maxSplit) return node;

    const splitX = rng.nextInt(minSplit, maxSplit);

    const leftBounds: Rect = {
      x: bounds.x,
      y: bounds.y,
      width: splitX - bounds.x,
      height: bounds.height,
    };
    const rightBounds: Rect = {
      x: splitX,
      y: bounds.y,
      width: bounds.width - (splitX - bounds.x),
      height: bounds.height,
    };

    node.left = splitBSP(leftBounds, depth + 1, maxDepth, minRoomSize, rng);
    node.right = splitBSP(rightBounds, depth + 1, maxDepth, minRoomSize, rng);
  }

  return node;
}

/**
 * Carve rooms in each leaf node of the BSP tree
 */
function carveRooms(
  node: BSPNode,
  grid: string[][],
  rooms: Rect[],
  minRoomSize: number,
  maxRoomSize: number,
  rng: SeededRandom
): void {
  // If this is a leaf node, carve a room
  if (!node.left && !node.right) {
    const { bounds } = node;

    // Room dimensions (with 1-tile wall padding from partition edges)
    const maxW = Math.min(maxRoomSize, bounds.width - 2);
    const maxH = Math.min(maxRoomSize, bounds.height - 2);
    const roomW = Math.max(minRoomSize, rng.nextInt(minRoomSize, maxW));
    const roomH = Math.max(minRoomSize, rng.nextInt(minRoomSize, maxH));

    // Random position within the partition (with padding)
    const roomX = rng.nextInt(bounds.x + 1, bounds.x + bounds.width - roomW - 1);
    const roomY = rng.nextInt(bounds.y + 1, bounds.y + bounds.height - roomH - 1);

    const room: Rect = { x: roomX, y: roomY, width: roomW, height: roomH };
    node.room = room;
    rooms.push(room);

    // Carve the room into the grid
    for (let y = roomY; y < roomY + roomH; y++) {
      for (let x = roomX; x < roomX + roomW; x++) {
        grid[y][x] = "floor";
      }
    }

    return;
  }

  if (node.left) carveRooms(node.left, grid, rooms, minRoomSize, maxRoomSize, rng);
  if (node.right) carveRooms(node.right, grid, rooms, minRoomSize, maxRoomSize, rng);
}

/**
 * Get the center of a room
 */
function roomCenter(room: Rect): Position {
  return {
    x: Math.floor(room.x + room.width / 2),
    y: Math.floor(room.y + room.height / 2),
  };
}

/**
 * Select the room center farthest from the dungeon entry.
 */
function selectExitPosition(
  rooms: Rect[],
  grid: string[][],
  entryPosition: Position
): Position {
  let exitPosition = entryPosition;
  let greatestDistance = -1;

  for (const room of rooms.slice(1)) {
    const candidate = roomCenter(room);
    const distance =
      Math.abs(candidate.x - entryPosition.x) +
      Math.abs(candidate.y - entryPosition.y);
    if (distance > greatestDistance) {
      greatestDistance = distance;
      exitPosition = candidate;
    }
  }

  if (
    exitPosition.x !== entryPosition.x ||
    exitPosition.y !== entryPosition.y
  ) {
    return exitPosition;
  }

  // A shallow BSP tree may produce one room. Use its farthest floor tile so
  // the entry and exit remain distinct without introducing game-specific tiles.
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (grid[y][x] !== "floor") {
        continue;
      }
      const distance =
        Math.abs(x - entryPosition.x) + Math.abs(y - entryPosition.y);
      if (distance > greatestDistance) {
        greatestDistance = distance;
        exitPosition = { x, y };
      }
    }
  }

  return exitPosition;
}

/**
 * Get any room from a BSP subtree (picks the first leaf's room)
 */
function getRoom(node: BSPNode): Rect | null {
  if (node.room) return node.room;
  if (node.left) {
    const room = getRoom(node.left);
    if (room) return room;
  }
  if (node.right) {
    const room = getRoom(node.right);
    if (room) return room;
  }
  return null;
}

/**
 * Carve an L-shaped corridor between two points
 */
function carveCorridor(
  grid: string[][],
  x1: number,
  y1: number,
  x2: number,
  y2: number
): void {
  // Carve horizontal segment first, then vertical
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  for (let x = minX; x <= maxX; x++) {
    if (y1 >= 0 && y1 < grid.length && x >= 0 && x < grid[0].length) {
      grid[y1][x] = "floor";
    }
  }

  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  for (let y = minY; y <= maxY; y++) {
    if (y >= 0 && y < grid.length && x2 >= 0 && x2 < grid[0].length) {
      grid[y][x2] = "floor";
    }
  }
}

/**
 * Connect sibling rooms in the BSP tree with corridors
 */
function connectRooms(node: BSPNode, grid: string[][]): void {
  if (!node.left || !node.right) return;

  // Recursively connect children first
  connectRooms(node.left, grid);
  connectRooms(node.right, grid);

  // Connect a room from the left subtree to a room from the right subtree
  const leftRoom = getRoom(node.left);
  const rightRoom = getRoom(node.right);

  if (leftRoom && rightRoom) {
    const c1 = roomCenter(leftRoom);
    const c2 = roomCenter(rightRoom);
    carveCorridor(grid, c1.x, c1.y, c2.x, c2.y);
  }
}

/**
 * Generate a dungeon using BSP (Binary Space Partitioning)
 *
 * @param config Dungeon configuration (dimensions, room sizes, tree depth)
 * @param rng Seeded random number generator for deterministic generation
 * @returns A GeneratedDungeon with tile grid and room list
 */
export function generateDungeon(
  config: DungeonConfig,
  rng: SeededRandom
): GeneratedDungeon {
  const { width, height, minRoomSize, maxRoomSize, maxDepth } = config;

  // 1. Fill entire grid with walls
  const grid = createGrid(width, height);
  const rooms: Rect[] = [];

  // 2. BSP split
  const rootBounds: Rect = { x: 0, y: 0, width, height };
  const root = splitBSP(rootBounds, 0, maxDepth, minRoomSize, rng);

  // 3. Carve rooms in leaf nodes
  carveRooms(root, grid, rooms, minRoomSize, maxRoomSize, rng);

  // 4. Connect sibling rooms with corridors
  connectRooms(root, grid);

  const entryPosition = roomCenter(rooms[0]);
  const exitPosition = selectExitPosition(rooms, grid, entryPosition);

  return {
    width,
    height,
    tiles: grid,
    rooms,
    entryPosition,
    exitPosition,
  };
}
