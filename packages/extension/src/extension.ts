/**
 * VS Code Dungeon Crawler Extension
 *
 * This is the UI layer that binds the engine to VS Code's UI surfaces.
 */

import * as vscode from "vscode";
import { GAME_VERSION, getEngineVersion } from "@vscdc/game";
import { GameDocumentProvider } from "./gameDocumentProvider";
import { GameController } from "./gameController";
import { PlayerTreeProvider } from "./playerTreeProvider";

let gameController: GameController | undefined;
let combatOutputChannel: vscode.OutputChannel | undefined;

export function activate(context: vscode.ExtensionContext): void {
  console.log("VS Code Dungeon Crawler extension activating...");

  // Create the combat output channel for logging attacks
  combatOutputChannel = vscode.window.createOutputChannel("Dungeon Crawler - Combat");
  context.subscriptions.push(combatOutputChannel);

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

  // Create the game controller
  gameController = new GameController(
    context,
    documentProvider,
    playerTreeProvider,
    combatOutputChannel
  );
  context.subscriptions.push(gameController);

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand("vscdc.startGame", async () => {
      await gameController?.startGame();
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
  combatOutputChannel?.dispose();
  combatOutputChannel = undefined;
}
