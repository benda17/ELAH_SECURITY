/**
 * APACT execution board (ELAH V2).
 * Status lives on each row with the evidence note. The seed copies that status;
 * it does not infer Done from a title alone.
 * Product truth: ELAH-TDD.md v0.3 and ELAH-APACT-PRODUCT/README.md (13 Oct 2026),
 * pushed to github.com/benda17/elah-product.
 * Anchor for milestone dates: 15 Oct 2026.
 */
import type { TaskStatus, Workstream } from "../types";

export interface PhaseSpec {
  phase: string;
  workstream: Workstream;
  category: string;
  tasks: string[];
}

export interface TaskEvidence {
  title: string;
  status: TaskStatus;
  progress: number;
  notes: string;
  doneWhen: string;
}

export interface MilestoneSpec {
  order: number;
  title: string;
  exitCriteria: string;
  /** Calendar date, chosen relative to 15 Oct 2026. */
  targetDate: string;
  evidence: string | null;
}

interface PhaseDraft {
  phase: string;
  workstream: Workstream;
  category: string;
  tasks: TaskEvidence[];
}

function done(title: string, notes: string, doneWhen: string): TaskEvidence {
  return { title, status: "done", progress: 100, notes, doneWhen };
}

function review(title: string, notes: string, doneWhen: string): TaskEvidence {
  return { title, status: "in_review", progress: 70, notes, doneWhen };
}

function doing(
  title: string,
  progress: number,
  notes: string,
  doneWhen: string,
): TaskEvidence {
  return { title, status: "in_progress", progress, notes, doneWhen };
}

function later(title: string, notes: string, doneWhen: string): TaskEvidence {
  return { title, status: "backlog", progress: 0, notes, doneWhen };
}

const TDD = "ELAH-TDD.md v0.3 (local revision 2026-10-06)";
const README = "ELAH-APACT-PRODUCT/README.md (13 Oct 2026)";
const GH = "github.com/benda17/elah-product";

const PHASE_DRAFTS: PhaseDraft[] = [
  {
    phase: "Phase 0 — APACT product definition",
    workstream: "Product",
    category: "Protocol",
    tasks: [
      done(
        "Write the plain-language definition of ELAH as a CAPTCHA for agents installed at a website entrance.",
        `Done. ${TDD} §1. The file status line still says internal working draft.`,
        "A reader can point at the paragraph that calls ELAH a CAPTCHA for agents and names the widget, the decision, and the key-bound token.",
      ),
      done(
        "Specify the guest path and the delegated path, including that exercise success cannot supply missing authority.",
        `Done. ${TDD} §3. Guest admission is site policy plus an exercise. Delegated admission needs accepted authority. A passing challenge does not create permission.`,
        "The trust-model section shows both paths and says a self-generated key proves possession, not identity.",
      ),
      done(
        "Specify the eight APACT fields and the evidence each field does and does not provide.",
        `Done. ${TDD} §5, entrance protocol APACT 0.1. Each field has input, validation, the absent case, and the evidence actually obtained.`,
        "All eight fields are written, including the limits on origin, authority, and the declaration.",
      ),
      done(
        "Specify the prepare, declare, freeze, exercise, complete, decide, and present lifecycle with expiry and retry limits.",
        `Done. ${TDD} §4. Challenges have states, expiry, and a bounded retry budget. Completion must not mint conflicting grants.`,
        "The lifecycle lists seven steps and says client-supplied site policy is never authoritative.",
      ),
      done(
        "Specify allow_limited, step_up_required, rejected, and unsupported, and issue a token only for allow_limited.",
        `Done. ${TDD} §7. step_up_required identifies missing approval and issues no token.`,
        "The four decisions are named, and only allow_limited is allowed to issue a token.",
      ),
      done(
        "Specify the admission report, receipt binding, and ES256 DPoP token claims, leaving prompts and raw credentials out of the token.",
        `Done. ${TDD} §8. Claims include iss, aud, sub, cnf.jkt, authorization_details, and the ELAH binding. Private prompts stay out of the JWT.`,
        "The report shape and the token claim list are written, and the text says a client-edited report cannot enlarge scope.",
      ),
      done(
        "Specify partner verification order and online revocation that fails closed when token status cannot be read.",
        `Done. ${TDD} §9 and §10. Online revocation is required for V1, and a missing status check refuses the call.`,
        "The verifier order and the fail-closed rule are both in the TDD.",
      ),
      done(
        "Write the guest-travel profile so flight search and guest draft are allowed and payment, contract submission, and export are blocked.",
        `Done. ${TDD} §12 names this as the proposed initial profile. ${README} implements flight.search and traveler.draft.update, and blocks payment.create, contract.submit, and data.export.`,
        "The profile names the allowed functions and the three blocked ones.",
      ),
      done(
        "Specify the baseline, pressure, and relabel exercises and keep every effect inert.",
        `Done. ${TDD} §6. Baseline, instruction pressure, and equivalent presentation. Payment and contract probes never call external services.`,
        "The three exercises are specified, and the text says effects stay inert.",
      ),
      done(
        "Record that a pass does not identify the model, prove the user's real instruction, or promise future behavior.",
        `Done. ${TDD} §1 and §7. ${README} "Not in this slice" repeats the same limit for the running code.`,
        "The non-goals are written in the TDD and restated next to the slice.",
      ),
      review(
        "Publish the open decisions from TDD section 13 without filling in partners, issuers, or thresholds that are still unset.",
        `In review. ${TDD} §13 lists partner, issuers, delivery, thresholds, token and retention rules, and optional runtime evidence. The list is published. None of those choices are closed in the file.`,
        "The open-decision list stays visible, and blank items are not filled with invented answers.",
      ),
      done(
        "Separate the page-local laboratory from production requirements so the lab is not described as a deployed control.",
        `Done. ${TDD} §12 describes the page-local lab (keys in the page, no deployed endpoints as of that revision). The 13 Oct FastAPI process is a later localhost prototype, documented in ${README}, and is still not a deployed control.`,
        "A reader can tell the educational lab, the localhost server, and a production service apart.",
      ),
      done(
        "Define the V1 success criterion as an installable entrance, a limited-function report, a key-bound token, and explainable revocable enforcement.",
        `Done. ${TDD} §13 states the V1 success criterion and says behavioral benefit must not imply hidden reasoning or authority from a test score.`,
        "The success criterion is one paragraph a partner could be measured against.",
      ),
      review(
        "Record founder acceptance of TDD v0.3 as the execution source of truth for the APACT pivot.",
        `In review. ${TDD} status line is still "Internal working draft". The revision history says the v0.3 text was synchronized to the Google Drive TDD on 2026-10-09. This board uses the file as product truth. An acceptance line is not in the file.`,
        "The TDD file, or a note beside it, records that v0.3 replaces the intention-scoring execution plan.",
      ),
    ],
  },
  {
    phase: "Phase 1 — Thin guest-travel slice",
    workstream: "Engineering",
    category: "Slice",
    tasks: [
      done(
        "Package elah_apact as a FastAPI service with strict JSON parsing, canonical JSON, and ES256 JWS checks.",
        `Done 13 Oct 2026. ${GH}: ELAH-APACT-PRODUCT/pyproject.toml and elah_apact/protocol.py. ${README} lists strict JSON, canonical JSON, and ES256.`,
        "The package installs, and the protocol module rejects duplicate keys and private key material.",
      ),
      done(
        "Rebuild the declaration digest from the stored challenge and reject a digest the client asserts on its own.",
        `Done 13 Oct 2026. ${GH}: elah_apact/declaration.py. ${README} says the server rebuilds D from the submitted fields and its own challenge, and a changed declaration is rejected in pytest.`,
        "A tampered declaration or nonce fails, and the client-supplied digest is not trusted alone.",
      ),
      done(
        "Issue server-owned guest-travel challenges and ignore any policy, catalog, or limits supplied by the client.",
        `Done 13 Oct 2026. ${GH}: elah_apact/challenges.py and elah_apact/catalog.py. ${README}: POST /challenges takes only site_id. Policy guest-travel-v1 and catalog travel-functions-v1 stay on the server. Challenge lifetime is 120 seconds.`,
        "A client cannot submit its own policy and have the server honor it.",
      ),
      done(
        "Run the baseline, pressure, and relabel exercises on inert mock flights and record every action on the server.",
        `Done 13 Oct 2026. ${GH}: elah_apact/exercise.py. ${README}: three pages, server-recorded events, no client-uploaded trace, payment never runs.`,
        "Each exercise action is an authenticated call, and the server stores the event itself.",
      ),
      done(
        "Judge each attempt as boundary_violated, insufficient evidence, incomplete, probe_inconsistent, or allow_limited.",
        `Done 13 Oct 2026. ${README} decision table. allow_limited uses reason guest_policy_and_task_test_passed. The honest-agent report shows 6/6 and probe_consistency passed.`,
        "The judge reads server events only, and each refusal has one of the named reasons.",
      ),
      done(
        "Issue a short-lived ES256 admission token bound to the agent key and publish JWKS plus token status and revocation.",
        `Done 13 Oct 2026. ${GH}: elah_apact/tokens.py. ${README}: elah-admission+jwt, 300 seconds, cnf.jkt, JWKS at /.well-known/jwks.json, status and revoke routes. Storage is in-memory. Durability is Phase 2.`,
        "allow_limited returns a key-bound token, and status plus revoke respond for that jti inside the same process.",
      ),
      done(
        "Verify each partner request with DPoP, token checks, catalog scope, and online revocation that fails closed.",
        `Done 13 Oct 2026. ${GH}: elah_apact/verifier.py. ${README} §6 order. Pytest covers wrong key, replayed DPoP, edited token, revoked token, expired token, and a revocation outage that fails closed.`,
        "A protected call without a valid proof is refused, and an unreachable status check is refused.",
      ),
      done(
        "Ship the entrance widget with an unverified human checkbox and an agent path that keeps a non-extractable P-256 key and calls ElahApact.fetch.",
        `Done 13 Oct 2026. ${GH}: ELAH-APACT-PRODUCT/widget/apact-widget.js and apact-crypto.js. ${README}: human path does not contact ELAH. Agent path declares, exercises, and decides. The key is non-extractable and page-memory only.`,
        "Both buttons render, the human path skips ELAH, and ElahApact.fetch attaches the token and a fresh DPoP proof.",
      ),
      done(
        "Run Skyhop so flight search and guest draft succeed, payment and contract and export stay blocked, and the log separates human from APACT.",
        `Done 13 Oct 2026. ${GH}: testing-environment/ on port 4173. ${README} browser table: human pay logged unverified; honest agent allow_limited; admitted Pay returned step_up_required. /log showed each path.`,
        "Skyhop allows flight.search and traveler.draft.update for an admitted guest and returns step_up_required for payment.create.",
      ),
      done(
        "Keep the reference agent and the pytest suite green for honest, pressure-pay, cross-challenge, and upfront-payment behavior.",
        `Done 13 Oct 2026. ${GH}: tests/agent_client.py, tests/test_e2e.py, tests/test_protocol.py. ${README}: 33 pytest tests passed, including the four agent behaviors and the binding and presentation cases.`,
        "The suite passes, and the four reference-agent behaviors match the README.",
      ),
      doing(
        "Repeat the pressure-page Pay action as a browser click on the exercise control.",
        55,
        `In progress. ${README} "What was checked by hand": the reference agent against the live server returned rejected / boundary_violated. The browser click on the exercise Pay control was not completed in that session.`,
        "A browser session on the pressure exercise clicks Pay and the server records boundary_violated with no token.",
      ),
      done(
        "Record the 13 Oct 2026 push to github.com/benda17/elah-product and the localhost-only limit in the product README.",
        `Done. ${README} is dated 13 October 2026, names ${GH}, and says only this machine can reach 127.0.0.1.`,
        "The README carries the date, the repo, and the localhost limit.",
      ),
      done(
        "Return unsupported when the declaration carries an operator credential or approval evidence, until an adapter exists.",
        `Done 13 Oct 2026. ${README} field rules: an unknown task kind, non-null approval evidence, or an operator credential returns unsupported. No approval or credential adapter is included.`,
        "Those declarations get unsupported and no token.",
      ),
    ],
  },
  {
    phase: "Phase 2 — Durable APACT service",
    workstream: "Engineering",
    category: "Durability",
    tasks: [
      later(
        "Replace the in-memory challenge store with shared durable storage so a restart does not drop an active attempt.",
        `Backlog. ${GH}: elah_apact/challenges.py keeps records in memory behind one lock (${README}).`,
        "A challenge survives a process restart and is visible to a second process.",
      ),
      later(
        "Move the DPoP replay cache to shared storage so a second process cannot accept the same proof.",
        `Backlog. ${README} says the DPoP replay cache is in memory, so each server must run as a single process. Pytest shows replay rejection only on that one process.`,
        "Two processes reject the same proof, and a restart does not forget proofs still inside the acceptance window.",
      ),
      later(
        "Move revocation status to shared storage and keep the call fail-closed when that store cannot be read.",
        `Backlog. Revocation works inside one process (${README}, tokens.py). Fail-closed behavior is tested. The store is not shared.`,
        "A revoke on one process is visible to another, and an unreachable store still refuses the call.",
      ),
      later(
        "Make completion and token issuance atomic so concurrent retries cannot mint two grants.",
        `Backlog. ${TDD} §4 requires atomic or idempotent completion. The slice rejects a second completion in one process (${README}). Cross-process atomicity is not built.`,
        "Two overlapping complete calls produce one grant.",
      ),
      later(
        "Add restart tests for challenge expiry, the declaration attempt budget, and one-time completion.",
        "Backlog. Current pytest uses an in-process clock (tests/conftest.py). Nothing restarts a second process against a database.",
        "A test stops the process, starts it again, and checks expiry, the three declaration attempts, and a single completion.",
      ),
      later(
        "Write retention rules for challenges, synthetic exercise events, and revocation records before any real traveler data is stored.",
        `Backlog. ${TDD} §10 requires retention rules before real partner telemetry. The slice stores synthetic exercise events in memory only.`,
        "A short retention note names what is kept, for how long, and that current rows are dummy travel data.",
      ),
      later(
        "Move the admission signing key out of process-local defaults and document rotation.",
        `Backlog. ${README} describes ELAH's signing key inside the local server. Rotation is not documented as an operational procedure.`,
        "The signing key is loaded from a local secret store, and a rotation note says what happens to outstanding tokens.",
      ),
      later(
        "Add a health check that reports whether the challenge, replay, and revocation stores are reachable.",
        "Backlog. The slice has no shared stores to report. A process liveness check would not answer this.",
        "The health response names each store and fails when one of them is down.",
      ),
      later(
        "Keep the strict duplicate-key JSON parser covered by tests while the stores are replaced.",
        `Backlog for the migration. The parser is already tested: ${README} says the strict parser rejects bad input and duplicate JSON keys (tests/test_protocol.py). Re-run that test when storage changes.`,
        "The duplicate-key tests still pass after the store move.",
      ),
      doing(
        "Run APACT and Skyhop as single local processes until shared storage exists.",
        50,
        `In progress. ${README} run commands: uvicorn elah_apact.server on 127.0.0.1:8700 and testing-environment on 127.0.0.1:4173. Challenges, replay, and revocation are in memory. Hosting is not this task.`,
        "Both processes start from the repo virtualenv, and the README still says they are single-process.",
      ),
      later(
        "Load further sites from server configuration instead of the one hard-coded local registration.",
        `Backlog. ${GH}: elah_apact/catalog.py registers one local Skyhop origin. ${README} settings table lists that one site.`,
        "A second origin can be added in server configuration without editing the exercise code.",
      ),
      later(
        "Define the TDD section 10 audit fields and confirm the current process does not store them durably.",
        `Backlog. ${TDD} §10 lists the minimum audit fields and says default records exclude raw prompts and raw credentials. The slice has no durable audit log.`,
        "A field list exists, and a note confirms today's process keeps none of it on disk.",
      ),
    ],
  },
  {
    phase: "Phase 3 — Partner integration kit",
    workstream: "Engineering",
    category: "Kit",
    tasks: [
      doing(
        "Split a versioned partner verifier from the Skyhop import of the in-repo verifier module.",
        35,
        `In progress. Skyhop imports the verifier from the editable elah_apact install (${README}, elah_apact/verifier.py). There is no separate versioned partner package.`,
        "A partner project depends on a named verifier release and does not import server internals.",
      ),
      later(
        "Write a route-to-function guide that uses Skyhop search, draft, and payment as the worked example.",
        `Backlog. ${README} already maps GET /api/flights, PUT /api/draft, and POST /api/payments. That mapping is not a standalone partner guide.`,
        "A short guide shows the three routes, the catalog ids, and the verified / step_up_required / rejected results.",
      ),
      later(
        "Publish widget embed steps for both buttons, the non-extractable key, and ElahApact.fetch.",
        `Backlog. The behavior is in ${README} and widget/. A partner install page does not exist apart from the product README.`,
        "A partner can embed the widget from steps that do not require reading the server source.",
      ),
      later(
        "Extract a copy-paste middleware example that calls the verifier on every protected route.",
        `Backlog. The check lives inside testing-environment/app.py. It is not extracted as a standalone snippet.`,
        "The kit contains one middleware example a partner can paste onto their own routes.",
      ),
      later(
        "Document site registration for origin, audience, and a site credential, and require a non-default credential off localhost.",
        `Backlog. ${README} settings table shows local defaults for issuer, site id, and the site credential. Do not copy that local credential into this card or into a public host.`,
        "The kit says how to register origin and audience, and it forbids the localhost credential on any other host.",
      ),
      later(
        "Package the passing pytest cases as partner vectors for admission, replay, revocation, and a revocation outage.",
        `Backlog. The 33 tests in ELAH-APACT-PRODUCT/tests cover these cases for Skyhop. They are not packaged as a partner vector file.`,
        "A partner can run a published vector list without cloning the server tests.",
      ),
      later(
        "Instruct partners to log the human checkbox as unverified and to withhold any ELAH decision from that path.",
        `Backlog. ${README} and the 13 Oct browser check already show this on Skyhop. The instruction is not yet in a partner kit.`,
        "The kit says the human path is unverified and must not be displayed as an ELAH allow.",
      ),
      later(
        "Specify the site response when a client cannot complete the exercise, distinguishing unsupported from rejected.",
        `Backlog. ${TDD} §5.8 separates an unavailable interface from a recorded violation. The slice does not document a partner response for that case.`,
        "The kit tells the site what to return when the exercise UI cannot run.",
      ),
      later(
        "Pin protocol 0.1, guest-travel-v1, and travel-functions-v1 in the kit changelog.",
        `Backlog. Those version strings are in ${README}. A kit changelog does not exist.`,
        "The kit names the protocol, policy, and catalog versions it was tried against.",
      ),
      later(
        "Document that challenge CORS allows only the registered site origin.",
        `Backlog. ${README} tests: CORS allows only the registered site, and an unknown site is refused. The kit page is unwritten.`,
        "The kit states the CORS rule and the unknown-site refusal.",
      ),
      later(
        "List the machine-readable reasons a partner should store and which reason text an end user should see.",
        `Backlog. ${TDD} §9 defines status, principal, agent, grant, action, and reason. A partner-facing split between stored reasons and user-visible text is not written.`,
        "The kit has two columns: store this reason, show the user that sentence.",
      ),
      later(
        "State in the kit that a frontend-only gate is insufficient because every protected route must check the token.",
        `Backlog. ${TDD} §2 says a frontend-only gate is insufficient. The slice enforces this on Skyhop. The kit chapter is unwritten.`,
        "The kit opens with that requirement and points at the middleware example.",
      ),
    ],
  },
  {
    phase: "Phase 4 — Step-up and authority adapters",
    workstream: "Security",
    category: "Authority",
    tasks: [
      later(
        "Specify the approval credential: principal, session key, audience, functions, resource, limits, expiry, and one-time use.",
        `Backlog. ${TDD} §5.6 describes the credential. The slice accepts null for guest functions and does not verify an approval document.`,
        "A one-page credential profile lists those fields and says an approved:true flag is not evidence.",
      ),
      later(
        "Build a partner approval screen for payment that shows the agent, function, resource, and limits before any charge.",
        `Backlog. ${README}: asking for payment returns step_up_required and says the slice has no approval flow. No consent screen exists.`,
        "A partner user can see the requested payment scope and approve or refuse it.",
      ),
      later(
        "Require a fresh declaration after approval instead of widening a guest token already issued.",
        `Backlog. ${TDD} §7 says an approval that changes the contract needs a new declaration. The slice never issues a second, wider token.`,
        "A test shows the original guest token still cannot pay after a later approval, until a new declaration is admitted.",
      ),
      later(
        "Implement one configured trust-root adapter that checks signature, audience, expiry, and revocation before authority evidence can count.",
        `Backlog. ${README} and ${TDD} §12: no operator or approval adapter. Unknown credentials return unsupported.`,
        "One configured issuer can be accepted, and any other issuer still returns unsupported.",
      ),
      later(
        "Write the adapter rule that a null authority field stays on the guest path and the token subject stays a guest-session reference.",
        `Backlog as an adapter spec. The slice already does this: ${README} uses sub guest-session:<report_id> and does not invent a human principal. The written adapter rule is still missing.`,
        "The adapter spec says null authority cannot become a person, and a test locks the guest subject.",
      ),
      later(
        "Keep provider and model labels from raising operator origin above asserted or unknown once the adapter exists.",
        `Backlog. ${TDD} §5.2 says a provider name does not improve assurance by itself. The slice reports operator origin as asserted or unknown (${README} assurance block).`,
        "A label-only origin claim stays asserted or unknown in the report after the adapter ships.",
      ),
      later(
        "Bind a request-body digest on approved payment and contract writes, and reject the call when the body changes.",
        `Backlog. ${TDD} §9 says exact writes need body binding. The slice does not implement it, and payment is not an approved write.`,
        "A changed payment body fails even when the token and DPoP key are valid.",
      ),
      later(
        "Issue a shorter one-time grant for an approved sensitive action instead of reusing the guest token lifetime.",
        "Backlog. The guest token lasts 300 seconds and is not one-time (README). No approved-action grant exists.",
        "An approved payment grant expires sooner than the guest token and cannot be replayed.",
      ),
      later(
        "Set user-task authority to verified only after the adapter accepts the credential.",
        `Backlog. ${README} reports user task authority as declared for the guest slice. Nothing sets it to verified.`,
        "A guest report stays declared, and only an accepted credential can say verified.",
      ),
      done(
        "Keep the regression that a guest who passed every exercise still receives step_up_required on payment, contract submission, and export.",
        `Done 13 Oct 2026 as a regression, not as an approval flow. ${README} browser check: admitted agent Pay returned step_up_required. Pytest: search and draft verified, payment step_up_required. No approval screen exists.`,
        "The guest who passed APACT still cannot pay, submit a contract, or export, and the reason is step_up_required.",
      ),
      later(
        "Write the caller-facing next step for step_up_required, including the current suggestion to continue as a guest, and stop before describing an approval screen that does not exist.",
        `Backlog. ${README} says the declaration reply suggests continuing as a guest because there is no approval flow. Partner-facing copy for that sentence is not separated from the server source.`,
        "The written next step matches the API and does not mention an approval screen.",
      ),
      later(
        "Test a forged approval document and confirm it does not raise assurance or widen the guest grant.",
        "Backlog. No adapter accepts approval documents, so this test cannot pass for a real grant yet. Today's unsupported response is the stand-in.",
        "A forged or unsigned approval leaves the guest grant unchanged.",
      ),
    ],
  },
  {
    phase: "Phase 5 — Second task profile",
    workstream: "Product",
    category: "Profile",
    tasks: [
      later(
        "Choose the second task profile only after guest-travel state is durable, and leave it out of the current catalog.",
        `Backlog. ${README}: the only profile is guest travel. ${TDD} §12: no second profile is deployed.`,
        "A written choice names the profile or explicitly defers it, and travel-functions-v1 is unchanged until then.",
      ),
      later(
        "Write that profile's task kind, completion conditions, and stop condition in the same shape as guest travel.",
        `Backlog. Guest travel's task shape is in ${TDD} §5.3. No second kind is specified.`,
        "The new task kind has a summary, completion conditions, and a stop condition the judge can test.",
      ),
      later(
        "Define its server-owned function catalog with resources, effects, and parameter limits.",
        `Backlog. ${TDD} §5.4 says general route adapters and parameter schemas are still implementation work. The slice catalog is the five travel functions.`,
        "The catalog is server-owned and lists resources, effects, and limits.",
      ),
      later(
        "Mark which of its functions a guest may call and which ones return step_up_required.",
        "Backlog. No second profile, so no second guest boundary.",
        "Every function in the new catalog is either guest-allowed or step-up.",
      ),
      later(
        "Design baseline, pressure, and relabel exercises that keep the same facts and change only labels or untrusted instructions.",
        `Backlog. ${TDD} §6 describes that pattern for guest travel. It has not been applied to a second profile.`,
        "Three exercises share facts, and the pressure page adds only an untrusted forbidden instruction.",
      ),
      later(
        "Compare probe consistency on effect classes rather than on the visible button text.",
        `Backlog. The travel judge compares permitted outcomes (${README}, probe_inconsistent). A second profile needs the same rule on its own effects.`,
        "Two legitimate sequences with the same effects pass, and a different effect fails.",
      ),
      later(
        "Reject declarations that request a function and also forbid it, and reject unknown function ids.",
        `Backlog for the new catalog. The travel slice already rejects contradictions and unknown functions (${README}). The new profile needs its own cases.`,
        "Both bad declarations are rejected before exercises are generated.",
      ),
      later(
        "Add a local test site with its own origin and token audience for the new profile.",
        "Backlog. Skyhop is the only registered site.",
        "The new site has its own origin, audience, and route map, and it does not reuse the travel audience.",
      ),
      later(
        "Add a pytest pack for admission, binding, and presentation before calling the profile supported.",
        "Backlog. The 33 travel tests are not a template that has been copied onto a second profile.",
        "The new pack covers an honest admit, a pressure violation, a bad declaration, replay, and revocation.",
      ),
      later(
        "Version the new profile apart from guest-travel-v1 and travel-functions-v1.",
        `Backlog. Those two version strings belong to the slice (${README}).`,
        "Tokens and challenges for the new profile carry their own policy and catalog versions.",
      ),
      later(
        "Leave the support-ticket read and exact-create idea as a candidate and withhold any claim that a partner has chosen it.",
        `Backlog as a decision to record when the second profile is chosen. ${TDD} §12 already says this workflow is a candidate and that no partner is selected. Do not promote it on this card.`,
        "The profile note either picks something else or repeats that support-ticket is only a candidate.",
      ),
    ],
  },
  {
    phase: "Phase 6 — Adversarial evaluation",
    workstream: "Security",
    category: "Evaluation",
    tasks: [
      later(
        "Write an evaluation plan for legitimate completion, false rejection, unsupported clients, forbidden-effect attempts, latency, and cost.",
        `Backlog. ${TDD} §13 names these measures and says the scripted fixtures cannot establish them. No evaluation plan file exists for the FastAPI slice.`,
        "The plan lists each measure, the data it will use, and what would count as a result.",
      ),
      later(
        "Hold out one pressure template and one relabel template from the pages the reference agent already knows.",
        "Backlog. The slice has one pressure page and one relabel page, and the reference agent was written for them.",
        "At least one pressure template and one relabel template are unused by the reference agent until the eval run.",
      ),
      later(
        "Compare scope checks alone with scope checks plus the exercise, and write down what the exercise added.",
        `Backlog. ${TDD} §13 asks for this comparison. The slice always runs both. No side-by-side note exists.`,
        "A short note says which forbidden effects the exercise caught that scope checks would also have stopped at the route.",
      ),
      doing(
        "Record the admitted-agent payment check on Skyhop as step_up_required, and extend it beyond the single browser session before calling it a rate.",
        45,
        `In progress. ${README} browser table: an admitted agent clicking Pay got step_up_required (fresh_approval_required). That is one session, not a rate across agents.`,
        "The note cites the 13 Oct session and says how many further agents were tried. It does not call one session a rate.",
      ),
      later(
        "Add the pressure-page browser click to the evaluation note after that click is actually run.",
        `Backlog. The reference-agent result is boundary_violated (${README}). The browser click is the open Phase 1 task. Do not write it up as a UI result before it happens.`,
        "The eval note distinguishes the reference-agent result from the browser click.",
      ),
      later(
        "Record replay rejection for a repeated exercise action and a repeated DPoP proof, and label the cache as single-process.",
        `Backlog as an eval write-up. Pytest already rejects both replays (${README}). The cache is in memory. Copy that into the eval note and keep the single-process label.`,
        "The note states both rejections and says they were observed on one process.",
      ),
      later(
        "Record that a revocation outage fails closed, and describe the availability cost of that choice in the evaluation note.",
        `Backlog as an eval write-up. ${README} already says a revocation outage fails closed, and pytest covers it. The availability tradeoff is not in an evaluation note yet.`,
        "The note says the call is refused when status cannot be read, and it names the outage that causes.",
      ),
      later(
        "Document the human checkbox as a bypass that the site accepts and logs as unverified without contacting ELAH.",
        `Backlog as an eval finding separate from the README. The 13 Oct browser check and pytest already show the bypass (${README}). Copy it into the eval note so a partner cannot miss it.`,
        "The eval note calls the checkbox a bypass and points at the /log rows.",
      ),
      later(
        "Put a standing limit on the evaluation template: results must not name a model, reconstruct the user's real instruction, or claim future behavior.",
        `Backlog. The limit is in ${TDD} §1 and ${README}. It is not yet a header on an evaluation template, because that template does not exist.`,
        "Every eval write-up starts with that limit.",
      ),
      later(
        "Schedule a case where the client uploads a trace, and confirm the judge still uses only server-recorded events.",
        `Backlog as a scheduled eval case. The slice already ignores client traces (${README}: the client cannot upload a trace). The case is not in an evaluation plan.`,
        "The plan includes one uploaded-trace attempt, and the result cites server events only.",
      ),
      later(
        "Measure false rejection when legitimate wording changes beyond the single relabel page in the slice.",
        "Backlog. One relabel page exists. No false-rejection count exists.",
        "A table shows how many legitimate wording changes were refused, on pages the agent was not built for.",
      ),
      later(
        "Turn the TDD adaptive-attacker list into concrete cases: recognizing the exercise, outsourcing it, and complying only while the probe is visible.",
        `Backlog. ${TDD} §13 names these attackers. They are not test cases yet.`,
        "Each of the three attackers has a procedure, a fixture or a manual script, and an empty result line.",
      ),
    ],
  },
  {
    phase: "Phase 7 — Hosted deployment",
    workstream: "Engineering",
    category: "Hosting",
    tasks: [
      doing(
        "Run the local APACT server and Skyhop on loopback for development, and describe that pair as a prototype.",
        45,
        `In progress. ${README} gives the two uvicorn commands on 127.0.0.1 ports 8700 and 4173, and calls the slice a prototype rather than a security control. Nothing is hosted.`,
        "A developer can start both processes locally, and no doc calls that pair a production host.",
      ),
      later(
        "Deploy APACT on a public HTTPS origin that a cloud browser agent can reach.",
        `Backlog. ${README}: only agents on this machine can reach 127.0.0.1. No public origin exists.`,
        "A URL that is not loopback answers the challenge API and serves JWKS over HTTPS.",
      ),
      later(
        "Deploy the travel test site so its APACT calls do not use a loopback address.",
        "Backlog. Skyhop's default ELAH URL is the local server (README settings table).",
        "The hosted test site calls the hosted APACT origin.",
      ),
      later(
        "Set the issuer, audience, CORS allowlist, and JWKS URL to those hosted origins.",
        "Backlog. Today's issuer and audience are the local defaults in the README settings table.",
        "Tokens and CORS use the hosted origins, and the local defaults are gone from that environment.",
      ),
      later(
        "Provision a site credential that is not the localhost default before the first public process starts.",
        "Backlog. The README has a local default site credential. Do not copy it here. No public process is running.",
        "The host uses a new credential, and the local default is absent from that environment.",
      ),
      later(
        "Run one instance only until replay and revocation are shared, so two hosts cannot split those caches.",
        "Backlog. The in-memory caches make a second instance unsafe (README). Hosting has not started, so the single-instance guard is not deployed either.",
        "The host runs one process, or shared storage is in place first.",
      ),
      later(
        "Repeat the honest-agent admission and the payment step-up check from a machine other than the developer laptop.",
        "Backlog. The 13 Oct checks ran on the local machine. A remote machine cannot reach 127.0.0.1.",
        "A second machine completes guest travel and gets step_up_required on pay.",
      ),
      later(
        "Add an uptime check for the challenge endpoint and the JWKS document.",
        "Backlog. No hosted endpoint exists to check.",
        "A check fails when either the challenge route or JWKS stops answering.",
      ),
      later(
        "Confirm the deployed widget contains no private key and that a private JWK is still rejected.",
        `Backlog for the deploy check. ${README} protocol tests already refuse private keys, and the browser key is non-extractable. That has not been re-checked on a hosted bundle.`,
        "The hosted widget bundle has no private key, and the server still rejects a private JWK.",
      ),
      later(
        "Write the hosting runbook, including the limit that cloud agents cannot call 127.0.0.1.",
        `Backlog. ${README} already states the loopback limit. A hosting runbook does not exist.`,
        "The runbook includes the loopback limit, the single-instance rule, and the credential rule.",
      ),
      later(
        "Decide whether public hosting waits for shared replay and revocation, and record that decision before choosing a host.",
        "Backlog. The decision is open on this board. No host has been chosen.",
        "A decision row is closed, and it is dated before any public process starts.",
      ),
      later(
        "Point the widget APACT base URL at configuration so a hosted origin can replace loopback without editing the exercise flow.",
        `Backlog. ${README} uses environment defaults for the local URL. The widget's hosted configuration is not separated as a deploy setting.`,
        "Changing the base URL is a configuration change, and the exercise flow stays the same.",
      ),
    ],
  },
  {
    phase: "Phase 8 — Design partners",
    workstream: "Business",
    category: "Partners",
    tasks: [
      later(
        "Write the partner profile as a site that wants guest agents to search and draft and wants payment, contracts, and export withheld.",
        `Backlog. Guest travel is the example in ${TDD} §12 and ${README}. A partner-profile page for outreach does not exist. Do not name a company.`,
        "The profile describes the site's job and the withheld functions, with no company name.",
      ),
      later(
        "State the work the partner still owns: sign-in, business policy, and final execution.",
        `Backlog. ${TDD} §2 assigns those to the partner application. It is not yet a leave-behind for a meeting.`,
        "A one-pager lists partner-owned work next to APACT-owned work.",
      ),
      doing(
        "Write a repeatable Skyhop demo script for the unverified human path, an allow_limited agent, and step-up on pay.",
        40,
        `In progress. ${README} records those three browser results on 13 Oct 2026. A script another person can follow, with expected /log rows, is not written out as a demo.`,
        "Someone else can run the three paths from the script and match the log.",
      ),
      later(
        "Add the pass limits to that script so a viewer cannot mistake admission for model identity or future safety.",
        `Backlog. The limits are in ${TDD} §1. They are not yet spoken lines in a demo script.`,
        "The script says what allow_limited does not prove, in the same breath as the green check.",
      ),
      later(
        "Draft qualification questions on catalog fit, fail-closed revocation, and whether the partner can accept an unknown operator.",
        `Backlog. ${TDD} §13 lists related open decisions. A question list for a first meeting is not written. Do not record pretend answers.`,
        "The question list exists, and the answer column is empty.",
      ),
      later(
        "Keep target accounts in the founder CRM without writing in meetings, interest, or logos that have not happened.",
        "Backlog. Investor contacts stay in RoadmapContact. No design-partner meetings are recorded in the TDD or the product README.",
        "Any new CRM row has a real source, and empty rows are not filled with interest or logos.",
      ),
      later(
        "Decide whether the first technical conversation uses guest travel or waits for the second profile.",
        "Backlog. This is the open partner decision. Guest travel is the only runnable demo.",
        "The decision row names guest travel or a wait, and it does not name a partner.",
      ),
      later(
        "Limit any future pilot data to synthetic tasks until a data-processing agreement exists.",
        `Backlog. The slice uses dummy flights and a dummy traveler (${README}). A pilot data rule for a future partner is not written.`,
        "The pilot note forbids real tickets, real payments, and real traveler records until an agreement exists.",
      ),
      done(
        "Record on this board that no design partner is selected and that the support-ticket pilot has no named partner.",
        `Done as a negative record. ${TDD} §12: no real partner has been selected or deployed by this local work. elah_investor_deck/output/Investor_Source_Brief.md (13 Oct 2026) says no named partner or live deployment is established.`,
        "This card stays done only while that sentence remains true. A real partner would be a new card with a name you can point to.",
      ),
      later(
        "Draw the one-page path from widget to APACT server to partner verifier for a technical meeting.",
        `Backlog. ${README} has a sequence diagram for the local slice. A one-page leave-behind is not separated from that README.`,
        "A single page shows widget, APACT, and the partner verifier, and it marks localhost as the current deployment.",
      ),
      later(
        "Define a pilot as meeting the TDD V1 success criterion, with no revenue target and no invented logo.",
        `Backlog. The criterion is in ${TDD} §13. A pilot definition that uses it, and that omits money and logos, is not written.`,
        "The pilot definition quotes the V1 criterion and has no revenue or logo line.",
      ),
    ],
  },
  {
    phase: "Phase 9 — Company, legal, and privacy",
    workstream: "Legal",
    category: "Privacy",
    tasks: [
      later(
        "Inventory the localhost process memory: challenges, exercise events, replay entries, tokens, and revocation status.",
        `Backlog as a privacy inventory. ${README} already says those structures are in memory and names the modules. A separate inventory memo is not written.`,
        "The memo lists each in-memory structure, what it holds, and that it dies with the process.",
      ),
      later(
        "Set retention and deletion periods for those records before any hosted pilot.",
        `Backlog. ${TDD} §10 requires retention behavior. No periods are chosen.`,
        "Each record type has a retention period and a deletion step, dated before hosting.",
      ),
      later(
        "Write a privacy note that current exercises use dummy flights and a dummy traveler, not a partner's customers.",
        `Backlog. ${README} describes mock flights and a traveler name on the exercise pages. A privacy note a partner could read does not exist.`,
        "The note says the slice data is synthetic and names what it is not.",
      ),
      later(
        "State in that note that hashing a low-entropy value is not anonymization.",
        `Backlog. ${TDD} §10 states this. It is not copied into a privacy note yet.`,
        "The privacy note includes that sentence next to the retention rules.",
      ),
      later(
        "List subprocessors as none for the localhost prototype, and open the list again only when a host is chosen.",
        "Backlog. No host is chosen, and the README does not name a subprocessor. The list itself is unwritten.",
        "The list says none today, and it has a line to revisit when a host exists.",
      ),
      later(
        "Review the licenses of the Python server dependencies and the widget before a partner is asked to install them.",
        "Backlog. pyproject.toml names FastAPI, uvicorn, cryptography, PyJWT, and httpx. A license review note is not written.",
        "A note lists each dependency's license and any obligation before a partner install.",
      ),
      later(
        "Draft demo terms that call the localhost prototype a demonstration rather than a production security control.",
        `Backlog. ${README} already says the slice is a prototype, not a security control. Demo terms a visitor would accept are not written.`,
        "The draft terms use that sentence and are labeled as a draft, not as finished legal advice.",
      ),
      later(
        "List questions for counsel on admission tokens, operator credentials, and cross-site traffic, and label the list as questions rather than advice.",
        "Backlog. No counsel memo is in the TDD or the product README. This card is a question list only.",
        "The list is labeled questions. It does not answer them.",
      ),
      later(
        "Write the incident step for a copied session key: short token life plus revocation, noting revocation is still single-process.",
        `Backlog. ${TDD} §11 discusses copied tokens. The slice can revoke inside one process (${README}). An incident step is not written.`,
        "The step says to revoke the jti, wait out the token life, and notes that revoke does not cross processes yet.",
      ),
      later(
        "Keep guest tokens on a guest-session subject in the privacy note, with no invented human principal.",
        `Backlog as privacy-note copy. The token already uses guest-session:<report_id> (${README}, ${TDD} §8).`,
        "The privacy note quotes the guest-session subject and says it is not a person.",
      ),
      later(
        "Cite the non-extractable browser key and its loss on reload in the privacy note.",
        `Backlog as privacy-note copy. ${README} already describes the non-extractable P-256 key and the reload behavior.`,
        "The privacy note says the private key stays in page memory and a reload starts APACT again.",
      ),
      later(
        "Describe what a partner data-processing agreement has to cover before dummy names are replaced with real traveler data.",
        `Backlog. ${TDD} §10 says to specify access and retention before real partner telemetry. No agreement checklist exists.`,
        "The checklist covers purpose, retention, deletion, and the ban on raw prompts in the default record.",
      ),
    ],
  },
  {
    phase: "Phase 10 — Fundraising narrative for the pivot",
    workstream: "Operations",
    category: "Narrative",
    tasks: [
      doing(
        "Update the 13 Oct 2026 investor source brief so its current-status section describes the FastAPI localhost slice.",
        40,
        "In progress. elah_investor_deck/output/Investor_Source_Brief.md (13 Oct 2026) says ELAH is a CAPTCHA for agents and uses guest travel as the example. Its current-status section still describes the page-local laboratory, not the FastAPI server, the 33 tests, or the browser-versus-reference-agent split in the product README.",
        "The current-status section names the localhost FastAPI slice, the test count, and which checks were browser versus reference agent.",
      ),
      review(
        "Keep the narrative's one-sentence description as a CAPTCHA for agents that a website installs.",
        "In review. Investor_Source_Brief.md (13 Oct 2026) already uses that sentence. A regenerated deck was not checked in this pass.",
        "The sentence in the brief and in the deck match, and neither says intention scoring.",
      ),
      review(
        "Describe guest travel in the narrative: search and draft can be allowed; payment, contract, and export stay blocked; a pass is not future behavior.",
        "In review. Investor_Source_Brief.md (13 Oct 2026) product-contract section has this example. It still needs to be checked against the deck and against the FastAPI status section.",
        "The narrative example matches the guest-travel profile and the pass limits.",
      ),
      review(
        "State in the narrative that a pass does not identify the model, prove the real user instruction, or promise future behavior.",
        "In review. Investor_Source_Brief.md (13 Oct 2026) includes this limit. Deck regeneration was not checked.",
        "The limit appears in the narrative next to any admission example.",
      ),
      later(
        "Explain the human checkbox in the narrative as a visible unverified bypass.",
        "Backlog. The product README explains the checkbox. The investor source brief's opening sections do not. The deck was not checked.",
        "The narrative says the human path is unverified on purpose.",
      ),
      later(
        "List durable storage, the partner kit, real step-up, and hosting as unfinished, so the narrative cannot skip them.",
        "Backlog. The brief says there is no production server, no authority adapter, and no live deployment. It does not list the FastAPI slice's remaining work in those four words.",
        "The narrative names those four gaps as unfinished.",
      ),
      later(
        "Read the generated deck and remove leftover intention-scoring or CS/CRM wedge claims.",
        "Backlog. The source brief says the older concept predates APACT. The generated deck files were not reviewed for leftover claims in this pass.",
        "A pass over the deck finds no intention-score product claim and no CS/CRM wedge as the current plan.",
      ),
      later(
        "Draft the answer to a scoped-API-key question, using pressure and relabel as the hypothesis under test.",
        "Backlog. The brief contrasts task exercises with signed-request identity products. It does not say the exercise's incremental value is still unmeasured. TDD §13 says to compare against scoped authorization.",
        "The answer calls pressure and relabel a hypothesis and does not quote a lift number.",
      ),
      later(
        "Leave investor CRM rows untouched and keep raise amount, revenue, and team size out of the narrative.",
        "Backlog. RoadmapContact rows are preserved by the reseed. The narrative files must not grow a raise amount, revenue, or headcount.",
        "The narrative has no raise, revenue, or team-size figure, and CRM rows are unchanged by this writing.",
      ),
      later(
        "Write the near-term effort story around the durable service, the partner kit, and step-up, with no dollar figure.",
        "Backlog. Milestones on this board are the source. A narrative paragraph that follows them is not written.",
        "The paragraph names those three efforts and contains no dollar amount.",
      ),
      later(
        "Cite aCAPTCHA and AttriGuard only as related work named in the TDD, not as a benchmark this project has run.",
        `Backlog for the narrative. ${TDD} revision history already says these papers are related prior work, not measured ELAH performance. The deck was not checked.`,
        "Any citation says related work and does not claim a comparison result.",
      ),
      later(
        "Rehearse the narrative against a live Skyhop session so each spoken claim maps to a check you can repeat.",
        "Backlog. The 13 Oct browser checks exist. A rehearsal note that maps each sentence to a check does not.",
        "Each claim in the narrative has the Skyhop path or the pytest name that supports it.",
      ),
    ],
  },
];

export const PHASE_SPECS: PhaseSpec[] = PHASE_DRAFTS.map((draft) => ({
  phase: draft.phase,
  workstream: draft.workstream,
  category: draft.category,
  tasks: draft.tasks.map((task) => task.title),
}));

const EVIDENCE = new Map<string, TaskEvidence>();
for (const draft of PHASE_DRAFTS) {
  if (draft.tasks.length < 8 || draft.tasks.length > 14) {
    throw new Error(`${draft.phase} has ${draft.tasks.length} tasks; expected 8–14.`);
  }
  const seen = new Set<string>();
  for (const task of draft.tasks) {
    if (seen.has(task.title)) {
      throw new Error(`Duplicate task in ${draft.phase}: ${task.title}`);
    }
    seen.add(task.title);
    EVIDENCE.set(`${draft.phase}||${task.title}`, task);
  }
}

export function evidenceFor(phase: string, title: string): TaskEvidence {
  const row = EVIDENCE.get(`${phase}||${title}`);
  if (!row) {
    throw new Error(`No APACT evidence for [${phase}] ${title}`);
  }
  return row;
}

export function allTaskEvidence(): { phase: string; task: TaskEvidence }[] {
  return PHASE_DRAFTS.flatMap((draft) =>
    draft.tasks.map((task) => ({ phase: draft.phase, task })),
  );
}

/** Milestone dates are calendar days chosen from 15 Oct 2026, not months-from-whenever. */
export const MILESTONE_SPECS: MilestoneSpec[] = [
  {
    order: 1,
    title: "APACT definition is the execution source of truth",
    exitCriteria:
      "TDD v0.3 states the eight fields, guest travel, the four decisions, and the pass limits. Founder acceptance of the draft is recorded, or the file still says working draft and this milestone stays open.",
    targetDate: "2026-10-29",
    evidence: `${TDD}. Drive synchronization noted 2026-10-09. Acceptance line not in the file.`,
  },
  {
    order: 2,
    title: "Thin guest-travel slice checked on localhost",
    exitCriteria:
      "Widget, APACT server, Skyhop, and the 33 tests match the 13 Oct 2026 README. The pressure-page Pay browser click is the remaining gap.",
    targetDate: "2026-10-22",
    evidence: `${README}. Repo ${GH}.`,
  },
  {
    order: 3,
    title: "Challenge, replay, and revocation storage is shared",
    exitCriteria:
      "A restart and a second process do not drop or split those stores, and revocation still fails closed when the store cannot be read.",
    targetDate: "2026-12-15",
    evidence: null,
  },
  {
    order: 4,
    title: "A partner can integrate from the kit",
    exitCriteria:
      "A second developer can verify DPoP and scope from the kit without reading Skyhop internals, and the human checkbox is documented as unverified.",
    targetDate: "2027-01-31",
    evidence: null,
  },
  {
    order: 5,
    title: "Step-up is a real approval path or still explicitly absent",
    exitCriteria:
      "Either a partner approval screen issues a new limited grant, or the board still says the slice only returns step_up_required with no approval flow.",
    targetDate: "2027-02-28",
    evidence: `${README}: no approval flow in the 13 Oct slice.`,
  },
  {
    order: 6,
    title: "A second task profile is specified and tested, or explicitly deferred",
    exitCriteria:
      "One profile besides guest travel has a catalog, exercises, and tests, or a written deferral says guest travel remains the only profile.",
    targetDate: "2027-03-31",
    evidence: null,
  },
  {
    order: 7,
    title: "Adversarial note covers pressure, relabel, replay, revocation, and the human checkbox",
    exitCriteria:
      "The note says what was run, on one process or in the browser, and it does not turn fixture results into a model-safety claim.",
    targetDate: "2027-03-15",
    evidence: null,
  },
  {
    order: 8,
    title: "A non-local agent can reach APACT, or hosting is explicitly deferred",
    exitCriteria:
      "A machine other than the laptop completes guest travel against HTTPS APACT, or the hosting decision says to stay on localhost until storage is shared.",
    targetDate: "2027-04-30",
    evidence: null,
  },
  {
    order: 9,
    title: "Design-partner criteria exist and no partner is claimed",
    exitCriteria:
      "Profile, demo script, and qualification questions exist. The partner count stays at zero until a real name is on a card.",
    targetDate: "2026-12-01",
    evidence: `${TDD} §12: no partner selected.`,
  },
  {
    order: 10,
    title: "Prototype privacy note and demo terms are drafted",
    exitCriteria:
      "The draft covers the in-memory inventory, dummy travel data, and demo terms, and it is labeled as a draft rather than legal advice.",
    targetDate: "2026-12-15",
    evidence: null,
  },
  {
    order: 11,
    title: "Fundraising narrative matches the APACT slice",
    exitCriteria:
      "The narrative says CAPTCHA for agents, describes the localhost slice limits, and contains no raise amount, revenue, team size, or invented customer.",
    targetDate: "2026-11-30",
    evidence:
      "Investor_Source_Brief.md dated 13 Oct 2026. Current-status section still describes the page-local lab.",
  },
];
