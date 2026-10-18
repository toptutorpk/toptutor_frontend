import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  Send,
  Search,
  ShieldCheck,
  Check,
  CheckCheck,
  Flag,
  Loader2,
  MessageSquare,
  Building2,
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/queryKeys';
import { messagingService, type ChatMessage } from '@/services/messagingService';
import { unreadMessagesKey } from '@/hooks/useUnreadMessages';
import { useMessagingSocket, type TypingEvent } from '@/hooks/useMessagingSocket';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/sonner';
import type { UserRole } from '@/types';

export default function MessagesPage() {
  const me = useAuthStore((s) => s.user);
  const myId = me ? Number(me.id) : -1;
  const qc = useQueryClient();

  const [activeId, setActiveId] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [typingFrom, setTypingFrom] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: conversations = [] } = useQuery({
    queryKey: queryKeys.conversations.all,
    queryFn: messagingService.listConversations,
    refetchInterval: 20000, // safety net if the socket drops
  });

  // Default to the first conversation once loaded.
  useEffect(() => {
    if (activeId === null && conversations.length > 0) setActiveId(conversations[0].id);
  }, [conversations, activeId]);

  const active = conversations.find((c) => c.id === activeId) ?? null;

  // The thread is paged by message id (keyset). The query holds the LATEST page and stays live
  // (refetch + socket invalidation); older pages are loaded on demand into `older` and kept apart,
  // so a refetch of the latest page never throws away history the user has scrolled back to.
  const { data: threadPage } = useQuery({
    queryKey: queryKeys.messages(String(activeId)),
    queryFn: () => messagingService.getThreadPage(activeId as number),
    enabled: activeId !== null,
    refetchInterval: 15000,
  });
  const [older, setOlder] = useState<ChatMessage[]>([]);
  const [olderState, setOlderState] = useState<{ cursor: string | null; hasMore: boolean } | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  useEffect(() => {
    setOlder([]);
    setOlderState(null);
  }, [activeId]);

  const latest = useMemo(() => threadPage?.messages ?? [], [threadPage]);
  const thread = useMemo(() => {
    if (older.length === 0) return latest;
    const seen = new Set(older.map((m) => m.id));
    return [...older, ...latest.filter((m) => !seen.has(m.id))];
  }, [older, latest]);
  const hasOlder = olderState ? olderState.hasMore : (threadPage?.hasMore ?? false);

  const loadOlder = async () => {
    if (activeId === null || loadingOlder) return;
    const cursor = olderState ? olderState.cursor : (threadPage?.nextCursor ?? null);
    if (!cursor) return;
    setLoadingOlder(true);
    try {
      const page = await messagingService.getThreadPage(activeId, cursor);
      setOlder((prev) => [...page.messages, ...prev]);
      setOlderState({ cursor: page.nextCursor, hasMore: page.hasMore });
    } catch {
      toast.error('Could not load earlier messages. Please try again.');
    } finally {
      setLoadingOlder(false);
    }
  };

  const invalidate = (conversationId?: number) => {
    qc.invalidateQueries({ queryKey: queryKeys.conversations.all });
    qc.invalidateQueries({ queryKey: queryKeys.messages(String(conversationId ?? activeId)) });
    qc.invalidateQueries({ queryKey: unreadMessagesKey });
  };

  const markReadMutation = useMutation({
    mutationFn: (conversationId: number) => messagingService.markRead(conversationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.conversations.all });
      qc.invalidateQueries({ queryKey: unreadMessagesKey });
    },
  });

  // ---- Live socket -------------------------------------------------------
  const { sendTyping } = useMessagingSocket({
    onMessage: (msg) => {
      invalidate(msg.conversationId);
      if (msg.conversationId === activeId) markReadMutation.mutate(msg.conversationId);
    },
    onReceipt: (evt) => invalidate(evt.conversationId),
    onTyping: (evt: TypingEvent) => {
      if (evt.conversationId !== activeId) return;
      setTypingFrom(evt.typing ? evt.fromAccountId : null);
    },
  });

  const sendMutation = useMutation({
    mutationFn: (body: string) => messagingService.sendMessage(activeId as number, body),
    onSuccess: (msg) => {
      setDraft('');
      invalidate(msg.conversationId);
      if (msg.redacted) {
        toast.warning('Policy violation — contact details hidden', {
          description:
            'Sharing phone numbers, emails or links is against the rules. Repeated violations are flagged to our team and can get your account blocked.',
        });
      }
    },
    onError: () => toast.error('Could not send message. Please try again.'),
  });

  const reportMutation = useMutation({
    mutationFn: () => messagingService.report(activeId as number, 'ABUSE'),
    onSuccess: () => toast.success('Reported', { description: 'Our team will review this conversation.' }),
  });

  // Mark the open thread as read whenever it changes and has unread messages for me.
  useEffect(() => {
    if (activeId === null) return;
    // Only the live (latest) page can carry something unread; loading history must not re-trigger this.
    const hasUnreadForMe = latest.some((m) => m.senderAccountId !== myId && !m.readAt);
    if (hasUnreadForMe) markReadMutation.mutate(activeId);
    setTypingFrom(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, latest.length]);

  // Keep the thread scrolled to the newest message — scroll only the list, never the page
  // (scrollIntoView would scroll ancestor containers too, hiding the panel under the header).
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    // Keyed on the latest page only: loading older messages prepends and must not yank the user
    // back to the bottom of the thread.
  }, [latest.length, typingFrom]);

  const send = () => {
    const body = draft.trim();
    if (!body || activeId === null) return;
    sendTyping(activeId, false);
    sendMutation.mutate(body);
  };

  const onDraftChange = (value: string) => {
    setDraft(value);
    if (activeId === null) return;
    sendTyping(activeId, true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => sendTyping(activeId, false), 2500);
  };

  const filtered = useMemo(
    () =>
      conversations.filter((c) =>
        c.participantName?.toLowerCase().includes(search.trim().toLowerCase()),
      ),
    [conversations, search],
  );

  if (conversations.length === 0) {
    return <EmptyState role={me?.role} />;
  }

  return (
    <div className="grid h-[calc(100vh-9rem)] grid-cols-1 overflow-hidden rounded-2xl border bg-card shadow-soft md:grid-cols-[320px_1fr]">
      {/* Conversation list */}
      <div className="hidden min-h-0 flex-col border-r md:flex">
        <div className="border-b p-4">
          <h2 className="font-display text-lg font-bold">Messages</h2>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations…"
              className="h-10 pl-9"
            />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={cn(
                'flex w-full items-center gap-3 border-b p-4 text-left transition-colors hover:bg-secondary/50',
                activeId === c.id && 'bg-secondary',
              )}
            >
              <Avatar className="h-11 w-11">
                <AvatarImage src={c.participantAvatar ?? undefined} alt={c.participantName} />
                <AvatarFallback>{getInitials(c.participantName)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="truncate font-semibold">{c.participantName}</span>
                  {c.lastMessageAt && (
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(c.lastMessageAt))}
                    </span>
                  )}
                </div>
                <p className="truncate text-sm text-muted-foreground">
                  {c.lastMessage ?? 'Say hello 👋'}
                </p>
              </div>
              {c.unread > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-md bg-brand-600 px-1 text-xs font-bold text-white">
                  {c.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Thread */}
      <div className="flex min-h-0 flex-col">
        <div className="flex items-center gap-3 border-b p-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={active?.participantAvatar ?? undefined} alt={active?.participantName} />
            <AvatarFallback>{getInitials(active?.participantName ?? '')}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 font-semibold">
              {active?.participantName}
              {active?.participantRole === 'TUTOR' && (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
                  <ShieldCheck className="h-3 w-3" /> Verified
                </span>
              )}
              {/* A school reaching a tutor looks exactly like a parent without this — and the two
                  warrant very different replies, so say which one is writing. */}
              {active?.participantRole === 'INSTITUTE' && (
                <span className="inline-flex items-center gap-1 rounded-md bg-brand-500/10 px-2 py-0.5 text-xs font-medium text-brand-600">
                  <Building2 className="h-3 w-3" /> Institute
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {typingFrom ? <span className="text-brand-600">typing…</span> : 'Tap to view profile'}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Report conversation"
            onClick={() => reportMutation.mutate()}
          >
            <Flag className="h-4 w-4" />
          </Button>
        </div>

        <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-secondary/20 p-4">
          {hasOlder && (
            <div className="flex justify-center">
              <Button variant="ghost" size="sm" onClick={loadOlder} disabled={loadingOlder}>
                {loadingOlder ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {loadingOlder ? 'Loading…' : 'Load earlier messages'}
              </Button>
            </div>
          )}
          <div className="mx-auto w-fit rounded-md bg-secondary px-3 py-1 text-center text-xs text-muted-foreground">
            🔒 Keep chatting here. Phone numbers, emails & links are hidden to protect you both.
          </div>
          {thread.map((m) => (
            <MessageBubble key={m.id} message={m} mine={m.senderAccountId === myId} />
          ))}
        </div>

        <div className="flex items-center gap-2 border-t p-4">
          <Input
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Type a message…"
            className="h-11"
          />
          <Button
            variant="gradient"
            size="icon"
            onClick={send}
            disabled={sendMutation.isPending || !draft.trim()}
            aria-label="Send"
          >
            {sendMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** A single chat bubble with WhatsApp-style delivery/read ticks on the sender's own messages. */
function MessageBubble({ message, mine }: { message: ChatMessage; mine: boolean }) {
  return (
    <div className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm',
          mine ? 'rounded-br-sm bg-brand-600 text-white' : 'rounded-bl-sm border bg-card',
        )}
      >
        <span>{message.body}</span>
        <span
          className={cn(
            'ml-2 inline-flex items-center gap-0.5 align-bottom text-[10px]',
            mine ? 'text-white/70' : 'text-muted-foreground',
          )}
        >
          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {mine && <Ticks message={message} />}
        </span>
      </div>
    </div>
  );
}

/** ✓ sent · ✓✓ delivered · ✓✓ (blue) read. */
function Ticks({ message }: { message: ChatMessage }) {
  if (message.readAt) return <CheckCheck className="h-3 w-3 text-sky-300" />;
  if (message.deliveredAt) return <CheckCheck className="h-3 w-3" />;
  return <Check className="h-3 w-3" />;
}

/**
 * The empty inbox, addressed to whoever is looking at it.
 *
 * <p>This page is shared by both portals, and the learner's version of it read as nonsense on the
 * tutor side: a tutor was being told to book an intro call with a tutor, under a button offering to
 * find them one. The two roles sit on opposite ends of the same action — a learner opens the
 * conversation, a tutor waits for one — so each needs its own account of why the page is empty and
 * what, if anything, to do about it.
 */
function EmptyState({ role }: { role?: UserRole }) {
  const isTutor = role === 'tutor';

  // An institute is a third end of the same action: it goes looking for a teacher, the way a
  // learner goes looking for a tutor — but through the teacher database, not the public listing.
  if (role === 'institute') {
    return (
      <div className="flex h-[calc(100vh-9rem)] flex-col items-center justify-center rounded-2xl border bg-card p-8 text-center shadow-soft">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
          <MessageSquare className="h-8 w-8" />
        </div>
        <h2 className="font-display text-xl font-bold">No messages yet</h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Message a teacher from your search results to start a conversation. Contact details stay
          hidden on both sides until an offer is accepted.
        </p>
        <Button className="mt-5" variant="gradient" asChild>
          <Link to="/dashboard/institute/teachers">Find teachers</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col items-center justify-center rounded-2xl border bg-card p-8 text-center shadow-soft">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
        <MessageSquare className="h-8 w-8" />
      </div>
      <h2 className="font-display text-xl font-bold">No messages yet</h2>

      {isTutor ? (
        <>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            When a student messages you, your conversation opens here. All chat stays in-app, so
            your phone number stays private until you confirm a booking.
          </p>
          {/* Verification, not "find a student": a tutor cannot go looking for one. Being listed
              at all is what gates this, and that is gated on finishing verification — so the only
              thing they can actually act on is the step they may not have finished. */}
          <p className="mt-4 max-w-sm text-xs text-muted-foreground">
            Students can only find and message you once your verification is complete.
          </p>
          <Button className="mt-4" variant="gradient" asChild>
            <Link to="/dashboard/tutor/verification">Check your verification</Link>
          </Button>
        </>
      ) : (
        <>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Message any tutor from their profile to start a conversation. All chat stays in-app to
            keep everyone safe.
          </p>
          <Button className="mt-5" variant="gradient" asChild>
            <Link to="/tutors">Find a tutor</Link>
          </Button>
        </>
      )}
    </div>
  );
}
