/**
 * Tests for the game controller
 */

import * as assert from "assert";
import * as vscode from "vscode";
import { GameController } from "../gameController";
import { GameDocumentProvider } from "../gameDocumentProvider";

suite("GameController Test Suite", () => {
  let controller: GameController;
  let provider: GameDocumentProvider;
  let context: vscode.ExtensionContext;

  setup(() => {
    // Create a mock context for testing
    context = {
      subscriptions: [],
      workspaceState: {
        get: () => undefined,
        update: () => Promise.resolve(),
      },
      globalState: {
        get: () => undefined,
        update: () => Promise.resolve(),
        setKeysForSync: () => {},
      },
      extensionPath: "",
      extensionUri: vscode.Uri.file(""),
      storagePath: "",
      globalStoragePath: "",
      logPath: "",
      extensionMode: vscode.ExtensionMode.Test,
      extension: {} as any,
      environmentVariableCollection: {} as any,
      storageUri: undefined,
      globalStorageUri: vscode.Uri.file(""),
      logUri: vscode.Uri.file(""),
      secrets: {} as any,
      asAbsolutePath: (path: string) => path,
    } as unknown as vscode.ExtensionContext;

    provider = new GameDocumentProvider();
    controller = new GameController(context, provider);
  });

  teardown(() => {
    controller.dispose();
    provider.dispose();
  });

  test("Should not have active game initially", () => {
    assert.strictEqual(
      controller.hasActiveGame(),
      false,
      "Should not have active game initially"
    );
  });

  test("Movement commands should work when game is active", async () => {
    await controller.startGame();

    assert.ok(controller.hasActiveGame(), "Should have active game after starting");

    // Test that movement commands execute without error
    controller.moveUp();
    controller.moveDown();
    controller.moveLeft();
    controller.moveRight();
  });

  test("Should stop game correctly", async () => {
    await controller.startGame();
    assert.ok(controller.hasActiveGame(), "Should have active game");

    controller.stopGame();
    assert.strictEqual(
      controller.hasActiveGame(),
      false,
      "Should not have active game after stopping"
    );
  });
});
