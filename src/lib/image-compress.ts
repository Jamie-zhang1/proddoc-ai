/**
 * Compress an image data URL to reduce localStorage usage.
 * Resizes to maxWidth and applies JPEG quality compression.
 */
export function compressImage(
  dataUrl: string,
  maxWidth = 800,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve) => {
    if (!dataUrl.startsWith("data:image")) {
      resolve(dataUrl);
      return;
    }

    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Estimate localStorage usage in bytes by serializing all stored values.
 */
export function estimateLocalStorageUsage(): number {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      total += key.length * 2; // UTF-16
      const value = localStorage.getItem(key);
      if (value) total += value.length * 2;
    }
  }
  return total;
}

/**
 * Check if there's enough space to store `additionalBytes` more.
 * Returns true if there appears to be room (assumes ~5MB limit).
 */
export function hasStorageCapacity(additionalBytes: number): boolean {
  const used = estimateLocalStorageUsage();
  const limit = 5 * 1024 * 1024; // 5MB typical limit
  return used + additionalBytes < limit;
}
