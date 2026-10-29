/**
 * Game slice - manages global game state
 */

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Position } from "./types";

const initialGameState = {
  turnCount: 0,
  currentFloor: 1,
};

/**
 * Payload used to transition the run to the next floor.
 */
export interface DescendFloorPayload {
  /** Starting position on the newly generated floor */
  playerStart: Position;
}

/**
 * Game slice handles turn management and other global game state
 */
export const gameSlice = createSlice({
  name: "game",
  initialState: initialGameState,
  reducers: {
    /**
     * Increment the turn counter
     */
    incrementTurn: (state) => {
      state.turnCount += 1;
    },
    /**
     * Reset the turn counter
     */
    resetTurn: (state) => {
      state.turnCount = 0;
    },
    /**
     * Advance to the next floor and consume one turn.
     *
     * Other slices handle this action to replace their floor-scoped state.
     */
    descendFloor: (state, _action: PayloadAction<DescendFloorPayload>) => {
      state.currentFloor += 1;
      state.turnCount += 1;
    },
  },
});

export const { incrementTurn, resetTurn, descendFloor } = gameSlice.actions;
export default gameSlice.reducer;
