/** biome-ignore-all lint/suspicious/noExplicitAny: unit tests ok */
import { access, readFile, rename, rm, writeFile } from "node:fs/promises";
import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  atomicWrite,
  createLimiter,
  deepMerge,
  existsAsync,
  findUp,
  readJson,
  safeRename,
  tryImport,
} from "./utils";

vi.mock("node:fs/promises", () => ({
  access: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockResolvedValue(""),
  writeFile: vi.fn().mockResolvedValue(undefined),
  rename: vi.fn().mockResolvedValue(undefined),
  rm: vi.fn().mockResolvedValue(undefined),
}));

describe("utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("deepMerge", () => {
    test("should merge objects deeply", () => {
      const a = { a: 1, b: { c: 2 }, e: [1, 2, 3] };
      const b = { a: 2, b: { d: 3 }, e: [4, 5, 6] };
      const expected = { a: 2, b: { c: 2, d: 3 }, e: [4, 5, 6] };
      expect(deepMerge(a, b)).toEqual(expected);
    });

    test("should handle null and primitives", () => {
      expect(deepMerge(null, { a: 1 })).toEqual({ a: 1 });
      expect(deepMerge({ a: 1 }, null)).toEqual(null);
      expect(deepMerge(1, { a: 1 })).toEqual({ a: 1 });
    });

    test("should prevent prototype pollution", () => {
      const target = {};
      const source = JSON.parse('{"__proto__": {"polluted": true}}');
      deepMerge(target, source);
      expect((target as Record<string, any>)["polluted"]).toBeUndefined();
    });
  });

  describe("existsAsync", () => {
    test("should return true if file exists", async () => {
      vi.mocked(access).mockResolvedValue(undefined);
      expect(await existsAsync("test")).toBe(true);
    });

    test("should return false if file does not exist", async () => {
      const err = new Error("Not found");
      (err as any).code = "ENOENT";
      vi.mocked(access).mockRejectedValue(err);
      expect(await existsAsync("test")).toBe(false);
    });

    test("should throw other errors", async () => {
      vi.mocked(access).mockRejectedValue(new Error("PERM"));
      await expect(existsAsync("test")).rejects.toThrow("PERM");
    });
  });

  describe("readJson", () => {
    test("should read and parse JSON", async () => {
      vi.mocked(readFile).mockResolvedValue('{"a": 1}');
      expect(await readJson("test.json")).toEqual({ a: 1 });
    });

    test("should return null if file not found", async () => {
      const err = new Error("Not found");
      (err as any).code = "ENOENT";
      vi.mocked(readFile).mockRejectedValue(err);
      expect(await readJson("test.json")).toBeNull();
    });

    test("should return null if parsing fails in non-strict mode", async () => {
      vi.mocked(readFile).mockResolvedValue("invalid json");
      expect(await readJson("test.json")).toBeNull();
    });

    test("should throw in strict mode if parsing fails", async () => {
      vi.mocked(readFile).mockResolvedValue("invalid json");
      await expect(readJson("test.json", { strict: true })).rejects.toThrow();
    });
  });

  describe("createLimiter", () => {
    test("should limit concurrency", async () => {
      const limiter = createLimiter(2);
      let count = 0;
      let maxCount = 0;

      const task = async () => {
        count++;
        maxCount = Math.max(maxCount, count);
        await new Promise((r) => setTimeout(r, 10));
        count--;
      };

      await Promise.all([task, task, task, task].map((t) => limiter(t)));
      expect(maxCount).toBe(2);
    });

    test("should throw if concurrency < 1", () => {
      expect(() => createLimiter(0)).toThrow("concurrency must be >= 1");
    });
  });

  describe("atomicWrite", () => {
    test("should write to a temp file first", async () => {
      vi.mocked(writeFile).mockResolvedValue(undefined);
      vi.mocked(rename).mockResolvedValue(undefined);
      vi.mocked(access).mockResolvedValue(undefined);

      await atomicWrite("test.json", '{"a": 1}');
      expect(writeFile).toHaveBeenCalledWith(
        expect.stringContaining(".tmp"),
        '{"a": 1}',
        "utf-8",
      );
      expect(rename).toHaveBeenCalled();
    });

    test("should cleanup on failure", async () => {
      vi.mocked(writeFile).mockRejectedValue(new Error("Disk Full"));
      vi.mocked(rm).mockResolvedValue(undefined);
      await expect(atomicWrite("test.json", "data")).rejects.toThrow(
        "Disk Full",
      );
      expect(rm).toHaveBeenCalled();
    });
  });

  describe("safeRename", () => {
    test("should throw other errors than EEXIST/EPERM", async () => {
      vi.mocked(access).mockResolvedValue(undefined);
      vi.mocked(rename).mockRejectedValue(new Error("CRASH"));
      await expect(safeRename("a", "b")).rejects.toThrow("CRASH");
    });

    test("should retry rename on EEXIST", async () => {
      vi.mocked(access).mockResolvedValue(undefined);
      const eexist = Object.assign(new Error("EEXIST"), { code: "EEXIST" });
      vi.mocked(rename)
        .mockRejectedValueOnce(eexist)
        .mockResolvedValueOnce(undefined);
      vi.mocked(rm).mockResolvedValue(undefined);
      await safeRename("a", "b");
      expect(rm).toHaveBeenCalled();
      expect(rename).toHaveBeenCalledTimes(2);
    });

    test("should skip if source does not exist", async () => {
      const err = Object.assign(new Error("ENOENT"), { code: "ENOENT" });
      vi.mocked(access).mockRejectedValue(err);
      await safeRename("missing", "dest");
      expect(rename).not.toHaveBeenCalled();
    });
  });

  describe("findUp", () => {
    test("should find file by walking up", async () => {
      // Mock access to fail once then succeed
      vi.mocked(access)
        .mockRejectedValueOnce({ code: "ENOENT" } as any)
        .mockResolvedValueOnce(undefined);

      const result = await findUp("a/b/c", ["marker"]);
      expect(result).toBeDefined();
    });

    test("should return null if marker not found", async () => {
      const err = Object.assign(new Error("ENOENT"), { code: "ENOENT" });
      vi.mocked(access).mockRejectedValue(err);
      const result = await findUp("/", ["nonexistent"]);
      expect(result).toBeNull();
    });
  });

  describe("tryImport", () => {
    test("should return null if file does not exist", async () => {
      const err = new Error("Not found");
      (err as any).code = "ENOENT";
      vi.mocked(access).mockRejectedValue(err);
      expect(await tryImport("missing.ts")).toBeNull();
    });
  });
});
