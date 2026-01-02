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
      text: "Greetings, adventurer. I am the Sage, keeper of ancient knowledge. What brings you to this dungeon?",
      options: [
        { text: "I seek treasure and glory.", nextNodeId: "treasure" },
        { text: "I'm just exploring.", nextNodeId: "exploring" },
        { text: "Who are you?", nextNodeId: "who" },
        { text: "Farewell.", nextNodeId: null },
      ],
    },
    treasure: {
      id: "treasure",
      text: "Ah, the eternal pursuit of wealth and fame. Be warned, many before you have sought the same, and few have returned.",
      options: [
        { text: "I'm not afraid.", nextNodeId: "not_afraid" },
        { text: "Tell me more about the dangers.", nextNodeId: "dangers" },
        { text: "On second thought, maybe I'll leave.", nextNodeId: null },
      ],
    },
    exploring: {
      id: "exploring",
      text: "A curious mind is a valuable asset. This dungeon holds many secrets for those patient enough to uncover them.",
      options: [
        { text: "What kind of secrets?", nextNodeId: "secrets" },
        { text: "Thank you for the wisdom.", nextNodeId: null },
      ],
    },
    who: {
      id: "who",
      text: "I am one who has studied these halls for longer than you can imagine. I offer guidance to those who seek it.",
      options: [
        { text: "Why do you stay here?", nextNodeId: "stay" },
        { text: "Can you help me?", nextNodeId: "help" },
        { text: "I see. Farewell.", nextNodeId: null },
      ],
    },
    not_afraid: {
      id: "not_afraid",
      text: "Bravery is admirable, but recklessness is folly. Remember that distinction.",
      options: [{ text: "I will. Thank you.", nextNodeId: null }],
    },
    dangers: {
      id: "dangers",
      text: "The creatures here grow stronger as you delve deeper. Some are driven by hunger, others by malice. All are dangerous.",
      options: [
        { text: "How do I defeat them?", nextNodeId: "defeat" },
        { text: "I understand.", nextNodeId: null },
      ],
    },
    secrets: {
      id: "secrets",
      text: "Ancient artifacts, forgotten lore, and pathways to realms beyond. But all require courage to discover.",
      options: [{ text: "Fascinating. Thank you.", nextNodeId: null }],
    },
    stay: {
      id: "stay",
      text: "I have my reasons, as all do. Some are bound by duty, others by choice. Mine is a bit of both.",
      options: [{ text: "I understand.", nextNodeId: null }],
    },
    help: {
      id: "help",
      text: "I offer what I can: knowledge, warnings, and the occasional word of encouragement. Beyond that, your fate is your own.",
      options: [{ text: "That's enough. Thank you.", nextNodeId: null }],
    },
    defeat: {
      id: "defeat",
      text: "Study your foes, learn their patterns, and strike when they're vulnerable. Patience and observation are your greatest weapons.",
      options: [{ text: "Wise words. Thank you.", nextNodeId: null }],
    },
  },
};

/**
 * Dialog handler for the Sage NPC
 */
const sageDialogHandler: DialogHandler = (npc: NPC) => {
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
