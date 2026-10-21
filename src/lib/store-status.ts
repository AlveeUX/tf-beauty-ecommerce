export type Hours = { open: string; close: string };

/** "20:00" -> "8:00 PM" */
export function formatClock(time: string): string {
  const [h = "0", m = "00"] = time.split(":");
  const hour = Number(h);
  return `${hour % 12 === 0 ? 12 : hour % 12}:${m} ${hour < 12 ? "AM" : "PM"}`;
}

/** Minutes since midnight in the store's own time zone. */
function minutesNow(now: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return get("hour") * 60 + get("minute");
}

const toMinutes = (time: string) => {
  const [h = "0", m = "0"] = time.split(":");
  return Number(h) * 60 + Number(m);
};

/**
 * "Open · Closes 8:00 PM" / "Closed · Opens 10:00 AM" (Figma 3:24566). The hours are the same every day;
 * per-day opening hours are a buyer extension.
 */
export function storeStatus(
  hours: Hours,
  timeZone: string,
  now: Date,
): { open: boolean; text: string } {
  const minutes = minutesNow(now, timeZone);
  const open = minutes >= toMinutes(hours.open) && minutes < toMinutes(hours.close);
  return open
    ? { open, text: `Closes ${formatClock(hours.close)}` }
    : { open, text: `Opens ${formatClock(hours.open)}` };
}
