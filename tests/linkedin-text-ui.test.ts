import assert from "node:assert/strict";
import {
  applyLinkedInTextUi,
  fromLinkedInBold,
  hasLinkedInBold,
  toLinkedInBold,
  toTweetText,
} from "../lib/founder/content-engine/format-post";
import { V2_DRAFTS, V2_SOURCE_TOPICS } from "../lib/founder/content-engine/v2-content";

const introducing = toLinkedInBold("Introducing Dave.");
assert.equal(introducing, "𝗜𝗻𝘁𝗿𝗼𝗱𝘂𝗰𝗶𝗻𝗴 𝗗𝗮𝘃𝗲.");
assert.equal(fromLinkedInBold(introducing), "Introducing Dave.");
assert.equal(hasLinkedInBold(introducing), true);

const shaped = applyLinkedInTextUi(`**Introducing Dave.**

Sometimes it is attention.
Judgment.
**And one precise move.**

**The giant has changed.**
**The principle has not.**`);

assert.equal(
  shaped,
  `${toLinkedInBold("Introducing Dave.")}

Sometimes it is attention.
Judgment.
${toLinkedInBold("And one precise move.")}

${toLinkedInBold("The giant has changed.")}
${toLinkedInBold("The principle has not.")}`,
);
assert.equal(applyLinkedInTextUi(shaped), shaped);

const numbered = applyLinkedInTextUi(
  "The declaration has eight fields.\n\n1. Session key: a public key. Private keys are refused.\n\nhttps://www.elahsecurity.com",
);
const numberedPlain = fromLinkedInBold(numbered);
assert.match(numberedPlain, /1\. Session key: a public key\./);
assert.equal(
  numberedPlain.split("\n").some((line) => line.trim() === "1."),
  false,
);
assert.ok(numbered.endsWith("https://www.elahsecurity.com"));
assert.equal(toLinkedInBold("https://www.elahsecurity.com"), "https://www.elahsecurity.com");

const specSlice = /eight fields|flight\.search|traveler\.draft|boundary_violated|guest\/current/i;

for (const draft of V2_DRAFTS) {
  const styled = applyLinkedInTextUi(draft.body);
  assert.equal(hasLinkedInBold(styled), true, draft.title);
  assert.equal(applyLinkedInTextUi(styled), styled, draft.title);
  assert.ok(styled.includes("https://www.elahsecurity.com"), draft.title);
  assert.equal(styled.includes("**"), false, draft.title);
  assert.equal(specSlice.test(draft.body), false, draft.title);
  const words = draft.body.replace(/https?:\/\/\S+/g, "").split(/\s+/).filter(Boolean);
  assert.ok(words.length >= 120, `${draft.title} is ${words.length} words`);
}

for (const topic of V2_SOURCE_TOPICS) {
  assert.match(topic.summary, /^Research angle:/, topic.title);
  assert.equal(specSlice.test(topic.summary), false, topic.title);
  assert.ok(
    V2_DRAFTS.some((draft) => draft.title === topic.title),
    topic.title,
  );
}

const tweet = toTweetText(`${toLinkedInBold("Stay inside the declaration.")}\n\nhttps://www.elahsecurity.com`);
assert.equal(tweet.includes("Stay inside the declaration."), true);
assert.equal(hasLinkedInBold(tweet), false);

console.log("linkedin text ui ok");
