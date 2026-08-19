import { useEffect, useState } from 'react';
import { ImageIcon, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/DashboardKit';
import { Button } from '@/components/ui/button';
import { Field, SectionTitle } from '@/components/tutor/profileFields';
import { MediaUploadField } from '@/components/tutor/MediaUploadField';
import { authService, type TutorProfilePayload } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import { ApiError, getAccessToken } from '@/api/client';
import { toast } from '@/components/ui/sonner';

/**
 * Tutor media library — the files shown on the public profile.
 *
 * <p>Split out of the profile form: uploads are a different kind of edit from typing into fields,
 * and grouping them gives the other media types (intro video, gallery) somewhere to land later
 * without stretching the profile page further.
 *
 * <p>The save sends the whole profile back because the endpoint is a PUT — the loaded profile is
 * kept verbatim and only the media URLs are replaced, so saving here can't quietly drop a field
 * that was set on the profile page.
 */
export default function TutorMedia() {
  const setSession = useAuthStore((s) => s.setSession);
  const [profile, setProfile] = useState<TutorProfilePayload | null>(null);
  const [coverUrl, setCoverUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    authService
      .getMyTutorProfile()
      .then((p) => {
        if (cancelled || !p) return;
        setProfile(p);
        setCoverUrl(p.coverUrl ?? '');
      })
      .catch(() => {
        /* leave empty; a fresh profile may not exist yet */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const save = async () => {
    if (!profile) {
      toast.error('Finish your profile first', {
        description: 'Add your name and details on the Profile page before uploading media.',
      });
      return;
    }
    setSaving(true);
    try {
      const updated = await authService.updateTutorProfile({
        ...profile,
        coverUrl: coverUrl.trim() ? coverUrl.trim() : undefined,
      });
      setSession(updated, getAccessToken() ?? '');
      toast.success('Media saved', { description: 'Your changes are now live on your profile.' });
    } catch (e) {
      toast.error('Could not save media', {
        description: e instanceof ApiError || e instanceof Error ? e.message : 'Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Media" description="Images and video shown on your public profile." />
        <div className="flex items-center justify-center rounded-2xl border bg-card p-12 shadow-soft">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Media" description="Images and video shown on your public profile." />

      <div className="space-y-6">
        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <SectionTitle icon={ImageIcon} title="Profile media" hint="More media types coming soon" />
          <Field
            label="Cover image"
            hint="A banner shown at the top of your public profile — a wide image works best, around 1600 × 400 pixels."
          >
            <MediaUploadField
              kind="image"
              category="cover-image"
              value={coverUrl || undefined}
              onChange={(url) => setCoverUrl(url ?? '')}
            />
          </Field>
        </div>

        <div className="flex justify-end">
          <Button variant="gradient" size="lg" onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}
