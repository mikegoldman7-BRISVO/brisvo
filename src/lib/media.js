import { supabase, supabaseAnonKey, supabaseUrl } from "./supabase";
import { getDisplayFileName, normaliseWhitespace } from "./storage-paths";

export { createStoragePath, deriveStoragePathFromPublicUrl, getDisplayFileName } from "./storage-paths";

export const PROFILE_IMAGE_BUCKET = import.meta.env.VITE_SUPABASE_PROFILE_BUCKET || "artist-images";
export const DEMO_AUDIO_BUCKET = import.meta.env.VITE_SUPABASE_DEMO_BUCKET || "artist-demos";

export const IMAGE_UPLOAD_LIMIT_BYTES = 8 * 1024 * 1024;
export const AUDIO_UPLOAD_LIMIT_BYTES = 25 * 1024 * 1024;

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const ACCEPTED_AUDIO_TYPES = ["audio/mpeg", "audio/mp3"];

function buildStorageObjectUrl(bucket, path) {
  const encodedPath = path
    .split("/")
    .map(segment => encodeURIComponent(segment))
    .join("/");

  return `${supabaseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${encodedPath}`;
}

export function formatBytes(bytes = 0) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value >= 10 || exponent === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[exponent]}`;
}

export function validateImageFile(file) {
  if (!file) return "Select an image to upload.";
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return "Profile pictures must be JPEG, PNG, or WebP.";
  }
  if (file.size > IMAGE_UPLOAD_LIMIT_BYTES) {
    return `Profile pictures must be ${formatBytes(IMAGE_UPLOAD_LIMIT_BYTES)} or smaller.`;
  }
  return "";
}

export function validateAudioFile(file) {
  if (!file) return "Select an MP3 file to upload.";

  const isMp3Type = ACCEPTED_AUDIO_TYPES.includes(file.type);
  const isMp3Name = file.name.toLowerCase().endsWith(".mp3");

  if (!isMp3Type && !isMp3Name) {
    return "Demo uploads must be MP3 files.";
  }
  if (file.size > AUDIO_UPLOAD_LIMIT_BYTES) {
    return `Demo uploads must be ${formatBytes(AUDIO_UPLOAD_LIMIT_BYTES)} or smaller.`;
  }
  return "";
}

export function createDemoTitleFromFile(fileName = "") {
  const stem = fileName.replace(/\.[^.]+$/, "");
  return normaliseWhitespace(stem.replace(/[-_]+/g, " ")) || "Untitled demo";
}

export async function uploadFileWithProgress({ bucket, path, file, onProgress }) {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message || "Unable to read your session.");
  }

  const accessToken = data.session?.access_token;

  if (!accessToken) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  const uploadUrl = buildStorageObjectUrl(bucket, path);

  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open("POST", uploadUrl);
    xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
    xhr.setRequestHeader("apikey", supabaseAnonKey);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

    xhr.upload.onprogress = event => {
      if (!event.lengthComputable) return;
      onProgress?.(Math.round((event.loaded / event.total) * 100));
    };

    xhr.onerror = () => {
      reject(new Error("Upload failed before the server returned a response."));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
        return;
      }

      try {
        const parsed = JSON.parse(xhr.responseText);
        reject(new Error(parsed.message || parsed.error || "Upload failed."));
      } catch {
        reject(new Error(xhr.responseText || "Upload failed."));
      }
    };

    xhr.send(file);
  });

  return getPublicUrl(bucket, path);
}

export function getPublicUrl(bucket, path) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function listBucketFolder(bucket, folder) {
  const { data, error } = await supabase.storage.from(bucket).list(folder, {
    limit: 100,
    sortBy: { column: "created_at", order: "desc" },
  });

  if (error) {
    throw new Error(error.message || "Unable to list stored files.");
  }

  return (data || [])
    .filter(entry => entry.name && !entry.id?.endsWith("/"))
    .map(entry => {
      const path = `${folder}/${entry.name}`;

      return {
        ...entry,
        path,
        displayName: getDisplayFileName(entry.name),
        publicUrl: getPublicUrl(bucket, path),
      };
    });
}

export async function deleteBucketObject(bucket, path) {
  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    throw new Error(error.message || "Unable to delete the file from storage.");
  }
}

function sleep(delayMs) {
  return new Promise(resolve => {
    window.setTimeout(resolve, delayMs);
  });
}

export async function deleteBucketObjectConfirmed({
  bucket,
  path,
  folder,
  attempts = 4,
  delayMs = 250,
}) {
  await deleteBucketObject(bucket, path);

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const files = await listBucketFolder(bucket, folder);
    const stillExists = files.some(file => file.path === path);

    if (!stillExists) {
      return files;
    }

    if (attempt < attempts - 1) {
      await sleep(delayMs);
    }
  }

  throw new Error("Storage delete did not persist. The file is still present in Supabase Storage.");
}
