/**
 * Game controller that manages the active game session
 * and handles player commands
 */

import * as vscode from "vscode";
import {
  GameSession,
  createGame,
  getTileAt,
  getDialogHandler,
  DialogTree,
  DialogNode,
  NPC,
} from "@vscdc/game";
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
/**
 * Number of header lines in the game document before the map grid starts
 * (level name, turn count, empty line)
 */
const MAP_HEADER_LINES = 3;

export class GameController {
  private gameSession: GameSession | null = null;
  private documentProvider: GameDocumentProvider;
  private playerTreeProvider: PlayerTreeProvider;
  private cursorLocationTreeProvider: CursorLocationTreeProvider;
  private combatOutputChannel: vscode.OutputChannel;
  private gameEditor: vscode.TextEditor | null = null;
  private eventUnsubscribers: Array<() => void> = [];
  private disposables: vscode.Disposable[] = [];

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

    // Subscribe to cursor/selection changes to update cursor location view
    this.disposables.push(
      vscode.window.onDidChangeTextEditorSelection((event) => {
        this.handleSelectionChange(event);
      })
    );
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
   * Handle VS Code text editor selection changes
   * Updates the cursor location view when the cursor moves in the game document
   */
  private handleSelectionChange(event: vscode.TextEditorSelectionChangeEvent): void {
    // Only handle selection changes in the game document
    if (event.textEditor.document.uri.toString() !== GAME_DOCUMENT_URI.toString()) {
      return;
    }

    if (!this.gameSession) return;

    // Get the cursor position (use the active/primary selection)
    const cursorPosition = event.selections[0].active;
    const gamePosition = this.convertEditorPositionToGamePosition(cursorPosition);

    if (!gamePosition) {
      // Cursor is outside the game map area
      this.cursorLocationTreeProvider.setLocationInfo(null);
      return;
    }

    this.updateCursorLocationAtPosition(gamePosition.x, gamePosition.y);
  }

  /**
   * Convert VS Code editor position (line, character) to game world position (x, y)
   * Returns null if the editor position is outside the game map area
   */
  private convertEditorPositionToGamePosition(
    editorPosition: vscode.Position
  ): { x: number; y: number } | null {
    if (!this.gameSession) return null;

    const { level } = this.gameSession;

    // Convert editor line/character to game coordinates
    // The game map starts after MAP_HEADER_LINES header lines
    const y = editorPosition.line - MAP_HEADER_LINES;
    const x = editorPosition.character;

    // Check if the position is within the game map bounds
    if (x < 0 || x >= level.width || y < 0 || y >= level.height) {
      return null;
    }

    return { x, y };
  }

  /**
   * Update the cursor location tree view with info at the specified game position
   */
  private updateCursorLocationAtPosition(x: number, y: number): void {
    if (!this.gameSession) return;

    const tile = getTileAt(this.gameSession.level, x, y);

    // If tile is undefined, position is out of bounds
    if (!tile) {
      this.cursorLocationTreeProvider.setLocationInfo(null);
      return;
    }

    // Build list of entities at the cursor position
    const entitiesAtPosition: Array<{ name: string; health: { current: number; max: number } }> = [];

    // Check if player is at this position
    const playerPos = this.gameSession.engine.getPlayerPosition();
    if (playerPos.x === x && playerPos.y === y) {
      entitiesAtPosition.push({
        name: this.gameSession.engine.getPlayerName(),
        health: this.gameSession.engine.getPlayerHealth(),
      });
    }

    // Get all enemies at the cursor position
    // Note: We filter all entities rather than using getEntityAt() because
    // getEntityAt() returns only one entity, but we need to support multiple entities per square
    const enemiesAtPosition = this.gameSession
      .getEntities()
      .filter((e) => e.position.x === x && e.position.y === y);

    for (const enemy of enemiesAtPosition) {
      entitiesAtPosition.push({
        name: enemy.name,
        health: enemy.health,
      });
    }

    // Get all NPCs at the cursor position
    const npcsAtPosition = this.gameSession
      .getNPCs()
      .filter((npc) => npc.position.x === x && npc.position.y === y);

    for (const npc of npcsAtPosition) {
      entitiesAtPosition.push({
        name: npc.name,
        health: npc.health,
      });
    }

    this.cursorLocationTreeProvider.setLocationInfo({
      position: { x, y },
      tile,
      entities: entitiesAtPosition,
    });
  }

  /**
   * Update the cursor location tree view based on current editor cursor
   * Called when starting a game to initialize the view
   */
  private updateCursorLocation(): void {
    if (!this.gameEditor) return;

    const cursorPosition = this.gameEditor.selection.active;
    const gamePosition = this.convertEditorPositionToGamePosition(cursorPosition);

    if (gamePosition) {
      this.updateCursorLocationAtPosition(gamePosition.x, gamePosition.y);
    } else {
      this.cursorLocationTreeProvider.setLocationInfo(null);
    }
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
  private async handleMove(dx: number, dy: number): Promise<void> {
    if (!this.gameSession) return;

    const result = this.gameSession.movePlayer(dx, dy);

    // Update player stats after any action
    this.playerTreeProvider.setPlayerStats(this.gameSession.getPlayerStats());

    // Update cursor location after movement
    this.updateCursorLocation();

    if (result.actionType === "interact" && result.interactTarget) {
      // Handle NPC interaction
      await this.handleNPCInteraction(result.interactTarget);
    } else if (!result.success && result.actionType === "blocked") {
      this.showBlockedMessage();
    }
  }

  /**
   * Handle interaction with an NPC by showing dialog
   */
  private async handleNPCInteraction(npc: NPC): Promise<void> {
    const dialogHandler = getDialogHandler(npc.type);
    if (!dialogHandler) {
      vscode.window.showInformationMessage(`${npc.name} has nothing to say.`);
      return;
    }

    const dialogTree = dialogHandler(npc);
    if (!dialogTree) {
      vscode.window.showInformationMessage(`${npc.name} has nothing to say.`);
      return;
    }

    // Start the dialog at the root node
    await this.showDialogNode(dialogTree, dialogTree.startNodeId);
  }

  /**
   * Display a dialog node and handle the player's choice
   */
  private async showDialogNode(dialogTree: DialogTree, nodeId: string): Promise<void> {
    const node = dialogTree.nodes[nodeId];
    if (!node) {
      return;
    }

    // Create quick pick items from dialog options
    const quickPickItems = node.options.map((option) => ({
      label: option.text,
      nextNodeId: option.nextNodeId,
    }));

    // Show the quick pick with the NPC's dialog text at the top
    const selected = await vscode.window.showQuickPick(quickPickItems, {
      placeHolder: node.text,
      title: "Dialog",
    });

    // If user selected an option and it has a next node, show that node
    if (selected && selected.nextNodeId) {
      await this.showDialogNode(dialogTree, selected.nextNodeId);
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
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables = [];
  }
}
