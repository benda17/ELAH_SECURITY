import { execSync } from "node:child_process";
import { beforeAll, vi } from "vitest";

process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  process.env.DATABASE_URL ??
  "postgresql://elah:elah@localhost:5432/elah_banking?schema=public";
process.env.AUTH_SECRET = "test-auth-secret-for-agent-suite-min-32-chars";
process.env.LOG_MIRROR_JSONL = "false";
process.env.ELAH_SERVICE_TOKEN = "test-elah-service-token-min-32-chars";
process.env.ELAH_SCORE_TIMEOUT_MS = "250";
delete process.env.ELAH_SERVICE_URL;
delete process.env.OPENAI_API_KEY;

vi.mock("@/lib/auth/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/session")>();
  return {
    ...actual,
    getSessionUser: vi.fn().mockResolvedValue(null),
    getSessionId: vi.fn().mockReturnValue(null),
    clientIp: vi.fn().mockReturnValue("127.0.0.1"),
    clientUserAgent: vi.fn().mockReturnValue(null),
  };
});

beforeAll(() => {
  try {
    execSync("npx prisma db push --skip-generate", {
      cwd: process.cwd(),
      env: { ...process.env },
      stdio: "pipe",
    });
  } catch (err) {
    const output = `${err instanceof Error ? err.message : String(err)} ${
      err && typeof err === "object" && "stderr" in err
        ? String((err as { stderr?: Buffer | string }).stderr ?? "")
        : ""
    }`;
    if (/P1001|Can't reach database/.test(output)) {
      console.warn(
        "[tests/setup] database unreachable; skipping prisma db push (unit tests that mock Prisma can still run)",
      );
      return;
    }
    throw err;
  }
});
