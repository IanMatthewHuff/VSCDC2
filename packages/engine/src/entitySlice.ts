/**
 * Entity slice - manages enemy entities in the game
 */

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { EntityState, Enemy, Position } from "./types";

/**
 * Initial state for entities
 */
const initialEntityState: EntityState = {
  entities: {},
};

/**
 * Payload for adding an entity
 */
export interface AddEntityPayload {
  entity: Enemy;
}

/**
 * Payload for damaging an entity
 */
export interface DamageEntityPayload {
  id: string;
  amount: number;
}

/**
 * Payload for removing an entity
 */
export interface RemoveEntityPayload {
  id: string;
}

/**
 * Entity slice with actions for managing entities
 */
const entitySlice = createSlice({
  name: "entities",
  initialState: initialEntityState,
  reducers: {
    /**
     * Add a new entity to the game
     */
    addEntity: (state, action: PayloadAction<AddEntityPayload>) => {
      const { entity } = action.payload;
      state.entities[entity.id] = entity;
    },

    /**
     * Damage an entity, reducing its current health
     * Health will not go below 0
     */
    damageEntity: (state, action: PayloadAction<DamageEntityPayload>) => {
      const { id, amount } = action.payload;
      const entity = state.entities[id];
      if (entity) {
        entity.health.current = Math.max(0, entity.health.current - amount);
      }
    },

    /**
     * Remove an entity from the game
     */
    removeEntity: (state, action: PayloadAction<RemoveEntityPayload>) => {
      const { id } = action.payload;
      delete state.entities[id];
    },

    /**
     * Clear all entities from the game
     */
    clearEntities: (state) => {
      state.entities = {};
    },
  },
});

/**
 * Selector to get an entity at a specific position
 */
export function selectEntityAt(
  state: EntityState,
  position: Position
): Enemy | undefined {
  return Object.values(state.entities).find(
    (entity) => entity.position.x === position.x && entity.position.y === position.y
  );
}

/**
 * Selector to get all entities
 */
export function selectAllEntities(state: EntityState): Enemy[] {
  return Object.values(state.entities);
}

/**
 * Selector to get an entity by ID
 */
export function selectEntityById(
  state: EntityState,
  id: string
): Enemy | undefined {
  return state.entities[id];
}

export const { addEntity, damageEntity, removeEntity, clearEntities } =
  entitySlice.actions;
export default entitySlice.reducer;
