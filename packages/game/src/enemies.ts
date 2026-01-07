/**
 * Enemy definitions for the game
 */

import { Enemy, Position } from "@vscdc/engine";

let enemyIdCounter = 0;

/**
 * Creates a unique enemy ID
 */
function generateEnemyId(prefix: string): string {
  return `${prefix}_${++enemyIdCounter}`;
}

/**
 * Creates a Goblin enemy at the specified position
 * Goblins have 3 hit points and attack by bumping into the player
 * They move greedily toward the player but avoid lava
 * 
 * @param position The position to place the Goblin
 * @returns A new Goblin enemy entity
 */
export function createGoblin(position: Position): Enemy {
  return {
    id: generateEnemyId("goblin"),
    name: "Goblin",
    type: "goblin",
    position: { ...position },
    displayChar: "G",
    color: "green",
    health: { current: 3, max: 3 },
  };
}

/**
 * Reset the enemy ID counter (for tests)
 */
export function resetEnemyIdCounter(): void {
  enemyIdCounter = 0;
}
