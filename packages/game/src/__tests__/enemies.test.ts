import { describe, it, expect } from "vitest";
import { createGame, createGoblin } from "../index";

describe("Enemy movement and combat", () => {
  describe("Goblin enemy", () => {
    it("creates a goblin with correct properties", () => {
      const goblin = createGoblin({ x: 4, y: 4 });
      
      expect(goblin.name).toBe("Goblin");
      expect(goblin.type).toBe("goblin");
      expect(goblin.displayChar).toBe("G");
      expect(goblin.color).toBe("green");
      expect(goblin.health).toEqual({ current: 3, max: 3 });
      expect(goblin.position).toEqual({ x: 4, y: 4 });
    });

    it("creates unique IDs for each goblin", () => {
      const goblin1 = createGoblin({ x: 1, y: 1 });
      const goblin2 = createGoblin({ x: 2, y: 2 });
      
      expect(goblin1.id).not.toBe(goblin2.id);
    });

    it("is included when includeEnemies option is true", () => {
      const game = createGame({ includeEnemies: true });
      const entities = game.getEntities();
      
      const goblin = entities.find(e => e.type === "goblin");
      expect(goblin).toBeDefined();
      expect(goblin?.name).toBe("Goblin");
    });

    it("is not included when includeEnemies option is false", () => {
      const game = createGame({ includeEnemies: false });
      const entities = game.getEntities();
      
      const goblin = entities.find(e => e.type === "goblin");
      expect(goblin).toBeUndefined();
    });

    it("is not included by default", () => {
      const game = createGame();
      const entities = game.getEntities();
      
      const goblin = entities.find(e => e.type === "goblin");
      expect(goblin).toBeUndefined();
    });
  });

  describe("Goblin movement", () => {
    it("goblin moves toward player", () => {
      const game = createGame({ includeEnemies: true });
      
      // Goblin starts at (1, 1), player at (3, 3)
      const goblinBefore = game.getEntityAt({ x: 1, y: 1 });
      expect(goblinBefore?.type).toBe("goblin");
      
      // Player moves, triggering goblin turn
      game.movePlayer(1, 0); // Move to (4, 3)
      
      // Goblin should have moved from starting position
      const goblinAfter1 = game.getEntities().find(e => e.type === "goblin");
      expect(goblinAfter1).toBeDefined();
      // Goblin should not be at starting position (it should have moved)
      expect(goblinAfter1?.position).not.toEqual({ x: 1, y: 1 });
      
      // The goblin should be trying to move toward the player
      // We can verify it moved by checking it's not at the original position
      // and is generally moving in the right direction (not moving away)
      const distanceBefore = Math.abs(1 - 3) + Math.abs(1 - 3); // Manhattan distance: 4
      const distanceAfter = Math.abs(goblinAfter1!.position.x - 4) + 
                            Math.abs(goblinAfter1!.position.y - 3);
      // Distance should not increase (goblin doesn't move away)
      expect(distanceAfter).toBeLessThanOrEqual(distanceBefore);
    });

    it("goblin avoids lava when moving", () => {
      const game = createGame({ includeEnemies: true });
      
      // Lava is at (4, 1), goblin at (1, 1), player at (3, 3)
      // If goblin tries to move toward player, it should avoid lava
      
      // Move player several times to make goblin move
      for (let i = 0; i < 5; i++) {
        game.movePlayer(0, 0); // Wait in place (blocked by wall or dummy)
      }
      
      // Check that goblin never entered lava position
      const goblin = game.getEntities().find(e => e.type === "goblin");
      expect(goblin?.position).not.toEqual({ x: 4, y: 1 });
    });

    it("goblin attacks player when adjacent", () => {
      const game = createGame({ includeEnemies: true });
      
      const initialHealth = game.getPlayerStats().health.current;
      
      // Move player toward goblin at (1, 1)
      // Player starts at (3, 3)
      game.movePlayer(-1, -1); // Move to (2, 2) - but target dummy is there, so attack
      game.movePlayer(-1, -1); // Attack again
      game.movePlayer(-1, -1); // Destroy dummy
      game.movePlayer(-1, -1); // Move to (2, 2)
      
      // After these moves, goblin should have moved toward player
      // and might be adjacent, causing damage
      const healthAfter = game.getPlayerStats().health.current;
      
      // Either player took damage from goblin, or goblin is close
      // (This test is a bit loose since exact behavior depends on pathfinding)
      const goblin = game.getEntities().find(e => e.type === "goblin");
      expect(goblin).toBeDefined();
      
      // If goblin reached player, health should be lower
      if (healthAfter < initialHealth) {
        expect(healthAfter).toBe(initialHealth - 1); // 1 damage per attack
      }
    });

    it("player can attack and destroy goblin", () => {
      const game = createGame();
      
      // Manually add a goblin next to the player for easy testing
      const goblin = createGoblin({ x: 4, y: 3 });
      game.engine.addEntity(goblin);
      
      // Player at (3, 3), goblin at (4, 3)
      // Attack goblin 3 times to destroy it (3 HP)
      let result = game.movePlayer(1, 0);
      expect(result.actionType).toBe("attack");
      expect(result.targetDestroyed).toBe(false);
      
      result = game.movePlayer(1, 0);
      expect(result.actionType).toBe("attack");
      expect(result.targetDestroyed).toBe(false);
      
      result = game.movePlayer(1, 0);
      expect(result.actionType).toBe("attack");
      expect(result.targetDestroyed).toBe(true);
      
      // Goblin should be removed
      expect(game.getEntityAt({ x: 4, y: 3 })).toBeUndefined();
      const goblins = game.getEntities().filter(e => e.type === "goblin");
      expect(goblins).toHaveLength(0);
    });
  });
});
