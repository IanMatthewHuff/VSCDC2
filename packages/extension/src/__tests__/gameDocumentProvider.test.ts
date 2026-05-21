/**
 * Unit tests for GameDocumentProvider
 * Tests the document content rendering logic
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GameDocumentProvider, GAME_DOCUMENT_URI } from "../gameDocumentProvider";
import { createGame, GameSession } from "@vscdc/game";

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
  };
});

describe("GameDocumentProvider", () => {
  let provider: GameDocumentProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new GameDocumentProvider();
  });

  describe("provideTextDocumentContent", () => {
    it("should return placeholder text when no game session is set", () => {
      const content = provider.provideTextDocumentContent(GAME_DOCUMENT_URI);
      expect(content).toBe("No game session active");
    });

    it("should render the game when a session is set", () => {
      const gameSession = createGame();
      provider.setGameSession(gameSession);

      const content = provider.provideTextDocumentContent(GAME_DOCUMENT_URI);

      // Should contain the level name
      expect(content).toContain("Test Level");

      // Should contain turn counter
      expect(content).toContain("Turn: 1");

      // Should contain the player character
      expect(content).toContain("@");

      // Should contain controls hint
      expect(content).toContain("Controls:");
    });

    it("should show walls and floors", () => {
      const gameSession = createGame();
      provider.setGameSession(gameSession);

      const content = provider.provideTextDocumentContent(GAME_DOCUMENT_URI);

      // Should have walls (#)
      expect(content).toContain("#");

      // Should have floors (.)
      expect(content).toContain(".");
    });

    it("renders a consumable floor item with !", () => {
      const gameSession = createGame();
      provider.setGameSession(gameSession);

      // createGame seeds a floor potion at (3, 4) — see packages/game/src/index.ts
      const content = provider.provideTextDocumentContent(GAME_DOCUMENT_URI);
      expect(content).toContain("!");
    });

    it("renders an equipment floor item with [", () => {
      const gameSession = createGame();
      // Drop an equipment item on a floor tile far from the player and other entities
      gameSession.engine.addFloorItem(
        {
          id: "test_sword",
          name: "Test Sword",
          // Use the engine's enum value via game re-export indirectly: rely on string
          type: "equipment",
          slot: "rightArm",
          attack: 1,
        } as never,
        { x: 5, y: 5 }
      );
      provider.setGameSession(gameSession);

      const content = provider.provideTextDocumentContent(GAME_DOCUMENT_URI);
      expect(content).toContain("[");
    });

    it("renders the player on top of a floor item", () => {
      const gameSession = createGame();
      // Player starts at (3,3); place a floor item on the player's tile
      gameSession.engine.addFloorItem(
        {
          id: "test_potion_under_player",
          name: "Hidden Potion",
          type: "consumable",
          effect: { type: "heal", amount: 1 },
        } as never,
        { x: 3, y: 3 }
      );
      provider.setGameSession(gameSession);

      const content = provider.provideTextDocumentContent(GAME_DOCUMENT_URI);
      // Player char "@" still visible
      expect(content).toContain("@");
      // Tile rendering for player position should be "@" not "!", check the
      // grid line that contains the player. We split off the header.
      const gridLines = content.split("\n").slice(3); // header + Turn + blank
      expect(gridLines[3]?.[3]).toBe("@");
    });
  });

  describe("setGameSession", () => {
    it("should update rendered content when game state changes", () => {
      const gameSession = createGame();
      provider.setGameSession(gameSession);

      const initialContent = provider.provideTextDocumentContent(GAME_DOCUMENT_URI);
      expect(initialContent).toContain("Turn: 1");

      // Move the player to advance the turn
      gameSession.movePlayer(1, 0);

      const updatedContent = provider.provideTextDocumentContent(GAME_DOCUMENT_URI);
      expect(updatedContent).toContain("Turn: 2");
    });
  });

  describe("GAME_DOCUMENT_URI", () => {
    it("should use the roguelike scheme", () => {
      expect(GAME_DOCUMENT_URI.scheme).toBe("roguelike");
    });
  });

  describe("dispose", () => {
    it("should not throw when disposed without a session", () => {
      expect(() => provider.dispose()).not.toThrow();
    });

    it("should not throw when disposed with a session", () => {
      const gameSession = createGame();
      provider.setGameSession(gameSession);

      expect(() => provider.dispose()).not.toThrow();
    });
  });
});
