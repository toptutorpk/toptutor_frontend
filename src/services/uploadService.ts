import { http } from '@/api/client';

export type UploadCategory = 'profile-image' | 'cover-image' | 'video-intro' | 'document';

export interface UploadResult {
  url: string;
  key: string;
  contentType: string;
  size: number;
}

export const uploadService = {
  /**
   * Uploads a file to object storage (R2) under the given category and returns its public URL.
   * Pass {@link replaces} (a URL from an earlier, not-yet-saved upload in this session) to have the
   * server delete that throwaway object once the new one lands.
   */
  async upload(
    file: File,
    category: UploadCategory,
    opts?: { onProgress?: (percent: number) => void; replaces?: string },
  ): Promise<UploadResult> {
    const form = new FormData();
    form.append('category', category);
    if (opts?.replaces) form.append('replaces', opts.replaces);
    form.append('file', file);
    return http.upload<UploadResult>('/uploads', form, opts?.onProgress);
  },
};
