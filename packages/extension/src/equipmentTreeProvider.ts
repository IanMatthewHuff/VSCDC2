/**
 * Tree data provider for displaying player equipment in a tree view
 */

import * as vscode from "vscode";
import { PlayerEquipment } from "@vscdc/game";

/**
 * Tree item representing an equipment slot or item
 */
export class EquipmentItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly value: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None,
    icon?: vscode.ThemeIcon,
    public readonly contextValue?: string
  ) {
    super(label, collapsibleState);
    this.description = value;
    if (icon) {
      this.iconPath = icon;
    }
  }
}

/**
 * Provides tree data for the equipment view
 */
export class EquipmentTreeProvider implements vscode.TreeDataProvider<EquipmentItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<EquipmentItem | undefined | null | void> =
    new vscode.EventEmitter<EquipmentItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<EquipmentItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  private equipment: PlayerEquipment | null = null;

  /**
   * Updates the equipment and refreshes the tree view
   */
  setEquipment(equipment: PlayerEquipment | null): void {
    this.equipment = equipment;
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: EquipmentItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: EquipmentItem): Thenable<EquipmentItem[]> {
    if (!this.equipment) {
      return Promise.resolve([]);
    }

    if (!element) {
      // Root level: show equipment slots and consumable slots
      const items: EquipmentItem[] = [];

      // Head slot
      const headValue = this.equipment.head?.name || "Empty";
      items.push(
        new EquipmentItem(
          "Head",
          headValue,
          vscode.TreeItemCollapsibleState.None,
          new vscode.ThemeIcon("copilot"),
          "equipmentSlot"
        )
      );

      // Armor slot
      const armorValue = this.equipment.armor?.name || "Empty";
      items.push(
        new EquipmentItem(
          "Armor",
          armorValue,
          vscode.TreeItemCollapsibleState.None,
          new vscode.ThemeIcon("shield"),
          "equipmentSlot"
        )
      );

      // Left Arm slot (shield)
      const leftArmValue = this.equipment.leftArm?.name || "Empty";
      items.push(
        new EquipmentItem(
          "Left Arm",
          leftArmValue,
          vscode.TreeItemCollapsibleState.None,
          new vscode.ThemeIcon("shield"),
          "equipmentSlot"
        )
      );

      // Right Arm slot (weapon)
      const rightArmValue = this.equipment.rightArm?.name || "Empty";
      items.push(
        new EquipmentItem(
          "Right Arm",
          rightArmValue,
          vscode.TreeItemCollapsibleState.None,
          new vscode.ThemeIcon("sword"),
          "equipmentSlot"
        )
      );

      // Consumable slots (3 slots)
      for (let i = 0; i < 3; i++) {
        const consumable = this.equipment.consumables[i];
        const slotLabel = `Slot ${i + 1}`;
        const slotValue = consumable?.name || "Empty";
        const contextValue = consumable ? `consumableSlot${i}` : undefined;
        
        items.push(
          new EquipmentItem(
            slotLabel,
            slotValue,
            vscode.TreeItemCollapsibleState.None,
            new vscode.ThemeIcon("beaker"),
            contextValue
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
