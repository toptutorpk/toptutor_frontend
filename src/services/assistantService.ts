import { http } from '@/api/client';
import { env } from '@/config/env';

/** One turn of the conversation, as the server expects it back. */
export interface AssistantTurn {
  role: 'user' | 'assistant';
  text: string;
}

/**
 * The help assistant.
 *
 * <p>The answer streams, so this cannot go through the shared axios client: axios buffers the
 * whole body before resolving, which would turn a visibly-typing answer into a five-second pause
 * followed by a wall of text. `fetch` gives us the body as a stream instead.
 *
 * <p>The endpoint is public, so no token is attached and none is needed.
 */
export const assistantService = {
  /** Whether the assistant is configured server-side. The launcher hides itself when it is not. */
  async available(): Promise<boolean> {
    try {
      const res = await http.get<{ available: boolean }>('/assistant/status');
      return res.available === true;
    } catch {
      // A help widget must never be the reason a page looks broken.
      return false;
    }
  },

  /**
   * Asks a question and calls `onText` with each piece of the answer as it arrives.
   *
   * @param signal abort signal, so closing the panel stops the stream rather than leaving it
   *               writing into a component that has gone away
   */
  async ask(
    message: string,
    history: AssistantTurn[],
    onText: (chunk: string) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    const response = await fetch(`${env.apiBaseUrl}/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
      body: JSON.stringify({ message, history }),
      signal,
    });

    if (!response.ok || !response.body) {
      throw new Error('Sorry, something went wrong. Please try again.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // Server-sent events are separated by a blank line. Anything after the last separator is a
      // partial frame and stays in the buffer until the rest of it arrives.
      const frames = buffer.split('\n\n');
      buffer = frames.pop() ?? '';

      for (const frame of frames) {
        const parsed = parseFrame(frame);
        if (!parsed) continue;
        if (parsed.event === 'error') throw new Error(parsed.data);
        onText(parsed.data);
      }
    }
  },
};

/**
 * One SSE frame into its event name and data.
 *
 * <p>A frame may carry several `data:` lines, which the protocol says to join with newlines. That
 * is not a nicety here: any answer containing a line break arrives that way.
 */
function parseFrame(frame: string): { event: string; data: string } | null {
  let event = 'message';
  const dataLines: string[] = [];

  for (const line of frame.split('\n')) {
    if (line.startsWith('event:')) event = line.slice(6).trim();
    // Exactly one optional space after the colon is part of the framing, not the payload.
    else if (line.startsWith('data:')) dataLines.push(line.slice(5).replace(/^ /, ''));
  }

  if (dataLines.length === 0) return null;
  return { event, data: dataLines.join('\n') };
}
