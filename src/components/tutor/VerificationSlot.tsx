import { useRef, useState } from 'react';
import {
  UploadCloud,
  Loader2,
  Eye,
  RefreshCw,
  FileText,
  CheckCircle2,
  Trash2,
  Video as VideoIcon,
  Lock,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  verificationService,
  type DocStatus,
  type VerificationSlot as Slot,
} from '@/services/verificationService';
import { ApiError } from '@/api/client';
import { toast } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';
import { acceptHint, acceptedTypes, rejectReason } from '@/lib/uploadRules';
import { ImageWithSkeleton } from '@/components/common/ImageWithSkeleton';

/**
 * Marks a slot the tutor may skip.
 *
 * <p>Optionality used to be written into the label itself — "Teaching certificate (optional)" —
 * while required slots carried a red asterisk, so the same fact was told two different ways in the
 * same row. One quiet tag against the asterisk reads as a pair.
 */
function OptionalTag() {
  return (
    <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
      Optional
    </span>
  );
}

/** Small status chip for a single document. */
function StatusChip({ status }: { status?: DocStatus }) {
  if (!status || status === 'PENDING') return null;
  const meta = {
    APPROVED: {
      label: 'Approved',
      cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
      icon: CheckCircle2,
    },
    REJECTED: {
      label: 'Rejected',
      cls: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
      icon: AlertTriangle,
    },
    UNDER_REVIEW: {
      label: 'Under review',
      cls: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
      icon: Clock,
    },
  }[status];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold',
        meta.cls,
      )}
    >
      <Icon className="h-3 w-3" /> {meta.label}
    </span>
  );
}

/** One document slot: an ATM-card image box, a document row, or a video box, with upload + preview. */
export function VerificationSlot({ slot, onChanged }: { slot: Slot; onChanged: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const src = localPreview || slot.url;
  const isCnic = slot.key === 'cnic_front' || slot.key === 'cnic_back';
  const uploaded = Boolean(slot.url);
  const locked = slot.locked; // approved → cannot be changed
  const rejected = slot.status === 'REJECTED';
  // The server's own list, spelled out rather than image/* — a wildcard invites the file picker to
  // offer HEIC, WebP and GIF that the upload will then refuse.
  const accept = acceptedTypes(slot).join(',');
  const hint = acceptHint(slot);

  const pick = () => {
    if (locked) return;
    inputRef.current?.click();
  };

  const handleFile = async (file: File) => {
    // Checked before the preview is generated and before anything is sent: an oversized file should
    // not briefly appear in the box as though it had been accepted.
    const problem = rejectReason(file, slot);
    if (problem) {
      toast.error('That file can’t be uploaded', { description: problem });
      return;
    }
    if (slot.kind !== 'document') {
      setLocalPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });
    }
    setUploading(true);
    setProgress(0);
    try {
      await verificationService.uploadDocument(slot.key, file, setProgress);
      toast.success('Uploaded', { description: slot.label });
      onChanged();
    } catch (e) {
      toast.error('Upload failed', {
        description: e instanceof ApiError || e instanceof Error ? e.message : 'Please try again.',
      });
    } finally {
      setUploading(false);
    }
  };

  const remove = async () => {
    try {
      await verificationService.removeDocument(slot.key);
      setLocalPreview(null);
      onChanged();
    } catch (e) {
      toast.error('Could not remove the file', {
        description: e instanceof ApiError ? e.message : undefined,
      });
    }
  };

  const rejectionNote = rejected && slot.reviewNotes && (
    <div className="mt-1.5 flex items-start gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
      <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
      <span>
        <span className="font-semibold">Re-upload needed:</span> {slot.reviewNotes}
      </span>
    </div>
  );

  const changeLabel = uploaded ? 'Change' : 'Upload';

  const hiddenInput = (
    <input
      ref={inputRef}
      type="file"
      accept={accept}
      className="hidden"
      onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) handleFile(f);
        e.target.value = '';
      }}
    />
  );

  // ---- Image slot: ATM/credit-card sized box --------------------------------
  if (slot.kind === 'image') {
    return (
      // Fixed cap rather than filling its column: this box now sits in a flex row next to other
      // content (e.g. the Identity step's CNIC fields) rather than a grid it needs to share equal
      // columns with, so a card-sized cap is what keeps it from stretching to whatever width its
      // row happens to have.
      <div className="w-full max-w-[326px]">
        <div
          className={cn(
            'group relative aspect-[1.586] overflow-hidden rounded-2xl border-2 transition-colors',
            src
              ? 'border-solid border-border'
              : 'border-dashed border-input hover:border-brand-400',
            slot.status === 'APPROVED' && 'border-emerald-300 dark:border-emerald-500/30',
            rejected && 'border-red-300 dark:border-red-500/30',
            'bg-secondary/40',
          )}
        >
          {src ? (
            isCnic ? (
              <ImageWithSkeleton
                skeletonVariant="document"
                src={src}
                alt={slot.label}
                containerClassName="h-full w-full"
              />
            ) : (
              <img src={src} alt={slot.label} className="h-full w-full object-cover" />
            )
          ) : (
            <button
              type="button"
              onClick={pick}
              className="flex h-full w-full flex-col items-center justify-center gap-1.5 p-4 text-center text-muted-foreground hover:text-brand-600"
            >
              <UploadCloud className="h-7 w-7" />
              <span className="text-sm font-semibold">Upload {slot.label}</span>
              <span className="text-[11px]">{hint}</span>
            </button>
          )}

          {slot.status && slot.status !== 'PENDING' && (
            <div className="absolute left-2 top-2">
              <StatusChip status={slot.status} />
            </div>
          )}
          {locked && (
            <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-md bg-emerald-600 text-white shadow">
              <Lock className="h-3.5 w-3.5" />
            </div>
          )}

          {uploading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-slate-900/60 text-white">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-xs">Uploading {progress}%</span>
            </div>
          )}

          {src && !uploading && (
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
              <Button type="button" size="sm" variant="secondary" onClick={() => setOpen(true)}>
                <Eye className="h-4 w-4" /> Preview
              </Button>
              {!locked && (
                <Button type="button" size="sm" variant="outline" onClick={pick}>
                  <RefreshCw className="h-4 w-4" /> Change
                </Button>
              )}
            </div>
          )}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1.5 text-center">
          <p className="text-xs font-medium">
            {slot.label}
            {slot.required && <span className="text-red-500"> *</span>}
          </p>
          {!slot.required && <OptionalTag />}
          {uploaded && !slot.status && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
        </div>
        {rejectionNote}
        {hiddenInput}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{slot.label}</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center overflow-hidden rounded-xl border bg-slate-900">
              {src &&
                (isCnic ? (
                  <ImageWithSkeleton
                    skeletonVariant="document"
                    src={src}
                    alt={slot.label}
                    containerClassName="aspect-[1.586] max-h-[70vh] w-full"
                    className="object-contain"
                  />
                ) : (
                  <img src={src} alt={slot.label} className="max-h-[70vh] w-full object-contain" />
                ))}
            </div>
            <div className="flex justify-end gap-2">
              {!locked && (
                <Button type="button" variant="outline" onClick={pick}>
                  <RefreshCw className="h-4 w-4" /> Change file
                </Button>
              )}
              <Button type="button" variant="gradient" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ---- Video slot -----------------------------------------------------------
  if (slot.kind === 'video') {
    return (
      <div className="w-full max-w-md space-y-2">
        <div className="overflow-hidden rounded-xl border bg-slate-900">
          {src ? (
            <video src={src} controls className="max-h-72 w-full" />
          ) : (
            <button
              type="button"
              onClick={pick}
              className="flex aspect-video w-full flex-col items-center justify-center gap-2 text-slate-300 hover:text-white"
            >
              <VideoIcon className="h-8 w-8" />
              <span className="text-sm font-semibold">Upload your demo video</span>
              <span className="text-[11px]">MP4, WEBM or MOV</span>
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {locked ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
              <Lock className="h-3.5 w-3.5" /> Approved & locked
            </span>
          ) : (
            <Button type="button" variant="outline" size="sm" onClick={pick} disabled={uploading}>
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UploadCloud className="h-4 w-4" />
              )}
              {uploaded ? 'Change video' : 'Upload video'}
            </Button>
          )}
          {uploading && (
            <span className="text-xs text-muted-foreground">Uploading {progress}%</span>
          )}
          <StatusChip status={slot.status} />
        </div>
        {rejectionNote}
        {hiddenInput}
      </div>
    );
  }

  // ---- Document slot (pdf/image) --------------------------------------------
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-secondary/30 p-3">
        <span
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg',
            slot.status === 'APPROVED'
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
              : rejected
                ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'
                : uploaded
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                  : 'bg-secondary text-muted-foreground',
          )}
        >
          {locked ? <Lock className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-medium">
              {slot.label}
              {slot.required && <span className="text-red-500"> *</span>}
            </p>
            {!slot.required && <OptionalTag />}
            <StatusChip status={slot.status} />
          </div>
          <p className="text-xs text-muted-foreground">
            {uploading ? `Uploading ${progress}%` : uploaded ? 'Uploaded' : hint}
          </p>
        </div>
        {uploaded && slot.url && (
          <Button type="button" variant="secondary" size="sm" asChild>
            <a href={slot.url} target="_blank" rel="noreferrer">
              <Eye className="h-4 w-4" /> View
            </a>
          </Button>
        )}
        {uploaded && !locked && (
          <Button type="button" variant="ghost" size="icon" onClick={remove} aria-label="Remove">
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
        {locked ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
            <Lock className="h-3.5 w-3.5" /> Locked
          </span>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={pick} disabled={uploading}>
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UploadCloud className="h-4 w-4" />
            )}
            {changeLabel}
          </Button>
        )}
        {hiddenInput}
      </div>
      {rejectionNote}
    </div>
  );
}
