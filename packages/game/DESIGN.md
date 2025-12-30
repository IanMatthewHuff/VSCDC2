# Game Content Package Design

## Overview

The `@vscdc/game` package defines all game-specific content—entities, items, rules, and data. This is the "what" of the game, while the engine provides the "how."

## Responsibilities

- Entity definitions (player classes, enemies, NPCs)
- Item definitions (weapons, armor, consumables)
- Dungeon themes and generation parameters
- Combat rules and damage formulas
- Progression systems (XP, leveling)
- Dialog and quest content

## Design Principles

1. **No UI code** — Game content never imports from extension package
2. **Data-driven where possible** — Prefer declarative definitions over code
3. **Extensible** — Structure should support future content expansion
4. **Validated** — Content should be schema-validated at build time

## Content Categories

### Entities
*TODO: Document entity definition format*

### Items
*TODO: Document item definition format*

### Dungeon Themes
*TODO: Document dungeon generation parameters*

### Combat Rules
*TODO: Document combat system*

### Dialog System
*TODO: Document dialog/conversation format*

## Initial Scope (MVP)

Per DESIGN.md, we're starting minimal:
- Basic player character
- A couple of enemy types
- Simple melee combat
- One NPC with dialog

Expand only after the foundation is solid.
