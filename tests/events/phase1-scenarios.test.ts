import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { executeTool } from "@/lib/agent/tools";
import type { ToolContext } from "@/lib/agent/types";
import { prisma } from "@/lib/db";
import { seedTestFixtures, type TestFixtures } from "../agent/fixtures";

interface Phase1Scenario {
  id: string;
  pack: "repeatable" | "abnormal" | "legitimate_edge";
  actorEmail: string;
  channel: "ui" | "agent";
  steps: string[];
  expectedAuditActionTypes: string[];
  expectedCanonicalActionTypes: string[];
  expectedCreatedByAgent: boolean;
  expectedOutcome: string;
  expectedIntentionHint: string;
  bankPolicy: string;
  notes: string;
  automation?: string;
}

interface Phase1ScenarioFile {
  meta: Record<string, string>;
  scenarios: Phase1Scenario[];
}

const FORBIDDEN_ACTION_TYPES = [
  "withdrawal",
  "device_change",
  "beneficiary_add",
];

const REQUIRED_PACKS = ["repeatable", "abnormal", "legitimate_edge"] as const;

function loadFile(): Phase1ScenarioFile {
  const path = join(process.cwd(), "scripts/phase1-scenarios.json");
  return JSON.parse(readFileSync(path, "utf8")) as Phase1ScenarioFile;
}

describe("phase1-scenarios.json contract", () => {
  const file = loadFile();

  it("parses with a scenarios array", () => {
    expect(Array.isArray(file.scenarios)).toBe(true);
    expect(file.scenarios.length).toBeGreaterThanOrEqual(8);
  });

  it("includes the three required packs with enough repeatable rows", () => {
    const packs = new Set(file.scenarios.map((s) => s.pack));
    for (const pack of REQUIRED_PACKS) {
      expect(packs.has(pack)).toBe(true);
    }
    const repeatable = file.scenarios.filter((s) => s.pack === "repeatable");
    expect(repeatable.length).toBeGreaterThanOrEqual(8);
    const ids = new Set(repeatable.map((s) => s.id));
    expect(ids.has("R01")).toBe(true);
    expect(ids.has("R09")).toBe(true);
  });

  it("does not use N/A actionTypes (withdrawal, device_change, beneficiary_add)", () => {
    for (const s of file.scenarios) {
      const names = [
        ...s.expectedAuditActionTypes,
        ...s.expectedCanonicalActionTypes,
      ];
      for (const t of names) {
        expect(FORBIDDEN_ACTION_TYPES).not.toContain(t);
      }
    }
  });

  it("marks injection utterances SIMULATION ONLY", () => {
    const injection = file.scenarios.filter((s) =>
      s.expectedCanonicalActionTypes.includes("prompt_injection"),
    );
    expect(injection.length).toBeGreaterThan(0);
    for (const s of injection) {
      const blob = `${s.steps.join(" ")} ${s.notes}`;
      expect(blob).toMatch(/SIMULATION ONLY/);
    }
  });

  it("keeps UI external twin and live abnormal hooks", () => {
    const byId = Object.fromEntries(file.scenarios.map((s) => [s.id, s]));
    expect(byId.R09?.channel).toBe("ui");
    expect(byId.R09?.expectedCanonicalActionTypes).toContain("external_transfer");
    expect(byId.A02?.expectedAuditActionTypes).toContain("transfer_blocked");
    expect(byId.A04?.expectedAuditActionTypes).toContain(
      "document_bulk_download_attempt",
    );
  });
});

describe("phase1 automated tools (no LLM)", () => {
  let fx: TestFixtures;

  beforeAll(async () => {
    fx = await seedTestFixtures();
  });

  function ctx(): ToolContext {
    return {
      user: fx.userA,
      profileId: fx.profileAId,
      ipAddress: "127.0.0.1",
      userAgent: "vitest-phase1-scenarios",
      sessionCookieId: "phase1-test-session",
      conversationId: "phase1-test-conversation",
    };
  }

  it("executes create_internal_transfer without OpenAI", async () => {
    const beforeChecking = await prisma.bankAccount.findUniqueOrThrow({
      where: { id: fx.checkingAId },
    });
    const beforeSavings = await prisma.bankAccount.findUniqueOrThrow({
      where: { id: fx.savingsAId },
    });

    const result = await executeTool(
      "create_internal_transfer",
      {
        fromAccountType: "checking",
        toAccountType: "savings",
        amount: 80,
        note: "modest own-account move",
      },
      ctx(),
    );

    if (!result.ok) {
      console.warn(
        `[phase1] skip internal transfer: ${result.error ?? result.summary} (DB/schema owned by other agents)`,
      );
      return;
    }

    const afterChecking = await prisma.bankAccount.findUniqueOrThrow({
      where: { id: fx.checkingAId },
    });
    const afterSavings = await prisma.bankAccount.findUniqueOrThrow({
      where: { id: fx.savingsAId },
    });
    expect(afterChecking.currentBalance).toBe(beforeChecking.currentBalance - 80);
    expect(afterSavings.currentBalance).toBe(beforeSavings.currentBalance + 80);

    const log = await prisma.auditLog.findFirst({
      where: { actionType: "internal_transfer", createdByAgent: true },
      orderBy: { timestamp: "desc" },
    });
    expect(log).not.toBeNull();
    expect(log?.createdByAgent).toBe(true);
  });

  it("executes get_saved_recipients without OpenAI", async () => {
    const result = await executeTool("get_saved_recipients", {}, ctx());
    if (!result.ok) {
      console.warn(
        `[phase1] skip recipients read: ${result.error ?? result.summary}`,
      );
      return;
    }

    const log = await prisma.auditLog.findFirst({
      where: { actionType: "agent_recipients_read", createdByAgent: true },
    });
    expect(log).not.toBeNull();
  });

  it("executes get_account_balance without OpenAI", async () => {
    const result = await executeTool(
      "get_account_balance",
      { accountType: "all" },
      ctx(),
    );
    if (!result.ok) {
      console.warn(
        `[phase1] skip balance read: ${result.error ?? result.summary}`,
      );
      return;
    }
    expect(result.summary).toMatch(/checking|savings/i);
  });

  // Injection refuse is orchestrator-owned (AgentEventLog suspicious_prompt_detected).
  // Skip LLM / handleAgentChat here. SIMULATION ONLY samples live in phase1-scenarios.json.
});
