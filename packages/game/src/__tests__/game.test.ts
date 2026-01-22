import { describe, it, expect } from "vitest";
import { createGame, createTargetDummy } from "../index";

describe("createGame", () => {
  it("creates a game session with engine and level", () => {
    const game = createGame();
    expect(game.engine).toBeDefined();
    expect(game.level).toBeDefined();
    expect(game.movePlayer).toBeDefined();
    expect(game.getPlayerStats).toBeDefined();
    expect(game.getEntities).toBeDefined();
    expect(game.getEntityAt).toBeDefined();
  });

  it("places player at level start position", () => {
    const game = createGame();
    const pos = game.engine.getPlayerPosition();
    expect(pos).toEqual({ x: 3, y: 3 });
  });

  it("creates a target dummy in the level", () => {
    const game = createGame();
    const entities = game.getEntities();
    expect(entities.length).toBeGreaterThanOrEqual(1);
    
    // Find the target dummy among entities
    const targetDummy = entities.find(e => e.type === "target_dummy");
    expect(targetDummy).toBeDefined();
    expect(targetDummy?.name).toBe("Target Dummy");
    expect(targetDummy?.position).toEqual({ x: 2, y: 2 });
  });

  describe("getPlayerStats", () => {
    it("returns player name and health", () => {
      const game = createGame();
      const stats = game.getPlayerStats();
      expect(stats.name).toBe("Adventurer");
      expect(stats.health).toEqual({ current: 10, max: 10 });
    });
  });

  describe("getEntities", () => {
    it("returns all entities in the game", () => {
      const game = createGame();
      const entities = game.getEntities();
      expect(entities.length).toBeGreaterThanOrEqual(1);
      
      // Verify target dummy exists
      const targetDummy = entities.find(e => e.type === "target_dummy");
      expect(targetDummy).toBeDefined();
      expect(targetDummy?.name).toBe("Target Dummy");
    });
  });

  describe("getEntityAt", () => {
    it("returns entity at the specified position", () => {
      const game = createGame();
      const entity = game.getEntityAt({ x: 2, y: 2 });
      expect(entity).toBeDefined();
      expect(entity?.name).toBe("Target Dummy");
    });

    it("returns undefined when no entity at position", () => {
      const game = createGame();
      const entity = game.getEntityAt({ x: 4, y: 4 });
      expect(entity).toBeUndefined();
    });
  });

  describe("movePlayer", () => {
    it("allows movement to floor tiles", () => {
      const game = createGame();
      // Move right (from 3,3 to 4,3 - away from the target dummy)
      const result = game.movePlayer(1, 0);
      expect(result.success).toBe(true);
      expect(result.actionType).toBe("move");
      expect(game.engine.getPlayerPosition()).toEqual({ x: 4, y: 3 });
    });

    it("blocks movement into walls", () => {
      // Use excludeEnemies to avoid goblin at (1,1)
      const game = createGame({ excludeEnemies: true });
      // Move to edge first (1,1)
      game.movePlayer(-2, -2);
      // Try to move into wall
      const result = game.movePlayer(-1, 0);
      expect(result.success).toBe(false);
      expect(result.actionType).toBe("blocked");
      // Position should be unchanged
      expect(game.engine.getPlayerPosition()).toEqual({ x: 1, y: 1 });
    });

    it("supports all four directions", () => {
      const game = createGame();
      // Start at 3,3, move right first to avoid target dummy
      expect(game.movePlayer(1, 0).actionType).toBe("move"); // right to 4,3
      expect(game.engine.getPlayerPosition()).toEqual({ x: 4, y: 3 });

      expect(game.movePlayer(0, -1).actionType).toBe("move"); // up to 4,2
      expect(game.engine.getPlayerPosition()).toEqual({ x: 4, y: 2 });

      expect(game.movePlayer(0, 1).actionType).toBe("move"); // down to 4,3
      expect(game.engine.getPlayerPosition()).toEqual({ x: 4, y: 3 });

      expect(game.movePlayer(-1, 0).actionType).toBe("move"); // left to 3,3
      expect(game.engine.getPlayerPosition()).toEqual({ x: 3, y: 3 });
    });

    it("blocks movement at all walls", () => {
      // Use excludeEnemies to avoid goblin at (1,1) interfering with wall tests
      const game = createGame({ excludeEnemies: true });
      // Move to top-left corner (1,1)
      game.movePlayer(-2, -2);
      expect(game.movePlayer(-1, 0).actionType).toBe("blocked"); // left wall
      expect(game.movePlayer(0, -1).actionType).toBe("blocked"); // top wall

      // Move to bottom-right corner (4,4)
      game.movePlayer(3, 3);
      expect(game.movePlayer(1, 0).actionType).toBe("blocked"); // right wall
      expect(game.movePlayer(0, 1).actionType).toBe("blocked"); // bottom wall
    });
  });

  describe("bump-to-attack", () => {
    it("attacks enemy when moving onto its tile", () => {
      const game = createGame();
      // Player starts at (3,3), target dummy is at (2,2)
      // Move diagonally to (2,3) first, then up to attack
      game.movePlayer(-1, 0); // Move to 2,3

      // Now move up into the target dummy at (2,2)
      const result = game.movePlayer(0, -1);

      expect(result.success).toBe(true);
      expect(result.actionType).toBe("attack");
      expect(result.attackTarget).toBeDefined();
      expect(result.attackTarget?.name).toBe("Target Dummy");
    });

    it("does not move player when attacking", () => {
      const game = createGame();
      // Move to position adjacent to target dummy
      game.movePlayer(-1, 0); // Move to 2,3
      const posBeforeAttack = game.engine.getPlayerPosition();

      // Attack the target dummy
      game.movePlayer(0, -1);

      // Player should still be at (2,3)
      expect(game.engine.getPlayerPosition()).toEqual(posBeforeAttack);
    });

    it("deals damage to enemy when attacking", () => {
      const game = createGame();
      game.movePlayer(-1, 0); // Move to 2,3

      // Get target dummy HP before attack
      const dummyBefore = game.getEntityAt({ x: 2, y: 2 });
      const hpBefore = dummyBefore?.health.current ?? 0;

      // Attack
      game.movePlayer(0, -1);

      // Check HP decreased
      // Player attack (2) - target dummy defense (1) = 1 damage
      const dummyAfter = game.getEntityAt({ x: 2, y: 2 });
      expect(dummyAfter?.health.current).toBe(hpBefore - 1);
    });

    it("destroys enemy after enough attacks", () => {
      // Use excludeEnemies to test clean target dummy destruction
      const game = createGame({ excludeEnemies: true });
      game.movePlayer(-1, 0); // Move to 2,3

      // Target dummy has 6 HP and 1 defense, player has attack 2
      // Each attack deals 2 - 1 = 1 damage, so 6 attacks to destroy
      game.movePlayer(0, -1); // Attack 1 (HP: 5)
      game.movePlayer(0, -1); // Attack 2 (HP: 4)
      game.movePlayer(0, -1); // Attack 3 (HP: 3)
      game.movePlayer(0, -1); // Attack 4 (HP: 2)
      game.movePlayer(0, -1); // Attack 5 (HP: 1)
      const result = game.movePlayer(0, -1); // Attack 6 (HP: 0, destroyed)

      expect(result.targetDestroyed).toBe(true);
      expect(game.getEntityAt({ x: 2, y: 2 })).toBeUndefined();
      
      // No entities should remain (only target dummy existed)
      const entities = game.getEntities();
      expect(entities.find(e => e.type === "target_dummy")).toBeUndefined();
    });

    it("can move onto tile after enemy is destroyed", () => {
      // Use excludeEnemies to ensure tile is clear after destroying target dummy
      const game = createGame({ excludeEnemies: true });
      game.movePlayer(-1, 0); // Move to 2,3

      // Destroy the target dummy (6 attacks needed)
      game.movePlayer(0, -1); // Attack 1
      game.movePlayer(0, -1); // Attack 2
      game.movePlayer(0, -1); // Attack 3
      game.movePlayer(0, -1); // Attack 4
      game.movePlayer(0, -1); // Attack 5
      game.movePlayer(0, -1); // Attack 6 - destroyed

      // Now we can move onto that tile
      const result = game.movePlayer(0, -1);
      expect(result.actionType).toBe("move");
      expect(game.engine.getPlayerPosition()).toEqual({ x: 2, y: 2 });
    });
  });
});

describe("createTargetDummy", () => {
  it("creates a target dummy with correct properties", () => {
    const dummy = createTargetDummy({ x: 5, y: 5 });

    expect(dummy.name).toBe("Target Dummy");
    expect(dummy.type).toBe("target_dummy");
    expect(dummy.displayChar).toBe("D");
    expect(dummy.color).toBe("brown");
    expect(dummy.health).toEqual({ current: 6, max: 6 });
    expect(dummy.attack).toBe(0);
    expect(dummy.defense).toBe(1);
    expect(dummy.position).toEqual({ x: 5, y: 5 });
  });

  it("creates unique IDs for each dummy", () => {
    // Note: IDs are reset when createGame() is called
    const dummy1 = createTargetDummy({ x: 1, y: 1 });
    const dummy2 = createTargetDummy({ x: 2, y: 2 });

    expect(dummy1.id).not.toBe(dummy2.id);
  });
});

describe("environments", () => {
  describe("getEnvironments", () => {
    it("returns all environments in the game", () => {
      const game = createGame();
      const environments = game.getEnvironments();
      
      // Game should have 1 lava environment at (4,1)
      expect(environments).toHaveLength(1);
      expect(environments[0].type).toBe("lava");
    });
  });

  describe("getEnvironmentAt", () => {
    it("returns environment at the specified position", () => {
      const game = createGame();
      const env = game.getEnvironmentAt({ x: 4, y: 1 });
      
      expect(env).toBeDefined();
      expect(env?.type).toBe("lava");
      expect(env?.color).toBe("orange");
    });

    it("returns undefined when no environment at position", () => {
      const game = createGame();
      const env = game.getEnvironmentAt({ x: 3, y: 3 });
      
      expect(env).toBeUndefined();
    });
  });

  describe("environment damage", () => {
    it("deals damage when player moves onto lava", () => {
      // Use excludeEnemies to avoid goblin attack damage
      const game = createGame({ excludeEnemies: true });
      
      // Player starts at (3,3) with 10 HP
      const initialHealth = game.getPlayerStats().health;
      expect(initialHealth).toEqual({ current: 10, max: 10 });

      // Move right to (4,3) - no lava
      game.movePlayer(1, 0);
      expect(game.getPlayerStats().health).toEqual({ current: 10, max: 10 });

      // Move up to (4,2) - no lava
      game.movePlayer(0, -1);
      expect(game.getPlayerStats().health).toEqual({ current: 10, max: 10 });

      // Move up to (4,1) - lava! Should take 1 damage
      game.movePlayer(0, -1);
      expect(game.getPlayerStats().health).toEqual({ current: 9, max: 10 });
    });

    it("emits environment events when player enters lava", () => {
      const game = createGame();
      const events: string[] = [];

      // Subscribe to environment entered events
      game.engine.onEvent("environment_entered" as any, (event: any) => {
        events.push(`entered:${event.environmentType}`);
      });

      // Subscribe to environment damage events
      game.engine.onEvent("environment_damage" as any, (event: any) => {
        events.push(`damage:${event.damage}`);
      });

      // Move onto lava at (4,1)
      game.movePlayer(1, 0); // to (4,3)
      game.movePlayer(0, -1); // to (4,2) - no lava
      game.movePlayer(0, -1); // to (4,1) - lava

      expect(events).toContain("entered:lava");
      expect(events).toContain("damage:1");
    });
  });
});
