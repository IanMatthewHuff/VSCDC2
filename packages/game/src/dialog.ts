/**
 * Dialog system for NPC interactions
 */

import { NPC } from "@vscdc/engine";

/**
 * A single option in a dialog choice
 */
export interface DialogOption {
  /** Display text for the option */
  text: string;
  /** ID of the next dialog node to show, or null to end the dialog */
  nextNodeId: string | null;
}

/**
 * A single node in a dialog tree
 */
export interface DialogNode {
  /** Unique ID for this dialog node */
  id: string;
  /** The text the NPC says */
  text: string;
  /** Available response options for the player */
  options: DialogOption[];
}

/**
 * A complete dialog tree for an NPC
 */
export interface DialogTree {
  /** Starting node ID */
  startNodeId: string;
  /** All nodes in the dialog tree */
  nodes: Record<string, DialogNode>;
}

/**
 * Handler function for NPC interactions
 * Returns the dialog tree to display, or null if no interaction
 */
export type DialogHandler = (npc: NPC) => DialogTree | null;

/**
 * Registry of dialog handlers by NPC type
 */
const dialogHandlers = new Map<string, DialogHandler>();

/**
 * Register a dialog handler for an NPC type
 */
export function registerDialogHandler(npcType: string, handler: DialogHandler): void {
  dialogHandlers.set(npcType, handler);
}

/**
 * Get the dialog handler for an NPC type
 */
export function getDialogHandler(npcType: string): DialogHandler | undefined {
  return dialogHandlers.get(npcType);
}

/**
 * Clear all registered dialog handlers (useful for tests)
 */
export function clearDialogHandlers(): void {
  dialogHandlers.clear();
}
