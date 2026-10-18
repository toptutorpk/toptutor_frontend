/**
 * Display details for the banks and wallets in the payout/refund catalog.
 *
 * <p>The catalog itself (which banks exist) lives in the database, so adding a bank is a row, not a
 * release. This file only knows how to *show* one: its logo under `public/banks/{64,128,256}/`, a
 * short name for the initials badge, and a one-line description. A bank added to the database that
 * isn't listed here still works — it gets an initials badge built from its name.
 */

export interface InstitutionMeta {
  /** File name (without extension) under public/banks/{size}/, or a full path for wallets. */
  logo?: string;
  /**
   * The logo is a full-bleed square (its own coloured background to the edges), so it fills the round
   * badge instead of sitting inside it on white.
   */
  fill?: boolean;
  /** Up to three letters for the fallback badge. */
  initials: string;
  /** One line under the name in the picker. */
  subtitle?: string;
  /** Names this institution is known by in the catalog or typed by users, matched loosely. */
  names: string[];
}

const ISLAMIC = 'Islamic banking';
const BOTH = 'Conventional · Islamic';
const PUBLIC = 'Public sector';

const BANKS: InstitutionMeta[] = [
  { logo: 'meezan-bank', initials: 'MB', subtitle: ISLAMIC, names: ['Meezan Bank', 'Meezan'] },
  {
    logo: 'hbl',
    initials: 'HBL',
    subtitle: BOTH,
    names: ['HBL (Habib Bank Limited)', 'HBL', 'Habib Bank Limited'],
  },
  {
    logo: 'ubl',
    initials: 'UBL',
    subtitle: BOTH,
    names: ['United Bank Limited (UBL)', 'UBL', 'United Bank Limited'],
  },
  {
    logo: 'mcb',
    initials: 'MCB',
    subtitle: BOTH,
    names: ['MCB Bank', 'MCB', 'Muslim Commercial Bank'],
  },
  { logo: 'bank-alfalah', initials: 'BA', subtitle: BOTH, names: ['Bank Alfalah', 'Alfalah'] },
  {
    logo: 'allied-bank',
    initials: 'ABL',
    subtitle: BOTH,
    names: ['Allied Bank (ABL)', 'Allied Bank', 'ABL'],
  },
  {
    logo: 'nbp',
    initials: 'NBP',
    subtitle: PUBLIC,
    names: ['National Bank of Pakistan (NBP)', 'National Bank of Pakistan', 'NBP'],
  },
  { logo: 'faysal-bank', initials: 'FB', subtitle: ISLAMIC, names: ['Faysal Bank', 'Faysal'] },
  { logo: 'bankislami', initials: 'BI', subtitle: ISLAMIC, names: ['Bank Islami', 'BankIslami'] },
  { logo: 'askari-bank', initials: 'AKB', subtitle: BOTH, names: ['Askari Bank', 'Askari'] },
  {
    logo: 'standard-chartered',
    initials: 'SC',
    subtitle: BOTH,
    names: ['Standard Chartered Bank Pakistan', 'Standard Chartered', 'SCB'],
  },
  {
    logo: 'bop',
    initials: 'BOP',
    subtitle: PUBLIC,
    names: ['The Bank of Punjab', 'Bank of Punjab', 'BOP'],
  },
  { logo: 'js-bank', initials: 'JS', subtitle: BOTH, names: ['JS Bank'] },
  { logo: 'soneri-bank', initials: 'SB', subtitle: BOTH, names: ['Soneri Bank', 'Soneri'] },
  {
    logo: 'bank-al-habib',
    initials: 'BAH',
    subtitle: BOTH,
    names: ['Bank Al Habib', 'Bank AL Habib', 'BAHL'],
  },
  {
    logo: 'al-baraka',
    initials: 'AB',
    subtitle: ISLAMIC,
    names: ['Al Baraka Bank Pakistan', 'Al Baraka Bank', 'Al Baraka'],
  },
];

/** Mobile wallets reuse the brand marks already shipped for the booking payment screen. */
const WALLETS: InstitutionMeta[] = [
  {
    logo: '/payments/easypaisa-logo.png',
    initials: 'EP',
    subtitle: 'Mobile wallet',
    names: ['Easypaisa'],
  },
  {
    logo: '/payments/jazzcash-logo.png',
    initials: 'JC',
    subtitle: 'Mobile wallet',
    names: ['JazzCash', 'Jazz Cash'],
  },
  // Bank-run wallets: HBL Konnect has its own mark; UBL Omni and Alfa wear their parent bank's.
  {
    logo: 'hbl-konnect',
    fill: true,
    initials: 'HK',
    subtitle: 'Mobile wallet · HBL',
    names: ['HBL Konnect'],
  },
  { logo: 'ubl', initials: 'UO', subtitle: 'Mobile wallet · UBL', names: ['UBL Omni'] },
  {
    logo: 'bank-alfalah',
    initials: 'AF',
    subtitle: 'Mobile wallet · Bank Alfalah',
    names: ['Alfa (Bank Alfalah)', 'Alfa'],
  },
  // Standalone wallets.
  { logo: 'sadapay', initials: 'SP', subtitle: 'Mobile wallet', names: ['SadaPay'] },
  { logo: 'nayapay', initials: 'NP', subtitle: 'Mobile wallet', names: ['NayaPay'] },
  { logo: 'upaisa', initials: 'UP', subtitle: 'Mobile wallet', names: ['UPaisa', 'U Paisa'] },
  // The catalog spells it Zindagi; the brand is Zindigi. Both resolve.
  {
    logo: 'zindigi',
    fill: true,
    initials: 'ZI',
    subtitle: 'Mobile wallet',
    names: ['Zindigi', 'Zindagi'],
  },
];

const key = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

const INDEX = new Map<string, InstitutionMeta>();
for (const meta of [...BANKS, ...WALLETS]) {
  for (const name of meta.names) INDEX.set(key(name), meta);
}

/** Display details for a bank or wallet name, or null when it isn't a known one. */
export function findInstitution(name: string | null | undefined): InstitutionMeta | null {
  if (!name) return null;
  return INDEX.get(key(name)) ?? null;
}

/** Up to three initials from a name: "Habib Metropolitan Bank" → "HMB". Ignores filler words. */
export function initialsFor(name: string): string {
  const words = name
    .replace(/\(.*?\)/g, ' ')
    .split(/\s+/)
    .filter(
      (w) => w && !['the', 'of', 'and', 'limited', 'ltd', 'pakistan'].includes(w.toLowerCase()),
    );
  // One word reads better as two letters ("SadaPay" → "SA") than one.
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  const letters = words
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return (letters || name.slice(0, 2).toUpperCase()).slice(0, 3);
}

/** Sources for one logo at 1x/2x/3x, for a badge displayed at {@code px} CSS pixels. */
export function logoSources(
  meta: InstitutionMeta,
  px: number,
): { src: string; srcSet?: string } | null {
  if (!meta.logo) return null;
  if (meta.logo.startsWith('/')) return { src: meta.logo };
  const at = (size: number) => `/banks/${size}/${meta.logo}.png`;
  const base = px <= 32 ? 64 : 128;
  return {
    src: at(base),
    srcSet: `${at(base)} 1x, ${at(base === 64 ? 128 : 256)} 2x, ${at(256)} 3x`,
  };
}
