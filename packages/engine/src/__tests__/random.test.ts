import { describe, it, expect } from "vitest";
import { SeededRandom } from "../random";

describe("SeededRandom", () => {
  describe("determinism", () => {
    it("produces the same sequence with the same seed", () => {
      const rng1 = new SeededRandom(42);
      const rng2 = new SeededRandom(42);

      const seq1 = Array.from({ length: 20 }, () => rng1.next());
      const seq2 = Array.from({ length: 20 }, () => rng2.next());

      expect(seq1).toEqual(seq2);
    });

    it("produces different sequences with different seeds", () => {
      const rng1 = new SeededRandom(42);
      const rng2 = new SeededRandom(99);

      const seq1 = Array.from({ length: 10 }, () => rng1.next());
      const seq2 = Array.from({ length: 10 }, () => rng2.next());

      expect(seq1).not.toEqual(seq2);
    });
  });

  describe("next()", () => {
    it("returns values in [0, 1)", () => {
      const rng = new SeededRandom(12345);
      for (let i = 0; i < 1000; i++) {
        const value = rng.next();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });
  });

  describe("nextInt()", () => {
    it("returns integers within [min, max]", () => {
      const rng = new SeededRandom(42);
      for (let i = 0; i < 1000; i++) {
        const value = rng.nextInt(3, 7);
        expect(value).toBeGreaterThanOrEqual(3);
        expect(value).toBeLessThanOrEqual(7);
        expect(Number.isInteger(value)).toBe(true);
      }
    });

    it("can return both min and max values", () => {
      const rng = new SeededRandom(42);
      const values = new Set<number>();
      for (let i = 0; i < 1000; i++) {
        values.add(rng.nextInt(0, 2));
      }
      expect(values.has(0)).toBe(true);
      expect(values.has(1)).toBe(true);
      expect(values.has(2)).toBe(true);
    });
  });

  describe("nextFloat()", () => {
    it("returns floats within [min, max)", () => {
      const rng = new SeededRandom(42);
      for (let i = 0; i < 1000; i++) {
        const value = rng.nextFloat(2.0, 5.0);
        expect(value).toBeGreaterThanOrEqual(2.0);
        expect(value).toBeLessThan(5.0);
      }
    });
  });

  describe("edge cases", () => {
    it("handles seed of 0 (converts to non-zero)", () => {
      const rng = new SeededRandom(0);
      const value = rng.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    });
  });
});
