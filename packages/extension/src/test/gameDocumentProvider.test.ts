/**
 * Tests for the game document provider
 */

import * as assert from "assert";
import { GameDocumentProvider, GAME_DOCUMENT_URI } from "../gameDocumentProvider";
import { createGame } from "@vscdc/game";

suite("GameDocumentProvider Test Suite", () => {
  test("Should provide content when game session is set", () => {
    const provider = new GameDocumentProvider();
    const game = createGame();
    provider.setGameSession(game);

    const content = provider.provideTextDocumentContent(GAME_DOCUMENT_URI);

    assert.ok(content.length > 0, "Content should not be empty");
    assert.ok(content.includes("Test Level"), "Content should include level name");
    assert.ok(content.includes("Turn:"), "Content should include turn count");
    assert.ok(content.includes("@"), "Content should include player character");
  });

  test("Should show message when no game session", () => {
    const provider = new GameDocumentProvider();

    const content = provider.provideTextDocumentContent(GAME_DOCUMENT_URI);

    assert.strictEqual(
      content,
      "No game session active",
      "Should show no game session message"
    );
  });

  test("Should update content after player moves", () => {
    const provider = new GameDocumentProvider();
    const game = createGame();
    provider.setGameSession(game);

    const contentBefore = provider.provideTextDocumentContent(GAME_DOCUMENT_URI);
    const turnBefore = game.engine.getTurnCount();

    // Move the player
    game.movePlayer(1, 0);

    const contentAfter = provider.provideTextDocumentContent(GAME_DOCUMENT_URI);
    const turnAfter = game.engine.getTurnCount();

    assert.notStrictEqual(
      contentBefore,
      contentAfter,
      "Content should change after player moves"
    );
    assert.ok(
      turnAfter > turnBefore,
      "Turn count should increase after move"
    );
  });
});
