/** Clears cached founder pages after a subscriber, Gmail, or connection change. */

export function invalidateSettingsPageCache(): void {
  const g = globalThis as typeof globalThis & { __elahSettingsPage?: unknown };
  g.__elahSettingsPage = undefined;
}

export function invalidateNewsletterPageCache(): void {
  const g = globalThis as typeof globalThis & { __elahNewsletterPage?: unknown };
  g.__elahNewsletterPage = undefined;
  invalidateSettingsPageCache();
}
