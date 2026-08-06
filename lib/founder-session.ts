/** Edge + Node compatible founder session helpers. */

export const FOUNDER_COOKIE = "elah_founder_session";
export const FOUNDER_USERNAME = "bnd";
export const FOUNDER_PASSWORD = "elah_founder";

function sessionSecret() {
  return (
    process.env.FOUNDER_AUTH_SECRET ||
    process.env.AUTH_SECRET ||
    "elah-founder-platform-gate-v1"
  );
}

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function makeFounderSessionToken(): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(sessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    enc.encode(`${FOUNDER_USERNAME}:authenticated`),
  );
  return toHex(sig);
}

export async function isFounderSessionToken(
  token: string | undefined | null,
): Promise<boolean> {
  if (!token) return false;
  const expected = await makeFounderSessionToken();
  if (token.length !== expected.length) return false;
  let ok = 0;
  for (let i = 0; i < token.length; i++) {
    ok |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return ok === 0;
}

export function credentialsMatch(username: string, password: string) {
  return username === FOUNDER_USERNAME && password === FOUNDER_PASSWORD;
}
