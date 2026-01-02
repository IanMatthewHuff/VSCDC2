/**
 * Game controller that manages the active game session
 * and handles player commands
 */

import * as vscode from "vscode";
import { GameSession, createGame, getTileAt } from "@vscdc/game";
import {
  GameEventType,
  AttackEvent,
  EntityDestroyedEvent,
  AnyGameEvent,
} from "@vscdc/engine";
import { GameDocumentProvider, GAME_DOCUMENT_URI } from "./gameDocumentProvider";
import { PlayerTreeProvider } from "./playerTreeProvider";
import { CursorLocationTreeProvider } from "./cursorLocationTreeProvider";

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
  private cursorLocationTreeProvider: CursorLocationTreeProvider;
  private combatOutputChannel: vscode.OutputChannel;
  private gameEditor: vscode.TextEditor | null = null;
  private eventUnsubscribers: Array<() => void> = [];

  constructor(
    private context: vscode.ExtensionContext,
    documentProvider: GameDocumentProvider,
    playerTreeProvider: PlayerTreeProvider,
    cursorLocationTreeProvider: CursorLocationTreeProvider,
    combatOutputChannel: vscode.OutputChannel
  ) {
    this.documentProvider = documentProvider;
    this.playerTreeProvider = playerTreeProvider;
    this.cursorLocationTreeProvider = cursorLocationTreeProvider;
    this.combatOutputChannel = combatOutputChannel;
  }

  /**
   * Start a new game session
   */
  async startGame(): Promise<void> {
    // Create a new game session
    this.gameSession = createGame();
    this.documentProvider.setGameSession(this.gameSession);
    this.playerTreeProvider.setPlayerStats(this.gameSession.getPlayerStats());

    // Update cursor location to initial position
    this.updateCursorLocation();

    // Subscribe to combat events
    this.subscribeToEvents();

    // Show and clear the combat output channel
    this.combatOutputChannel.clear();
    this.combatOutputChannel.appendLine("=== Combat Log ===");
    this.combatOutputChannel.appendLine("");

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
   * Subscribe to game events for combat logging
   */
  private subscribeToEvents(): void {
    if (!this.gameSession) return;

    const engine = this.gameSession.engine;

    // Subscribe to attack events
    const unsubAttack = engine.onEvent(GameEventType.ATTACK, (event: AnyGameEvent) => {
      const attackEvent = event as AttackEvent;
      const message = `${attackEvent.attackerName} attacked ${attackEvent.targetName} for ${attackEvent.damage} damage. HP: ${attackEvent.targetRemainingHp}/${attackEvent.targetMaxHp}`;
      this.combatOutputChannel.appendLine(message);
    });
    this.eventUnsubscribers.push(unsubAttack);

    // Subscribe to entity destroyed events
    const unsubDestroyed = engine.onEvent(
      GameEventType.ENTITY_DESTROYED,
      (event: AnyGameEvent) => {
        const destroyedEvent = event as EntityDestroyedEvent;
        const message = `${destroyedEvent.entityName} was destroyed by ${destroyedEvent.destroyedByName}!`;
        this.combatOutputChannel.appendLine(message);
      }
    );
    this.eventUnsubscribers.push(unsubDestroyed);
  }

  /**
   * Unsubscribe from all game events
   */
  private unsubscribeFromEvents(): void {
    for (const unsub of this.eventUnsubscribers) {
      unsub();
    }
    this.eventUnsubscribers = [];
  }

  /**
   * Update the cursor location tree view with current player position info
   */
  private updateCursorLocation(): void {
    if (!this.gameSession) return;

    const position = this.gameSession.engine.getPlayerPosition();
    const tile = getTileAt(this.gameSession.level, position.x, position.y);

    // If tile is undefined (shouldn't happen), bail out
    if (!tile) return;

    // Get all entities at the player's position
    const entitiesAtPosition = this.gameSession
      .getEntities()
      .filter((e) => e.position.x === position.x && e.position.y === position.y);

    this.cursorLocationTreeProvider.setLocationInfo({
      position,
      tile,
      entities: entitiesAtPosition,
    });
  }

  /**
   * Stop the current game session
   */
  stopGame(): void {
    this.unsubscribeFromEvents();
    this.gameSession = null;
    this.gameEditor = null;
    this.playerTreeProvider.setPlayerStats(null);
    this.cursorLocationTreeProvider.setLocationInfo(null);
    vscode.commands.executeCommand("setContext", GAME_ACTIVE_CONTEXT, false);
  }

  /**
   * Move the player up
   */
  moveUp(): void {
    this.handleMove(0, -1);
  }

  /**
   * Move the player down
   */
  moveDown(): void {
    this.handleMove(0, 1);
  }

  /**
   * Move the player left
   */
  moveLeft(): void {
    this.handleMove(-1, 0);
  }

  /**
   * Move the player right
   */
  moveRight(): void {
    this.handleMove(1, 0);
  }

  /**
   * Handle a movement command
   */
  private handleMove(dx: number, dy: number): void {
    if (!this.gameSession) return;

    const result = this.gameSession.movePlayer(dx, dy);

    // Update player stats after any action
    this.playerTreeProvider.setPlayerStats(this.gameSession.getPlayerStats());

    // Update cursor location after movement
    this.updateCursorLocation();

    if (!result.success && result.actionType === "blocked") {
      this.showBlockedMessage();
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
