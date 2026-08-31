/**
 * Unit tests for GameController
 * These tests mock the VS Code API to test controller logic in isolation
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GameController, GAME_ACTIVE_CONTEXT, GameOutputChannels } from "../gameController";
import { GameDocumentProvider } from "../gameDocumentProvider";
import { PlayerTreeProvider } from "../playerTreeProvider";
import { EquipmentTreeProvider } from "../equipmentTreeProvider";
import { InventoryTreeProvider } from "../inventoryTreeProvider";
import { CursorLocationTreeProvider } from "../cursorLocationTreeProvider";

// Store selection change listeners so tests can trigger them
let selectionChangeListeners: Array<(event: any) => void> = [];

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
    Position: class {
      constructor(
        public readonly line: number,
        public readonly character: number
      ) {}
    },
    Range: class {
      constructor(
        public readonly startLine: number,
        public readonly startChar: number,
        public readonly endLine: number,
        public readonly endChar: number
      ) {}
    },
    ThemeColor: class {
      constructor(public readonly id: string) {}
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
      onDidChangeTextDocument: vi.fn(() => ({ dispose: vi.fn() })),
    },
    window: {
      showTextDocument: vi.fn().mockResolvedValue({
        selection: {
          active: { line: 0, character: 0 },
        },
        setDecorations: vi.fn(),
      }),
      showInformationMessage: vi.fn(),
      onDidChangeTextEditorSelection: vi.fn((listener: (event: any) => void) => {
        selectionChangeListeners.push(listener);
        return { dispose: vi.fn() };
      }),
      createTextEditorDecorationType: vi.fn(() => ({
        dispose: vi.fn(),
      })),
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

/**
 * Creates mock GameOutputChannels for testing
 */
function createMockOutputChannels(): GameOutputChannels {
  return {
    gameLog: createMockOutputChannel(),
    combatLog: createMockOutputChannel(),
    dialogLog: createMockOutputChannel(),
    otherLog: createMockOutputChannel(),
  };
}

describe("GameController", () => {
  let controller: GameController;
  let mockContext: vscode.ExtensionContext;
  let documentProvider: GameDocumentProvider;
  let playerTreeProvider: PlayerTreeProvider;
  let equipmentTreeProvider: EquipmentTreeProvider;
  let inventoryTreeProvider: InventoryTreeProvider;
  let cursorLocationTreeProvider: CursorLocationTreeProvider;
  let mockOutputChannels: GameOutputChannels;

  beforeEach(() => {
    vi.clearAllMocks();
    selectionChangeListeners = [];

    // Create minimal mock context
    mockContext = {
      subscriptions: [],
    } as unknown as vscode.ExtensionContext;

    documentProvider = new GameDocumentProvider();
    playerTreeProvider = new PlayerTreeProvider();
    equipmentTreeProvider = new EquipmentTreeProvider();
    inventoryTreeProvider = new InventoryTreeProvider();
    cursorLocationTreeProvider = new CursorLocationTreeProvider();
    mockOutputChannels = createMockOutputChannels();
    controller = new GameController(
      mockContext,
      documentProvider,
      playerTreeProvider,
      equipmentTreeProvider,
      inventoryTreeProvider,
      cursorLocationTreeProvider,
      mockOutputChannels
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
        "Game started! WASD to move character, Arrow keys or mouse to move status cursor."
      );
    });

    it("should clear and initialize the combat output channel", async () => {
      await controller.startGame();

      // All output channels should be cleared
      expect(mockOutputChannels.gameLog.clear).toHaveBeenCalled();
      expect(mockOutputChannels.combatLog.clear).toHaveBeenCalled();
      expect(mockOutputChannels.dialogLog.clear).toHaveBeenCalled();
      
      // Each channel should have its header
      expect(mockOutputChannels.gameLog.appendLine).toHaveBeenCalledWith("=== Game Log ===");
      expect(mockOutputChannels.combatLog.appendLine).toHaveBeenCalledWith("=== Combat Log ===");
      expect(mockOutputChannels.dialogLog.appendLine).toHaveBeenCalledWith("=== Dialog Log ===");
    });

    it("should reveal the view container", async () => {
      await controller.startGame();

      expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
        "vscdc.playerView.focus"
      );
    });

    it("should show the game log output channel with focus preserved", async () => {
      await controller.startGame();

      // Game log should be shown with preserveFocus=true to keep editor focused
      expect(mockOutputChannels.gameLog.show).toHaveBeenCalledWith(true);
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

  describe("descendFloor", () => {
    it("should not throw without an active game", () => {
      expect(() => controller.descendFloor()).not.toThrow();
    });

    it("should explain when the active level has no stairs", async () => {
      await controller.startGame();
      vi.clearAllMocks();

      controller.descendFloor();

      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        "This level has no downward stairs."
      );
    });

    it("should explain when the player is not standing on stairs", async () => {
      await controller.startDungeonCrawl({ seed: 42 });
      vi.clearAllMocks();

      controller.descendFloor();

      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        "Stand on the downward stairs (>) before descending."
      );
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

  describe("cursor location tracking", () => {
    it("should subscribe to selection change events on construction", () => {
      expect(vscode.window.onDidChangeTextEditorSelection).toHaveBeenCalled();
      expect(selectionChangeListeners.length).toBe(1);
    });

    it("should update cursor location when selection changes in game document", async () => {
      await controller.startGame();

      // Spy on the cursor location tree provider
      const setLocationInfoSpy = vi.spyOn(cursorLocationTreeProvider, "setLocationInfo");
      setLocationInfoSpy.mockClear();

      // Simulate a selection change in the game document
      // Line 3 = y 0 (after 3 header lines), character 1 = x 1
      const mockEvent = {
        textEditor: {
          document: {
            uri: {
              toString: () => "roguelike://game/view",
            },
          },
        },
        selections: [
          {
            active: { line: 3, character: 1 },
          },
        ],
      };

      selectionChangeListeners[0](mockEvent);

      // Should update location info with the converted position
      expect(setLocationInfoSpy).toHaveBeenCalled();
      const locationInfo = setLocationInfoSpy.mock.calls[0][0];
      expect(locationInfo).not.toBeNull();
      expect(locationInfo?.position.x).toBe(1);
      expect(locationInfo?.position.y).toBe(0);
    });

    it("should ignore selection changes in non-game documents", async () => {
      await controller.startGame();

      const setLocationInfoSpy = vi.spyOn(cursorLocationTreeProvider, "setLocationInfo");
      setLocationInfoSpy.mockClear();

      // Simulate a selection change in a different document
      const mockEvent = {
        textEditor: {
          document: {
            uri: {
              toString: () => "file:///some/other/file.ts",
            },
          },
        },
        selections: [
          {
            active: { line: 5, character: 10 },
          },
        ],
      };

      selectionChangeListeners[0](mockEvent);

      // Should not update location info
      expect(setLocationInfoSpy).not.toHaveBeenCalled();
    });

    it("should clear location info when cursor is outside game map bounds", async () => {
      await controller.startGame();

      const setLocationInfoSpy = vi.spyOn(cursorLocationTreeProvider, "setLocationInfo");
      setLocationInfoSpy.mockClear();

      // Simulate a selection change in the game document but in header area (line 0-2)
      const mockEvent = {
        textEditor: {
          document: {
            uri: {
              toString: () => "roguelike://game/view",
            },
          },
        },
        selections: [
          {
            active: { line: 0, character: 0 }, // Header line
          },
        ],
      };

      selectionChangeListeners[0](mockEvent);

      // Should clear location info (set to null)
      expect(setLocationInfoSpy).toHaveBeenCalledWith(null);
    });

    it("should correctly convert editor position to game position", async () => {
      await controller.startGame();

      const setLocationInfoSpy = vi.spyOn(cursorLocationTreeProvider, "setLocationInfo");

      // Test various positions
      // Line 3 = y 0, Line 4 = y 1, etc. (3 header lines offset)
      // Character directly maps to x
      const testCases = [
        { line: 3, character: 0, expectedX: 0, expectedY: 0 },
        { line: 4, character: 2, expectedX: 2, expectedY: 1 },
        { line: 5, character: 3, expectedX: 3, expectedY: 2 },
      ];

      for (const testCase of testCases) {
        setLocationInfoSpy.mockClear();

        const mockEvent = {
          textEditor: {
            document: {
              uri: {
                toString: () => "roguelike://game/view",
              },
            },
          },
          selections: [
            {
              active: { line: testCase.line, character: testCase.character },
            },
          ],
        };

        selectionChangeListeners[0](mockEvent);

        const locationInfo = setLocationInfoSpy.mock.calls[0][0];
        expect(locationInfo?.position.x).toBe(testCase.expectedX);
        expect(locationInfo?.position.y).toBe(testCase.expectedY);
      }
    });

    it("should include player as an entity when cursor is on player position", async () => {
      await controller.startGame();

      const setLocationInfoSpy = vi.spyOn(cursorLocationTreeProvider, "setLocationInfo");
      setLocationInfoSpy.mockClear();

      // Player starts at (3, 3) in the test level, which is line 6 (3 header + y=3)
      const mockEvent = {
        textEditor: {
          document: {
            uri: {
              toString: () => "roguelike://game/view",
            },
          },
        },
        selections: [
          {
            active: { line: 6, character: 3 }, // y=3, x=3 (player start)
          },
        ],
      };

      selectionChangeListeners[0](mockEvent);

      expect(setLocationInfoSpy).toHaveBeenCalled();
      const locationInfo = setLocationInfoSpy.mock.calls[0][0];
      expect(locationInfo).not.toBeNull();
      expect(locationInfo?.entities.length).toBeGreaterThan(0);

      // The player should be in the entities list with name and health
      const playerEntity = locationInfo?.entities.find((e: any) => e.name === "Adventurer");
      expect(playerEntity).toBeDefined();
      expect(playerEntity?.health).toBeDefined();
      expect(playerEntity?.health.current).toBe(playerEntity?.health.max);
    });

    it("should show entity HP in the location info", async () => {
      await controller.startGame();

      const setLocationInfoSpy = vi.spyOn(cursorLocationTreeProvider, "setLocationInfo");
      setLocationInfoSpy.mockClear();

      // The target dummy is at (2, 2) in the test level, which is line 5 (3 header + y=2)
      const mockEvent = {
        textEditor: {
          document: {
            uri: {
              toString: () => "roguelike://game/view",
            },
          },
        },
        selections: [
          {
            active: { line: 5, character: 2 }, // y=2, x=2 (target dummy position)
          },
        ],
      };

      selectionChangeListeners[0](mockEvent);

      expect(setLocationInfoSpy).toHaveBeenCalled();
      const locationInfo = setLocationInfoSpy.mock.calls[0][0];
      expect(locationInfo).not.toBeNull();
      expect(locationInfo?.entities.length).toBeGreaterThan(0);

      // Entity should have health info (Target Dummy has HP 6)
      const entity = locationInfo?.entities[0];
      expect(entity?.name).toBe("Target Dummy");
      expect(entity?.health).toBeDefined();
      expect(entity?.health.current).toBe(6);
      expect(entity?.health.max).toBe(6);
    });
  });
});
