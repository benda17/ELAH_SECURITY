/**
 * Shared by Banking and Founder (same GitHub repo, two Vercel projects).
 * Exit 0 = skip this deployment. Exit 1 = build.
 *
 * Founder production URL contains "elahfounderplatform".
 * Banking production URL contains "elahbankingsystem".
 */
const fs = require("node:fs");
const path = require("node:path");

const pkg = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8"),
).name;
const ref = process.env.VERCEL_GIT_COMMIT_REF || "";
const haystack = [
  process.env.VERCEL_PROJECT_PRODUCTION_URL,
  process.env.VERCEL_URL,
  process.env.VERCEL_BRANCH_URL,
  process.env.VERCEL_PROJECT_NAME,
]
  .filter(Boolean)
  .join(" ")
  .toLowerCase();
console.log(`vercel-ignore-build haystack=${haystack || "(empty)"}`);

const FOUNDER_PKG = "elah-analytics-dashboard";
const BANKING_PKG = "elah-banking-simulation";
const founderRefs = new Set(["ELAH_FOUNDER_PLATFORM", "analytics-dashboard"]);
const bankingRefs = new Set(["ELAH_BANKING_SYSTEM", "feature/elah-banking-system"]);

const isFounderProject = /elahfounderplatform|founderplatform/.test(haystack);
const isBankingProject = /elahbankingsystem|bankingsystem/.test(haystack);

function skip(reason) {
  console.log(`🛑 skip build: ${reason} (pkg=${pkg} ref=${ref})`);
  process.exit(0);
}
function build(reason) {
  console.log(`✅ build: ${reason} (pkg=${pkg} ref=${ref})`);
  process.exit(1);
}

if (isFounderProject) {
  if (pkg !== FOUNDER_PKG) skip("founder project cloned the banking tree");
  if (!founderRefs.has(ref)) skip(`founder project ignoring branch ${ref || "(empty)"}`);
  build("founder platform");
}

if (isBankingProject) {
  if (pkg !== BANKING_PKG) skip("banking project cloned the founder tree");
  if (!bankingRefs.has(ref)) skip(`banking project ignoring branch ${ref || "(empty)"}`);
  build("banking simulation");
}

if (pkg === FOUNDER_PKG && founderRefs.has(ref)) build("founder fallback (no project URL)");
if (pkg === BANKING_PKG && bankingRefs.has(ref)) build("banking fallback (no project URL)");
skip("unrecognized Vercel project or branch");
