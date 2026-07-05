/** Serializes rows to CSV, quoting/escaping values that contain commas, quotes, or newlines. */
export function toCsv(rows: readonly object[], columns: string[]): string {
  const esc = (val: unknown): string => {
    const s = val === null || val === undefined ? '' : String(val);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.map(esc).join(',');
  const lines = rows.map((r) => columns.map((c) => esc((r as Record<string, unknown>)[c])).join(','));
  return [header, ...lines].join('\n');
}

/** Triggers a client-side download of CSV content. */
export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
