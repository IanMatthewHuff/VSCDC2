/**
 * Environment definitions and effect handlers
 */

import { Environment, Position } from "@vscdc/engine";

/**
 * Environment types available in the game
 */
export enum EnvironmentType {
  Lava = "lava",
}

/**
 * Effect that can be applied when a character interacts with an environment
 */
export interface EnvironmentEffect {
  /** Damage dealt to the character (if any) */
  damage?: number;
  /** Whether the effect triggers when entering the environment */
  triggersOnEntry: boolean;
}

/**
 * Registry of environment types and their effects
 */
const environmentEffects = new Map<string, EnvironmentEffect>();

/**
 * Register an environment effect handler
 */
export function registerEnvironmentEffect(
  environmentType: string,
  effect: EnvironmentEffect
): void {
  environmentEffects.set(environmentType, effect);
}

/**
 * Get the effect for a specific environment type
 */
export function getEnvironmentEffect(environmentType: string): EnvironmentEffect | undefined {
  return environmentEffects.get(environmentType);
}

/**
 * Counter for generating unique environment IDs
 */
let environmentIdCounter = 0;

/**
 * Creates a lava environment at the specified position
 * Lava deals 1 damage to any character that enters it
 */
export function createLavaEnvironment(position: Position): Environment {
  return {
    id: `lava_${environmentIdCounter++}`,
    type: EnvironmentType.Lava,
    position,
    displayChar: "~",
    color: "orange",
  };
}

/**
 * Initialize environment effects registry
 * Call this during game initialization
 */
export function initializeEnvironmentEffects(): void {
  // Register lava environment effect
  registerEnvironmentEffect(EnvironmentType.Lava, {
    damage: 1,
    triggersOnEntry: true,
  });
}
