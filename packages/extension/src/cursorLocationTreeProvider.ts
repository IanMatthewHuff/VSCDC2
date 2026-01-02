/**
 * Tree data provider for displaying information about the current cursor location
 */

import * as vscode from "vscode";
import { Position } from "@vscdc/engine";
import { Enemy, Tile } from "@vscdc/game";

/**
 * Information about the current location
 */
export interface LocationInfo {
  position: Position;
  tile: Tile;
  entities: Enemy[];
}

/**
 * Tree item representing cursor location information
 */
export class LocationInfoItem extends vscode.TreeItem {
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
 * Provides tree data for the cursor location view
 */
export class CursorLocationTreeProvider implements vscode.TreeDataProvider<LocationInfoItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<LocationInfoItem | undefined | null | void> =
    new vscode.EventEmitter<LocationInfoItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<LocationInfoItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  private locationInfo: LocationInfo | null = null;

  /**
   * Updates the location information and refreshes the tree view
   */
  setLocationInfo(info: LocationInfo | null): void {
    this.locationInfo = info;
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: LocationInfoItem): vscode.TreeItem {
    return element;
  }

  /**
   * Get tree children for the given element.
   * Returns root-level items (position, terrain, entities) when element is undefined.
   * Returns empty array for child elements (all items are leaf nodes).
   */
  getChildren(element?: LocationInfoItem): Thenable<LocationInfoItem[]> {
    if (!this.locationInfo) {
      return Promise.resolve([]);
    }

    if (!element) {
      // Root level: show position, tile, and entities
      const items: LocationInfoItem[] = [];

      // Position
      items.push(
        new LocationInfoItem(
          "Position",
          `(${this.locationInfo.position.x}, ${this.locationInfo.position.y})`,
          vscode.TreeItemCollapsibleState.None,
          new vscode.ThemeIcon("location")
        )
      );

      // Tile type
      items.push(
        new LocationInfoItem(
          "Terrain",
          this.locationInfo.tile.type,
          vscode.TreeItemCollapsibleState.None,
          new vscode.ThemeIcon("symbol-field")
        )
      );

      // Entities at this location
      if (this.locationInfo.entities.length > 0) {
        const entityNames = this.locationInfo.entities.map((e) => e.name).join(", ");
        items.push(
          new LocationInfoItem(
            "Entities",
            entityNames,
            vscode.TreeItemCollapsibleState.None,
            new vscode.ThemeIcon("symbol-misc")
          )
        );
      } else {
        items.push(
          new LocationInfoItem(
            "Entities",
            "None",
            vscode.TreeItemCollapsibleState.None,
            new vscode.ThemeIcon("circle-slash")
          )
        );
      }

      return Promise.resolve(items);
    }

    return Promise.resolve([]);
  }

  dispose(): void {
    this._onDidChangeTreeData.dispose();
  }
}
