/**
 * Game controller that manages the active game session
 * and handles player commands
 */

import * as vscode from "vscode";
import { GameSession, createGame } from "@vscdc/game";
import { GameDocumentProvider, GAME_DOCUMENT_URI } from "./gameDocumentProvider";
import { PlayerTreeProvider } from "./playerTreeProvider";

/**
 * Context key that indicates when the game is active
 */
export const GAME_ACTIVE_CONTEXT = "vscdc.gameActive";

/**
 * Controller for managing the active game session
 */
export class GameController {
  private gameSession: GameSession | null = null;
  private documentProvider: GameDocumentProvider;
  private playerTreeProvider: PlayerTreeProvider;
  private gameEditor: vscode.TextEditor | null = null;

  constructor(
    private context: vscode.ExtensionContext,
    documentProvider: GameDocumentProvider,
    playerTreeProvider: PlayerTreeProvider
  ) {
    this.documentProvider = documentProvider;
    this.playerTreeProvider = playerTreeProvider;
  }

  /**
   * Start a new game session
   */
  async startGame(): Promise<void> {
    // Create a new game session
    this.gameSession = createGame();
    this.documentProvider.setGameSession(this.gameSession);
    this.playerTreeProvider.setPlayerStats(this.gameSession.getPlayerStats());

    // Open the game document
    const doc = await vscode.workspace.openTextDocument(GAME_DOCUMENT_URI);
    this.gameEditor = await vscode.window.showTextDocument(doc, {
      preview: false,
      preserveFocus: false,
    });

    // Set context to indicate game is active
    vscode.commands.executeCommand("setContext", GAME_ACTIVE_CONTEXT, true);

    vscode.window.showInformationMessage("Game started! Use WASD or arrow keys to move.");
  }

  /**
   * Stop the current game session
   */
  stopGame(): void {
    this.gameSession = null;
    this.gameEditor = null;
    this.playerTreeProvider.setPlayerStats(null);
    vscode.commands.executeCommand("setContext", GAME_ACTIVE_CONTEXT, false);
  }

  /**
   * Move the player up
   */
  moveUp(): void {
    if (this.gameSession) {
      const moved = this.gameSession.movePlayer(0, -1);
      if (!moved) {
        this.showBlockedMessage();
      }
    }
  }

  /**
   * Move the player down
   */
  moveDown(): void {
    if (this.gameSession) {
      const moved = this.gameSession.movePlayer(0, 1);
      if (!moved) {
        this.showBlockedMessage();
      }
    }
  }

  /**
   * Move the player left
   */
  moveLeft(): void {
    if (this.gameSession) {
      const moved = this.gameSession.movePlayer(-1, 0);
      if (!moved) {
        this.showBlockedMessage();
      }
    }
  }

  /**
   * Move the player right
   */
  moveRight(): void {
    if (this.gameSession) {
      const moved = this.gameSession.movePlayer(1, 0);
      if (!moved) {
        this.showBlockedMessage();
      }
    }
  }

  /**
   * Show a message when movement is blocked
   */
  private showBlockedMessage(): void {
    // Could show a status bar message or do nothing for now
    // vscode.window.setStatusBarMessage("Can't move there!", 1000);
  }

  /**
   * Check if there's an active game session
   */
  hasActiveGame(): boolean {
    return this.gameSession !== null;
  }

  dispose(): void {
    this.stopGame();
  }
}
