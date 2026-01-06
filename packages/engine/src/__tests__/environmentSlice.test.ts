import { describe, it, expect } from "vitest";
import environmentReducer, {
  addEnvironment,
  removeEnvironment,
  clearEnvironments,
  selectEnvironmentAt,
  selectAllEnvironments,
} from "../environmentSlice";
import { Environment, EnvironmentState } from "../types";

describe("environmentSlice", () => {
  function createTestEnvironment(overrides: Partial<Environment> = {}): Environment {
    return {
      id: "test_env_1",
      type: "lava",
      position: { x: 2, y: 3 },
      displayChar: "~",
      color: "red",
      ...overrides,
    };
  }

  describe("reducer", () => {
    it("starts with empty environments", () => {
      const state = environmentReducer(undefined, { type: "@@INIT" });
      expect(state.environments).toEqual({});
    });

    it("adds an environment", () => {
      const env = createTestEnvironment();
      const state = environmentReducer(
        undefined,
        addEnvironment({ environment: env })
      );

      expect(Object.values(state.environments)).toHaveLength(1);
      expect(state.environments["2,3"]).toEqual(env);
    });

    it("adds multiple environments at different positions", () => {
      let state = environmentReducer(undefined, { type: "@@INIT" });

      const env1 = createTestEnvironment({ id: "env1", position: { x: 1, y: 1 } });
      const env2 = createTestEnvironment({ id: "env2", position: { x: 2, y: 2 } });

      state = environmentReducer(state, addEnvironment({ environment: env1 }));
      state = environmentReducer(state, addEnvironment({ environment: env2 }));

      expect(Object.values(state.environments)).toHaveLength(2);
      expect(state.environments["1,1"]).toEqual(env1);
      expect(state.environments["2,2"]).toEqual(env2);
    });

    it("replaces environment at same position", () => {
      let state = environmentReducer(undefined, { type: "@@INIT" });

      const env1 = createTestEnvironment({ id: "env1", type: "lava" });
      const env2 = createTestEnvironment({ id: "env2", type: "water" });

      state = environmentReducer(state, addEnvironment({ environment: env1 }));
      state = environmentReducer(state, addEnvironment({ environment: env2 }));

      // Should only have one environment at that position (the second one)
      expect(Object.values(state.environments)).toHaveLength(1);
      expect(state.environments["2,3"]).toEqual(env2);
    });

    it("removes an environment by position", () => {
      let state = environmentReducer(undefined, { type: "@@INIT" });

      const env = createTestEnvironment({ position: { x: 3, y: 4 } });
      state = environmentReducer(state, addEnvironment({ environment: env }));
      state = environmentReducer(state, removeEnvironment({ position: { x: 3, y: 4 } }));

      expect(Object.values(state.environments)).toHaveLength(0);
    });

    it("clears all environments", () => {
      let state = environmentReducer(undefined, { type: "@@INIT" });

      const env1 = createTestEnvironment({ id: "env1", position: { x: 1, y: 1 } });
      const env2 = createTestEnvironment({ id: "env2", position: { x: 2, y: 2 } });

      state = environmentReducer(state, addEnvironment({ environment: env1 }));
      state = environmentReducer(state, addEnvironment({ environment: env2 }));
      state = environmentReducer(state, clearEnvironments());

      expect(Object.values(state.environments)).toHaveLength(0);
    });
  });

  describe("selectors", () => {
    it("selectEnvironmentAt returns environment at position", () => {
      const env = createTestEnvironment({ position: { x: 5, y: 6 } });
      const state: EnvironmentState = {
        environments: { "5,6": env },
      };

      const found = selectEnvironmentAt(state, { x: 5, y: 6 });
      expect(found).toEqual(env);
    });

    it("selectEnvironmentAt returns undefined for empty position", () => {
      const state: EnvironmentState = {
        environments: {},
      };

      const found = selectEnvironmentAt(state, { x: 1, y: 1 });
      expect(found).toBeUndefined();
    });

    it("selectAllEnvironments returns all environments", () => {
      const env1 = createTestEnvironment({ id: "env1", position: { x: 1, y: 1 } });
      const env2 = createTestEnvironment({ id: "env2", position: { x: 2, y: 2 } });
      const state: EnvironmentState = {
        environments: {
          "1,1": env1,
          "2,2": env2,
        },
      };

      const environments = selectAllEnvironments(state);
      expect(environments).toHaveLength(2);
      expect(environments).toContainEqual(env1);
      expect(environments).toContainEqual(env2);
    });

    it("selectAllEnvironments returns empty array when no environments", () => {
      const state: EnvironmentState = {
        environments: {},
      };

      const environments = selectAllEnvironments(state);
      expect(environments).toEqual([]);
    });
  });
});
