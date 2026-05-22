/**
 * Loot spawning for procedurally generated dungeons.
 *
 * Picks a small handful of rooms from the map and drops a single item in each
 * — a mix of consumables and equipment — using a weighted item table.
 *
 * The placement helper is deterministic given a SeededRandom: the same seed
 * (advanced through the same number of calls) will produce the same loot.
 */

import { GameEngine, Position, Rect, SeededRandom, EquipmentItem, ConsumableItem } from "@vscdc/engine";
import {
  createHealingPotion,
  createLeatherArmor,
  createIronHelmet,
  createWoodenShield,
  createIronSword,
  createBasicClub,
} from "./items";

/** Minimum number of items spawned per generated floor */
export const MIN_LOOT_PER_FLOOR = 1;

/** Maximum number of items spawned per generated floor */
export const MAX_LOOT_PER_FLOOR = 3;

/** Factory function for an item */
type ItemFactory = () => EquipmentItem | ConsumableItem;

/**
 * Weighted item table.
 *
 * Weights are relative integers; higher weight = more common. Total weight
 * does not need to be 100. We pick by accumulating until the random roll
 * is exceeded.
 */
interface WeightedFactory {
  weight: number;
  factory: ItemFactory;
}

const ITEM_TABLE: WeightedFactory[] = [
  // 50% consumables
  { weight: 50, factory: createHealingPotion },
  // 25% defense gear (split across three pieces)
  { weight: 9, factory: createLeatherArmor },
  { weight: 8, factory: createIronHelmet },
  { weight: 8, factory: createWoodenShield },
  // 25% weapons (split across two)
  { weight: 13, factory: createIronSword },
  { weight: 12, factory: createBasicClub },
];

/**
 * Pick a random item from the weighted table.
 */
function pickWeightedItem(rng: SeededRandom): EquipmentItem | ConsumableItem {
  const totalWeight = ITEM_TABLE.reduce((sum, e) => sum + e.weight, 0);
  const roll = rng.nextInt(1, totalWeight);
  let acc = 0;
  for (const entry of ITEM_TABLE) {
    acc += entry.weight;
    if (roll <= acc) {
      return entry.factory();
    }
  }
  // Fallback (should never hit if weights are positive)
  return ITEM_TABLE[ITEM_TABLE.length - 1].factory();
}

/**
 * Pick a random tile position inside a room (inclusive of all carved tiles).
 */
function randomTileInRoom(room: Rect, rng: SeededRandom): Position {
  const x = rng.nextInt(room.x, room.x + room.width - 1);
  const y = rng.nextInt(room.y, room.y + room.height - 1);
  return { x, y };
}

/**
 * Check whether a position collides with an existing occupant (enemy, NPC,
 * environment, or player start).
 */
function isOccupied(engine: GameEngine, position: Position, playerStart: Position): boolean {
  if (position.x === playerStart.x && position.y === playerStart.y) return true;
  if (engine.getEntityAt(position)) return true;
  if (engine.getNPCAt(position)) return true;
  if (engine.getEnvironmentAt(position)) return true;
  if (engine.getFloorItemAt(position)) return true;
  return false;
}

/**
 * Options for spawning dungeon loot.
 */
export interface SpawnLootOptions {
  /** All rooms in the level */
  rooms: Rect[];
  /** Indices of rooms to skip (e.g., player start, enemy room) */
  excludedRoomIndices?: number[];
  /** Player start position; loot will not spawn there */
  playerStart: Position;
  /** Seeded RNG (deterministic placement) */
  rng: SeededRandom;
  /** Override count; otherwise picks a random count in [MIN_LOOT_PER_FLOOR, MAX_LOOT_PER_FLOOR] */
  count?: number;
}

/**
 * Spawn loot in 1..3 (configurable) non-excluded rooms of the dungeon.
 *
 * For each chosen room, tries up to a few random tiles to avoid spawning on
 * top of existing entities/environments/loot. If no free tile can be found
 * after several attempts, that room is skipped silently.
 *
 * @returns The list of floor-item ids that were placed
 */
export function spawnDungeonLoot(engine: GameEngine, options: SpawnLootOptions): string[] {
  const { rooms, excludedRoomIndices = [], playerStart, rng } = options;

  // Candidate room indices (rooms not in the excluded list)
  const excluded = new Set(excludedRoomIndices);
  const candidateIndices: number[] = [];
  for (let i = 0; i < rooms.length; i++) {
    if (!excluded.has(i)) candidateIndices.push(i);
  }

  if (candidateIndices.length === 0) {
    return [];
  }

  const requestedCount =
    options.count ?? rng.nextInt(MIN_LOOT_PER_FLOOR, MAX_LOOT_PER_FLOOR);
  const targetCount = Math.min(requestedCount, candidateIndices.length);

  // Shuffle candidates with Fisher-Yates using the seeded RNG, then take first N
  const shuffled = [...candidateIndices];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = rng.nextInt(0, i);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const placedIds: string[] = [];
  const MAX_ATTEMPTS = 6;

  for (let i = 0; i < targetCount; i++) {
    const room = rooms[shuffled[i]];
    const item = pickWeightedItem(rng);

    let placed = false;
    for (let attempt = 0; attempt < MAX_ATTEMPTS && !placed; attempt++) {
      const pos = randomTileInRoom(room, rng);
      if (!isOccupied(engine, pos, playerStart)) {
        const id = engine.addFloorItem(item, pos);
        placedIds.push(id);
        placed = true;
      }
    }
  }

  return placedIds;
}
