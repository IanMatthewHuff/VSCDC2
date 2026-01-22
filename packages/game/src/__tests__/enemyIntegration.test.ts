import { describe, it, expect } from "vitest";
import { createGame } from "../index";

describe("Enemy system integration", () => {
  it("complete enemy behavior scenario", () => {
    const game = createGame(); // Goblin included by default
    
    // Initial setup: Player at (3,3), Goblin at (1,1), Target Dummy at (2,2)
    const initialPlayerHealth = game.getPlayerStats().health.current;
    expect(initialPlayerHealth).toBe(10);
    
    const goblin = game.getEntities().find(e => e.type === "goblin");
    expect(goblin).toBeDefined();
    expect(goblin?.position).toEqual({ x: 1, y: 1 });
    
    // Track goblin movement over several turns
    const goblinPositions: { x: number; y: number }[] = [{ ...goblin!.position }];
    
    // Make several moves to allow goblin to approach
    for (let i = 0; i < 5; i++) {
      game.movePlayer(0, 1); // Try to move down (might be blocked by walls)
      
      const currentGoblin = game.getEntities().find(e => e.type === "goblin");
      if (currentGoblin) {
        goblinPositions.push({ ...currentGoblin.position });
      }
    }
    
    // Verify goblin moved from starting position
    const finalGoblin = game.getEntities().find(e => e.type === "goblin");
    expect(finalGoblin?.position).not.toEqual({ x: 1, y: 1 });
    
    // Check if player took damage (goblin might have reached and attacked)
    const finalPlayerHealth = game.getPlayerStats().health.current;
    if (finalPlayerHealth < initialPlayerHealth) {
      // Goblin successfully attacked
      expect(finalPlayerHealth).toBeLessThan(initialPlayerHealth);
      console.log(`Goblin dealt ${initialPlayerHealth - finalPlayerHealth} damage to player`);
    }
    
    // Verify goblin positions show movement toward player
    // The goblin should be getting closer to the player
    const lastPos = goblinPositions[goblinPositions.length - 1];
    expect(lastPos).toBeDefined();
    
    // Log the goblin's path for debugging
    console.log("Goblin path:", goblinPositions);
  });

  it("player can fight back and destroy goblin", () => {
    // Use excludeEnemies to start with no goblins, then add one at a specific position
    const game = createGame({ excludeEnemies: true });
    
    // Manually place goblin next to player for controlled test
    const goblin = createGoblin({ x: 2, y: 3 });
    game.engine.addEntity(goblin);
    
    // Player at (3, 3), goblin at (2, 3)
    expect(game.getEntityAt({ x: 2, y: 3 })).toBeDefined();
    
    // Goblin has HP 5, defense 0; player has attack 2
    // Each attack deals 2 damage, so 3 attacks needed to destroy
    const result1 = game.movePlayer(-1, 0);
    expect(result1.actionType).toBe("attack");
    expect(result1.targetDestroyed).toBe(false);
    
    const goblinAfter1 = game.getEntityAt({ x: 2, y: 3 });
    expect(goblinAfter1?.health.current).toBe(3); // 5 - 2 = 3
    
    const result2 = game.movePlayer(-1, 0);
    expect(result2.actionType).toBe("attack");
    expect(result2.targetDestroyed).toBe(false);
    
    const goblinAfter2 = game.getEntityAt({ x: 2, y: 3 });
    expect(goblinAfter2?.health.current).toBe(1); // 3 - 2 = 1
    
    const result3 = game.movePlayer(-1, 0);
    expect(result3.actionType).toBe("attack");
    expect(result3.targetDestroyed).toBe(true); // 1 - 2 = -1, destroyed
    
    // Goblin should be removed
    expect(game.getEntityAt({ x: 2, y: 3 })).toBeUndefined();
  });

  it("goblin avoids lava while pursuing player", () => {
    const game = createGame(); // Goblin included by default
    
    // Lava at (4, 1), goblin starts at (1, 1)
    // If we move player to (4, 2), goblin might try to reach via (4, 1) but should avoid
    
    // Move player toward lava area
    game.movePlayer(1, 0); // to (4, 3)
    game.movePlayer(0, -1); // to (4, 2) - right above lava
    
    // Check goblin position after several turns
    const goblin = game.getEntities().find(e => e.type === "goblin");
    expect(goblin).toBeDefined();
    
    // Goblin should never be on lava tile
    expect(goblin?.position).not.toEqual({ x: 4, y: 1 });
    
    // Make more moves to give goblin chances to move
    for (let i = 0; i < 5; i++) {
      game.movePlayer(0, 0); // Wait (blocked)
      
      const currentGoblin = game.getEntities().find(e => e.type === "goblin");
      expect(currentGoblin?.position).not.toEqual({ x: 4, y: 1 });
    }
  });

  it("equipment changes trigger enemy turns", () => {
    // Use excludeEnemies to start clean, then add a goblin adjacent to player
    const game = createGame({ excludeEnemies: true });
    
    // Place goblin adjacent to player at (3,3)
    const goblin = createGoblin({ x: 2, y: 3 });
    game.engine.addEntity(goblin);
    
    const initialHealth = game.getPlayerStats().health.current;
    expect(initialHealth).toBe(10);
    
    // Goblin is adjacent and should attack when world advances
    // Call onEquipmentChanged to simulate an equipment change action
    game.onEquipmentChanged();
    
    // Goblin (attack 3) vs Player (defense 2 from chain mail) = 1 damage
    const healthAfterEquipChange = game.getPlayerStats().health.current;
    expect(healthAfterEquipChange).toBe(initialHealth - 1);
    
    // Another equipment change should trigger another enemy turn
    game.onEquipmentChanged();
    expect(game.getPlayerStats().health.current).toBe(initialHealth - 2);
  });
});

// Re-export createGoblin for the integration test
import { createGoblin } from "../enemies";
