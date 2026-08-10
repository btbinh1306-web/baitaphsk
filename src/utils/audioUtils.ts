/**
 * Utility functions for handling audio URLs, Base64 audio, and Google Drive audio links.
 */

/**
 * Converts Google Drive view links or raw audio links to playable/embeddable streaming URLs.
 * Example Google Drive link: https://drive.google.com/file/d/1ABC123XYZ/view?usp=sharing
 * Playable output: https://lh3.googleusercontent.com/d/1ABC123XYZ
 */
export const getDriveAudioPlayerUrl = (rawLink: string): string => {
  if (!rawLink) return '';
  const trimmed = rawLink.trim();

  // If already base64 or blob URL, return as-is
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // If raw string is directly a Google Drive File ID (25-60 chars alphanumeric)
  if (/^[a-zA-Z0-9_-]{25,60}$/.test(trimmed)) {
    return `https://lh3.googleusercontent.com/d/${trimmed}`;
  }

  // Extract URL from string if embedded in text like "Câu 1: https://..."
  const urlMatch = trimmed.match(/https?:\/\/[^\s"']+/);
  const actualUrl = urlMatch ? urlMatch[0] : trimmed;

  // Check if it's a Google Drive link (e.g. /d/FILE_ID, id=FILE_ID, /uc?id=FILE_ID)
  const idMatch = actualUrl.match(/\/d\/([a-zA-Z0-9_-]+)|[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) {
    const fileId = idMatch[1] || idMatch[2];
    if (fileId) {
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
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
