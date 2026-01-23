import { describe, test } from "vitest";
import { deepMerge } from "./utils";

describe("utils", () => {
  test("deepMerge", ({ expect }) => {
    const a = { a: 1, b: { c: 2 }, e: [1, 2, 3] };
    const b = { a: 2, b: { d: 3 }, e: [4, 5, 6] };
    const expected = { a: 2, b: { c: 2, d: 3 }, e: [4, 5, 6] };
    expect(deepMerge(a, b)).toEqual(expected);
  });
});
