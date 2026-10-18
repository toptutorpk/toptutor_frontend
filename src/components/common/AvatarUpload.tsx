import { useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ImageCropDialog } from '@/components/common/ImageCropDialog';
import { uploadService } from '@/services/uploadService';
import { accountService } from '@/services/accountService';
import { useAuthStore } from '@/store/authStore';
import { getAccessToken, ApiError } from '@/api/client';
import { getInitials } from '@/lib/utils';
import { toast } from '@/components/ui/sonner';

interface Props {
  /** Current photo URL (falls back to the session avatar). */
  url?: string | null;
  name?: string;
  /** Diameter in px. */
  size?: number;
  /**
   * What this image is called, in the person's words — "profile photo" for a person, "logo" for
   * an institute. Used in the control's accessible name, the crop dialog and the success message,
   * so a school is never told it updated its "profile photo".
   */
  label?: string;
  /** Called with the new URL after a successful upload (e.g. to sync a form field). */
  onChange?: (url: string) => void;
}

/**
 * Image control shared by every account that has one: pick an image → crop it (circular) → upload
 * ONLY the 512×512 crop to R2 (replacing the previous one) → persist + reflect in the session
 * avatar. The original is never stored.
 *
 * <p>Where the image is saved is the server's decision, not this component's: {@code updatePhoto}
 * routes by the caller's role — a tutor's to {@code tutor_profile.photo_url}, a learner's to their
 * profile, an institute's to {@code institute_profile.logo_url}. That is what lets one control
 * serve all of them.
 */
export function AvatarUpload({ url, name, size = 80, label = 'profile photo', onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const [picked, setPicked] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [current, setCurrent] = useState<string | null>(url ?? user?.avatarUrl ?? null);

  const pick = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }
    setPicked((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const closeCrop = () => {
    setPicked((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const onSave = async (blob: Blob) => {
    setSaving(true);
    try {
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
      // Upload only the cropped image; `replaces` deletes the previous avatar so nothing is retained.
      const result = await uploadService.upload(file, 'profile-image', { replaces: current ?? undefined });
      await accountService.updatePhoto(result.url);
      setCurrent(result.url);
      onChange?.(result.url);
      if (user) setSession({ ...user, avatarUrl: result.url }, getAccessToken() ?? '');
      toast.success(`${capitalise(label)} updated`);
      closeCrop();
    } catch (e) {
      toast.error(`Could not update ${label}`, {
        description: e instanceof ApiError || e instanceof Error ? e.message : 'Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  const displayUrl = current ?? user?.avatarUrl ?? undefined;

  return (
    <>
      <div className="relative" style={{ width: size, height: size }}>
        <Avatar className="h-full w-full">
          <AvatarImage src={displayUrl} alt={name} />
          <AvatarFallback className="text-xl">{getInitials(name ?? 'TT')}</AvatarFallback>
        </Avatar>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-md bg-brand-600 text-white shadow-md transition-colors hover:bg-brand-700"
          aria-label={`Change ${label}`}
        >
          <Camera className="h-4 w-4" />
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) pick(f);
            e.target.value = ''; // allow re-picking the same file
          }}
        />
      </div>

      <ImageCropDialog
        open={!!picked}
        imageSrc={picked}
        saving={saving}
        title={`Adjust your ${label}`}
        saveLabel={`Save ${label}`}
        onCancel={closeCrop}
        onSave={onSave}
      />
    </>
  );
}

/** "logo" → "Logo". Only the first character, so "profile photo" does not become "Profile Photo". */
function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
