/**
 * Tile colours for subjects and categories.
 *
 * <p><b>The database stores a token — `blue`, `emerald` — never Tailwind classes.</b> This is not a
 * style preference; storing the classes does not work. Tailwind generates CSS only for class names
 * it can find by scanning the source files, so a gradient that exists only in a database row is
 * never emitted and the tile renders with no colour at all. That failure is silent, and it is
 * partial: it strikes only the classes that happen not to appear somewhere else in the codebase,
 * which is why five of the eighteen category gradients were blank while the rest looked fine.
 *
 * <p>Mapping token → classes here puts every class in a file the scanner reads, so any colour the
 * database can hold is guaranteed to render. It also gives the admin colour picker a fixed list to
 * offer, exactly as the icon registry does for icons — a colour that cannot be chosen cannot break.
 */

/** Token → gradient classes. Written out in full, never composed, so the scanner can see them. */
export const COLOR_TOKENS: Record<string, string> = {
  blue: 'from-blue-500 to-indigo-600',
  indigo: 'from-indigo-500 to-violet-600',
  sky: 'from-sky-500 to-blue-600',
  cyan: 'from-cyan-500 to-sky-600',
  teal: 'from-teal-500 to-cyan-600',
  emerald: 'from-emerald-500 to-teal-600',
  green: 'from-green-500 to-emerald-600',
  lime: 'from-lime-500 to-green-600',
  yellow: 'from-yellow-500 to-amber-600',
  amber: 'from-amber-500 to-orange-600',
  orange: 'from-orange-500 to-red-600',
  red: 'from-red-500 to-rose-600',
  rose: 'from-rose-500 to-pink-600',
  pink: 'from-pink-500 to-rose-600',
  fuchsia: 'from-fuchsia-500 to-pink-600',
  purple: 'from-purple-500 to-fuchsia-600',
  violet: 'from-violet-500 to-purple-600',
  slate: 'from-slate-600 to-slate-800',
};

/** Every token, for the admin colour picker. A colour it cannot offer cannot reach the database. */
export const COLOR_TOKEN_NAMES = Object.keys(COLOR_TOKENS);

/** Shown when a row carries no colour and none can be derived. */
const FALLBACK = COLOR_TOKENS.slate;

/**
 * The order uncoloured subjects are spread across.
 *
 * <p>Ordered so that neighbouring entries sit far apart on the colour wheel: consecutive tiles often
 * land on consecutive indices, and two near-identical blues side by side look like a mistake.
 */
const SPREAD: string[] = [
  'blue',
  'rose',
  'emerald',
  'violet',
  'orange',
  'cyan',
  'fuchsia',
  'green',
  'red',
  'sky',
  'amber',
  'teal',
  'purple',
  'lime',
  'indigo',
  'pink',
  'slate',
  'yellow',
];

/**
 * FNV-1a, 32-bit.
 *
 * <p>Any stable hash would do; this one is short, has no dependencies and scatters similar inputs
 * well — which matters when the inputs are strings as alike as "algebra-1" and "algebra-2".
 *
 * <p>`>>> 0` keeps the result unsigned: JavaScript bitwise operators produce signed 32-bit integers,
 * and a negative value would index off the front of the list.
 */
function hash(value: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Gradient classes for a subject tile.
 *
 * <p>Subjects are not stored with a colour: assigning one to each of nearly three hundred rows would
 * be a wall of arbitrary choices to maintain, and inheriting the category's painted every tile in a
 * category the same shade, so a screenful read as one block rather than as separate subjects.
 *
 * <p>The derived colour comes from the slug rather than from the tile's position, which keeps it
 * **stable**: Chemistry is the same green on every visit and whether it is seen under "All Subjects"
 * or under "Science". Position would look identical in a screenshot but change under filtering, and
 * a tile that changes colour when you filter reads as a different tile.
 *
 * @param slug  the subject's slug — stable, unlike its display name
 * @param token a colour chosen explicitly (in the admin portal); always wins when recognised
 */
export function subjectGradient(slug: string, token?: string | null): string {
  if (token && COLOR_TOKENS[token]) return COLOR_TOKENS[token];
  return COLOR_TOKENS[SPREAD[hash(slug) % SPREAD.length]];
}

/**
 * Gradient classes for a category chip.
 *
 * <p>Unlike a subject this is not derived: a category is a deliberate thing with a chosen colour,
 * and there are few enough of them to choose for.
 */
export function categoryGradient(token?: string | null): string {
  return (token && COLOR_TOKENS[token]) || FALLBACK;
}
