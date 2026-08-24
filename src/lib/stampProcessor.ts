/**
 * Stamp Image Processing & High-Performance Rendering Cache
 */

// Cache of raw HTMLImageElements
const rawImageCache = new Map<string, HTMLImageElement>();
// Cache of tinted offscreen canvases keyed by `${imageUrl}_${color}`
const tintedCanvasCache = new Map<string, HTMLCanvasElement>();

/**
 * Get or asynchronously load an HTMLImageElement from a URL (Data URL or Asset URL)
 */
export const getOrLoadStampImage = (url: string): HTMLImageElement | null => {
  if (!url) return null;
  const cached = rawImageCache.get(url);
  if (cached && cached.complete && cached.naturalWidth > 0) {
    return cached;
  }

  if (!cached) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    img.onload = () => {
      rawImageCache.set(url, img);
    };
    rawImageCache.set(url, img);
  }
  return null;
};

/**
 * Clear cache when memory needs flushing
 */
export const clearStampCache = () => {
  rawImageCache.clear();
  tintedCanvasCache.clear();
};

/**
 * Get a cached offscreen canvas containing the stamp image tinted with a specific hex/rgb color.
 * Uses alpha channel of the image as the mask and applies fill color via 'source-in'.
 */
export const getTintedStampCanvas = (
  imageUrl: string,
  color: string,
  invert: boolean = false
): HTMLCanvasElement | null => {
  const cacheKey = `${imageUrl}_${color}_${invert}`;
  const cached = tintedCanvasCache.get(cacheKey);
  if (cached) return cached;

  const sourceImg = getOrLoadStampImage(imageUrl);
  if (!sourceImg || !sourceImg.complete || sourceImg.naturalWidth === 0) {
    return null;
  }

  const canvas = document.createElement('canvas');
  const w = sourceImg.naturalWidth || 256;
  const h = sourceImg.naturalHeight || 256;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  // Draw base image
  ctx.drawImage(sourceImg, 0, 0, w, h);

  if (invert) {
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i];
      data[i + 1] = 255 - data[i + 1];
      data[i + 2] = 255 - data[i + 2];
    }
    ctx.putImageData(imgData, 0, 0);
  }

  // Tint with color using source-in (keeps only alpha, fills with color)
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);

  tintedCanvasCache.set(cacheKey, canvas);
  return canvas;
};

export interface ProcessStampOptions {
  maxDimension?: number;
  removeBackground?: boolean;
  threshold?: number; // 0 - 255
  invertMask?: boolean;
  contrast?: number; // 0 - 100
}

/**
 * Process an imported image file or data URL into a clean, normalized stamp mask
 */
export const processImageToStampDataUrl = async (
  fileOrUrl: File | string,
  options: ProcessStampOptions = {}
): Promise<string> => {
  const maxDim = options.maxDimension || 512;
  const removeBg = options.removeBackground ?? true;
  const threshold = options.threshold ?? 240;
  const invertMask = options.invertMask ?? false;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      let width = img.naturalWidth || 256;
      let height = img.naturalHeight || 256;

      // Scale to max dimension
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        reject(new Error("Could not create 2D canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Perform luminance extraction & alpha mask processing
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;
      let hasAlpha = false;

      // Check if image already has transparent pixels
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 250) {
          hasAlpha = true;
          break;
        }
      }

      // If image is solid RGB without alpha (like JPG), extract luminance to alpha
      if (!hasAlpha && removeBg) {
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

          if (invertMask) {
            // Dark becomes transparent, bright becomes opaque
            data[i] = 255;
            data[i + 1] = 255;
            data[i + 2] = 255;
            data[i + 3] = brightness > (255 - threshold) ? Math.min(255, (brightness / 255) * 255) : 0;
          } else {
            // White becomes transparent, dark becomes opaque
            data[i] = 255;
            data[i + 1] = 255;
            data[i + 2] = 255;
            const darkness = 255 - brightness;
            data[i + 3] = brightness < threshold ? Math.min(255, (darkness / 255) * 255 * 1.5) : 0;
          }
        }
        ctx.putImageData(imgData, 0, 0);
      } else if (invertMask) {
        for (let i = 0; i < data.length; i += 4) {
          data[i] = 255 - data[i];
          data[i + 1] = 255 - data[i + 1];
          data[i + 2] = 255 - data[i + 2];
        }
        ctx.putImageData(imgData, 0, 0);
      }

      const resultUrl = canvas.toDataURL('image/png');
      // Pre-warm raw image cache
      getOrLoadStampImage(resultUrl);
      resolve(resultUrl);
    };

    img.onerror = () => {
      reject(new Error("Failed to load image for stamp processing."));
    };

    if (typeof fileOrUrl === 'string') {
      img.src = fileOrUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Error reading file"));
      reader.readAsDataURL(fileOrUrl);
    }
  });
};
