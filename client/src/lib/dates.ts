/**
 * Dates as the school sees them. `toISOString()` is in UTC, so in Pakistan
 * (UTC+5) it gives yesterday's date between midnight and 5 AM; use these instead.
 */

/** The local calendar date, "YYYY-MM-DD". */
export const localISODate = (d: Date = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
