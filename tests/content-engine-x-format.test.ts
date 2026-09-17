import assert from "node:assert/strict";
import {
  buildTwitterClipboardText,
  MAX_X_POST_CHARS,
  toTweetText,
  xPostCharacterCount,
} from "../lib/founder/content-engine/format-post";

const short = buildTwitterClipboardText("Intent should be verified before tools.", [
  "AgentSecurity",
]);
assert.equal(short, "Intent should be verified before tools.\n\n#AgentSecurity");
assert.ok(xPostCharacterCount(short) <= MAX_X_POST_CHARS);

const long = buildTwitterClipboardText(
  "ELAH scores genuine intent before support and CRM tools. ".repeat(12),
  ["AgentSecurity", "CustomerSupport"],
);
assert.ok(xPostCharacterCount(long) <= MAX_X_POST_CHARS);
assert.ok(long.endsWith("…\n\nhttps://www.elahsecurity.com"));

const emoji = toTweetText("🔐".repeat(400));
assert.ok(xPostCharacterCount(emoji) <= MAX_X_POST_CHARS);

console.log("content-engine X formatting tests passed");
