import { supabase } from './database';

/**
 * Nexora DPR Storage Service
 * Abstracted Object Storage Service supporting Supabase Storage Buckets
 * with transparent client-side image compression and Base64 conversion helpers.
 */

const DEFAULT_ATTACHMENTS_BUCKET = import.meta.env.VITE_STORAGE_BUCKET || 'dpr-attachments';
const DEFAULT_AVATARS_BUCKET = import.meta.env.VITE_AVATARS_BUCKET || 'dpr-avatars';

/**
 * Check if string is a Base64 Data URL
 */
export const isBase64Url = (str) => {
  return typeof str === 'string' && (str.startsWith('data:image/') || str.startsWith('data:application/'));
};

/**
 * Compress image using HTML Canvas before upload
 */
export const compressImage = (file, maxDim = 1200, quality = 0.8) => {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

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

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
};

/**
 * Upload binary File to Supabase Storage bucket
 */
export const uploadFileToStorage = async (file, folder = 'reports', bucketName = DEFAULT_ATTACHMENTS_BUCKET) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

    const { data, error } = await supabase.storage.from(bucketName).upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
    });

    if (error) {
      console.warn(`Supabase Storage upload warning (${bucketName}):`, error.message);
      // Fallback: return compressed base64 if bucket does not exist or permission error
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    }

    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(data.path);
    return publicUrlData.publicUrl;
  } catch (err) {
    console.error("Storage upload exception:", err);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  }
};

/**
 * Upload Base64 Data URL to Supabase Storage bucket
 */
export const uploadBase64ToStorage = async (base64Str, filename, folder = 'reports', bucketName = DEFAULT_ATTACHMENTS_BUCKET) => {
  try {
    const matches = base64Str.match(/^data:(.+);base64,(.+)$/);
    if (!matches) return base64Str;

    const mimeType = matches[1];
    const base64Data = matches[2];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });

    const fileExt = mimeType.split('/')[1] || 'png';
    const filePath = `${folder}/${filename}_${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage.from(bucketName).upload(filePath, blob, {
      contentType: mimeType,
      cacheControl: '31536000',
      upsert: true,
    });

    if (error) {
      console.warn(`Storage uploadBase64 warning: ${error.message}`);
      return base64Str;
    }

    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(data.path);
    return publicUrlData.publicUrl;
  } catch (err) {
    console.warn("Storage uploadBase64 exception:", err);
    return base64Str;
  }
};
