import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function walkTsx(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walkTsx(full));
    else if (/\.(ts|tsx)$/.test(name)) out.push(full);
  }
  return out;
}

const SCORE_LEAK = /\belahScore\b|\belahScoreLabel\b|chainOfThought/;

describe("Phase 10 customer UI score isolation", () => {
  it("does not mention elahScore in customer routes", () => {
    const files = walkTsx(path.join(process.cwd(), "app/(customer)"));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      expect(text, file).not.toMatch(SCORE_LEAK);
    }
  });
});
