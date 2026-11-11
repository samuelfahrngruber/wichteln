import { describe, expect, it } from "vite-plus/test";
import { draw, encodeGame, decodeGame } from "./game.js";

const names = ["Anna", "Ben", "Clara", "David"];
const game = { version: 1, names, exclusions: [[0, 1]], seed: 123, assignments: [2, 3, 0, 1] };

describe("draw", () => {
  it("gives every person exactly one recipient, respecting directed exclusions", () => {
    for (let seed = 0; seed < 100; seed++) {
      const assignments = draw(
        names,
        [
          [0, 1],
          [2, 3],
        ],
        seed,
      );
      expect(new Set(assignments).size).toBe(names.length);
      assignments.forEach((recipient, giver) => expect(recipient).not.toBe(giver));
      expect(assignments[0]).not.toBe(1);
      expect(assignments[2]).not.toBe(3);
      expect(
        draw(
          names,
          [
            [0, 1],
            [2, 3],
          ],
          seed,
        ),
      ).toEqual(assignments);
    }
  });
  it("does not silently add a reverse exclusion", () => {
    expect(draw(["A", "B", "C"], [[0, 1]], 1)).toEqual([2, 0, 1]);
  });
  it("handles two people and rejects an impossible game", () => {
    expect(draw(["A", "B"], [], 0)).toEqual([1, 0]);
    expect(() => draw(["A", "B"], [[0, 1]], 0)).toThrow("impossible");
    expect(() =>
      draw(
        names,
        [
          [0, 2],
          [0, 3],
          [1, 2],
          [1, 3],
          [2, 3],
        ],
        0,
      ),
    ).toThrow("impossible");
  });
  it("can reassign earlier matches to find a solution", () => {
    const exclusions = [
      [0, 2],
      [0, 3],
      [1, 3],
      [2, 0],
      [2, 1],
      [3, 1],
      [3, 2],
    ];
    for (let seed = 0; seed < 30; seed++) {
      expect(draw(names, exclusions, seed)).toEqual([1, 2, 3, 0]);
    }
  });
});

describe("game URLs", () => {
  it("round trips Unicode names and all game state", () => {
    const unicode = { ...game, names: ["Änne 🎁", "李", "<script>", "Zoë"] };
    const encoded = encodeGame(unicode);
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodeGame(encoded)).toEqual(unicode);
  });
  it("preserves saved assignments instead of drawing again", () => {
    expect(decodeGame(encodeGame(game)).assignments).toEqual([2, 3, 0, 1]);
    expect(decodeGame(encodeGame({ ...game, seed: 999 })).assignments).toEqual(game.assignments);
  });
  it("keeps version 1 links compatible", () => {
    const saved =
      "eyJ2ZXJzaW9uIjoxLCJuYW1lcyI6WyJBIiwiQiJdLCJleGNsdXNpb25zIjpbXSwic2VlZCI6MCwiYXNzaWdubWVudHMiOlsxLDBdfQ";
    expect(decodeGame(saved)).toEqual({
      version: 1,
      names: ["A", "B"],
      exclusions: [],
      seed: 0,
      assignments: [1, 0],
    });
  });
  it("rejects damaged links and invalid game data", () => {
    for (const value of ["", "!", "bnVsbA", "e30"])
      expect(() => decodeGame(value)).toThrow("invalid");
    for (const change of [
      { version: 2 },
      { seed: -1 },
      { names: ["A", "A"] },
      { exclusions: [[0, 9]] },
      { assignments: [0, 1, 2, 3] },
      { assignments: [1, 2, 3, 0] },
      { assignments: [2, 2, 0, 1] },
    ])
      expect(() => encodeGame({ ...game, ...change })).toThrow("invalid");
  });
});
