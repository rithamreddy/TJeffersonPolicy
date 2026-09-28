/**
 * CSV output shared by every officer export.
 *
 * Exports are opened in Excel or Google Sheets, and both evaluate a cell that
 * begins with `=`, `+`, `-` or `@` as a formula. Member-typed text — a form
 * answer, a registration note — could therefore run as a formula on an
 * officer's machine (CSV injection). Every cell is prefixed with an apostrophe
 * when it starts with one of those characters, which spreadsheets treat as
 * "this is text".
 */
export function csvCell(value: string): string {
  const guarded = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${guarded.replace(/"/g, '""')}"`;
}

/** Header plus rows, CRLF-separated as RFC 4180 specifies. */
export function toCsv(header: readonly string[], rows: readonly (readonly string[])[]): string {
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}
