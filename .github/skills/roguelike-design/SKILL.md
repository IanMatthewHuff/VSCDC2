---
name: roguelike-design
description: Design principles for a tactical, position-focused roguelike with short runs, permadeath, and fair difficulty. Use when implementing combat, enemies, items, levels, or game balance.
---

# Roguelike Design Principles

This skill provides design guidance for implementing game features. These principles should inform decisions about combat mechanics, enemy behavior, item design, level generation, and overall game balance.

---

## Core Philosophy

**This is a tactical puzzle game disguised as a dungeon crawler.** Every death should feel like a learning opportunity, not random bad luck. The player should always have agency.

### Guiding Principles
- **Positioning over stats**: Where you stand matters more than your damage numbers
- **Information enables tactics**: Players need full information to make meaningful decisions
- **Predictable systems, emergent complexity**: Simple rules that combine in interesting ways
- **Respect the player's time**: Short runs, no tedium, every decision matters

---

## Combat Design

### Positioning is the Puzzle
- Design encounters where **optimal positioning is the key to victory**
- Damage numbers are secondary to spatial relationships
- Consider: flanking bonuses, backstab mechanics, zone control, choke points
- The question should be "where do I stand?" not "do I have enough HP?"

### Telegraph Enemy Intentions
- Before an enemy attacks, the player should know **what it will do next turn**
- Show attack patterns visually (highlight threatened tiles)
- Enemies should have clear "tells" before powerful attacks
- No surprise one-shot deaths from off-screen enemies

### Always Provide an Out
- Every combat encounter should have at least one **escape route or defensive option**
- No inescapable death traps
- If the player is surrounded, they should have had warning and opportunity to prevent it
- Consider: knockback abilities, teleport scrolls, smoke bombs, terrain destruction

### Moderate Randomness
- Randomness adds tension but **skilled play should win**
- Avoid pure RNG damage ranges (e.g., 1-100 damage)
- Prefer: small variance (8-12 damage), guaranteed minimums, or deterministic combat
- Critical hits should be telegraphed or player-controlled (positioning, abilities)

---

## Enemy Design

### Distinct Behavioral Roles
- Each enemy type should have a **clear, learnable pattern**
- Avoid generic enemies that just "move toward player and attack"
- Examples of distinct roles:
  - **Archer**: Stays at range, telegraphs shots, vulnerable up close
  - **Charger**: Telegraphs a line attack, commits to direction
  - **Summoner**: Weak but spawns threats, priority target
  - **Tank**: Slow, blocks paths, high HP, low damage

### Predictable but Not Trivial
- Enemy behavior should be **learnable through observation**
- Once a player understands an enemy, they should be able to counter it
- Complexity comes from **combinations of enemies**, not individual unpredictability
- A room with 3 simple enemy types can be harder than one complex enemy

### Fair Spawning
- Never spawn enemies adjacent to the player without warning
- New enemies entering a fight should come from **visible entry points**
- Reinforcement waves should be telegraphed (doors rumbling, horns sounding)
- The player should never feel ambushed by the spawn system

---

## Item and Equipment Design

### Clear Effects, No Identification Mystery
- **All items should have clear, known effects** when acquired
- Tactical decisions require information; mystery undermines tactics
- No "unidentified potion" gambling
- Item descriptions should be concise but complete

### Tactical Trade-offs
- Equipment should present **meaningful choices, not strict upgrades**
- Examples:
  - Sword A: High damage, slow attack
  - Sword B: Low damage, hits twice, causes bleed
  - Sword C: Medium damage, knockback effect
- "Which is best?" should depend on the situation, not item level

### Limited but Meaningful Inventory
- Inventory constraints force **interesting decisions**
- Every slot should matter; no "junk" items
- Consumables should be powerful enough to feel worth using
- Hoarding should be discouraged by encounter design (use it or lose it)

---

## Level and Encounter Design

### Tactical Arenas
- Combat should happen in **contained, designed spaces**
- Small rooms with meaningful terrain: pillars, pits, doors, water
- Terrain should create tactical options (cover, choke points, elevation)
- Avoid large empty rooms where positioning doesn't matter

### Spatial Constraints Create Puzzles
- The "puzzle" emerges from **space + enemies + player abilities**
- A room's layout should make you think before acting
- Consider: limited exits, hazardous terrain, destructible cover
- Movement should feel as important as attacking

### Encounter Pacing
- Not every room needs combat
- Alternate tension and relief: fight, explore, find loot, fight harder
- Boss encounters should be **positioning puzzles with phases**
- Rest points should be earned, not random

---

## Progression and Pacing

### Short Run Design (15-30 minutes)
- A complete run should fit in a short play session
- No filler; every floor should introduce something new or escalate
- Death should feel like "I'll try again" not "I lost hours of progress"
- Consider: 5-7 floors, each with 4-6 rooms

### Meaningful Build Choices
- Character progression should involve **real trade-offs**
- "Do I want more damage or more mobility?"
- Avoid mandatory upgrades; prefer lateral options
- The player's build should change how they approach encounters

### Light Story, Strong Context
- Minimal narrative, but enough to give meaning to the journey
- Why is the player in this dungeon? What's at the bottom?
- Story beats can reward progress without interrupting flow
- Environmental storytelling over cutscenes

---

## Fairness Principles

### No Unavoidable Deaths
- If the player dies, they should understand **what they could have done differently**
- Every death should be a lesson, not a dice roll
- "I should have retreated" or "I should have used that potion" = good death
- "The RNG screwed me" or "I couldn't see that coming" = bad death

### Information Availability
- The player should have access to all information needed for decisions
- Show: enemy HP, attack patterns, threatened tiles, status effects
- Hide nothing that affects tactical choices
- UI should surface danger clearly (low HP warnings, incoming damage preview)

### Consistent Rules
- Game systems should behave **predictably and consistently**
- If fire hurts enemies, it should hurt the player too
- No "gotcha" exceptions that punish exploration
- Teach rules through gameplay, then test mastery

---

## Anti-Patterns to Avoid

These patterns conflict with the design philosophy:

- ❌ **Damage sponge enemies** — HP pools that just take time to whittle down
- ❌ **Instant death traps** — without warning or counterplay
- ❌ **Mandatory grinding** — progress should come from skill, not repetition
- ❌ **Hidden information** — that affects tactical decisions
- ❌ **Runaway difficulty** — where falling behind means certain death
- ❌ **Luck-based progression** — where bad RNG blocks advancement
- ❌ **Tedious backtracking** — respect the player's time
- ❌ **Generic enemies** — every enemy type should feel distinct
