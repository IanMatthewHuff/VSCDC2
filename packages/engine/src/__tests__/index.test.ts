import { describe, it, expect, vi } from "vitest";
import {
  ENGINE_VERSION,
  GameEngine,
  GameEventType,
  Enemy,
  AttackEvent,
  EntityDestroyedEvent,
} from "../index";

describe("engine", () => {
  it("exports ENGINE_VERSION", () => {
    expect(ENGINE_VERSION).toBe("0.0.1");
  });
});

describe("GameEngine", () => {
  describe("player stats", () => {
    it("returns default player name", () => {
      const engine = new GameEngine();
      expect(engine.getPlayerName()).toBe("Adventurer");
    });

    it("returns player health with current and max values", () => {
      const engine = new GameEngine();
      const health = engine.getPlayerHealth();
      expect(health).toEqual({ current: 10, max: 10 });
    });
  });

  describe("entity management", () => {
    function createTestEnemy(overrides: Partial<Enemy> = {}): Enemy {
      return {
        id: "test_enemy_1",
        name: "Test Enemy",
        type: "test",
        position: { x: 5, y: 5 },
        displayChar: "E",
        color: "red",
        health: { current: 3, max: 3 },
        ...overrides,
      };
    }

    it("starts with no entities", () => {
      const engine = new GameEngine();
      expect(engine.getEntities()).toEqual([]);
    });

    it("can add an entity", () => {
      const engine = new GameEngine();
      const enemy = createTestEnemy();

      engine.addEntity(enemy);

      const entities = engine.getEntities();
      expect(entities).toHaveLength(1);
      expect(entities[0]).toEqual(enemy);
    });

    it("can add multiple entities", () => {
      const engine = new GameEngine();
      const enemy1 = createTestEnemy({ id: "enemy_1", position: { x: 1, y: 1 } });
      const enemy2 = createTestEnemy({ id: "enemy_2", position: { x: 2, y: 2 } });

      engine.addEntity(enemy1);
      engine.addEntity(enemy2);

      expect(engine.getEntities()).toHaveLength(2);
    });

    it("can get entity by ID", () => {
      const engine = new GameEngine();
      const enemy = createTestEnemy({ id: "unique_id" });
      engine.addEntity(enemy);

      const found = engine.getEntityById("unique_id");
      expect(found).toEqual(enemy);
    });

    it("returns undefined for non-existent entity ID", () => {
      const engine = new GameEngine();
      expect(engine.getEntityById("nonexistent")).toBeUndefined();
    });

    it("can get entity at position", () => {
      const engine = new GameEngine();
      const enemy = createTestEnemy({ position: { x: 3, y: 4 } });
      engine.addEntity(enemy);

      const found = engine.getEntityAt({ x: 3, y: 4 });
      expect(found).toEqual(enemy);
    });

    it("returns undefined when no entity at position", () => {
      const engine = new GameEngine();
      const enemy = createTestEnemy({ position: { x: 1, y: 1 } });
      engine.addEntity(enemy);

      expect(engine.getEntityAt({ x: 5, y: 5 })).toBeUndefined();
    });

    it("can remove an entity", () => {
      const engine = new GameEngine();
      const enemy = createTestEnemy({ id: "to_remove" });
      engine.addEntity(enemy);

      expect(engine.getEntities()).toHaveLength(1);
      engine.removeEntity("to_remove");
      expect(engine.getEntities()).toHaveLength(0);
    });
  });

  describe("combat", () => {
    function createTestEnemy(overrides: Partial<Enemy> = {}): Enemy {
      return {
        id: "test_enemy",
        name: "Test Enemy",
        type: "test",
        position: { x: 5, y: 5 },
        displayChar: "E",
        color: "red",
        health: { current: 3, max: 3 },
        ...overrides,
      };
    }

    it("can attack an entity and deal damage", () => {
      const engine = new GameEngine();
      const enemy = createTestEnemy();
      engine.addEntity(enemy);

      const result = engine.attack("test_enemy", 1);

      expect(result.hit).toBe(true);
      expect(result.damage).toBe(1);
      expect(result.targetDestroyed).toBe(false);

      const updatedEnemy = engine.getEntityById("test_enemy");
      expect(updatedEnemy?.health.current).toBe(2);
    });

    it("returns miss result when attacking non-existent entity", () => {
      const engine = new GameEngine();

      const result = engine.attack("nonexistent", 1);

      expect(result.hit).toBe(false);
      expect(result.damage).toBe(0);
      expect(result.targetDestroyed).toBe(false);
    });

    it("destroys entity when health reaches zero", () => {
      const engine = new GameEngine();
      const enemy = createTestEnemy({ health: { current: 1, max: 3 } });
      engine.addEntity(enemy);

      const result = engine.attack("test_enemy", 1);

      expect(result.hit).toBe(true);
      expect(result.targetDestroyed).toBe(true);
      expect(engine.getEntityById("test_enemy")).toBeUndefined();
    });

    it("destroys entity when damage exceeds remaining health", () => {
      const engine = new GameEngine();
      const enemy = createTestEnemy({ health: { current: 2, max: 3 } });
      engine.addEntity(enemy);

      const result = engine.attack("test_enemy", 5);

      expect(result.targetDestroyed).toBe(true);
      expect(engine.getEntityById("test_enemy")).toBeUndefined();
    });

    it("advances turn when attacking", () => {
      const engine = new GameEngine();
      const enemy = createTestEnemy();
      engine.addEntity(enemy);

      const initialTurn = engine.getTurnCount();
      engine.attack("test_enemy", 1);

      expect(engine.getTurnCount()).toBe(initialTurn + 1);
    });

    it("uses default damage of 1 when not specified", () => {
      const engine = new GameEngine();
      const enemy = createTestEnemy({ health: { current: 3, max: 3 } });
      engine.addEntity(enemy);

      engine.attack("test_enemy");

      const updatedEnemy = engine.getEntityById("test_enemy");
      expect(updatedEnemy?.health.current).toBe(2);
    });
  });

  describe("combat events", () => {
    function createTestEnemy(overrides: Partial<Enemy> = {}): Enemy {
      return {
        id: "test_enemy",
        name: "Test Enemy",
        type: "test",
        position: { x: 5, y: 5 },
        displayChar: "E",
        color: "red",
        health: { current: 3, max: 3 },
        ...overrides,
      };
    }

    it("emits ATTACK event when attacking", () => {
      const engine = new GameEngine();
      const enemy = createTestEnemy();
      engine.addEntity(enemy);

      const attackHandler = vi.fn();
      engine.onEvent(GameEventType.ATTACK, attackHandler);

      engine.attack("test_enemy", 2);

      expect(attackHandler).toHaveBeenCalledTimes(1);
      const event = attackHandler.mock.calls[0][0] as AttackEvent;
      expect(event.type).toBe(GameEventType.ATTACK);
      expect(event.attackerName).toBe("Adventurer");
      expect(event.targetName).toBe("Test Enemy");
      expect(event.damage).toBe(2);
      expect(event.targetRemainingHp).toBe(1);
      expect(event.targetMaxHp).toBe(3);
    });

    it("emits ENTITY_DESTROYED event when entity is destroyed", () => {
      const engine = new GameEngine();
      const enemy = createTestEnemy({ health: { current: 1, max: 3 } });
      engine.addEntity(enemy);

      const destroyedHandler = vi.fn();
      engine.onEvent(GameEventType.ENTITY_DESTROYED, destroyedHandler);

      engine.attack("test_enemy", 1);

      expect(destroyedHandler).toHaveBeenCalledTimes(1);
      const event = destroyedHandler.mock.calls[0][0] as EntityDestroyedEvent;
      expect(event.type).toBe(GameEventType.ENTITY_DESTROYED);
      expect(event.entityName).toBe("Test Enemy");
      expect(event.destroyedByName).toBe("Adventurer");
    });

    it("does not emit ENTITY_DESTROYED when entity survives", () => {
      const engine = new GameEngine();
      const enemy = createTestEnemy({ health: { current: 3, max: 3 } });
      engine.addEntity(enemy);

      const destroyedHandler = vi.fn();
      engine.onEvent(GameEventType.ENTITY_DESTROYED, destroyedHandler);

      engine.attack("test_enemy", 1);

      expect(destroyedHandler).not.toHaveBeenCalled();
    });
  });
});
