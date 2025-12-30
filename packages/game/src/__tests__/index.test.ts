import { describe, it, expect } from "vitest";
import { GAME_VERSION, getEngineVersion } from "../index";

describe("game", () => {
  it("exports GAME_VERSION", () => {
    expect(GAME_VERSION).toBe("0.0.1");
  });

  it("can get engine version", () => {
    expect(getEngineVersion()).toBe("0.0.1");
  });
});
