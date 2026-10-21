import { http } from '@/api/client';
import { catalogService, type CatalogItem } from '@/services/catalogService';

/* ============================================================================
   Payout account — where a tutor's earnings are sent.

   The account number leaves the browser once, on save, and never comes back:
   the server stores it encrypted and returns only a masked form. There is
   deliberately no type here that could hold the full number on a read — the
   one exception is the admin reveal, which is a separate, audited call.
   ========================================================================== */

export type PayoutMethod = 'MOBILE_WALLET' | 'BANK';
/** ACTIVE the moment the tutor verifies their email code; REJECTED only by an admin. */
export type PayoutAccountStatus = 'ACTIVE' | 'REJECTED';

export interface PayoutAccountView {
  /** False until the tutor has set one up. */
  configured: boolean;
  method?: PayoutMethod;
  /** The bank or wallet's display name. */
  provider?: string;
  accountTitle?: string;
  /** e.g. `••••4567`. The only form of the number the API ever returns. */
  maskedNumber?: string;
  status?: PayoutAccountStatus;
  /** Why an admin blocked it, when they have said. */
  reviewNotes?: string;
  /** True while the account is too newly changed to receive money. */
  coolingOff: boolean;
  /** ISO instant the cooling-off window ends; absent once it has. */
  payableFromIso?: string;
  coolOffHours: number;
  /** False when verification is not complete enough to register an account. */
  eligible: boolean;
  ineligibleReason?: string;
}

export interface SavePayoutAccountRequest {
  method: PayoutMethod;
  provider: string;
  accountTitle: string;
  accountNumber: string;
}

/** One entry in an account's change history. */
export interface PayoutAuditEntry {
  id: number;
  action: 'CREATED' | 'CHANGED' | 'APPROVED' | 'REJECTED' | 'REVEALED';
  actorAccountId?: number;
  detail?: string;
  last4?: string;
  createdAtIso: string;
}

/** A payout account as the admin console shows it. Still masked. */
export interface AdminPayoutAccount {
  tutorAccountId: number;
  tutorName: string;
  tutorEmail: string;
  method: PayoutMethod;
  provider: string;
  accountTitle: string;
  maskedNumber: string;
  status: PayoutAccountStatus;
  reviewNotes?: string;
  /** False when the account title is not the tutor's verified name. */
  titleMatched: boolean;
  /** True when another tutor is already registered against this number. */
  numberShared: boolean;
  coolingOff: boolean;
  payableFromIso?: string;
  changedAtIso: string;
  verifiedAtIso?: string;
  /** Present on the detail call only. */
  history?: PayoutAuditEntry[];
}

export interface PayoutConfirmation {
  challengeId: string;
  maskedEmail: string;
  expiresInSeconds: number;
  resendAfterSeconds: number;
  devCode?: string;
}

export const payoutService = {
  async get(): Promise<PayoutAccountView> {
    return http.get<PayoutAccountView>('/payout-account');
  },

  startConfirmation(details: SavePayoutAccountRequest): Promise<PayoutConfirmation> {
    return http.post('/payout-account/confirmation/start', details);
  },
  confirm(
    challengeId: string,
    code: string,
    details: SavePayoutAccountRequest,
  ): Promise<PayoutAccountView> {
    return http.post('/payout-account/confirmation/confirm', { challengeId, code, details });
  },

  /** The banks and wallets a tutor may choose, straight from the database. */
  async providers(method: PayoutMethod): Promise<CatalogItem[]> {
    return catalogService.getOne(method === 'BANK' ? 'payout-banks' : 'payout-wallets');
  },
};

export const adminPayoutService = {
  async list(): Promise<AdminPayoutAccount[]> {
    return http.getAllPages<AdminPayoutAccount>('/admin/payout-accounts');
  },

  async get(tutorId: number): Promise<AdminPayoutAccount> {
    return http.get<AdminPayoutAccount>(`/admin/payout-accounts/${tutorId}`);
  },

  /** Blocks or restores an account. A rejection must carry a reason — the tutor is shown it. */
  async decide(
    tutorId: number,
    status: PayoutAccountStatus,
    notes?: string,
  ): Promise<AdminPayoutAccount> {
    return http.post<AdminPayoutAccount>(`/admin/payout-accounts/${tutorId}/decision`, {
      status,
      notes,
    });
  },

  /**
   * The full account number, for making a transfer.
   *
   * POST, not GET: this writes an audit row every time, and the result must not sit in browser
   * history or be replayed by a refresh. Nothing caches it.
   */
  async reveal(tutorId: number): Promise<string> {
    const data = await http.post<{ accountNumber: string }>(
      `/admin/payout-accounts/${tutorId}/reveal`,
      {},
    );
    return data.accountNumber;
  },
};

/* ============================================================================
   Withdrawals — a tutor claiming their cleared earnings.

   No amount is ever sent. A withdrawal takes everything that has cleared escrow
   and is not already claimed; the server works out what that is. A client able
   to name its own withdrawal amount is a client able to name any amount.
   ========================================================================== */

export type PayoutRequestStatus = 'REQUESTED' | 'APPROVED' | 'PAID' | 'REJECTED';

export interface PayoutRequest {
  id: number;
  amount: number;
  currency: string;
  status: PayoutRequestStatus;
  method: PayoutMethod;
  /** Where it was sent, as it read when the request was made — not the current account. */
  provider: string;
  accountTitle: string;
  maskedNumber: string;
  /** How many sessions this withdrawal is claiming. */
  sessionCount: number;
  requestedAtIso: string;
  processedAtIso?: string;
  /** The bank or wallet transaction reference, once finance has recorded it. */
  reference?: string;
  /** Why it was rejected, when it was. */
  notes?: string;
}

/** A withdrawal in the admin batch. */
export interface AdminPayoutRequest {
  request: PayoutRequest;
  tutorAccountId: number;
  tutorName: string;
  tutorEmail: string;
}

export const withdrawalService = {
  async list(): Promise<PayoutRequest[]> {
    return http.get<PayoutRequest[]>('/payouts', { params: { size: 100 } });
  },

  /** Claims every cleared, unclaimed session. Takes no arguments by design. */
  async request(): Promise<PayoutRequest> {
    return http.post<PayoutRequest>('/payouts', {});
  },
};

export const adminWithdrawalService = {
  async list(status?: PayoutRequestStatus): Promise<AdminPayoutRequest[]> {
    return http.getAllPages<AdminPayoutRequest>(
      '/admin/payouts',
      status ? { params: { status } } : undefined,
    );
  },

  /**
   * Move a request along.
   *
   * A rejection needs `notes` (the tutor is shown them) and marking one PAID needs `reference`
   * (a payout nobody can trace is the one a dispute needs traced). The server enforces both.
   */
  async decide(
    id: number,
    status: Exclude<PayoutRequestStatus, 'REQUESTED'>,
    opts: { reference?: string; notes?: string } = {},
  ): Promise<AdminPayoutRequest> {
    return http.post<AdminPayoutRequest>(`/admin/payouts/${id}/decision`, { status, ...opts });
  },
};
