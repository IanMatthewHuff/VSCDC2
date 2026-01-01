/**
 * Document content provider for the game view
 * Renders the game state as text content in a VS Code editor
 */

import * as vscode from "vscode";
import { GameSession } from "@vscdc/game";

/**
 * Provides text content for the game view document
 */
export class GameDocumentProvider implements vscode.TextDocumentContentProvider {
  private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
  private gameSession: GameSession | null = null;
  private stateChangeUnsubscribe?: () => void;

  readonly onDidChange = this._onDidChange.event;

  /**
   * Set the game session to render
   */
  setGameSession(session: GameSession): void {
    // Clean up previous subscription if any
    if (this.stateChangeUnsubscribe) {
      this.stateChangeUnsubscribe();
    }

    this.gameSession = session;
    // Subscribe to state changes to trigger document updates
    this.stateChangeUnsubscribe = session.engine.onStateChanged(() => {
      this.refresh();
    });
  }

  /**
   * Trigger a refresh of the document
   */
  refresh(): void {
    this._onDidChange.fire(GAME_DOCUMENT_URI);
  }

  /**
   * Provide the text content for the game document
   */
  provideTextDocumentContent(_uri: vscode.Uri): string {
    if (!this.gameSession) {
      return "No game session active";
    }

    return this.renderGame(this.gameSession);
  }

  /**
   * Render the game state as text
   */
  private renderGame(session: GameSession): string {
    const { level, engine } = session;
    const playerPos = engine.getPlayerPosition();
    const turnCount = engine.getTurnCount();
    const playerState = engine.getState().player;
    const entities = session.getEntities();

    // Create a map of positions to entities for quick lookup
    const entityPositions = new Map<string, { displayChar: string }>();
    for (const entity of entities) {
      const key = `${entity.position.x},${entity.position.y}`;
      entityPositions.set(key, entity);
    }

    const lines: string[] = [];

    // Header with game info
    lines.push(`=== ${level.name} ===`);
    lines.push(`Turn: ${turnCount}`);
    lines.push("");

    // Render the level grid with player and entities
    for (let y = 0; y < level.height; y++) {
      let row = "";
      for (let x = 0; x < level.width; x++) {
        // Show player if at this position (player renders on top)
        if (x === playerPos.x && y === playerPos.y) {
          row += playerState.displayChar;
        } else {
          // Check for entity at this position
          const entity = entityPositions.get(`${x},${y}`);
          if (entity) {
            row += entity.displayChar;
          } else {
            // Show the tile
            row += level.tiles[y][x].displayChar;
          }
        }
      }
      lines.push(row);
    }

    lines.push("");
    lines.push("Controls: WASD or Arrow keys to move");

    return lines.join("\n");
  }

  dispose(): void {
    if (this.stateChangeUnsubscribe) {
      this.stateChangeUnsubscribe();
      this.stateChangeUnsubscribe = undefined;
    }
    this._onDidChange.dispose();
  }
}

export const GAME_DOCUMENT_URI = vscode.Uri.parse("roguelike://game/view");
