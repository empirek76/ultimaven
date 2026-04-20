import { supabase } from './supabase';

const VIDEOS_BUCKET     = 'lb-videos';
const THUMBNAILS_BUCKET = 'lb-thumbnails';

export interface UploadProgress { loaded: number; total: number; percent: number; }

const UPLOAD_TIMEOUT_MS = 90_000;

async function uploadWithTimeout(
  blob: Blob,
  path: string,
  contentType: string,
  attempt: number,
): Promise<void> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Upload timeout after ${UPLOAD_TIMEOUT_MS / 1000}s`)), UPLOAD_TIMEOUT_MS)
  );

  const uploadPromise = supabase.storage
    .from(VIDEOS_BUCKET)
    .upload(path, blob, { contentType: 'video/mp4', upsert: true })
    .then(({ data, error }) => {
      console.error(`UPLOAD RESULT (attempt ${attempt}) - data:`, JSON.stringify(data), 'error:', JSON.stringify(error));
      if (error) throw new Error(`Video upload failed: ${error.message}`);
    });

  return Promise.race([uploadPromise, timeoutPromise]);
}

/**
 * Uploads a video file to lb-videos/{trackId}/{lbNumber}/{userId}.mp4
 * Reports phases via onPhase callback so the UI can drive its progress bar.
 * Retries the upload once on failure before throwing.
 */
export async function uploadLBVideo(
  fileUri: string,
  trackId: string,
  lbNumber: number,
  userId: string,
  onPhase?: (phase: 'converting' | 'uploading' | 'retrying') => void,
): Promise<string> {
  const path = `${trackId}/${lbNumber}/${userId}.mp4`;
  console.error('UPLOADING TO SUPABASE - bucket: lb-videos, path:', path);

  // Phase 1 — convert URI to Blob
  onPhase?.('converting');
  const response = await fetch(fileUri);
  const blob     = await response.blob();
  console.error('BLOB TYPE:', blob.type, 'BLOB SIZE:', blob.size, 'bytes', `(${(blob.size / 1024 / 1024).toFixed(1)} MB)`);

  if (blob.size > 100 * 1024 * 1024) {
    console.error('WARNING: Video is large (>100 MB), upload may take a few minutes');
  }

  // Phase 2 — upload with timeout, retry once on failure
  onPhase?.('uploading');
  try {
    await uploadWithTimeout(blob, path, 'video/mp4', 1);
  } catch (firstErr: any) {
    console.error('UPLOAD ATTEMPT 1 FAILED:', firstErr.message, '— retrying...');
    onPhase?.('retrying');
    await uploadWithTimeout(blob, path, 'video/mp4', 2);
  }

  return path;
}

/**
 * Returns the public download URL for a video in the lb-videos bucket.
 * Requires the bucket to be set to Public in Supabase Storage settings.
 */
export function getLBVideoUrl(storagePath: string): string {
  const { data } = supabase.storage
    .from(VIDEOS_BUCKET)
    .getPublicUrl(storagePath);

  if (!data?.publicUrl) {
    throw new Error(`Could not get public URL for: ${storagePath}`);
  }
  return data.publicUrl;
}

/**
 * Uploads a thumbnail to lb-thumbnails/{trackId}/{lbNumber}.jpg (public bucket).
 * Returns the public URL.
 */
export async function uploadThumbnail(
  fileUri: string,
  trackId: string,
  lbNumber: number,
): Promise<string> {
  const path = `${trackId}/${lbNumber}.jpg`;

  const response = await fetch(fileUri);
  const blob     = await response.blob();

  const { data, error } = await supabase.storage
    .from(THUMBNAILS_BUCKET)
    .upload(path, blob, { contentType: 'image/jpeg', upsert: true });

  console.error('THUMBNAIL UPLOAD RESULT - data:', JSON.stringify(data), 'error:', JSON.stringify(error));

  if (error) throw new Error(`Thumbnail upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from(THUMBNAILS_BUCKET)
    .getPublicUrl(path);

  return urlData.publicUrl;
}

/**
 * Deletes a video from lb-videos. Admin-only — enforced by RLS.
 */
export async function deleteLBVideo(storagePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from(VIDEOS_BUCKET)
    .remove([storagePath]);

  if (error) throw new Error(`Video delete failed: ${error.message}`);
}
