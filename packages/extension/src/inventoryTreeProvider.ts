/**
 * Tree data provider for displaying player inventory in a tree view
 * Items are grouped by type (Equipment, Consumables)
 */

import * as vscode from "vscode";
import { EquipmentItem as EngineEquipmentItem, ConsumableItem, ItemTypeEnum } from "@vscdc/game";

/**
 * Tree item representing an inventory category or item
 */
export class InventoryItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly itemData?: EngineEquipmentItem | ConsumableItem,
    icon?: vscode.ThemeIcon,
    public readonly contextValue?: string
  ) {
    super(label, collapsibleState);
    if (icon) {
      this.iconPath = icon;
    }
    if (itemData) {
      this.description = itemData.description;
    }
  }
}

/**
 * Provides tree data for the inventory view
 */
export class InventoryTreeProvider implements vscode.TreeDataProvider<InventoryItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<InventoryItem | undefined | null | void> =
    new vscode.EventEmitter<InventoryItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<InventoryItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  private inventory: (EngineEquipmentItem | ConsumableItem)[] = [];
  private capacity: number = 20;

  /**
   * Updates the inventory and refreshes the tree view
   */
  setInventory(inventory: (EngineEquipmentItem | ConsumableItem)[], capacity: number): void {
    this.inventory = inventory;
    this.capacity = capacity;
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: InventoryItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: InventoryItem): Thenable<InventoryItem[]> {
    if (!element) {
      // Root level: show category headers
      const items: InventoryItem[] = [];

      // Equipment category
      const equipmentItems = this.inventory.filter(
        (item) => item.type === ItemTypeEnum.Equipment
      );
      items.push(
        new InventoryItem(
          `Equipment (${equipmentItems.length})`,
          vscode.TreeItemCollapsibleState.Expanded,
          undefined,
          new vscode.ThemeIcon("package"),
          "inventoryCategory"
        )
      );

      // Consumables category
      const consumableItems = this.inventory.filter(
        (item) => item.type === ItemTypeEnum.Consumable
      );
      items.push(
        new InventoryItem(
          `Consumables (${consumableItems.length})`,
          vscode.TreeItemCollapsibleState.Expanded,
          undefined,
          new vscode.ThemeIcon("beaker"),
          "inventoryCategory"
        )
      );

      // Capacity indicator
      items.push(
        new InventoryItem(
          `Capacity: ${this.inventory.length}/${this.capacity}`,
          vscode.TreeItemCollapsibleState.None,
          undefined,
          new vscode.ThemeIcon("archive"),
          "inventoryCapacity"
        )
      );

      return Promise.resolve(items);
    }

    // Child level: show items in the selected category
    if (element.label?.toString().startsWith("Equipment")) {
      const equipmentItems = this.inventory.filter(
        (item) => item.type === ItemTypeEnum.Equipment
      ) as EngineEquipmentItem[];

      return Promise.resolve(
        equipmentItems.map((item) => {
          const slotLabel = this.getSlotDisplayName(item.slot);
          const stats = this.getEquipmentStats(item);
          const inventoryItem = new InventoryItem(
            item.name,
            vscode.TreeItemCollapsibleState.None,
            item,
            new vscode.ThemeIcon(this.getSlotIcon(item.slot)),
            `inventoryEquipment_${item.slot}`
          );
          inventoryItem.description = `${slotLabel}${stats ? ` • ${stats}` : ""}`;
          return inventoryItem;
        })
      );
    }

    if (element.label?.toString().startsWith("Consumables")) {
      const consumableItems = this.inventory.filter(
        (item) => item.type === ItemTypeEnum.Consumable
      ) as ConsumableItem[];

      return Promise.resolve(
        consumableItems.map((item) => {
          const effectLabel = this.getEffectLabel(item);
          const inventoryItem = new InventoryItem(
            item.name,
            vscode.TreeItemCollapsibleState.None,
            item,
            new vscode.ThemeIcon("beaker"),
            "inventoryConsumable"
          );
          inventoryItem.description = effectLabel;
          return inventoryItem;
        })
      );
    }

    return Promise.resolve([]);
  }

  /**
   * Get display name for an equipment slot
   */
  private getSlotDisplayName(slot: string): string {
    switch (slot) {
      case "armor":
        return "Armor";
      case "head":
        return "Head";
      case "leftArm":
        return "Left Arm";
      case "rightArm":
        return "Right Arm";
      default:
        return slot;
    }
  }

  /**
   * Get icon for an equipment slot
   */
  private getSlotIcon(slot: string): string {
    switch (slot) {
      case "armor":
        return "shield";
      case "head":
        return "copilot";
      case "leftArm":
        return "shield";
      case "rightArm":
        return "sword";
      default:
        return "package";
    }
  }

  /**
   * Get stats string for equipment item
   */
  private getEquipmentStats(item: EngineEquipmentItem): string {
    const stats: string[] = [];
    if (item.attack) {
      stats.push(`+${item.attack} ATK`);
    }
    if (item.defense) {
      stats.push(`+${item.defense} DEF`);
    }
    return stats.join(", ");
  }

  /**
   * Get effect label for consumable item
   */
  private getEffectLabel(item: ConsumableItem): string {
    if (item.effect.type === "heal" && item.effect.amount) {
      return `Heals ${item.effect.amount} HP`;
    }
    return item.effect.type;
  }

  dispose(): void {
    this._onDidChangeTreeData.dispose();
  }
}
