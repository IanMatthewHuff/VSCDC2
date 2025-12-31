/**
 * Game slice - manages global game state
 */

import { createSlice } from "@reduxjs/toolkit";

const initialGameState = {
  turnCount: 0,
};

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
  },
});

export const { incrementTurn, resetTurn } = gameSlice.actions;
export default gameSlice.reducer;
