import { execSync } from "node:child_process";
import { beforeAll, vi } from "vitest";

process.env.DATABASE_URL = "file:./test-agent.db";
process.env.AUTH_SECRET = "test-auth-secret-for-agent-suite-min-32-chars";
process.env.LOG_MIRROR_JSONL = "false";
delete process.env.OPENAI_API_KEY;

vi.mock("@/lib/auth/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/session")>();
  return {
    ...actual,
    getSessionUser: vi.fn().mockResolvedValue(null),
    getSessionId: vi.fn().mockReturnValue(null),
    clientIp: vi.fn().mockReturnValue("127.0.0.1"),
  };
});

beforeAll(() => {
  execSync("npx prisma db push --skip-generate", {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: "file:./test-agent.db" },
    stdio: "pipe",
  });
});
