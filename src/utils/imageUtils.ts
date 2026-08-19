export const fileToCompressedDataUrl = (
  file: File,
  maxDimension = 1100,
  quality = 0.65
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // If not an image, resolve as standard data URL
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        // Fill white background for potential PNG transparent areas when exporting JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };

      img.onerror = () => {
        // Fallback to uncompressed read if image load fails
        resolve(event.target?.result as string);
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const getDriveFileId = (value: string): string => {
  const match = value.match(/\/d\/([a-zA-Z0-9_-]+)|[?&]id=([a-zA-Z0-9_-]+)/);
  return match?.[1] || match?.[2] || '';
};

/**
 * Keeps one canonical copy of each image when the same submission is read
 * from Google Sheets, the server cache, and the local handwriting store.
 * Remote URLs are authoritative once available; base64 is only a fallback.
 */
export const normalizeImageList = (images?: string[]): string[] => {
  if (!Array.isArray(images)) return [];

  const remoteImages = images.filter(
    (image): image is string =>
      typeof image === 'string' && image.trim() !== '' && !image.trim().startsWith('data:') && !image.trim().startsWith('blob:')
  );
  const localImages = images.filter(
    (image): image is string =>
      typeof image === 'string' && image.trim() !== '' && (image.trim().startsWith('data:') || image.trim().startsWith('blob:'))
  );
  const source = remoteImages.length > 0 ? remoteImages : localImages;
  const seen = new Set<string>();

  return source.reduce<string[]>((result, image) => {
    const trimmed = image.trim().replace(/[),.;]+$/, '');
    if (trimmed.length <= 10 || trimmed.startsWith('[')) return result;

    const driveId = getDriveFileId(trimmed);
    const key = driveId ? `drive:${driveId}` : trimmed;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(trimmed);
    }
    return result;
  }, []);
};
