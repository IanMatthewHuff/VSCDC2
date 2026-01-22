/**
 * Enemy AI behaviors and movement logic
 */

import { Enemy, Position, GameEngine } from "@vscdc/engine";
import { Level, isWalkable } from "./level";
import { getEnvironmentEffect } from "./environments";

/**
 * Calculate Manhattan distance between two positions
 */
function manhattanDistance(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/**
 * Get all adjacent positions (4-directional)
 */
function getAdjacentPositions(pos: Position): Position[] {
  return [
    { x: pos.x, y: pos.y - 1 }, // North
    { x: pos.x, y: pos.y + 1 }, // South
    { x: pos.x - 1, y: pos.y }, // West
    { x: pos.x + 1, y: pos.y }, // East
  ];
}

/**
 * Process a single enemy's turn using greedy movement
 * Enemies move toward the player, preferring moves that reduce Manhattan distance
 * Enemies avoid lava tiles and will attack the player if adjacent
 * 
 * @param enemy The enemy to process
 * @param engine The game engine
 * @param level The current level
 */
export function processEnemyTurn(enemy: Enemy, engine: GameEngine, level: Level): void {
  const playerPos = engine.getPlayerPosition();
  const currentPos = enemy.position;

  // Check if player is adjacent - if so, attack
  const distanceToPlayer = manhattanDistance(currentPos, playerPos);
  if (distanceToPlayer === 1) {
    // Attack the player (damage calculated from enemy attack vs player defense)
    engine.enemyAttackPlayer(enemy.id);
    return;
  }

  // Get all adjacent positions
  const adjacentPositions = getAdjacentPositions(currentPos);

  // Filter to valid moves (walkable, not occupied, not lava)
  const validMoves = adjacentPositions.filter((pos) => {
    // Check if walkable
    if (!isWalkable(level, pos.x, pos.y)) {
      return false;
    }

    // Check if position is occupied by another entity or NPC
    const entityAtPos = engine.getEntityAt(pos);
    const npcAtPos = engine.getNPCAt(pos);
    if (entityAtPos || npcAtPos) {
      return false;
    }

    // Check if position has lava (goblins avoid lava)
    const environment = engine.getEnvironmentAt(pos);
    if (environment) {
      const effect = getEnvironmentEffect(environment.type);
      // Avoid environments that deal damage
      if (effect && effect.damage && effect.damage > 0) {
        return false;
      }
    }

    return true;
  });

  // If no valid moves, stay in place
  if (validMoves.length === 0) {
    return;
  }

  // Choose the move that minimizes distance to player (greedy)
  let bestMove = validMoves[0];
  let bestDistance = manhattanDistance(bestMove, playerPos);

  for (const move of validMoves) {
    const distance = manhattanDistance(move, playerPos);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestMove = move;
    }
  }

  // Move the enemy to the best position
  engine.moveEntity(enemy.id, bestMove);
}

/**
 * Process turns for all enemies in the game
 * Called after the player's turn completes
 * 
 * @param engine The game engine
 * @param level The current level
 */
export function processAllEnemyTurns(engine: GameEngine, level: Level): void {
  const enemies = engine.getEntities();

  // Process each enemy's turn
  // Skip non-active enemy types like target dummies
  for (const enemy of enemies) {
    if (enemy.type === "target_dummy") {
      continue; // Target dummies don't move or attack
    }
    
    processEnemyTurn(enemy, engine, level);
  }
}
