/**
 * VS Code Dungeon Crawler Extension
 *
 * This is the UI layer that binds the engine to VS Code's UI surfaces.
 */

import * as vscode from "vscode";
import { GAME_VERSION, getEngineVersion } from "@vscdc/game";
import { GameDocumentProvider } from "./gameDocumentProvider";
import { GameController, GameOutputChannels } from "./gameController";
import { PlayerTreeProvider } from "./playerTreeProvider";
import { CursorLocationTreeProvider } from "./cursorLocationTreeProvider";

let gameController: GameController | undefined;
let outputChannels: GameOutputChannels | undefined;

export function activate(context: vscode.ExtensionContext): void {
  console.log("VS Code Dungeon Crawler extension activating...");

  // Create output channels for game logging
  // Game Log shows all events, Combat and Dialog show filtered events
  const gameLogChannel = vscode.window.createOutputChannel("Dungeon Crawler - Game Log");
  const combatLogChannel = vscode.window.createOutputChannel("Dungeon Crawler - Combat");
  const dialogLogChannel = vscode.window.createOutputChannel("Dungeon Crawler - Dialog");
  
  outputChannels = {
    gameLog: gameLogChannel,
    combatLog: combatLogChannel,
    dialogLog: dialogLogChannel,
  };
  
  context.subscriptions.push(gameLogChannel);
  context.subscriptions.push(combatLogChannel);
  context.subscriptions.push(dialogLogChannel);

  // Create the document provider for the game view
  const documentProvider = new GameDocumentProvider();
  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider("roguelike", documentProvider)
  );

  // Create the player tree provider
  const playerTreeProvider = new PlayerTreeProvider();
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("vscdc.playerView", playerTreeProvider)
  );
  context.subscriptions.push(playerTreeProvider);

  // Create the cursor location tree provider
  const cursorLocationTreeProvider = new CursorLocationTreeProvider();
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("vscdc.cursorLocationView", cursorLocationTreeProvider)
  );
  context.subscriptions.push(cursorLocationTreeProvider);

  // Create the game controller
  gameController = new GameController(
    context,
    documentProvider,
    playerTreeProvider,
    cursorLocationTreeProvider,
    outputChannels
  );
  context.subscriptions.push(gameController);

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand("vscdc.startGame", async () => {
      await gameController?.startGame();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("vscdc.startGameNoEnemies", async () => {
      await gameController?.startGame({ excludeEnemies: true });
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("vscdc.moveUp", () => {
      gameController?.moveUp();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("vscdc.moveDown", () => {
      gameController?.moveDown();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("vscdc.moveLeft", () => {
      gameController?.moveLeft();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("vscdc.moveRight", () => {
      gameController?.moveRight();
    })
  );

  console.log(
    `VS Code Dungeon Crawler activated - Game v${GAME_VERSION}, Engine v${getEngineVersion()}`
  );
}

export function deactivate(): void {
  gameController?.dispose();
  gameController = undefined;
  if (outputChannels) {
    outputChannels.gameLog.dispose();
    outputChannels.combatLog.dispose();
    outputChannels.dialogLog.dispose();
    outputChannels = undefined;
  }
}
