import { useState } from 'react';
import { ApiError } from '@/api/client';
import { classroomService } from '@/services/classroomService';
import { toast } from '@/components/ui/sonner';
import { ClassroomRulesDialog } from '@/components/booking/ClassroomRulesDialog';

/**
 * Opens a session's classroom in a new tab, after the classroom rules have been accepted.
 *
 * <p>{@code join} only shows the rules; render {@code rulesDialog} wherever the hook is used. The
 * tab is opened synchronously inside the dialog's "Join classroom" click, before the network call:
 * browsers block pop-ups opened after an await. Once the server approves the join it is pointed at
 * the meeting; if the server refuses (not yet open, cancelled, classroom down) the tab is closed and
 * the reason shown.
 */
export function useJoinSession() {
  const [joiningId, setJoiningId] = useState<number | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);

  const enter = async (bookingId: number) => {
    if (joiningId !== null) return;
    const tab = window.open('', '_blank');
    if (tab) {
      tab.opener = null; // the meeting page must not be able to reach back into TopTutor
      tab.document.title = 'Opening your classroom…';
      tab.document.body.innerHTML =
        '<p style="font-family:system-ui,sans-serif;color:#475569;padding:32px">Opening your classroom…<br><br>' +
        'When your session is over, close this tab to return to TopTutor.</p>';
    }
    setJoiningId(bookingId);
    try {
      const res = await classroomService.join(bookingId);
      if (tab && !tab.closed) {
        tab.location.href = res.meetingUri;
      } else {
        // Pop-ups blocked entirely: fall back to this tab.
        window.location.href = res.meetingUri;
      }
      if (res.recording) {
        toast.info('This session is being recorded', {
          description:
            'Recordings are kept for quality and safety and are only seen by TopTutor staff.',
        });
      }
    } catch (e) {
      tab?.close();
      const msg = e instanceof ApiError || e instanceof Error ? e.message : 'Please try again.';
      toast.error('Couldn’t open the classroom', { description: msg });
    } finally {
      setJoiningId(null);
    }
  };

  const join = (bookingId: number) => {
    if (joiningId === null) setPendingId(bookingId);
  };

  const rulesDialog = (
    <ClassroomRulesDialog
      open={pendingId !== null}
      onOpenChange={(open) => !open && setPendingId(null)}
      onConfirm={() => {
        const id = pendingId;
        setPendingId(null);
        if (id !== null) void enter(id);
      }}
    />
  );

  return { join, joiningId, rulesDialog };
}
