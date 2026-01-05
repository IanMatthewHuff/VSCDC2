import { describe, it, expect, beforeEach } from "vitest";
import { createGame, createSage, initializeNPCDialogs, getDialogHandler } from "../index";

describe("NPC system", () => {
  beforeEach(() => {
    // Initialize dialogs before each test
    initializeNPCDialogs();
  });

  describe("createSage", () => {
    it("creates a Sage NPC with correct properties", () => {
      const sage = createSage({ x: 5, y: 5 });

      expect(sage.name).toBe("Sage");
      expect(sage.type).toBe("sage");
      expect(sage.displayChar).toBe("S");
      expect(sage.color).toBe("blue");
      expect(sage.health).toEqual({ current: 100, max: 100 });
      expect(sage.position).toEqual({ x: 5, y: 5 });
      expect(sage.canBeAttacked).toBe(false);
    });

    it("creates unique IDs for each NPC", () => {
      const sage1 = createSage({ x: 1, y: 1 });
      const sage2 = createSage({ x: 2, y: 2 });

      expect(sage1.id).not.toBe(sage2.id);
    });
  });

  describe("createGame with NPCs", () => {
    it("includes the Sage NPC in the level", () => {
      const game = createGame();
      const npcs = game.getNPCs();
      
      expect(npcs).toHaveLength(1);
      expect(npcs[0].name).toBe("Sage");
      expect(npcs[0].type).toBe("sage");
      expect(npcs[0].position).toEqual({ x: 1, y: 2 });
    });

    it("returns NPC at specific position", () => {
      const game = createGame();
      const npc = game.getNPCAt({ x: 1, y: 2 });
      
      expect(npc).toBeDefined();
      expect(npc?.name).toBe("Sage");
    });

    it("returns undefined when no NPC at position", () => {
      const game = createGame();
      const npc = game.getNPCAt({ x: 4, y: 4 });
      
      expect(npc).toBeUndefined();
    });
  });

  describe("NPC interaction", () => {
    it("triggers interaction when moving onto NPC tile", () => {
      const game = createGame();
      // Player starts at (3,3), Sage is at (1,2)
      // Move to (2,2) first (where target dummy is, attack it)
      game.movePlayer(-1, -1); // attack dummy
      game.movePlayer(-1, -1); // attack dummy
      game.movePlayer(-1, -1); // destroy dummy
      game.movePlayer(-1, -1); // move to (2,2)
      
      // Now move left to interact with Sage at (1,2)
      const result = game.movePlayer(-1, 0);
      
      expect(result.success).toBe(true);
      expect(result.actionType).toBe("interact");
      expect(result.interactTarget).toBeDefined();
      expect(result.interactTarget?.name).toBe("Sage");
    });

    it("does not move player when interacting with NPC", () => {
      const game = createGame();
      // Move to position adjacent to Sage
      game.movePlayer(-1, -1); // attack dummy
      game.movePlayer(-1, -1); // attack dummy
      game.movePlayer(-1, -1); // destroy dummy
      game.movePlayer(-1, -1); // move to (2,2)
      const posBeforeInteraction = game.engine.getPlayerPosition();
      
      // Try to interact with Sage
      game.movePlayer(-1, 0);
      
      // Player should still be at (2,2)
      expect(game.engine.getPlayerPosition()).toEqual(posBeforeInteraction);
    });

    it("cannot attack NPCs with canBeAttacked=false", () => {
      const game = createGame();
      // Move to position adjacent to Sage
      game.movePlayer(-1, -1); // attack dummy
      game.movePlayer(-1, -1); // attack dummy
      game.movePlayer(-1, -1); // destroy dummy
      game.movePlayer(-1, -1); // move to (2,2)
      
      // Try to interact with Sage - should be interact, not attack
      const result = game.movePlayer(-1, 0);
      
      expect(result.actionType).toBe("interact");
      expect(result.actionType).not.toBe("attack");
    });
  });

  describe("Dialog system", () => {
    it("registers dialog handler for Sage", () => {
      initializeNPCDialogs();
      const handler = getDialogHandler("sage");
      
      expect(handler).toBeDefined();
    });

    it("returns dialog tree for Sage", () => {
      initializeNPCDialogs();
      const handler = getDialogHandler("sage");
      const sage = createSage({ x: 1, y: 1 });
      
      const dialogTree = handler?.(sage);
      
      expect(dialogTree).toBeDefined();
      expect(dialogTree?.startNodeId).toBe("greeting");
      expect(dialogTree?.nodes).toBeDefined();
    });

    it("dialog tree has greeting node with options", () => {
      initializeNPCDialogs();
      const handler = getDialogHandler("sage");
      const sage = createSage({ x: 1, y: 1 });
      
      const dialogTree = handler?.(sage);
      const greetingNode = dialogTree?.nodes["greeting"];
      
      expect(greetingNode).toBeDefined();
      // Text can be a string or array of strings
      const textLines = Array.isArray(greetingNode?.text) 
        ? greetingNode.text 
        : [greetingNode?.text];
      expect(textLines.some(line => line?.includes("Greetings"))).toBe(true);
      expect(greetingNode?.options.length).toBeGreaterThan(0);
    });

    it("dialog options can navigate to other nodes", () => {
      initializeNPCDialogs();
      const handler = getDialogHandler("sage");
      const sage = createSage({ x: 1, y: 1 });
      
      const dialogTree = handler?.(sage);
      const greetingNode = dialogTree?.nodes["greeting"];
      const firstOption = greetingNode?.options[0];
      
      expect(firstOption?.nextNodeId).toBeDefined();
      if (firstOption?.nextNodeId) {
        const nextNode = dialogTree?.nodes[firstOption.nextNodeId];
        expect(nextNode).toBeDefined();
      }
    });

    it("dialog options can end the conversation", () => {
      initializeNPCDialogs();
      const handler = getDialogHandler("sage");
      const sage = createSage({ x: 1, y: 1 });
      
      const dialogTree = handler?.(sage);
      const greetingNode = dialogTree?.nodes["greeting"];
      
      // Should have at least one option that ends the dialog
      const exitOption = greetingNode?.options.find(opt => opt.nextNodeId === null);
      expect(exitOption).toBeDefined();
    });
  });
});
