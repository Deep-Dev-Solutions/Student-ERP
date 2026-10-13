// Fixed locale so the server and the browser print the same digits.
const numberFormat = new Intl.NumberFormat("en-US");

/** 12500 → "12,500" */
export function formatNumber(value: number) {
  return numberFormat.format(value);
}

/** 12500 → "Rs 12,500" */
export function formatRupees(value: number) {
  return `Rs ${formatNumber(value)}`;
}

/** Short form for headline figures: 1250000 → "Rs 1.25M", 145000 → "Rs 145K". */
export function formatRupeesCompact(value: number) {
  if (value >= 1_000_000) return `Rs ${(value / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`;
  if (value >= 1_000) return `Rs ${Math.round(value / 1_000)}K`;
  return `Rs ${value}`;
}

/** 94 → "94%" */
export function formatPercent(value: number) {
  return `${value}%`;
}

/** Any Pakistani mobile ("03001234567", "+92 300 1234567") → "0300-1234567". Other input is returned as is. */
export function formatPhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  const local = digits.startsWith("92") ? `0${digits.slice(2)}` : digits;
  return /^03\d{9}$/.test(local) ? `${local.slice(0, 4)}-${local.slice(4)}` : raw;
}

/** "2026-10-13" → "13 Oct 2026" */
export function formatDate(isoDate: string) {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
