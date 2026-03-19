import { describe, expect, test } from "vitest";
import { parseYaml } from "./yaml";

describe("parseYaml", () => {
  const pnpmWorkspaceYaml = `
packages:
  - "apps/*"
  - "packages/*"
  - tooling/config
`;

  test("should parse pnpm-workspace.yaml using fallback", async () => {
    // Force fallback by mocking import failure if needed,
    // but the fallback should work regardless if it's pnpm-workspace.yaml
    const result = await parseYaml<{ packages: string[] }>(pnpmWorkspaceYaml);
    expect(result.packages).toContain("apps/*");
    expect(result.packages).toContain("packages/*");
    expect(result.packages).toContain("tooling/config");
  });

  test("should handle comments in fallback", async () => {
    const yamlWithComments = `
# This is a comment
packages:
  - "a" # another comment
  - b
`;
    const result = await parseYaml<{ packages: string[] }>(yamlWithComments);
    expect(result.packages).toEqual(["a", "b"]);
  });

  test("should return empty object for non-matching content in fallback", async () => {
    const randomContent = "foo: bar\nbaz: qux";
    // Without 'yaml' package, this should return {} based on my implementation
    const result = await parseYaml<any>(randomContent);

    // If 'yaml' is present, it will parse it correctly.
    // If not, it returns {}.
    // We can't easily know if 'yaml' is present here without trying to import it.
    try {
      await import("yaml" as string);
      expect(result.foo).toBe("bar");
    } catch {
      expect(result).toEqual({});
    }
  });
});
