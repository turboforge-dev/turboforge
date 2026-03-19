/**
 * Minimal YAML parser with fallback.
 * Uses `yaml` package if available, else falls back to regex-based parsing
 * for common monorepo config patterns (like pnpm-workspace.yaml).
 */
export async function parseYaml<T>(content: string): Promise<T> {
  try {
    const yaml = await import("yaml" as string)
      .then((m) => m.default || m)
      .catch(() => null);
    if (yaml && typeof yaml.parse === "function") {
      return yaml.parse(content) as T;
    }
  } catch {
    // Proceed to fallback if import or parse fails in a way we can handle
  }

  // Robust fallback for simple `packages:` lists (pnpm-workspace.yaml)
  const result: Record<string, unknown> = {};

  // Remove comments
  const cleanContent = content.replace(/#.*$/gm, "");

  // Check for 'packages:' list
  const packagesMatch = cleanContent.match(/packages:\s*\n((?:\s*-\s*.*\n?)*)/);
  if (packagesMatch?.[1]) {
    const items: string[] = [];
    const itemRegex = /^\s*-\s*["']?([^"'\s]+)["']?/gm;
    let match: RegExpExecArray | null;
    // biome-ignore lint/suspicious/noAssignInExpressions: standard regex iteration
    while ((match = itemRegex.exec(packagesMatch[1])) !== null) {
      items.push(match[1]);
    }
    result["packages"] = items;
  }

  return result as T;
}
