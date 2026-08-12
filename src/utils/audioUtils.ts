/**
 * Utility functions for handling audio URLs, Base64 audio, and Google Drive audio links.
 */

const getActualUrl = (rawLink: string): string => {
  if (!rawLink) return '';
  const trimmed = rawLink.trim();

  // If already base64 or blob URL, return as-is
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // Extract URL from string if embedded in text like "Câu 1: https://..."
  const urlMatch = trimmed.match(/https?:\/\/[^\s"']+/);
  return urlMatch ? urlMatch[0] : trimmed;
};

const getDriveFileInfo = (rawLink: string): { fileId: string; resourceKey: string } => {
  const trimmed = rawLink.trim();
  const directId = /^[a-zA-Z0-9_-]{25,60}$/.test(trimmed) ? trimmed : '';
  const actualUrl = getActualUrl(rawLink);

  // Check if it's a Google Drive link (e.g. /d/FILE_ID, id=FILE_ID, /uc?id=FILE_ID)
  const idMatch = actualUrl.match(/\/d\/([a-zA-Z0-9_-]+)|[?&]id=([a-zA-Z0-9_-]+)/);
  const fileId = directId || idMatch?.[1] || idMatch?.[2] || '';
  const resourceKeyMatch = actualUrl.match(/[?&]resourcekey=([^&#]+)/i);
  const resourceKey = resourceKeyMatch ? decodeURIComponent(resourceKeyMatch[1]) : '';
  return { fileId, resourceKey };
};

/**
 * Converts Google Drive links to an image thumbnail URL. Drive thumbnails are
 * more reliable than the media endpoint for image MIME types and HEIC uploads.
 */
export const getDriveMediaPlayerUrl = (rawLink: string): string => {
  if (!rawLink) return '';
  const trimmed = rawLink.trim();
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return trimmed;

  const actualUrl = getActualUrl(rawLink);
  const { fileId, resourceKey } = getDriveFileInfo(rawLink);
  if (fileId) {
    const params = new URLSearchParams({ id: fileId, sz: 'w2000' });
    if (resourceKey) params.set('resourcekey', resourceKey);
    return `https://drive.google.com/thumbnail?${params.toString()}`;
  }

  return actualUrl;
};

/** Returns the direct media URL used by HTML5 audio players. */
export const getDriveAudioPlayerUrl = (rawLink: string): string => {
  if (!rawLink) return '';
  const trimmed = rawLink.trim();
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return trimmed;

  const actualUrl = getActualUrl(rawLink);
  const { fileId, resourceKey } = getDriveFileInfo(rawLink);
  if (fileId) {
    const params = new URLSearchParams({ export: 'media', id: fileId });
    if (resourceKey) params.set('resourcekey', resourceKey);
    return `https://drive.google.com/uc?${params.toString()}`;
  }

  return actualUrl;
};

/**
 * Returns a valid audio src string for HTML5 <audio> element.
 * Prioritizes Base64 data (which works on all devices) over ephemeral blob URLs.
 */
export const getAudioSrcFromObject = (aud: { data?: string; mime?: string; url?: string }): string => {
  if (!aud) return '';
  if (aud.data) {
    const mime = aud.mime || 'audio/webm';
    return aud.data.startsWith('data:') ? aud.data : `data:${mime};base64,${aud.data}`;
  }
  if (aud.url) {
    if (aud.url.startsWith('blob:')) {
      // Blob URLs are ephemeral and fail across sessions/devices. Return if valid.
      return aud.url;
    }
    return getDriveAudioPlayerUrl(aud.url);
  }
  return '';
};
