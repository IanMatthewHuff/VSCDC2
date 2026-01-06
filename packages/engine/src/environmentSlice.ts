/**
 * Environment slice - manages environmental effects in the game
 */

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { EnvironmentState, Environment, Position } from "./types";

/**
 * Initial state for environments
 */
const initialEnvironmentState: EnvironmentState = {
  environments: {},
};

/**
 * Payload for adding an environment
 */
export interface AddEnvironmentPayload {
  environment: Environment;
}

/**
 * Payload for removing an environment
 */
export interface RemoveEnvironmentPayload {
  position: Position;
}

/**
 * Helper to create position key for lookups
 */
function positionKey(position: Position): string {
  return `${position.x},${position.y}`;
}

/**
 * Environment slice with actions for managing environments
 */
const environmentSlice = createSlice({
  name: "environments",
  initialState: initialEnvironmentState,
  reducers: {
    /**
     * Add a new environment to the game at a specific position
     * Note: If an environment already exists at this position, it will be replaced
     */
    addEnvironment: (state, action: PayloadAction<AddEnvironmentPayload>) => {
      const { environment } = action.payload;
      const key = positionKey(environment.position);
      state.environments[key] = environment;
    },

    /**
     * Remove an environment from a specific position
     */
    removeEnvironment: (state, action: PayloadAction<RemoveEnvironmentPayload>) => {
      const { position } = action.payload;
      const key = positionKey(position);
      delete state.environments[key];
    },

    /**
     * Clear all environments from the game
     */
    clearEnvironments: (state) => {
      state.environments = {};
    },
  },
});

/**
 * Selector to get an environment at a specific position
 */
export function selectEnvironmentAt(
  state: EnvironmentState,
  position: Position
): Environment | undefined {
  const key = positionKey(position);
  return state.environments[key];
}

/**
 * Selector to get all environments
 */
export function selectAllEnvironments(state: EnvironmentState): Environment[] {
  return Object.values(state.environments);
}

export const { addEnvironment, removeEnvironment, clearEnvironments } =
  environmentSlice.actions;
export default environmentSlice.reducer;
