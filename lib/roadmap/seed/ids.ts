/** Stable roadmap task ids. Shared by the APACT seed and the Phase 7 compatibility export. */

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export function taskIdFor(phaseIndex: number, title: string): string {
  return `task-${phaseIndex}-${slugify(title)}`.slice(0, 64);
}
