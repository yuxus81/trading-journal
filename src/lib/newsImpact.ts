/**
 * A news entry on a trade is either the plain tag name (legacy / base color)
 * or `Name|red` / `Name|orange` — the same event picked as a red or orange
 * folder. Stored inside the existing string[] so no DB migration is needed.
 */
export const NEWS_IMPACTS = ['red', 'orange'] as const;
export type NewsImpact = (typeof NEWS_IMPACTS)[number];

export const IMPACT_LABEL: Record<NewsImpact, string> = { red: 'Rot', orange: 'Orange' };

export function splitNews(entry: string): { name: string; impact: NewsImpact | null } {
  const i = entry.lastIndexOf('|');
  if (i > 0) {
    const suffix = entry.slice(i + 1);
    if ((NEWS_IMPACTS as readonly string[]).includes(suffix)) {
      return { name: entry.slice(0, i), impact: suffix as NewsImpact };
    }
  }
  return { name: entry, impact: null };
}

export function joinNews(name: string, impact: NewsImpact | null): string {
  return impact ? `${name}|${impact}` : name;
}

/** Human-readable form for exports. */
export function newsLabel(entry: string): string {
  const { name, impact } = splitNews(entry);
  return impact ? `${name} (${IMPACT_LABEL[impact]})` : name;
}
