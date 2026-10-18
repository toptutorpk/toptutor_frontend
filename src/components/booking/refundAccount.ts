import { normaliseMsisdn } from '@/services/paymentService';
import type { RefundMethod } from '@/services/refundService';

/** Where a refund should go, as typed. */
export interface RefundAccount {
  method: RefundMethod;
  title: string;
  /** Wallet mobile number, or IBAN grouped in fours. */
  number: string;
  bankName: string;
}

export const EMPTY_REFUND_ACCOUNT: RefundAccount = {
  method: 'EASYPAISA',
  title: '',
  number: '',
  bankName: '',
};

/** The account in the shape the server takes. */
export function refundAccountPayload(a: RefundAccount) {
  return {
    method: a.method,
    bankName: a.method === 'BANK' ? a.bankName.trim() : undefined,
    accountTitle: a.title.trim(),
    accountNumber: a.method === 'BANK' ? a.number.replace(/\s/g, '').toUpperCase() : a.number,
  };
}

/** Groups an IBAN in fours as it's typed: 'pk36scbl…' → 'PK36 SCBL …'. */
export function formatIban(raw: string): string {
  return raw
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 24)
    .replace(/(.{4})/g, '$1 ')
    .trim();
}

/** The same checks the server makes. Null when the account looks right. */
export function validateRefundAccount({
  method,
  title,
  number,
  bankName,
}: RefundAccount): string | null {
  if (method === 'BANK' && bankName.trim().length < 2) return 'Enter your bank’s name.';
  if (!/^\p{L}[\p{L} .'&()-]{1,119}$/u.test(title.trim().replace(/\s+/g, ' '))) {
    return 'Enter the account title as it appears on the account.';
  }
  if (method === 'BANK') {
    const iban = number.replace(/\s/g, '').toUpperCase();
    if (!/^PK\d{2}[A-Z]{4}[A-Z0-9]{16}$/.test(iban))
      return 'Enter a Pakistani IBAN — 24 characters starting with PK.';
    if (!ibanChecksumValid(iban))
      return 'That IBAN doesn’t look right — please check it against your bank app.';
    return null;
  }
  return normaliseMsisdn(number) ? null : 'Enter the mobile number as 03XX XXXXXXX.';
}

/** ISO 13616 mod-97, computed in chunks so it needs no BigInt. */
function ibanChecksumValid(iban: string): boolean {
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const digits = rearranged.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let remainder = 0;
  for (let i = 0; i < digits.length; i += 7) {
    remainder = Number(String(remainder) + digits.slice(i, i + 7)) % 97;
  }
  return remainder === 1;
}
