/**
 * VS Code Dungeon Crawler Extension
 *
 * This is the UI layer that binds the engine to VS Code's UI surfaces.
 */

import * as vscode from "vscode";
import { GAME_VERSION, getEngineVersion } from "@vscdc/game";

export function activate(context: vscode.ExtensionContext): void {
  const startGameCommand = vscode.commands.registerCommand(
    "vscdc.startGame",
    () => {
      vscode.window.showInformationMessage(
        `VS Code Dungeon Crawler - Game v${GAME_VERSION}, Engine v${getEngineVersion()}`
      );
    }
  );

  context.subscriptions.push(startGameCommand);
}

export function deactivate(): void {
  // Cleanup if needed
}
