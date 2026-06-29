/**
 * clean-injection-data.ts
 *
 * Removes every prompt-injection testing artifact from the database while
 * preserving normal user activity and naturally-elevated-risk entries
 * (e.g. VIP investments_view, manager viewing a sensitive customer profile,
 *  large legitimate transfers).
 *
 * What gets deleted:
 *   - All RiskEvent rows (all 5 demo events are injection-testing related)
 *   - All AgentActionLog rows (seeded AI-agent prompt-injection traces)
 *   - All PromptInjectionScenario rows (the test scenario catalog)
 *   - Document / LoanRequest / SupportTicket / ManagerNote rows whose
 *     containsInjectionTest (or containsPromptInjectionTest) flag is true
 *   - Transaction rows whose riskFlags column references "injection_test"
 *     or whose description starts with "[SIMULATION ONLY"
 *   - AuditLog rows that are clearly injection-test related:
 *       * reasonForFlagging is set (only injection logs use this)
 *       * actionType is *_blocked / unauthorized_route_access /
 *         document_bulk_download_attempt
 *       * inputDataSummary or targetResource contains "SIMULATION ONLY"
 *
 * What is preserved:
 *   - All normal customer browsing, transfers, document views, etc.
 *   - AuditLog entries elevated to medium/high because of *resource sensitivity*
 *     (investments_view, customer_profile_viewed of VIPs, large valid transfers)
 *
 * Run with:   npx tsx scripts/clean-injection-data.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const before = await snapshotCounts();
  console.log("Before cleanup:");
  printCounts(before);

  const result = await prisma.$transaction(async (tx) => {
    // Order matters — child tables before parents (FK on cascade is set, but
    // we still want a deterministic, explicit sequence).
    const auditDel = await tx.auditLog.deleteMany({
      where: {
        OR: [
          { reasonForFlagging: { not: null, notIn: [""] } },
          {
            actionType: {
              in: [
                "transfer_blocked",
                "loan_request_blocked",
                "document_bulk_download_attempt",
                "unauthorized_route_access",
              ],
            },
          },
          { inputDataSummary: { contains: "SIMULATION ONLY" } },
          { targetResource: { contains: "SIMULATION ONLY" } },
        ],
      },
    });

    const txnDel = await tx.transaction.deleteMany({
      where: {
        OR: [
          { riskFlags: { contains: "injection_test" } },
          { description: { startsWith: "[SIMULATION ONLY" } },
        ],
      },
    });

    const docDel = await tx.document.deleteMany({
      where: { containsInjectionTest: true },
    });

    const loanDel = await tx.loanRequest.deleteMany({
      where: { containsInjectionTest: true },
    });

    const ticketDel = await tx.supportTicket.deleteMany({
      where: { containsInjectionTest: true },
    });

    const noteDel = await tx.managerNote.deleteMany({
      where: { containsPromptInjectionTest: true },
    });

    const riskDel = await tx.riskEvent.deleteMany({});
    const agentDel = await tx.agentActionLog.deleteMany({});
    const scenarioDel = await tx.promptInjectionScenario.deleteMany({});

    return {
      auditDel,
      txnDel,
      docDel,
      loanDel,
      ticketDel,
      noteDel,
      riskDel,
      agentDel,
      scenarioDel,
    };
  });

  console.log("\nDeleted:");
  console.log(`  AuditLog                 ${result.auditDel.count}`);
  console.log(`  Transaction              ${result.txnDel.count}`);
  console.log(`  Document                 ${result.docDel.count}`);
  console.log(`  LoanRequest              ${result.loanDel.count}`);
  console.log(`  SupportTicket            ${result.ticketDel.count}`);
  console.log(`  ManagerNote              ${result.noteDel.count}`);
  console.log(`  RiskEvent                ${result.riskDel.count}`);
  console.log(`  AgentActionLog           ${result.agentDel.count}`);
  console.log(`  PromptInjectionScenario  ${result.scenarioDel.count}`);

  const after = await snapshotCounts();
  console.log("\nAfter cleanup:");
  printCounts(after);

  // Sanity check — there should be no residue.
  const residue = await prisma.auditLog.count({
    where: {
      OR: [
        { reasonForFlagging: { not: null, notIn: [""] } },
        { inputDataSummary: { contains: "SIMULATION ONLY" } },
        { targetResource: { contains: "SIMULATION ONLY" } },
      ],
    },
  });
  console.log(`\nResidue AuditLog rows matching injection filter: ${residue}`);
  if (residue !== 0) {
    process.exitCode = 1;
  }
}

async function snapshotCounts() {
  const [
    audit,
    auditNonLow,
    txn,
    txnFlagged,
    doc,
    loan,
    ticket,
    note,
    risk,
    agent,
    scenario,
  ] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.count({ where: { riskLevel: { not: "low" } } }),
    prisma.transaction.count(),
    prisma.transaction.count({ where: { riskFlags: { not: null } } }),
    prisma.document.count(),
    prisma.loanRequest.count(),
    prisma.supportTicket.count(),
    prisma.managerNote.count(),
    prisma.riskEvent.count(),
    prisma.agentActionLog.count(),
    prisma.promptInjectionScenario.count(),
  ]);
  return {
    audit,
    auditNonLow,
    txn,
    txnFlagged,
    doc,
    loan,
    ticket,
    note,
    risk,
    agent,
    scenario,
  };
}

function printCounts(c: Awaited<ReturnType<typeof snapshotCounts>>) {
  console.log(
    `  AuditLog                 ${c.audit} (${c.auditNonLow} non-low)\n  Transaction              ${c.txn} (${c.txnFlagged} flagged)\n  Document                 ${c.doc}\n  LoanRequest              ${c.loan}\n  SupportTicket            ${c.ticket}\n  ManagerNote              ${c.note}\n  RiskEvent                ${c.risk}\n  AgentActionLog           ${c.agent}\n  PromptInjectionScenario  ${c.scenario}`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
