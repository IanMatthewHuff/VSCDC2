/**
 * Tests for save/load round-tripping of a GameSession.
 */

import { describe, it, expect } from "vitest";
import {
  createGame,
  createDungeonCrawl,
  serializeGameSession,
  loadGameSession,
  InvalidSaveDataError,
  SAVE_VERSION,
  GameSaveData,
} from "../index";

describe("save / load", () => {
  it("exports a numeric SAVE_VERSION", () => {
    expect(typeof SAVE_VERSION).toBe("number");
    expect(SAVE_VERSION).toBeGreaterThanOrEqual(1);
  });

  it("produces a JSON-serializable snapshot", () => {
    const session = createGame();
    const save = serializeGameSession(session);

    // Must round-trip cleanly through JSON without throwing or losing data
    const json = JSON.stringify(save);
    const parsed = JSON.parse(json) as GameSaveData;

    expect(parsed.version).toBe(SAVE_VERSION);
    expect(typeof parsed.savedAt).toBe("string");
    expect(parsed.level.name).toBe(session.level.name);
    expect(parsed.state.player.name).toBe(session.engine.getPlayerName());
  });

  it("restores player position, stats, and turn count", () => {
    const session = createGame();

    // Move the player and let some turns advance so we have a non-default
    // state to compare against.
    session.movePlayer(0, -1);
    session.movePlayer(0, -1);

    const before = session.engine.getState();
    const save = serializeGameSession(session);

    const restored = loadGameSession(save);
    const after = restored.engine.getState();

    expect(after.player.position).toEqual(before.player.position);
    expect(after.player.health).toEqual(before.player.health);
    expect(after.player.experience).toEqual(before.player.experience);
    expect(after.player.level).toEqual(before.player.level);
    expect(after.game.turnCount).toBe(before.game.turnCount);
  });

  it("restores enemies, NPCs, and environments at their positions", () => {
    const session = createGame();
    const beforeEntities = session.getEntities();
    const beforeNPCs = session.getNPCs();
    const beforeEnvs = session.getEnvironments();

    const save = serializeGameSession(session);
    const restored = loadGameSession(save);

    expect(restored.getEntities()).toEqual(beforeEntities);
    expect(restored.getNPCs()).toEqual(beforeNPCs);
    expect(restored.getEnvironments()).toEqual(beforeEnvs);
  });

  it("restores equipped items and inventory contents", () => {
    const session = createGame();
    const beforeEquip = session.engine.getPlayerEquipment();
    const beforeInventory = session.engine.getInventory();

    const save = serializeGameSession(session);
    const restored = loadGameSession(save);

    expect(restored.engine.getPlayerEquipment()).toEqual(beforeEquip);
    expect(restored.engine.getInventory()).toEqual(beforeInventory);
  });

  it("preserves the level layout (tiles and rooms)", () => {
    const session = createDungeonCrawl({ seed: 12345 });
    const save = serializeGameSession(session);
    const restored = loadGameSession(save);

    expect(restored.level.width).toBe(session.level.width);
    expect(restored.level.height).toBe(session.level.height);
    expect(restored.level.tiles).toEqual(session.level.tiles);
    expect(restored.level.rooms).toEqual(session.level.rooms);
    expect(restored.level.playerStart).toEqual(session.level.playerStart);
  });

  it("produces a session that continues to advance turns after load", () => {
    const session = createGame();
    const save = serializeGameSession(session);
    const restored = loadGameSession(save);

    const turnsBefore = restored.engine.getTurnCount();
    restored.movePlayer(0, -1);
    expect(restored.engine.getTurnCount()).toBeGreaterThan(turnsBefore);
  });

  it("snapshot is decoupled from the live session (no shared references)", () => {
    const session = createGame();
    const save = serializeGameSession(session);
    const originalTurnCount = save.state.game.turnCount;

    // Mutate the live session — the snapshot must remain unchanged.
    session.movePlayer(0, -1);

    expect(save.state.game.turnCount).toBe(originalTurnCount);
  });

  it("rejects save data with an unsupported version", () => {
    const session = createGame();
    const save = serializeGameSession(session);
    save.version = 999;

    expect(() => loadGameSession(save)).toThrow(InvalidSaveDataError);
  });

  it("rejects save data that is missing required fields", () => {
    expect(() => loadGameSession(null as unknown as GameSaveData)).toThrow(
      InvalidSaveDataError
    );
    expect(() =>
      loadGameSession({ version: SAVE_VERSION } as unknown as GameSaveData)
    ).toThrow(InvalidSaveDataError);
  });
});
