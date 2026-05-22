/**
 * Item slice - manages items lying on the floor of the world.
 *
 * Floor items are placed at specific positions and can be picked up
 * by the player by walking onto their tile. This slice is purely
 * positional state; pickup logic lives on GameEngine.
 */

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ItemState, FloorItem, Position } from "./types";

const initialItemState: ItemState = {
  floorItems: {},
};

/**
 * Payload for adding a floor item
 */
export interface AddFloorItemPayload {
  floorItem: FloorItem;
}

/**
 * Payload for removing a floor item
 */
export interface RemoveFloorItemPayload {
  id: string;
}

/**
 * Helper to create position key for lookups
 */
function positionKey(position: Position): string {
  return `${position.x},${position.y}`;
}

/**
 * Item slice with actions for managing floor items
 */
const itemSlice = createSlice({
  name: "items",
  initialState: initialItemState,
  reducers: {
    /**
     * Add a new floor item at a specific position.
     * If a floor item already exists at this position it is replaced.
     */
    addFloorItem: (state, action: PayloadAction<AddFloorItemPayload>) => {
      const { floorItem } = action.payload;
      const key = positionKey(floorItem.position);
      state.floorItems[key] = floorItem;
    },

    /**
     * Remove a floor item by its id
     */
    removeFloorItem: (state, action: PayloadAction<RemoveFloorItemPayload>) => {
      const { id } = action.payload;
      for (const key of Object.keys(state.floorItems)) {
        if (state.floorItems[key].id === id) {
          delete state.floorItems[key];
          return;
        }
      }
    },

    /**
     * Clear all floor items
     */
    clearFloorItems: (state) => {
      state.floorItems = {};
    },

    /**
     * No-op action signalling that the player attempted to pick up an item.
     *
     * The reducer intentionally does not change state. Its purpose is to give
     * the event middleware a dispatch to ride on so it can drain queued
     * ItemPickedUpEvents (notably for the inventory-full case, where no other
     * state changes). Keeping this in the slice lets all events flow through
     * the same emission path.
     */
    pickupAttempted: (_state) => {
      // intentionally empty
    },
  },
});

/**
 * Selector to get a floor item at a specific position
 */
export function selectFloorItemAt(
  state: ItemState,
  position: Position
): FloorItem | undefined {
  const key = positionKey(position);
  return state.floorItems[key];
}

/**
 * Selector to get all floor items
 */
export function selectAllFloorItems(state: ItemState): FloorItem[] {
  return Object.values(state.floorItems);
}

/**
 * Selector to get a floor item by id
 */
export function selectFloorItemById(
  state: ItemState,
  id: string
): FloorItem | undefined {
  return Object.values(state.floorItems).find((fi) => fi.id === id);
}

export const { addFloorItem, removeFloorItem, clearFloorItems, pickupAttempted } =
  itemSlice.actions;
export default itemSlice.reducer;
