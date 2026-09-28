/**
 * School-timezone wall clock <-> UTC instants.
 *
 * A `date` / `datetime-local` input has no timezone of its own. Read naively,
 * a deadline typed as "11:59 PM" would be saved against whatever zone the
 * machine runs in — UTC on Cloudflare Workers — and land 4–5 hours off. These
 * helpers anchor every typed time to the school's zone instead.
 *
 * Shared by the tournament form and the form builder's close date.
 */

export const SCHOOL_TIME_ZONE = "America/New_York";
const TIME_ZONE = SCHOOL_TIME_ZONE;

/** How far `timeZone` sits from UTC at a given instant, in milliseconds. */
export function zoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(instant);

  const at = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? "0");
  // hour comes back as 24 at midnight under hour12:false in some engines.
  const asUtc = Date.UTC(at("year"), at("month") - 1, at("day"), at("hour") % 24, at("minute"), at("second"));

  return asUtc - instant.getTime();
}

/**
 * Read a `date` or `datetime-local` value as school-timezone wall clock and
 * return the corresponding UTC instant.
 */
export function wallClockToIso(value: string): string | undefined {
  if (!value) return undefined;

  const [datePart, timePart = "00:00"] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  if ([year, month, day, hour, minute].some((part) => !Number.isFinite(part))) return undefined;

  const naiveUtc = Date.UTC(year, month - 1, day, hour, minute);
  // Two passes so an instant sitting near a DST transition resolves against
  // the offset actually in force on the far side of it.
  const firstPass = new Date(naiveUtc - zoneOffsetMs(new Date(naiveUtc), TIME_ZONE));
  return new Date(naiveUtc - zoneOffsetMs(firstPass, TIME_ZONE)).toISOString();
}

/** Render a stored instant as the school-timezone wall clock the inputs expect. */
export function isoToWallClock(iso: string | null | undefined, withTime: boolean): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const at = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
  const base = `${at("year")}-${at("month")}-${at("day")}`;
  return withTime ? `${base}T${String(Number(at("hour")) % 24).padStart(2, "0")}:${at("minute")}` : base;
}
