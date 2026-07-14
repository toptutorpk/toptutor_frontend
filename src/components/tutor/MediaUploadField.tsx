import { useRef, useState } from 'react';
import { Eye, Upload, Loader2, Image as ImageIcon, Video as VideoIcon, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { uploadService, type UploadCategory } from '@/services/uploadService';
import { ApiError } from '@/api/client';
import { toast } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';

interface MediaUploadFieldProps {
  kind: 'image' | 'video';
  category: UploadCategory;
  /** Current persisted URL (from the profile), if any. */
  value?: string;
  onChange: (url: string | undefined) => void;
  error?: string;
  accept?: string;
}

/**
 * Lets a tutor pick a file from their desktop, uploads it to object storage (R2), and shows a
 * thumbnail plus a Preview button that opens a dialog to view or change the file. The persisted
 * public URL is handed back via {@link onChange}.
 */
export function MediaUploadField({ kind, category, value, onChange, error, accept }: MediaUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  // URL uploaded earlier in THIS session (not the persisted value) — replaced on the next upload
  // so throwaway files don't pile up. The saved value is only deleted server-side on profile save.
  const [sessionUrl, setSessionUrl] = useState<string | null>(null);

  const previewSrc = localPreview || value || undefined;
  const hasMedia = Boolean(previewSrc);
  const pick = () => inputRef.current?.click();

  const handleFile = async (file: File) => {
    setLocalPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setFileName(file.name);
    setUploading(true);
    setProgress(0);
    try {
      const result = await uploadService.upload(file, category, {
        onProgress: setProgress,
        replaces: sessionUrl ?? undefined,
      });
      setSessionUrl(result.url);
      onChange(result.url);
      toast.success('Uploaded', { description: file.name });
    } catch (e) {
      const msg = e instanceof ApiError || e instanceof Error ? e.message : 'Upload failed';
      toast.error('Upload failed', { description: msg });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <div
        className={cn(
          'flex flex-wrap items-center gap-2 rounded-xl border bg-secondary/30 p-2.5',
          error && 'border-red-500',
        )}
      >
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-background">
          {hasMedia && kind === 'image' ? (
            <img src={previewSrc} alt="" className="h-full w-full object-cover" />
          ) : (
            <>{kind === 'image'
              ? <ImageIcon className={cn('h-6 w-6', hasMedia ? 'text-brand-500' : 'text-muted-foreground')} />
              : <VideoIcon className={cn('h-6 w-6', hasMedia ? 'text-brand-500' : 'text-muted-foreground')} />}
            </>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {fileName || (hasMedia ? 'Uploaded file' : 'No file selected')}
          </p>
          {uploading ? (
            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Uploading… {progress}%
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {kind === 'image' ? 'JPG, PNG, WEBP or GIF' : 'MP4, WEBM or MOV'}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={pick} disabled={uploading}>
            <Upload className="h-4 w-4" /> {hasMedia ? 'Change' : 'Choose file'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setOpen(true)}
            disabled={!hasMedia}
          >
            <Eye className="h-4 w-4" /> Preview
          </Button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={accept || (kind === 'image' ? 'image/*' : 'video/*')}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = '';
          }}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{kind === 'image' ? 'Image preview' : 'Video preview'}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center overflow-hidden rounded-xl border bg-slate-900">
            {hasMedia && kind === 'image' && (
              <img src={previewSrc} alt="" className="max-h-[70vh] w-full object-contain" />
            )}
            {hasMedia && kind === 'video' && (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video src={previewSrc} controls className="max-h-[70vh] w-full" />
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={pick} disabled={uploading}>
              <RefreshCw className="h-4 w-4" /> Change file
            </Button>
            <Button type="button" variant="gradient" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
