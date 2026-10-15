/**
 * ELAH V2 post angles and finished LinkedIn drafts.
 * Each draft is a company post. It is not a section of the TDD or the concept page.
 * Hand-written. Do not send these strings to an LLM from this module.
 */

export type V2SourceTopic = {
  title: string;
  summary: string;
};

export const V2_SOURCE_TOPICS: V2SourceTopic[] = [
  {
    title: "The checkbox still asks the old question",
    summary:
      "Research angle: human-checkboxes such as \"I'm not a robot.\" An agent can complete them. The resulting cookie does not say what job the agent was given, or whether this action sits inside a limited permission. Write the post about that failed question. General pattern only unless a citation is certain.",
  },
  {
    title: "Bot walls were built to keep software out",
    summary:
      "Research angle: bot management and login products still stop at the front door. Customers now want agents inside a portal for a specific action. A suspicion score on the session does not say which action was permitted. Tie it to a check at the protected action, not to a product manual.",
  },
  {
    title: "The page can talk the agent past the job",
    summary:
      "Research angle: indirect prompt injection. Untrusted content in a ticket, document, email, or on-page banner can steer a tool-using agent toward an action the user did not approve. OWASP treats prompt injection as a real class of failure. Do not invent a victim, a statistic, or a paper. The control is a permission the page cannot edit.",
  },
  {
    title: "A login is not a mandate",
    summary:
      "Research angle: agents operating inside B2B portals with a user session or a broad API key. Authentication of the account is not approval of this export, this setting change, or this write. OAuth already taught narrow scope. Do not invent a breach.",
  },
  {
    title: "Scope has to be shorter than the prompt",
    summary:
      "Research angle: teams try to constrain agents with careful instructions. The protected site cannot enforce a sentence it never saw. Contrast an instruction with a grant the site can refuse: action, resource, expiry, key. A wider action needs a new approval.",
  },
  {
    title: "After-the-fact logs are not a gate",
    summary:
      "Research angle: audit trails that explain an agent action only after it has run. Detection is not a control that can say no. Security leaders need the check at the request: signature, audience, expiry, scope, and revocation that fails closed.",
  },
  {
    title: "Knowing the model is not knowing the permission",
    summary:
      "Research angle: a vendor name or a self-generated key gets treated as trust. The model provider, the operator, and the person who delegated the task are different parties. Key possession is not the user's limit for this site. Do not claim the check identifies the model.",
  },
  {
    title: "Useful agents need a door, not a puzzle",
    summary:
      "Research angle: legitimate agents are sent to do bounded work, and human puzzles do not establish permission. A broad credential does not establish it either. The question at the site is whether this key carries a valid limited grant for this action, now. A puzzle is not that decision.",
  },
];

export type V2DraftSeed = {
  title: string;
  /** Unpublished V2 row to overwrite. The previous generator stored a spec section under this title. */
  replacesTitle?: string;
  body: string;
  hashtags: string[];
  status: "draft";
  era: "v2";
};

const LANDING = "https://www.elahsecurity.com";

export const V2_DRAFTS: V2DraftSeed[] = [
  {
    title: "The checkbox still asks the old question",
    replacesTitle: "The human checkbox is not a check",
    hashtags: ["#ELAH", "#AIAgents", "#AgentSecurity"],
    status: "draft",
    era: "v2",
    body: `**An agent can check "I'm not a robot."**

The box was built for a person with a mouse. Click it, and the site sets a cookie and moves on. Agents now browse, book, and change accounts for someone else. They can check the same box. The cookie still does not say what job they were given, or whether this action sits inside it.

Bot-detection products can flag traffic that looks automated. A login can tell you a user authenticated. Neither one, by itself, tells a protected site that this request is a known agent inside a limited permission.

That is the check worth making before the action runs. A short-lived grant, bound to the agent key, either covers this request or it does not. Miss the scope, and the site should get a reason instead of a pass. The check does not read the agent's private reasoning, and one allowed attempt is not a blank check for the next one.

**A checkbox answers "are you human?" The site still has to answer whether this action is allowed.**

${LANDING}`,
  },
  {
    title: "Bot walls were built to keep software out",
    replacesTitle: "A token is not a promise of the next action",
    hashtags: ["#ELAH", "#B2BSaaS", "#AgentAccess"],
    status: "draft",
    era: "v2",
    body: `**The wall at the front door cannot see the action.**

For years the job was to keep software out. That breaks when a customer wants an agent inside: read their own tickets, file one they approved, change one setting they confirmed. A suspicion score on the session does not say which of those actions was permitted.

Identity can authenticate the person. An agent platform can connect a model to tools. The protected site is still the one that has to decide, request by request, whether this call stays inside the grant.

ELAH is that decision point for the site. It checks a signed request against a short-lived permission: this key, this site, these actions, this expiry. The platform keeps the last word. It can proceed, ask for a fresh approval, or refuse. The verifier does not replace that policy, and it does not claim to see what the model was thinking.

**Let the agent in for the action that was approved. Do not hand it the account.**

${LANDING}`,
  },
  {
    title: "The page can talk the agent past the job",
    replacesTitle: "Pay now is a boundary test",
    hashtags: ["#ELAH", "#PromptInjection", "#AISecurity"],
    status: "draft",
    era: "v2",
    body: `**The dangerous instruction is often already on the page.**

Indirect prompt injection does not need a new piece of malware. A ticket, a document, or a line in the flow can tell an agent to pay, export, or widen a setting the user never approved. The agent is trying to be helpful. The site only sees the request that comes out the other side.

OWASP's work on LLM applications treats prompt injection as its own class of failure: untrusted content steering a system that can use tools. Where a specific incident is not one you can stand behind, the pattern is the point. A longer system prompt does not close it. The page can keep talking.

The receiving site needs a permission that is narrower than that page, checked before the action runs. A request outside the grant is a refusal, not a successful call with a note in a log. The check does not reveal the model's hidden reasoning.

**If the page can talk, the permission has to live somewhere the page cannot edit.**

${LANDING}`,
  },
  {
    title: "A login is not a mandate",
    replacesTitle: "Guest travel stops before payment",
    hashtags: ["#ELAH", "#LeastPrivilege", "#AgentSecurity"],
    status: "draft",
    era: "v2",
    body: `**A session proves someone signed in. It does not prove this action.**

Agents in business portals often arrive with a cookie or a broad API key. From the site's point of view the call is authenticated. It can also be an export, a cross-tenant read, or a setting change nobody approved for this task.

Delegated access is older than agents. OAuth already pushed the industry toward a narrow scope instead of a shared password. Agents make the miss more expensive, because one instruction can chain searches and writes before a person is watching.

A grant has to name the key, the site, the actions, and the expiry. A request outside it does not become allowed because the login is valid. If the site cannot confirm the grant is still good, the call should stop. None of that identifies the model, and none of it reconstructs the user's private prompt.

**Authenticate the account. Then authorize the action. They are not the same check.**

${LANDING}`,
  },
  {
    title: "Scope has to be shorter than the prompt",
    replacesTitle: "Eight fields, in plain language",
    hashtags: ["#ELAH", "#AIAgents", "#LeastPrivilege"],
    status: "draft",
    era: "v2",
    body: `**An instruction is not a control.**

Teams write careful prompts. Only search. Do not pay. Do not export. The agent may follow them. The protected site cannot enforce a sentence it never saw, and it should not have to trust one it did.

What the site can refuse is a grant it can read: which actions, on which resource, until when, for which key. Finishing the safe part of a task does not add the action that was left out. A wider action needs a new approval, not a quiet edit of the old one.

ELAH is built around that boundary. It verifies the signed request against the permission. It does not score private intent, and a pass is evidence about this attempt only. The entrance that exists today runs locally, on mock flows. It is not a production deployment.

**Write the limit where the site can refuse the call.**

${LANDING}`,
  },
  {
    title: "After-the-fact logs are not a gate",
    replacesTitle: "The exercises do nothing on purpose",
    hashtags: ["#ELAH", "#SecurityEngineering", "#AIAgents"],
    status: "draft",
    era: "v2",
    body: `**A clear log of a bad action is still a bad action.**

Incident review matters. It does not put the money back, unsend the export, or undo a setting that already changed. Agent traffic makes this sharper. The steps are fast, and the person who delegated the task may not be watching the screen.

Security teams already separate detection from a control that can say no. Agent access needs the second one at the request: a signature, the right site, a live expiry, the allowed actions, and a revocation check that stops the call when status cannot be read.

ELAH returns that decision before the protected action. Verified, needs a fresh approval, or rejected, with a reason. The site's own policy still decides what a verified call may do. The record is of the authorization and the attempt, not a transcript of the model's reasoning.

**Review explains what happened. The gate has to exist before it happens.**

${LANDING}`,
  },
  {
    title: "Knowing the model is not knowing the permission",
    replacesTitle: "Find, Total, Continue",
    hashtags: ["#ELAH", "#AgentIdentity", "#AISecurity"],
    status: "draft",
    era: "v2",
    body: `**"It came from a known vendor" is not a permission.**

The company that operates an agent, the lab that trained the model, and the person who delegated a task can all be different. A key the agent generated can prove that this caller holds the key. It does not prove who sent the agent. A vendor name on the request does not carry the user's limit for this site.

Treating the brand of the model as the trust decision leaves a familiar hole. The call looks legitimate, and the scope was never checked. A compromised key and a careful one get the same door.

Bind the grant to the key that must sign the request, to this site, and to the actions that were actually approved. A proof made for another address, another key, or a second time should fail. Possession can be checked. The name of the model cannot be inferred from that check, and should not be claimed.

**Trust the grant you can verify. Do not trust the logo on the agent.**

${LANDING}`,
  },
  {
    title: "Useful agents need a door, not a puzzle",
    replacesTitle: "A CAPTCHA for agents, not for humans",
    hashtags: ["#ELAH", "#AgentCAPTCHA", "#VerifiedAccess"],
    status: "draft",
    era: "v2",
    body: `**A puzzle for humans is a strange way to admit an agent.**

Legitimate agents are sent to do bounded work. A ticket. A comment the customer approved. One change in an account. Stopping them with a checkbox, or with a challenge built for a person, does not establish permission. Letting them reuse a broad credential does not establish it either.

The question at the protected site is narrower. Does this key carry a valid, limited grant for this action, right now. Unknown, replayed, or over-scoped automation does not get that path. Solving a puzzle would not prove the user approved the action. ELAH does not ask a good agent to solve one.

What it offers is a verifiable path for the action that was approved. It does not read private reasoning, and it does not replace the platform's own policy. The build in hand is a local prototype. No partner is running on it.

**Give the useful agent a door with a scope. Do not hand it the building.**

${LANDING}`,
  },
];
