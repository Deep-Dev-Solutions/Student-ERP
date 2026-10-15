/*
 * Input masks for Pakistani ID and phone numbers. Each takes whatever was
 * typed or pasted and returns the formatted value, so "3520212345671"
 * becomes "35202-1234567-1" as the user types.
 */

const digits = (value: string) => value.replace(/\D/g, "");

/** CNIC and B-form: 12345-1234567-1 */
export function maskCnic(value: string) {
  const d = digits(value).slice(0, 13);
  if (d.length <= 5) return d;
  if (d.length <= 12) return `${d.slice(0, 5)}-${d.slice(5)}`;
  return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}`;
}

/** Mobile: 0300-1234567. A leading +92 or 92 becomes 0. */
export function maskMobile(value: string) {
  let d = digits(value);
  if (d.startsWith("92")) d = `0${d.slice(2)}`;
  d = d.slice(0, 11);
  return d.length <= 4 ? d : `${d.slice(0, 4)}-${d.slice(4)}`;
}

export const CNIC_PATTERN = /^\d{5}-\d{7}-\d$/;
export const MOBILE_PATTERN = /^03\d{2}-\d{7}$/;
