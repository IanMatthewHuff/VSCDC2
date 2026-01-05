/**
 * NPC definitions for the game
 */

import { NPC, Position } from "@vscdc/engine";
import { DialogTree, DialogHandler, registerDialogHandler } from "./dialog";

let npcIdCounter = 0;

/**
 * Creates a unique NPC ID
 */
function generateNPCId(prefix: string): string {
  return `${prefix}_${++npcIdCounter}`;
}

/**
 * Dialog tree for the Sage NPC
 */
const sageDialogTree: DialogTree = {
  startNodeId: "greeting",
  nodes: {
    greeting: {
      id: "greeting",
      text: [
        "Greetings, adventurer.",
        "I am the Sage, keeper of ancient knowledge.",
        "What brings you to this dungeon?",
      ],
      options: [
        { text: "I seek treasure and glory.", nextNodeId: "treasure" },
        { text: "I'm just exploring.", nextNodeId: "exploring" },
        { text: "Who are you?", nextNodeId: "who" },
        { text: "Farewell.", nextNodeId: null },
      ],
    },
    treasure: {
      id: "treasure",
      text: [
        "Ah, the eternal pursuit of wealth and fame.",
        "Be warned, many have sought the same.",
        "Few have returned.",
      ],
      options: [
        { text: "I'm not afraid.", nextNodeId: "not_afraid" },
        { text: "Tell me about the dangers.", nextNodeId: "dangers" },
        { text: "Maybe I'll leave.", nextNodeId: null },
      ],
    },
    exploring: {
      id: "exploring",
      text: [
        "A curious mind is a valuable asset.",
        "This dungeon holds many secrets.",
        "Patience is required to uncover them.",
      ],
      options: [
        { text: "What kind of secrets?", nextNodeId: "secrets" },
        { text: "Thank you for the wisdom.", nextNodeId: null },
      ],
    },
    who: {
      id: "who",
      text: [
        "I have studied these halls for ages.",
        "I offer guidance to those who seek it.",
      ],
      options: [
        { text: "Why do you stay here?", nextNodeId: "stay" },
        { text: "Can you help me?", nextNodeId: "help" },
        { text: "I see. Farewell.", nextNodeId: null },
      ],
    },
    not_afraid: {
      id: "not_afraid",
      text: [
        "Bravery is admirable.",
        "But recklessness is folly.",
        "Remember that distinction.",
      ],
      options: [{ text: "I will. Thank you.", nextNodeId: null }],
    },
    dangers: {
      id: "dangers",
      text: [
        "The creatures grow stronger as you delve deeper.",
        "Some are driven by hunger, others by malice.",
        "All are dangerous.",
      ],
      options: [
        { text: "How do I defeat them?", nextNodeId: "defeat" },
        { text: "I understand.", nextNodeId: null },
      ],
    },
    secrets: {
      id: "secrets",
      text: [
        "Ancient artifacts. Forgotten lore.",
        "Pathways to realms beyond.",
        "All require courage to discover.",
      ],
      options: [{ text: "Fascinating. Thank you.", nextNodeId: null }],
    },
    stay: {
      id: "stay",
      text: [
        "I have my reasons, as all do.",
        "Some are bound by duty, others by choice.",
        "Mine is a bit of both.",
      ],
      options: [{ text: "I understand.", nextNodeId: null }],
    },
    help: {
      id: "help",
      text: [
        "I offer knowledge, warnings, and encouragement.",
        "Beyond that, your fate is your own.",
      ],
      options: [{ text: "That's enough. Thank you.", nextNodeId: null }],
    },
    defeat: {
      id: "defeat",
      text: [
        "Study your foes. Learn their patterns.",
        "Strike when they're vulnerable.",
        "Patience is your greatest weapon.",
      ],
      options: [{ text: "Wise words. Thank you.", nextNodeId: null }],
    },
  },
};

/**
 * Dialog handler for the Sage NPC
 * Currently returns the same dialog tree regardless of NPC state
 * Future enhancement: Could customize dialog based on NPC health, player progress, etc.
 */
const sageDialogHandler: DialogHandler = (_npc: NPC) => {
  return sageDialogTree;
};

/**
 * Creates a Sage NPC at the specified position
 * The Sage is a wise NPC who provides guidance to the player
 * 
 * @param position The position to place the Sage
 * @returns A new Sage NPC entity
 */
export function createSage(position: Position): NPC {
  return {
    id: generateNPCId("sage"),
    name: "Sage",
    type: "sage",
    position: { ...position },
    displayChar: "S",
    color: "blue",
    health: { current: 100, max: 100 },
    canBeAttacked: false,
  };
}

/**
 * Initialize NPC dialog handlers
 * This should be called at game initialization
 */
export function initializeNPCDialogs(): void {
  registerDialogHandler("sage", sageDialogHandler);
}

/**
 * Reset the NPC ID counter (for tests)
 */
export function resetNPCIdCounter(): void {
  npcIdCounter = 0;
}
