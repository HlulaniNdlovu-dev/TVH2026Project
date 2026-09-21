// Normalise South African numbers so +27 82 123 4567 and 082 123 4567 are the same login.
export function normalizePhone(input) {
  let digits = String(input || '').replace(/\D/g, '');
  if (digits.startsWith('27') && digits.length === 11) digits = `0${digits.slice(2)}`;
  return digits;
}
