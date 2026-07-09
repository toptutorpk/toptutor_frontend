/**
 * Password strength policy — kept in sync with the backend's `@StrongPassword` validator:
 * minimum length plus at least one upper-case, lower-case, digit, and special character.
 */

export const PASSWORD_MIN_LENGTH = 8;

export interface PasswordRule {
  label: string;
  test: (pw: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  { label: `At least ${PASSWORD_MIN_LENGTH} characters`, test: (pw) => pw.length >= PASSWORD_MIN_LENGTH },
  { label: 'An upper-case letter', test: (pw) => /[A-Z]/.test(pw) },
  { label: 'A lower-case letter', test: (pw) => /[a-z]/.test(pw) },
  { label: 'A number', test: (pw) => /[0-9]/.test(pw) },
  { label: 'A special character', test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

/** All rules satisfied? */
export function isStrongPassword(pw: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(pw));
}

/** Each rule with whether the given password currently meets it (for a live checklist). */
export function passwordChecklist(pw: string): { label: string; met: boolean }[] {
  return PASSWORD_RULES.map((rule) => ({ label: rule.label, met: rule.test(pw) }));
}

/** 0–4 coarse strength score (count of satisfied character-class rules), for a strength meter. */
export function passwordStrengthScore(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  // Length gate: without the minimum length, cap the score so it never reads "strong".
  return pw.length >= PASSWORD_MIN_LENGTH ? score : Math.min(score, 2);
}
