import { describe, it, expect } from "vitest";
import { ENGINE_VERSION } from "../index";

describe("engine", () => {
  it("exports ENGINE_VERSION", () => {
    expect(ENGINE_VERSION).toBe("0.0.1");
  });
});
