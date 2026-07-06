export function validatePakistaniPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  // 03XXXXXXXXX (11 digits) or +92 3XX XXXXXXX (12 digits starting 92)
  if (digits.length === 11 && digits.startsWith("03")) return true;
  if (digits.length === 12 && digits.startsWith("923")) return true;
  return false;
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("92")) return "0" + digits.slice(2);
  return digits;
}
