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
      // Root level: show name, level, health, attack, defense, and stat points
      const items: PlayerStatItem[] = [
        new PlayerStatItem(
          "Name",
          this.playerStats.name,
          vscode.TreeItemCollapsibleState.None,
          new vscode.ThemeIcon("account")
        ),
        new PlayerStatItem(
          "Level",
          `${this.playerStats.level} (${this.playerStats.experience}/${this.playerStats.experienceToNextLevel} XP)`,
          vscode.TreeItemCollapsibleState.None,
          new vscode.ThemeIcon("star-full", new vscode.ThemeColor("charts.yellow"))
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
        new PlayerStatItem(
          "Gold",
          `${this.playerStats.gold}`,
          vscode.TreeItemCollapsibleState.None,
          new vscode.ThemeIcon("symbol-numeric", new vscode.ThemeColor("charts.yellow"))
        ),
      ];

      // Show stat points if available
      if (this.playerStats.statPoints > 0) {
        const statPointsItem = new PlayerStatItem(
          "Stat Points",
          `${this.playerStats.statPoints} available - Click to spend`,
          vscode.TreeItemCollapsibleState.None,
          new vscode.ThemeIcon("sparkle", new vscode.ThemeColor("charts.green"))
        );
        statPointsItem.command = {
          command: "vscdc.spendStatPoints",
          title: "Spend Stat Points",
        };
        items.push(statPointsItem);
      }

      return Promise.resolve(items);
    }

    return Promise.resolve([]);
  }

  dispose(): void {
    this._onDidChangeTreeData.dispose();
  }
}
