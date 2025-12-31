/**
 * Player slice - manages player state and movement
 */

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Player, Position } from "./types";

const initialPlayerState: Player = {
  id: "player",
  name: "Adventurer",
  position: { x: 5, y: 5 },
  displayChar: "@",
  color: "white",
  health: { current: 10, max: 10 },
};

/**
 * Player slice handles all player-related state changes
 */
export const playerSlice = createSlice({
  name: "player",
  initialState: initialPlayerState,
  reducers: {
    /**
     * Move the player to a new position
     */
    movePlayer: (state, action: PayloadAction<Position>) => {
      state.position = action.payload;
    },
    /**
     * Move the player by a relative offset
     */
    movePlayerBy: (state, action: PayloadAction<{ dx: number; dy: number }>) => {
      state.position.x += action.payload.dx;
      state.position.y += action.payload.dy;
    },
  },
});

export const { movePlayer, movePlayerBy } = playerSlice.actions;
export default playerSlice.reducer;
