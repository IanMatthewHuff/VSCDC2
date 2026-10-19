import { describe, expect, it, vi } from "vitest";
import {
  ConsumableItem,
  Enemy,
  GameEngine,
  GameEventType,
  ItemTypeEnum,
  NPC,
} from "../index";

describe("floor transitions", () => {
  it("starts on floor one", () => {
    const engine = new GameEngine();

    expect(engine.getCurrentFloor()).toBe(1);
  });

  it("replaces floor-scoped state and preserves player progression", () => {
    const engine = new GameEngine();
    const enemy: Enemy = {
      id: "enemy",
      name: "Enemy",
      type: "test",
      position: { x: 1, y: 1 },
      displayChar: "E",
      color: "red",
      health: { current: 3, max: 3 },
      level: 1,
    };
    const npc: NPC = {
      id: "npc",
      name: "NPC",
      type: "test",
      position: { x: 2, y: 2 },
      displayChar: "N",
      color: "blue",
      health: { current: 3, max: 3 },
      canBeAttacked: false,
    };
    const potion: ConsumableItem = {
      id: "potion",
      name: "Potion",
      type: ItemTypeEnum.Consumable,
      effect: { type: "heal", amount: 2 },
    };

    engine.addEntity(enemy);
    engine.addNPC(npc);
    engine.addEnvironment({
      id: "lava",
      type: "lava",
      position: { x: 3, y: 3 },
      color: "orange",
    });
    engine.addToInventory(potion);
    engine.grantExperience(25, "test");
    engine.applyEnvironmentDamage("test", 4);

    engine.descendFloor({ x: 10, y: 11 });

    expect(engine.getCurrentFloor()).toBe(2);
    expect(engine.getTurnCount()).toBe(1);
    expect(engine.getPlayerPosition()).toEqual({ x: 10, y: 11 });
    expect(engine.getEntities()).toEqual([]);
    expect(engine.getNPCs()).toEqual([]);
    expect(engine.getEnvironments()).toEqual([]);
    expect(engine.getInventory()).toEqual([potion]);
    expect(engine.getPlayerExperience()).toBe(25);
    expect(engine.getPlayerHealth()).toEqual({ current: 6, max: 10 });
  });

  it("emits one floor event without treating cleared enemies as destroyed", () => {
    const engine = new GameEngine();
    const onDescended = vi.fn();
    const onDestroyed = vi.fn();
    engine.onEvent(GameEventType.FLOOR_DESCENDED, onDescended);
    engine.onEvent(GameEventType.ENTITY_DESTROYED, onDestroyed);
    engine.addEntity({
      id: "enemy",
      name: "Enemy",
      type: "test",
      position: { x: 1, y: 1 },
      displayChar: "E",
      color: "red",
      health: { current: 3, max: 3 },
      level: 1,
    });

    engine.descendFloor({ x: 4, y: 5 });

    expect(onDescended).toHaveBeenCalledOnce();
    expect(onDescended).toHaveBeenCalledWith(
      expect.objectContaining({
        type: GameEventType.FLOOR_DESCENDED,
        previousFloor: 1,
        newFloor: 2,
      })
    );
    expect(onDestroyed).not.toHaveBeenCalled();
  });
});
