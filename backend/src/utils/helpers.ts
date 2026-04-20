import crypto from 'crypto';

/** Generate numeric OTP code. */
export function generateOtp(length: number = 6): string {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[crypto.randomInt(0, digits.length)];
  }
  return otp;
}

/** Generate order code: DG-YYMMDD-XXXX */
export function generateOrderCode(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const rand = crypto.randomInt(1000, 9999);
  return `DG-${yy}${mm}${dd}-${rand}`;
}

/** Normalize phone to 628xxxxxxxxxx */
export function normalizePhone(input: string): string {
  let cleaned = input.replace(/[\s\-\(\)]/g, '');
  if (cleaned.startsWith('+')) cleaned = cleaned.substring(1);
  if (cleaned.startsWith('0')) cleaned = '62' + cleaned.substring(1);
  return cleaned;
}
