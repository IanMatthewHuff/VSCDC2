/**
 * Unit tests for GameController
 * These tests mock the VS Code API to test controller logic in isolation
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GameController, GAME_ACTIVE_CONTEXT } from "../gameController";
import { GameDocumentProvider } from "../gameDocumentProvider";
import { PlayerTreeProvider } from "../playerTreeProvider";

// Mock vscode module - factory must not reference external variables
vi.mock("vscode", () => {
  // Mock EventEmitter class defined inside the factory
  class MockEventEmitter<T> {
    event = vi.fn();
    fire = vi.fn();
    dispose = vi.fn();
  }

  return {
    Uri: {
      parse: (str: string) => ({ toString: () => str, scheme: "roguelike" }),
    },
    EventEmitter: MockEventEmitter,
    TreeItem: class {
      label: string;
      description?: string;
      collapsibleState?: number;
      constructor(label: string, collapsibleState?: number) {
        this.label = label;
        this.collapsibleState = collapsibleState;
      }
    },
    TreeItemCollapsibleState: {
      None: 0,
      Collapsed: 1,
      Expanded: 2,
    },
    workspace: {
      openTextDocument: vi.fn().mockResolvedValue({}),
    },
    window: {
      showTextDocument: vi.fn().mockResolvedValue({}),
      showInformationMessage: vi.fn(),
    },
    commands: {
      executeCommand: vi.fn(),
    },
  };
});

// Import vscode after mocking
import * as vscode from "vscode";

/**
 * Creates a mock OutputChannel for testing
 */
function createMockOutputChannel(): vscode.OutputChannel {
  return {
    name: "Test Output",
    append: vi.fn(),
    appendLine: vi.fn(),
    clear: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
    dispose: vi.fn(),
    replace: vi.fn(),
  };
}

describe("GameController", () => {
  let controller: GameController;
  let mockContext: vscode.ExtensionContext;
  let documentProvider: GameDocumentProvider;
  let playerTreeProvider: PlayerTreeProvider;
  let mockOutputChannel: vscode.OutputChannel;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create minimal mock context
    mockContext = {
      subscriptions: [],
    } as unknown as vscode.ExtensionContext;

    documentProvider = new GameDocumentProvider();
    playerTreeProvider = new PlayerTreeProvider();
    mockOutputChannel = createMockOutputChannel();
    controller = new GameController(
      mockContext,
      documentProvider,
      playerTreeProvider,
      mockOutputChannel
    );
  });

  describe("hasActiveGame", () => {
    it("should return false when no game is started", () => {
      expect(controller.hasActiveGame()).toBe(false);
    });

    it("should return true after starting a game", async () => {
      await controller.startGame();
      expect(controller.hasActiveGame()).toBe(true);
    });

    it("should return false after stopping a game", async () => {
      await controller.startGame();
      controller.stopGame();
      expect(controller.hasActiveGame()).toBe(false);
    });
  });

  describe("startGame", () => {
    it("should open the game document", async () => {
      await controller.startGame();

      expect(vscode.workspace.openTextDocument).toHaveBeenCalled();
      expect(vscode.window.showTextDocument).toHaveBeenCalled();
    });

    it("should set the game active context", async () => {
      await controller.startGame();

      expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
        "setContext",
        GAME_ACTIVE_CONTEXT,
        true
      );
    });

    it("should show a welcome message", async () => {
      await controller.startGame();

      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        "Game started! Use WASD or arrow keys to move."
      );
    });

    it("should clear and initialize the combat output channel", async () => {
      await controller.startGame();

      expect(mockOutputChannel.clear).toHaveBeenCalled();
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith("=== Combat Log ===");
    });
  });

  describe("stopGame", () => {
    it("should clear the game active context", async () => {
      await controller.startGame();
      vi.clearAllMocks();

      controller.stopGame();

      expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
        "setContext",
        GAME_ACTIVE_CONTEXT,
        false
      );
    });
  });

  describe("movement commands", () => {
    it("should not throw when moving without an active game", () => {
      // These should be no-ops when no game is active
      expect(() => controller.moveUp()).not.toThrow();
      expect(() => controller.moveDown()).not.toThrow();
      expect(() => controller.moveLeft()).not.toThrow();
      expect(() => controller.moveRight()).not.toThrow();
    });
  });

  describe("dispose", () => {
    it("should stop the game on dispose", async () => {
      await controller.startGame();
      expect(controller.hasActiveGame()).toBe(true);

      controller.dispose();
      expect(controller.hasActiveGame()).toBe(false);
    });
  });
});
