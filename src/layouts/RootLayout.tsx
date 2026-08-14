import { Outlet, ScrollRestoration } from 'react-router-dom';

/**
 * Router-level shell mounted above every route.
 *
 * Its only job is scroll behaviour, which has to live inside the data router
 * and above the individual layouts — otherwise each layout has to remember to
 * mount it, and the standalone routes (the tutor onboarding wizard, the payment
 * callback, the 404) get missed.
 *
 * `ScrollRestoration` resolves each navigation in a fixed order:
 *
 *   1. a position saved for this history entry — so Back returns you to where
 *      you were in a long tutor listing rather than to the top of it;
 *   2. the element matching `#hash`, scrolled into view — this is what keeps
 *      the legal documents' clause anchors and contents panel working, and the
 *      clauses carry `scroll-mt-28` so they clear the sticky navbar;
 *   3. otherwise the top of the page.
 *
 * Rule 3 is the fix for footer navigation: the footer sits at the bottom of the
 * page, so following a link from it used to drop you into the middle — or the
 * bottom — of the next page, which read as the new page being broken.
 *
 * It runs in a layout effect, so the correction happens before paint rather
 * than as a visible jump.
 */
export function RootLayout() {
  return (
    <>
      <ScrollRestoration />
      <Outlet />
    </>
  );
}
