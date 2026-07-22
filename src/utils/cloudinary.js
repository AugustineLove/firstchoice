// utils/cloudinary.js
//
// Web equivalent of the Flutter CloudinaryService — unsigned upload straight
// from the browser to Cloudinary, no backend round-trip needed.
//
// Uses the same cloud name / unsigned preset as the Flutter apps
// (`firstchoice_unsigned`, see AppConstants.cloudinaryCloudName). Swap the
// two constants below for real values (env vars) before shipping.

const CLOUDINARY_CLOUD_NAME = import.meta?.env?.VITE_CLOUDINARY_CLOUD_NAME || 'YOUR_CLOUD_NAME';
const CLOUDINARY_UPLOAD_PRESET = import.meta?.env?.VITE_CLOUDINARY_UPLOAD_PRESET || 'firstchoice_unsigned';

console.log(CLOUDINARY_CLOUD_NAME)
/**
 * Upload a File/Blob to Cloudinary using an unsigned preset.
 * Mirrors CloudinaryService.uploadFile — same folder convention, same
 * "return the secure_url or null" contract, plus an onProgress callback
 * (XHR gives us real upload progress, which plain fetch doesn't).
 *
 * @param {File} file
 * @param {{ folder?: string, onProgress?: (pct: number) => void }} opts
 * @returns {Promise<string|null>} secure_url on success, null on failure
 */
export function uploadToCloudinary(file, { folder = 'firstchoice', onProgress } = {}) {
  return new Promise((resolve) => {
    if (!file) return resolve(null);

    const form = new FormData();
    form.append('file', file);
    form.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    form.append('folder', folder);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total);
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) {
          resolve(data.secure_url);
        } else {
          console.error('Cloudinary upload failed', data);
          resolve(null);
        }
      } catch (err) {
        console.error('Cloudinary response parse error', err);
        resolve(null);
      }
    };

    xhr.onerror = () => {
      console.error('Cloudinary upload network error');
      resolve(null);
    };

    xhr.send(form);
  });
}

/** Quick client-side guardrails before we even try an upload. */
export function validateImageFile(file, { maxSizeMb = 8 } = {}) {
  if (!file.type.startsWith('image/')) return 'Please choose an image file.';
  if (file.size > maxSizeMb * 1024 * 1024) return `Image must be under ${maxSizeMb}MB.`;
  return null;
}