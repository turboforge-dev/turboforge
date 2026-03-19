import { describe, test } from "vitest";
import { findProjectRoot } from "./root";

describe("findProjectRoot", () => {
  test("should return cwd if no markers found (mocked)", async ({ expect }) => {
    const cwd = process.cwd();
    const result = await findProjectRoot(cwd);
    expect(result).toBeDefined();
    expect(result).toBe(cwd);
  });
});
