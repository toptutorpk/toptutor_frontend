import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Send, Search, Phone, Video, ShieldCheck } from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/queryKeys';
import { contentService } from '@/services/contentService';
import type { Message } from '@/types';
import { MOCK_MESSAGES } from '@/services/mock/misc';

export default function MessagesPage() {
  const { data: conversations = [] } = useQuery({
    queryKey: queryKeys.conversations.all,
    queryFn: contentService.conversations,
  });
  const [activeId, setActiveId] = useState('c1');
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);

  const active = conversations.find((c) => c.id === activeId);
  const thread = messages.filter((m) => m.conversationId === activeId);

  const send = () => {
    if (!draft.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `m${prev.length + 1}`,
        conversationId: activeId,
        senderId: 'me',
        text: draft,
        at: new Date().toISOString(),
        mine: true,
      },
    ]);
    setDraft('');
  };

  return (
    <div className="grid h-[calc(100vh-9rem)] grid-cols-1 overflow-hidden rounded-2xl border bg-card shadow-soft md:grid-cols-[320px_1fr]">
      {/* Conversation list */}
      <div className="hidden flex-col border-r md:flex">
        <div className="border-b p-4">
          <h2 className="font-display text-lg font-bold">Messages</h2>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search conversations…" className="h-10 pl-9" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={cn(
                'flex w-full items-center gap-3 border-b p-4 text-left transition-colors hover:bg-secondary/50',
                activeId === c.id && 'bg-secondary',
              )}
            >
              <div className="relative">
                <Avatar className="h-11 w-11">
                  <AvatarImage src={c.participantAvatar} alt={c.participantName} />
                  <AvatarFallback>{getInitials(c.participantName)}</AvatarFallback>
                </Avatar>
                {c.online && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-card" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="truncate font-semibold">{c.participantName}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(c.lastMessageAt))}
                  </span>
                </div>
                <p className="truncate text-sm text-muted-foreground">{c.lastMessage}</p>
              </div>
              {c.unread > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-xs font-bold text-white">
                  {c.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Thread */}
      <div className="flex flex-col">
        <div className="flex items-center gap-3 border-b p-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={active?.participantAvatar} alt={active?.participantName} />
            <AvatarFallback>{getInitials(active?.participantName ?? '')}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 font-semibold">
              {active?.participantName}
              <Badge variant="success" className="gap-1">
                <ShieldCheck className="h-3 w-3" /> Verified
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">{active?.online ? 'Online now' : 'Offline'}</div>
          </div>
          <Button variant="ghost" size="icon" aria-label="Call"><Phone className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" aria-label="Video"><Video className="h-4 w-4" /></Button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto bg-secondary/20 p-4">
          <div className="mx-auto w-fit rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
            🔒 Messages are end-to-end encrypted. Your number stays private until you book.
          </div>
          {thread.map((m) => (
            <div key={m.id} className={cn('flex', m.mine ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm',
                  m.mine
                    ? 'rounded-br-sm bg-brand-600 text-white'
                    : 'rounded-bl-sm border bg-card',
                )}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 border-t p-4">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Type a message…"
            className="h-11"
          />
          <Button variant="gradient" size="icon" onClick={send} aria-label="Send">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
