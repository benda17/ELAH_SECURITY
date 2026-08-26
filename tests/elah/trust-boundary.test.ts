import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SERVICE_DIR = path.join(process.cwd(), "lib/elah/service");

function listServiceTs(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (name.endsWith(".ts")) out.push(full);
  }
  return out;
}

describe("ELAH service trust boundary", () => {
  it("does not import executeTool or lib/agent/tools", () => {
    const files = listServiceTs(SERVICE_DIR);
    expect(files.length, "lib/elah/service/*.ts should exist").toBeGreaterThan(0);
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      expect(text, file).not.toMatch(/\bexecuteTool\b/);
      expect(text, file).not.toMatch(/lib\/agent\/tools/);
    }
  });
});
