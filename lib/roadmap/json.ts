/** Parse JSON array fields stored as strings in SQLite. */
export function parseJsonArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function stringifyJsonArray(values: string[]): string {
  return JSON.stringify(values ?? []);
}
