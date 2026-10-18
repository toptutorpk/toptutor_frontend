import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, ChevronDown, RotateCw, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { assistantService, type AssistantTurn } from '@/services/assistantService';
import { AssistantMascot } from './AssistantMascot';

/** What a new visitor is offered instead of a blank box. */
const STARTERS = [
  'How does TopTutor work?',
  'Are tutors verified?',
  'When can a tutor withdraw earnings?',
  'How does payment protection work?',
];

interface Turn extends AssistantTurn {
  /** Set while this answer is still being written, so the caret and disabled state can show. */
  streaming?: boolean;
  failed?: boolean;
}

/**
 * The public help assistant, floating on the home page.
 *
 * <p>Deliberately not styled like the tutor–learner chat. That surface is for talking to a real
 * person about a real booking; this one answers questions about how the platform works. Making
 * them look alike would invite the question "am I messaging my tutor or support?".
 *
 * <p>Hides itself entirely when the server reports no assistant configured, rather than offering
 * help that errors the moment someone asks.
 */
export function HelpAssistant() {
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let cancelled = false;
    assistantService.available().then((ok) => !cancelled && setEnabled(ok));
    return () => {
      cancelled = true;
    };
  }, []);

  // Closing the panel must stop the stream, or it keeps writing into state nobody is showing.
  useEffect(() => {
    if (!open) abortRef.current?.abort();
    else inputRef.current?.focus();
  }, [open]);
  useEffect(() => () => abortRef.current?.abort(), []);

  // Escape closes, as it does for every other dismissible surface in the app.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Keep the newest text in view as it streams. Scrolls the list only, never the page.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns]);

  /**
   * Asks a question.
   *
   * <p>`base` is the transcript the question is asked on top of. It defaults to what is on screen,
   * and a retry passes the transcript from before the attempt that failed — otherwise the retry
   * would stack a second copy of the question under the first, and send the failure itself to the
   * model as context.
   */
  const send = async (question: string, base: Turn[] = turns) => {
    const text = question.trim();
    if (!text || busy) return;

    // The history sent is what existed before this question, and never a half-written answer.
    const history: AssistantTurn[] = base
      .filter((t) => !t.failed && t.text.trim())
      .map((t) => ({ role: t.role, text: t.text }));

    setDraft('');
    setBusy(true);
    setTurns([
      ...base,
      { role: 'user', text },
      { role: 'assistant', text: '', streaming: true },
    ]);

    const controller = new AbortController();
    abortRef.current = controller;

    const appendToAnswer = (chunk: string) =>
      setTurns((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.role === 'assistant') next[next.length - 1] = { ...last, text: last.text + chunk };
        return next;
      });

    try {
      await assistantService.ask(text, history, appendToAnswer, controller.signal);
      setTurns((prev) => finishLast(prev, {}));
    } catch (e) {
      if (controller.signal.aborted) return; // the panel was closed; nothing to report
      const message = e instanceof Error ? e.message : 'Sorry, something went wrong.';
      setTurns((prev) => finishLast(prev, { failed: true, fallback: message }));
    } finally {
      setBusy(false);
    }
  };

  /** Re-asks the question that produced the failed answer at `index`, in place. */
  const retry = (index: number) => {
    const question = turns[index - 1];
    if (question?.role !== 'user') return;
    void send(question.text, turns.slice(0, index - 1));
  };

  if (!enabled) return null;

  return (
    <>
      {!open && (
        <div className="fixed bottom-5 right-4 z-50 sm:right-5">
          <Launcher onClick={() => setOpen(true)} />
        </div>
      )}

      {open && (
        // Not a modal: the page stays readable and scrollable behind it, because the question is
        // usually about what the person is already looking at.
        <div
          role="dialog"
          aria-label="Ask TopTutor"
          className="tt-panel-in fixed inset-x-0 bottom-0 z-50 flex h-[min(38rem,100dvh)] flex-col overflow-hidden border border-slate-200/80 bg-white shadow-lift rounded-t-[22px] sm:inset-x-auto sm:bottom-5 sm:right-5 sm:h-[min(38rem,calc(100dvh-2.5rem))] sm:w-[23.5rem] sm:rounded-[22px] dark:border-white/10 dark:bg-card"
        >
          <PanelHeader onMinimise={() => setOpen(false)} onClose={() => { setOpen(false); setTurns([]); }} />

          <div
            ref={listRef}
            className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#f4f7fb] px-4 py-4 dark:bg-background/40"
          >
            {turns.length === 0 ? (
              <Welcome onPick={send} />
            ) : (
              turns.map((turn, i) => (
                <Bubble key={i} turn={turn} busy={busy} onRetry={() => retry(i)} />
              ))
            )}
          </div>

          <Composer
            draft={draft}
            busy={busy}
            inputRef={inputRef}
            onChange={setDraft}
            onSubmit={() => void send(draft)}
          />
        </div>
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Launcher                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The launcher.
 *
 * <p>One state: an offer, always phrased the same way. It waits to be clicked rather than
 * interrupting, which is what keeps it welcome on a page someone is trying to read.
 *
 * <p>The halo is a blurred sibling rather than a box-shadow, so its slow swell costs no repaint.
 */
function Launcher({ onClick }: { onClick: () => void }) {
  return (
    <div className="relative">
      <span
        aria-hidden
        className="tt-halo pointer-events-none absolute -inset-2 rounded-full bg-brand-500/45 blur-xl"
      />
      <button
        type="button"
        onClick={onClick}
        aria-label="Ask TopTutor"
        className={cn(
          'relative flex items-center gap-2.5 rounded-full py-2 pl-2.5 pr-4 text-[15px] font-semibold text-white',
          'bg-[linear-gradient(135deg,#3b82f6_0%,#2563eb_45%,#1d4ed8_100%)]',
          'shadow-[0_10px_30px_-8px_rgb(37_99_235/0.55)] transition-transform duration-200',
          'hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.99]',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
        )}
      >
        <AssistantMascot className="h-9 w-9" />
        Ask TopTutor
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Panel                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * The header carries the honesty.
 *
 * <p>The mascot plus the live dot say "assistant, running"; the subtitle says what it actually
 * answers from. Both sit above the fold of the panel because the one thing a visitor must never
 * have to work out is whether they are talking to a person.
 */
function PanelHeader({ onMinimise, onClose }: { onMinimise: () => void; onClose: () => void }) {
  return (
    <header className="flex items-center gap-3 border-b border-slate-200/80 bg-white px-4 py-3 dark:border-white/10 dark:bg-card">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[linear-gradient(135deg,#3b82f6_0%,#2563eb_55%,#1d4ed8_100%)] shadow-[0_6px_16px_-6px_rgb(37_99_235/0.7)]">
        <AssistantMascot className="h-8 w-8" />
      </span>
      <div className="min-w-0 flex-1 leading-tight">
        <div className="font-display text-[15px] font-bold text-slate-900 dark:text-foreground">
          Ask TopTutor
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-slate-500 dark:text-muted-foreground">
          <span className="tt-mascot-spark h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
          <span className="truncate">Explains how TopTutor works</span>
        </div>
      </div>
      <button
        type="button"
        onClick={onMinimise}
        aria-label="Minimise assistant"
        className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:hover:bg-white/10 dark:hover:text-foreground"
      >
        <ChevronDown className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close assistant and clear the conversation"
        className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:hover:bg-white/10 dark:hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </header>
  );
}

/**
 * The empty state.
 *
 * <p>Suggested questions rather than "How can I help?", because the hardest part of a blank chat
 * box is knowing what it is for. These teach the scope in one glance.
 */
function Welcome({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div className="space-y-3">
      <div className="tt-msg-in flex gap-2">
        <AssistantChip />
        <div className="max-w-[86%] rounded-[18px] rounded-tl-md border border-slate-200/70 bg-white px-3.5 py-2.5 text-[13.5px] leading-relaxed text-slate-800 shadow-soft dark:border-white/10 dark:bg-card dark:text-foreground">
          Hi — I can explain how TopTutor works: finding a tutor, booking, payment protection,
          verification and payouts. What do you need?
        </div>
      </div>
      <div className="flex flex-wrap gap-2 pl-8">
        {STARTERS.map((q, i) => (
          <button
            key={q}
            type="button"
            onClick={() => onPick(q)}
            style={{ animationDelay: `${60 + i * 55}ms` }}
            className="tt-msg-in rounded-full border border-brand-200 bg-white px-3.5 py-1.5 text-[13px] font-medium text-brand-700 transition-colors hover:border-brand-400 hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-brand-500/30 dark:bg-card dark:text-brand-300 dark:hover:bg-brand-500/10"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

/** The small square that marks a line as the assistant's, at every size it appears. */
function AssistantChip() {
  return (
    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#3b82f6,#2563eb)] text-white shadow-[0_4px_10px_-4px_rgb(37_99_235/0.8)]">
      <Sparkles className="h-3 w-3" />
    </span>
  );
}

function Bubble({
  turn,
  busy,
  onRetry,
}: {
  turn: Turn;
  busy: boolean;
  onRetry: () => void;
}) {
  const mine = turn.role === 'user';

  // An answer that has started arriving shows its text; one that has not shows the dots. Swapping
  // a spinner for a caret mid-word would read as two different waits.
  if (!mine && turn.streaming && !turn.text) {
    return (
      <div className="tt-msg-in flex gap-2">
        <AssistantChip />
        <div className="flex items-center gap-2 rounded-full border border-slate-200/70 bg-white px-3.5 py-2 shadow-soft dark:border-white/10 dark:bg-card">
          <span className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{ animationDelay: `${i * 160}ms` }}
                className="tt-dot h-1.5 w-1.5 rounded-full bg-brand-500"
              />
            ))}
          </span>
          <span className="text-[13px] text-slate-500 dark:text-muted-foreground">Thinking…</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('tt-msg-in flex gap-2', mine && 'justify-end')}>
      {!mine && <AssistantChip />}
      <div
        className={cn(
          'max-w-[86%] whitespace-pre-wrap px-3.5 py-2.5 text-[13.5px] leading-relaxed shadow-soft',
          mine
            ? 'rounded-[18px] rounded-br-md bg-[linear-gradient(135deg,#3b82f6_0%,#2563eb_100%)] text-white'
            : 'rounded-[18px] rounded-tl-md border border-slate-200/70 bg-white text-slate-800 dark:border-white/10 dark:bg-card dark:text-foreground',
          turn.failed &&
            'border-destructive/25 bg-destructive/10 text-destructive dark:bg-destructive/10',
        )}
      >
        {turn.text}
        {/* A caret while the answer is still arriving, so a pause reads as thinking, not stalling. */}
        {turn.streaming && (
          <span className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 animate-pulse rounded-sm bg-current align-baseline" />
        )}
        {/* A failure without a way out means retyping the question. The retry re-asks it in
            place, so the transcript does not fill up with the same question twice. */}
        {turn.failed && (
          <button
            type="button"
            onClick={onRetry}
            disabled={busy}
            className="mt-2 flex items-center gap-1.5 rounded-full border border-destructive/30 px-2.5 py-1 text-[12px] font-medium transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-destructive/50"
          >
            <RotateCw className="h-3 w-3" />
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * The composer, and under it the one disclaimer.
 *
 * <p>Said once, quietly, and honestly — a wall of disclaimer would be read by nobody. The route to
 * a human sits beside it because the honest answer to some questions is "not me".
 */
function Composer({
  draft,
  busy,
  inputRef,
  onChange,
  onSubmit,
}: {
  draft: string;
  busy: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="border-t border-slate-200/80 bg-white px-3 pb-2.5 pt-3 dark:border-white/10 dark:bg-card">
      <form
        className="flex items-center gap-2 rounded-[18px] border border-slate-200 bg-[#f8fafd] py-1.5 pl-4 pr-1.5 transition-colors focus-within:border-brand-400 focus-within:bg-white dark:border-white/10 dark:bg-background/40 dark:focus-within:bg-background/70"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ask about tutors, pricing or safety…"
          maxLength={500}
          disabled={busy}
          aria-label="Your question"
          className="min-w-0 flex-1 bg-transparent text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:opacity-60 dark:text-foreground dark:placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          disabled={busy || !draft.trim()}
          aria-label="Send"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#3b82f6,#2563eb)] text-white shadow-[0_6px_14px_-6px_rgb(37_99_235/0.9)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </form>

      <div className="mt-2 flex items-center justify-between gap-2 px-1 text-[10.5px] leading-snug text-slate-400 dark:text-muted-foreground">
        <span>AI assistant · cannot see your account</span>
        <Link
          to="/contact"
          className="shrink-0 font-medium text-slate-500 no-underline underline-offset-2 transition-colors hover:text-brand-600 hover:underline dark:text-muted-foreground"
        >
          Talk to a human ›
        </Link>
      </div>
    </div>
  );
}

/** Closes off the answer in flight, optionally replacing empty text with an error. */
function finishLast(turns: Turn[], opts: { failed?: boolean; fallback?: string }): Turn[] {
  const next = [...turns];
  const last = next[next.length - 1];
  if (last?.role !== 'assistant') return next;
  next[next.length - 1] = {
    ...last,
    streaming: false,
    failed: opts.failed,
    // Keep whatever arrived before the failure; only replace it when nothing did.
    text: last.text || opts.fallback || '',
  };
  return next;
}
