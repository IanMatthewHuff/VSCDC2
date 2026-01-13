/**
 * Tree data provider for displaying player stats in a tree view
 */

import * as vscode from "vscode";
import { PlayerStats } from "@vscdc/game";

/**
 * Tree item representing a player stat
 */
export class PlayerStatItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly value: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None,
    icon?: vscode.ThemeIcon
  ) {
    super(label, collapsibleState);
    this.description = value;
    if (icon) {
      this.iconPath = icon;
    }
  }
}

/**
 * Provides tree data for the player stats view
 */
export class PlayerTreeProvider implements vscode.TreeDataProvider<PlayerStatItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<PlayerStatItem | undefined | null | void> =
    new vscode.EventEmitter<PlayerStatItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<PlayerStatItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  private playerStats: PlayerStats | null = null;

  /**
   * Updates the player stats and refreshes the tree view
   */
  setPlayerStats(stats: PlayerStats | null): void {
    this.playerStats = stats;
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: PlayerStatItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: PlayerStatItem): Thenable<PlayerStatItem[]> {
    if (!this.playerStats) {
      return Promise.resolve([]);
    }

    if (!element) {
      // Root level: show name, health, attack, and defense
      return Promise.resolve([
        new PlayerStatItem(
          "Name",
          this.playerStats.name,
          vscode.TreeItemCollapsibleState.None,
          new vscode.ThemeIcon("account")
        ),
        new PlayerStatItem(
          "Health",
          `${this.playerStats.health.current}/${this.playerStats.health.max}`,
          vscode.TreeItemCollapsibleState.None,
          new vscode.ThemeIcon("heart", new vscode.ThemeColor("charts.red"))
        ),
        new PlayerStatItem(
          "Attack",
          `${this.playerStats.attack}`,
          vscode.TreeItemCollapsibleState.None,
          new vscode.ThemeIcon("symbol-misc")
        ),
        new PlayerStatItem(
          "Defense",
          `${this.playerStats.defense}`,
          vscode.TreeItemCollapsibleState.None,
          new vscode.ThemeIcon("shield")
        ),
      ]);
    }

    return Promise.resolve([]);
  }

  dispose(): void {
    this._onDidChangeTreeData.dispose();
  }
}
