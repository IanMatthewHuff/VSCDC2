/**
 * Game controller that manages the active game session
 * and handles player commands
 */

import * as vscode from "vscode";
import {
  GameSession,
  createGame,
  CreateGameOptions,
  getTileAt,
  getDialogHandler,
  getEnvironmentEffect,
  DialogTree,
  DialogNode,
  NPC,
  EnvironmentType,
} from "@vscdc/game";
import {
  GameEventType,
  AttackEvent,
  EntityDestroyedEvent,
  EnvironmentEnteredEvent,
  EnvironmentDamageEvent,
  AnyGameEvent,
} from "@vscdc/engine";
import { GameDocumentProvider, GAME_DOCUMENT_URI } from "./gameDocumentProvider";
import { PlayerTreeProvider } from "./playerTreeProvider";
import { EquipmentTreeProvider } from "./equipmentTreeProvider";
import { CursorLocationTreeProvider } from "./cursorLocationTreeProvider";

/**
 * Context key that indicates when the game is active
 */
export const GAME_ACTIVE_CONTEXT = "vscdc.gameActive";

/**
 * Output channels for game logging
 */
export interface GameOutputChannels {
  /** Combined log of all game events */
  gameLog: vscode.OutputChannel;
  /** Combat-specific events (attacks, damage, deaths) */
  combatLog: vscode.OutputChannel;
  /** Dialog-specific events (NPC conversations) */
  dialogLog: vscode.OutputChannel;
}

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
  private equipmentTreeProvider: EquipmentTreeProvider;
  private cursorLocationTreeProvider: CursorLocationTreeProvider;
  private outputChannels: GameOutputChannels;
  private gameEditor: vscode.TextEditor | null = null;
  private eventUnsubscribers: Array<() => void> = [];
  private disposables: vscode.Disposable[] = [];

  /** Decoration type for lava environments (orange background) */
  private lavaDecorationType: vscode.TextEditorDecorationType;

  constructor(
    private context: vscode.ExtensionContext,
    documentProvider: GameDocumentProvider,
    playerTreeProvider: PlayerTreeProvider,
    equipmentTreeProvider: EquipmentTreeProvider,
    cursorLocationTreeProvider: CursorLocationTreeProvider,
    outputChannels: GameOutputChannels
  ) {
    this.documentProvider = documentProvider;
    this.playerTreeProvider = playerTreeProvider;
    this.equipmentTreeProvider = equipmentTreeProvider;
    this.cursorLocationTreeProvider = cursorLocationTreeProvider;
    this.outputChannels = outputChannels;

    // Create decoration types for environments
    this.lavaDecorationType = vscode.window.createTextEditorDecorationType({
      backgroundColor: "rgba(255, 100, 0, 0.5)",
    });

    // Subscribe to cursor/selection changes to update cursor location view
    this.disposables.push(
      vscode.window.onDidChangeTextEditorSelection((event) => {
        this.handleSelectionChange(event);
      })
    );
  }

  /**
   * Start a new game session
   * @param options Optional game creation options
   */
  async startGame(options?: CreateGameOptions): Promise<void> {
    // Create a new game session
    this.gameSession = createGame(options);
    this.documentProvider.setGameSession(this.gameSession);
    this.playerTreeProvider.setPlayerStats(this.gameSession.getPlayerStats());
    this.equipmentTreeProvider.setEquipment(this.gameSession.engine.getPlayerEquipment());

    // Update cursor location to initial position
    this.updateCursorLocation();

    // Subscribe to combat events
    this.subscribeToEvents();

    // Clear and initialize all output channels
    this.outputChannels.gameLog.clear();
    this.outputChannels.gameLog.appendLine("=== Game Log ===");
    this.outputChannels.gameLog.appendLine("");
    
    this.outputChannels.combatLog.clear();
    this.outputChannels.combatLog.appendLine("=== Combat Log ===");
    this.outputChannels.combatLog.appendLine("");
    
    this.outputChannels.dialogLog.clear();
    this.outputChannels.dialogLog.appendLine("=== Dialog Log ===");
    this.outputChannels.dialogLog.appendLine("");

    // Set context to indicate game is active (must be set before revealing views
    // since views have "when": "vscdc.gameActive" condition)
    await vscode.commands.executeCommand("setContext", GAME_ACTIVE_CONTEXT, true);

    // Open the game document
    const doc = await vscode.workspace.openTextDocument(GAME_DOCUMENT_URI);
    this.gameEditor = await vscode.window.showTextDocument(doc, {
      preview: false,
      preserveFocus: false,
    });

    // Reveal the player view in the sidebar (this focuses the view container)
    await vscode.commands.executeCommand("vscdc.playerView.focus");

    // Show the game log output channel (preserveFocus=true keeps editor focused)
    this.outputChannels.gameLog.show(true);

    // Apply initial environment decorations
    this.updateEnvironmentDecorations();

    // Subscribe to document changes to update decorations
    // This ensures decorations are applied AFTER the document content has been updated
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument((event) => {
        if (event.document.uri.toString() === GAME_DOCUMENT_URI.toString()) {
          this.updateEnvironmentDecorations();
        }
      })
    );

    vscode.window.showInformationMessage("Game started! WASD to move character, Arrow keys or mouse to move status cursor.");
  }

  /**
   * Log a message to the combat log (and game log)
   */
  private logCombat(message: string): void {
    this.outputChannels.combatLog.appendLine(message);
    this.outputChannels.gameLog.appendLine(`[Combat] ${message}`);
  }

  /**
   * Log a message to the dialog log (and game log)
   */
  private logDialog(message: string): void {
    this.outputChannels.dialogLog.appendLine(message);
    this.outputChannels.gameLog.appendLine(`[Dialog] ${message}`);
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
      this.logCombat(message);
    });
    this.eventUnsubscribers.push(unsubAttack);

    // Subscribe to entity destroyed events
    const unsubDestroyed = engine.onEvent(
      GameEventType.ENTITY_DESTROYED,
      (event: AnyGameEvent) => {
        const destroyedEvent = event as EntityDestroyedEvent;
        const message = `${destroyedEvent.entityName} was destroyed by ${destroyedEvent.destroyedByName}!`;
        this.logCombat(message);
      }
    );
    this.eventUnsubscribers.push(unsubDestroyed);

    // Subscribe to environment entered events
    const unsubEnvEntered = engine.onEvent(
      GameEventType.ENVIRONMENT_ENTERED,
      (event: AnyGameEvent) => {
        const envEvent = event as EnvironmentEnteredEvent;
        const message = `${envEvent.characterName} entered ${envEvent.environmentType}`;
        this.logCombat(message);
      }
    );
    this.eventUnsubscribers.push(unsubEnvEntered);

    // Subscribe to environment damage events
    const unsubEnvDamage = engine.onEvent(
      GameEventType.ENVIRONMENT_DAMAGE,
      (event: AnyGameEvent) => {
        const dmgEvent = event as EnvironmentDamageEvent;
        const message = `${dmgEvent.characterName} took ${dmgEvent.damage} damage from ${dmgEvent.environmentType}! HP: ${dmgEvent.remainingHp}/${dmgEvent.maxHp}`;
        this.logCombat(message);
      }
    );
    this.eventUnsubscribers.push(unsubEnvDamage);
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
   * Convert game world position (x, y) to VS Code editor range
   * Returns a range covering a single character at the specified position
   */
  private convertGamePositionToEditorRange(x: number, y: number): vscode.Range {
    const line = y + MAP_HEADER_LINES;
    const startChar = x;
    const endChar = x + 1;
    return new vscode.Range(line, startChar, line, endChar);
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

    // Get environment at this position
    const environment = this.gameSession.getEnvironmentAt({ x, y });

    this.cursorLocationTreeProvider.setLocationInfo({
      position: { x, y },
      tile,
      entities: entitiesAtPosition,
      environment,
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
   * Update environment decorations in the game editor
   * Applies visual highlighting to environment tiles (e.g., orange background for lava)
   */
  private updateEnvironmentDecorations(): void {
    if (!this.gameEditor || !this.gameSession) return;

    const environments = this.gameSession.getEnvironments();
    const lavaRanges: vscode.Range[] = [];

    for (const env of environments) {
      if (env.type === EnvironmentType.Lava) {
        const range = this.convertGamePositionToEditorRange(env.position.x, env.position.y);
        lavaRanges.push(range);
      }
    }

    // Apply decorations to the editor
    this.gameEditor.setDecorations(this.lavaDecorationType, lavaRanges);
  }

  /**
   * Stop the current game session
   */
  stopGame(): void {
    this.unsubscribeFromEvents();
    this.gameSession = null;
    this.gameEditor = null;
    this.playerTreeProvider.setPlayerStats(null);
    this.equipmentTreeProvider.setEquipment(null);
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

    // Update player stats and equipment after any action
    this.playerTreeProvider.setPlayerStats(this.gameSession.getPlayerStats());
    this.equipmentTreeProvider.setEquipment(this.gameSession.engine.getPlayerEquipment());

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
      vscode.window.showInformationMessage(`No dialog available for this NPC.`);
      return;
    }

    const dialogTree = dialogHandler(npc);
    if (!dialogTree) {
      vscode.window.showInformationMessage(`${npc.name} is not talkative right now.`);
      return;
    }

    // Log dialog start
    this.logDialog(`Started conversation with ${npc.name}`);

    // Run the dialog and collect the result path
    const resultPath = await this.runDialog(npc.name, dialogTree);

    // Log dialog end
    if (resultPath === null) {
      this.logDialog(`Conversation with ${npc.name} was cancelled`);
    } else {
      this.logDialog(`Ended conversation with ${npc.name}. Path: ${resultPath.join(" → ")}`);
    }
  }

  /**
   * Run a complete dialog tree and return the path of choices made
   * @param npcName Name of the NPC for display purposes
   * @param dialogTree The dialog tree to traverse
   * @returns Array of choice texts representing the path taken, or null if cancelled
   */
  private async runDialog(npcName: string, dialogTree: DialogTree): Promise<string[] | null> {
    const resultPath: string[] = [];
    let currentNodeId: string | null = dialogTree.startNodeId;

    while (currentNodeId !== null) {
      const node = dialogTree.nodes[currentNodeId];
      if (!node) {
        break;
      }

      const selectedChoice = await this.showDialogNode(npcName, node);

      if (selectedChoice === null) {
        // User cancelled (pressed Escape)
        return null;
      }

      // Log the choice
      this.logDialog(`  ${npcName}: "${node.text}"`);
      this.logDialog(`  You: "${selectedChoice.text}"`);

      // Add choice to result path
      resultPath.push(selectedChoice.text);

      // Move to next node (null means end of dialog)
      currentNodeId = selectedChoice.nextNodeId;
    }

    return resultPath;
  }

  /**
   * Display a single dialog node and return the player's choice
   * Shows NPC text lines at the top, then a separator, then player choices
   * 
   * @param npcName Name of the NPC for the title
   * @param node The dialog node to display
   * @returns The selected option, or null if cancelled
   */
  private async showDialogNode(
    npcName: string, 
    node: DialogNode
  ): Promise<{ text: string; nextNodeId: string | null } | null> {
    // Build quick pick items:
    // 1. NPC text lines as regular items (clicking re-shows the dialog)
    // 2. Separator to divide NPC text from choices
    // 3. Player choice options
    interface DialogQuickPickItem extends vscode.QuickPickItem {
      isNpcText?: boolean;
      nextNodeId?: string | null;
      optionText?: string;
    }

    // Normalize text to array (supports both string and string[])
    const textLines = Array.isArray(node.text) ? node.text : [node.text];

    const items: DialogQuickPickItem[] = [
      // NPC dialog text lines as non-actionable items
      // If clicked, we'll detect it and re-show the same node
      ...textLines.map((line) => ({
        label: `💬 ${line}`,
        isNpcText: true,
      })),
      // Separator between NPC text and player choices
      { 
        label: "Your response",
        kind: vscode.QuickPickItemKind.Separator,
      },
      // Player choice options
      ...node.options.map((option) => ({
        label: option.text,
        nextNodeId: option.nextNodeId,
        optionText: option.text,
      })),
    ];

    const selected = await vscode.window.showQuickPick(items, {
      title: `Talking to ${npcName}`,
      ignoreFocusOut: true,
    });

    if (!selected) {
      // User cancelled (pressed Escape)
      return null;
    }

    if (selected.isNpcText) {
      // User clicked the NPC text - re-show the same dialog node
      return this.showDialogNode(npcName, node);
    }

    return {
      text: selected.optionText!,
      nextNodeId: selected.nextNodeId ?? null,
    };
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

  /**
   * Use a consumable item from a specific slot
   */
  useConsumable(slot: number): void {
    if (!this.gameSession) return;

    // Use the consumable
    this.gameSession.useConsumable(slot);

    // Update UI
    this.playerTreeProvider.setPlayerStats(this.gameSession.getPlayerStats());
    this.equipmentTreeProvider.setEquipment(this.gameSession.engine.getPlayerEquipment());

    vscode.window.showInformationMessage(`Used consumable from slot ${slot + 1}`);
  }

  /**
   * Remove a consumable item from a specific slot
   */
  removeConsumable(slot: number): void {
    if (!this.gameSession) return;

    // Remove the consumable
    this.gameSession.removeConsumable(slot);

    // Update UI
    this.equipmentTreeProvider.setEquipment(this.gameSession.engine.getPlayerEquipment());

    vscode.window.showInformationMessage(`Removed consumable from slot ${slot + 1}`);
  }

  dispose(): void {
    this.stopGame();
    this.lavaDecorationType.dispose();
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables = [];
  }
}
