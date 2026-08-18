import { api, setToken } from "./api";

export async function login(username: string, password: string) {
  const result = await api<{ ok: boolean; token: string; username: string }>(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ username, password }),
    },
  );
  await setToken(result.token);
  return result;
}

export async function logout() {
  try {
    await api("/api/auth/logout", { method: "POST" });
  } catch {
    /* still clear local token */
  }
  await setToken(null);
}
