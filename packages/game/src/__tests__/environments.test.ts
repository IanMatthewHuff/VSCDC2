import { describe, it, expect, beforeEach } from "vitest";
import {
  EnvironmentType,
  createLavaEnvironment,
  initializeEnvironmentEffects,
  getEnvironmentEffect,
  registerEnvironmentEffect,
} from "../environments";

describe("environments", () => {
  describe("createLavaEnvironment", () => {
    it("creates a lava environment at the specified position", () => {
      const env = createLavaEnvironment({ x: 3, y: 4 });

      expect(env.type).toBe(EnvironmentType.Lava);
      expect(env.position).toEqual({ x: 3, y: 4 });
      expect(env.displayChar).toBe("~");
      expect(env.color).toBe("orange");
      expect(env.id).toContain("lava_");
    });

    it("creates unique IDs for each environment", () => {
      const env1 = createLavaEnvironment({ x: 1, y: 1 });
      const env2 = createLavaEnvironment({ x: 2, y: 2 });

      expect(env1.id).not.toBe(env2.id);
    });
  });

  describe("environment effects", () => {
    beforeEach(() => {
      initializeEnvironmentEffects();
    });

    it("registers lava effect on initialization", () => {
      const effect = getEnvironmentEffect(EnvironmentType.Lava);

      expect(effect).toBeDefined();
      expect(effect?.damage).toBe(1);
      expect(effect?.triggersOnEntry).toBe(true);
    });

    it("can register custom environment effects", () => {
      registerEnvironmentEffect("custom_env", {
        damage: 5,
        triggersOnEntry: false,
      });

      const effect = getEnvironmentEffect("custom_env");
      expect(effect?.damage).toBe(5);
      expect(effect?.triggersOnEntry).toBe(false);
    });

    it("returns undefined for unknown environment types", () => {
      const effect = getEnvironmentEffect("unknown_type");
      expect(effect).toBeUndefined();
    });
  });
});
