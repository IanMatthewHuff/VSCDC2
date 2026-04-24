/**
 * Seeded pseudo-random number generator
 *
 * Uses xorshift32 for deterministic, browser-safe random number generation.
 * Given the same seed, the sequence of numbers is always identical.
 */

export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    // Ensure seed is a 32-bit integer and non-zero (xorshift requires non-zero state)
    this.seed = (seed | 0) || 1;
  }

  /**
   * Returns the next random float in [0, 1)
   */
  next(): number {
    this.seed ^= this.seed << 13;
    this.seed ^= this.seed >> 17;
    this.seed ^= this.seed << 5;
    // Convert to unsigned 32-bit integer, then to [0, 1)
    return ((this.seed >>> 0) % 2147483647) / 2147483647;
  }

  /**
   * Returns a random integer in [min, max] (inclusive)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Returns a random float in [min, max)
   */
  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }
}
