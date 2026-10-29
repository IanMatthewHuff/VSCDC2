/**
 * Entity slice - manages enemy entities in the game
 */

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { EntityState, Enemy, NPC, Position } from "./types";
import { descendFloor } from "./gameSlice";

/**
 * Initial state for entities
 */
const initialEntityState: EntityState = {
  entities: {},
  npcs: {},
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
 * Payload for moving an entity
 */
export interface MoveEntityPayload {
  id: string;
  position: Position;
}

/**
 * Payload for adding an NPC
 */
export interface AddNPCPayload {
  npc: NPC;
}

/**
 * Payload for removing an NPC
 */
export interface RemoveNPCPayload {
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
     * Move an entity to a new position
     */
    moveEntity: (state, action: PayloadAction<MoveEntityPayload>) => {
      const { id, position } = action.payload;
      const entity = state.entities[id];
      if (entity) {
        entity.position = { ...position };
      }
    },

    /**
     * Clear all entities from the game
     */
    clearEntities: (state) => {
      state.entities = {};
    },

    /**
     * Add a new NPC to the game
     */
    addNPC: (state, action: PayloadAction<AddNPCPayload>) => {
      const { npc } = action.payload;
      state.npcs[npc.id] = npc;
    },

    /**
     * Remove an NPC from the game
     */
    removeNPC: (state, action: PayloadAction<RemoveNPCPayload>) => {
      const { id } = action.payload;
      delete state.npcs[id];
    },

    /**
     * Clear all NPCs from the game
     */
    clearNPCs: (state) => {
      state.npcs = {};
    },
  },
  extraReducers: (builder) => {
    builder.addCase(descendFloor, (state) => {
      state.entities = {};
      state.npcs = {};
    });
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

/**
 * Selector to get an NPC at a specific position
 */
export function selectNPCAt(
  state: EntityState,
  position: Position
): NPC | undefined {
  return Object.values(state.npcs).find(
    (npc) => npc.position.x === position.x && npc.position.y === position.y
  );
}

/**
 * Selector to get all NPCs
 */
export function selectAllNPCs(state: EntityState): NPC[] {
  return Object.values(state.npcs);
}

/**
 * Selector to get an NPC by ID
 */
export function selectNPCById(
  state: EntityState,
  id: string
): NPC | undefined {
  return state.npcs[id];
}

export const { addEntity, damageEntity, removeEntity, moveEntity, clearEntities, addNPC, removeNPC, clearNPCs } =
  entitySlice.actions;
export default entitySlice.reducer;
