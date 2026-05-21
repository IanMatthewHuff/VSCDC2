# Roadmap — Candidate Next Features

This document tracks **planned and candidate features** for the VS Code Roguelike project. It is the canonical list of what we're considering building next, with tradeoffs for each option.

**How to use this doc**
- Before starting a new feature, check here first — the idea may already be scoped.
- When a feature is picked up, move it to "In Progress" and link the tracking issue / PR.
- When a feature ships, move it to "Shipped" with the PR number and a one-line summary.
- When new ideas come up, add them to "Candidate Features" with pros/cons so future contributors have context.
- Keep this doc in sync with the `Planned` / `Implementation Status` sections of the package `DESIGN.md` files.

---

## In Progress

_None currently._

---

## Candidate Features

Features below are scoped as **small, self-contained additions** that respect the three-package boundary (engine / game / extension). Each entry lists pros and cons to make the tradeoffs explicit.

### Stairs & Multi-Floor Descent
Add a `>` stair tile placed by the BSP generator; walking onto it regenerates the next floor with increasing difficulty. Track `currentFloor` in the game slice.

**Pros**
- Natural follow-up to the BSP generator — makes it feel like an actual roguelike "crawl"
- Exercises the new generator for real (surfaces bugs in room placement / seeding)
- Small surface: one new tile type, one engine action (`descendFloor`), one extension command
- High perceived gameplay payoff

**Cons**
- Requires a difficulty-scaling decision (enemy count / level per floor)
- Touches all three packages
- Needs explicit handling for cross-floor state (enemies/items should not persist)

---

### Fog of War / Field of View
Only render tiles the player has seen. Currently-visible tiles are bright, previously-seen tiles dim, unseen tiles hidden. Start with radius-based visibility; upgrade to shadowcasting later.

**Pros**
- Classic roguelike feel — big atmosphere win
- Mostly rendering-layer + a new visibility slice; engine API stays clean
- Makes generated dungeons genuinely exciting to explore
- Well-defined scope: one algorithm, one state slice

**Cons**
- Shadowcasting is the "right" algorithm but has edge cases; radius-based is simpler but less satisfying
- Needs decoration work in the extension for dim "remembered" tiles
- Must integrate with entity rendering (hide enemies that aren't visible)

---

### Item Pickups (complete the inventory scaffolding)
Spawn items on the floor in generated dungeons. Walking onto a tile with an item picks it up into the existing inventory. Add a "use" command for consumables — `createHealingPotion` already exists.

**Pros**
- Completes a half-built system — high value per line of code
- Unlocks actual gameplay use of `inventoryTreeProvider` and `ConsumableItem`
- Pure content / wiring work; minimal new architecture
- Shallow touches across all three packages

**Cons**
- Needs a small item-spawn system for generated levels (placement rules)
- Quick Pick UI for "use item" is another small UI surface to design
- May surface gaps in the equipment/inventory model that expand scope

---

### Save / Load (single slot per workspace)
Serialize full Redux state to `ExtensionContext.globalState` (or `workspaceState`). Commands: `vscdc.saveGame`, `vscdc.loadGame`.

**Pros**
- Aligned with the roadmap (`Planned` in `packages/engine/DESIGN.md`)
- Redux state is already plain JSON → serialization is nearly free
- Fully web-compatible (`globalState` works in both desktop and web)
- Self-contained; almost no gameplay changes

**Cons**
- Less visible "fun" payoff than gameplay features
- Must re-register event handlers after load
- Schema versioning matters from day one (even if just a `version` field)

> **Status:** Shipped (see Shipped section). Initial implementation writes
> to a workspace file (`.vscdc-save.json`) rather than `globalState`, so
> users can move/back up saves as they wish.

---

### Merchant NPC (buy items & consumables)
A new NPC class that, instead of a pure dialog tree, opens a shop interface. Player can spend gold/currency to buy consumables (healing potions) and equipment. Reuses the existing NPC + dialog infrastructure with a Quick Pick "shop" mode.

**Pros**
- Builds on existing systems: NPCs, dialog trees, inventory, consumables, equipment
- Gives player a reason to accumulate gold → unlocks a currency/economy loop
- Fits the "content expansion" bucket — mostly game-package work with a small extension UI mode
- Natural fit for procedurally generated floors (a safe merchant room per N floors)

**Cons**
- Requires introducing a currency/gold concept (new player stat, drop tables on enemies)
- Shop UI in Quick Pick needs care — selling, buying, price display, "not enough gold" feedback
- Implies item pickups already work (depends on the **Item Pickups** candidate) — or the merchant becomes the only source of items
- Balance: pricing tiers and gold drops need tuning to feel meaningful

**Dependencies**
- Best shipped *after* **Item Pickups** so the inventory flow is already established

---

### New Enemy Type (e.g., Archer / Ranged)
Pure content expansion: a second active enemy with different stats or a ranged attack (line-of-sight required, N-tile attack range).

**Pros**
- Smallest possible change — mostly data + a new AI behavior branch
- Good exercise of the engine/game boundary (engine stays game-agnostic)
- Immediate tactical variety on existing levels

**Cons**
- Ranged attacks benefit from line-of-sight, which overlaps with the FOV feature
- Without FOV or multi-floor, variety adds only modest depth
- Risk of over-tuning; balance work needed

---

## Shipped

- **Save / Load** — Single-slot save/load to `.vscdc-save.json` in the workspace root. Commands: `vscdc.saveGame`, `vscdc.loadGame`. Schema versioned (`version: 1`); captures full Redux state plus level layout.
- **BSP Dungeon Generator** ([PR #9](https://github.com/IanMatthewHuff/VSCDC2/pull/9)) — Seeded PRNG + BSP procedural level generation, `createDungeonCrawl()` session factory, `vscdc.startDungeonCrawl` command.
- **Player Leveling** ([PR #8](https://github.com/IanMatthewHuff/VSCDC2/pull/8)) — XP from kills/floors, stat points allocation, level-up UI.

---

## Notes

- This roadmap captures **candidates**, not commitments. Picking a feature requires a separate implementation plan.
- Keep entries small. If a candidate grows beyond a single PR, split it.
- Per `DESIGN.md`, we expand gameplay scope only after the foundation is solid — prefer features that deepen the core loop over features that broaden it.
