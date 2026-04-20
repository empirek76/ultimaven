import { supabase } from './supabase';

const VIDEOS_BUCKET     = 'lb-videos';
const THUMBNAILS_BUCKET = 'lb-thumbnails';

export interface UploadProgress { loaded: number; total: number; percent: number; }

/**
 * Uploads a video file to lb-videos/{trackId}/{lbNumber}/{userId}.mp4
 * Converts the local file:// URI to a Blob first (required for React Native).
 * Returns the storage path on success.
 */
export async function uploadLBVideo(
  fileUri: string,
  trackId: string,
  lbNumber: number,
  userId: string,
  contentType: string = 'video/mp4',
  onProgress?: (p: UploadProgress) => void,
): Promise<string> {
  const path = `${trackId}/${lbNumber}/${userId}.mp4`;

  console.error('UPLOADING TO SUPABASE - bucket: lb-videos, path:', path);

  const response = await fetch(fileUri);
  const blob     = await response.blob();
  const total    = blob.size;

  console.error('UPLOAD START - file:', fileUri, 'size:', total, 'type:', contentType);

  onProgress?.({ loaded: 0, total, percent: 0 });

  const { data, error } = await supabase.storage
    .from(VIDEOS_BUCKET)
    .upload(path, blob, { contentType: 'video/mp4', upsert: true });

  console.error('UPLOAD RESULT - data:', JSON.stringify(data), 'error:', JSON.stringify(error));

  if (error) throw new Error(`Video upload failed: ${error.message}`);

  onProgress?.({ loaded: total, total, percent: 100 });
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
