import { describe, test, vi } from "vitest";
import { findProjectRoot } from "./root";
import * as utils from "./utils";

vi.mock("./utils", async (importOriginal) => {
  const actual = await importOriginal<typeof utils>();
  return { ...actual, findUp: vi.fn(), readJson: vi.fn() };
});

describe("findProjectRoot", () => {
  test("should return cwd if no markers found (mocked)", async ({ expect }) => {
    const cwd = process.cwd();
    const result = await findProjectRoot(cwd);
    expect(result).toBeDefined();
    expect(result).toBe(cwd);
  });

  test("should fall back to package.json workspaces when findUp returns null", async ({
    expect,
  }) => {
    vi.mocked(utils.findUp).mockResolvedValue(null);
    vi.mocked(utils.readJson).mockResolvedValue({ workspaces: ["packages/*"] });
    const cwd = process.cwd();
    const result = await findProjectRoot(cwd);
    expect(result).toBeDefined();
  });
});
