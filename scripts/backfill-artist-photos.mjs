import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";

import {
  buildStoragePath,
  createArtistMatchIndex,
  deriveStoragePathFromPublicUrl,
  normaliseArtistMatchKey,
  normaliseLegacyFileMatchKey,
  resolveArtistMatchForKey,
} from "../src/lib/storage-paths.js";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "..");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex <= 0) continue;

    const key = trimmed.slice(0, separatorIndex).trim();

    if (!key || process.env[key] !== undefined) continue;

    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

function loadProjectEnv() {
  loadEnvFile(path.join(PROJECT_ROOT, ".env"));
  loadEnvFile(path.join(PROJECT_ROOT, ".env.local"));
}

function parseArgs(argv) {
  const options = {
    artistId: "",
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--artist-id") {
      const value = argv[index + 1];

      if (!value) {
        throw new Error("Missing value for --artist-id.");
      }

      options.artistId = value;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function readRequiredEnv(name, fallbacks = []) {
  const value = [process.env[name], ...fallbacks.map(fallback => process.env[fallback])]
    .find(candidate => typeof candidate === "string" && candidate.trim());

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value.trim();
}

function getConfig() {
  return {
    legacyBucket: process.env.LEGACY_IMAGE_BUCKET || "artists",
    legacyPrefix: process.env.LEGACY_IMAGE_PREFIX || "headshots",
    profileBucket: process.env.PROFILE_IMAGE_BUCKET || process.env.VITE_SUPABASE_PROFILE_BUCKET || "artist-images",
    serviceRoleKey: readRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    supabaseUrl: readRequiredEnv("SUPABASE_URL", ["VITE_SUPABASE_URL"]),
  };
}

function createSupabaseAdminClient(config) {
  return createClient(config.supabaseUrl, config.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function getPublicUrl(supabase, bucket, storagePath) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  return data.publicUrl;
}

async function listBucketFiles(supabase, bucket, folder) {
  const files = [];
  let offset = 0;
  const pageSize = 100;

  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list(folder, {
      limit: pageSize,
      offset,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) {
      throw new Error(`Unable to list ${bucket}/${folder}: ${error.message}`);
    }

    const pageFiles = (data || [])
      .filter(entry => entry.name && !entry.id?.endsWith("/"))
      .map(entry => ({
        ...entry,
        matchKey: normaliseLegacyFileMatchKey(entry.name),
        path: `${folder}/${entry.name}`,
      }));

    files.push(...pageFiles);

    if (pageFiles.length < pageSize) {
      break;
    }

    offset += pageSize;
  }

  return files;
}

async function loadArtists(supabase, artistId) {
  let query = supabase
    .from("artists")
    .select("id, name, photo_url")
    .order("name", { ascending: true });

  if (artistId) {
    query = query.eq("id", artistId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Unable to load artists: ${error.message}`);
  }

  return data || [];
}

function appendMapList(map, key, value) {
  const items = map.get(key) || [];
  items.push(value);
  map.set(key, items);
}

function dedupeFilesByPath(files) {
  const deduped = new Map();

  for (const file of files) {
    deduped.set(file.path, file);
  }

  return [...deduped.values()];
}

function getSourceFileTimestamp(sourceFile) {
  const parsedTimestamp = Date.parse(sourceFile.created_at || sourceFile.updated_at || "");
  return Number.isFinite(parsedTimestamp) ? parsedTimestamp : Date.now();
}

async function copyLegacyFile({
  destinationBucket,
  destinationPath,
  sourceBucket,
  sourceFile,
  supabase,
}) {
  const { data: blob, error: downloadError } = await supabase.storage
    .from(sourceBucket)
    .download(sourceFile.path);

  if (downloadError) {
    throw new Error(`Download failed for ${sourceBucket}/${sourceFile.path}: ${downloadError.message}`);
  }

  const { error: uploadError } = await supabase.storage
    .from(destinationBucket)
    .upload(destinationPath, Buffer.from(await blob.arrayBuffer()), {
      contentType: sourceFile.metadata?.mimetype || sourceFile.metadata?.contentType || blob.type || undefined,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Upload failed for ${destinationBucket}/${destinationPath}: ${uploadError.message}`);
  }

  return {
    path: destinationPath,
    publicUrl: getPublicUrl(supabase, destinationBucket, destinationPath),
  };
}

async function updateArtistPhotoUrl(supabase, artistId, photoUrl) {
  const { error } = await supabase
    .from("artists")
    .update({ photo_url: photoUrl })
    .eq("id", artistId);

  if (error) {
    throw new Error(`Failed to update artists.photo_url for ${artistId}: ${error.message}`);
  }
}

function logArtistResult({ artist, copiedFiles, dryRun, livePhotoUpdated, reason }) {
  const prefix = dryRun ? "[dry-run]" : "[backfill]";

  if (!copiedFiles.length) {
    console.log(`${prefix} ${artist.name} (${artist.id}): skipped${reason ? ` - ${reason}` : ""}`);
    return;
  }

  console.log(
    `${prefix} ${artist.name} (${artist.id}): copied ${copiedFiles.length} file(s)${
      livePhotoUpdated ? " and moved live photo" : ""
    }`,
  );
}

async function main() {
  loadProjectEnv();

  const options = parseArgs(process.argv.slice(2));
  const config = getConfig();
  const supabase = createSupabaseAdminClient(config);
  const artists = await loadArtists(supabase, options.artistId);

  if (artists.length === 0) {
    throw new Error(options.artistId ? `No artist found for id ${options.artistId}.` : "No artists found.");
  }

  const artistIndex = createArtistMatchIndex(artists);
  const legacyFiles = await listBucketFiles(supabase, config.legacyBucket, config.legacyPrefix);
  const legacyFilesByPath = new Map(legacyFiles.map(file => [file.path, file]));
  const legacyFilesByArtistId = new Map();
  const ambiguousFiles = [];
  const unmatchedFiles = [];
  const summary = {
    ambiguousMatches: 0,
    copiedFiles: 0,
    failedArtists: 0,
    processedArtists: artists.length,
    skippedArtists: 0,
    updatedArtists: 0,
  };
  const details = {
    ambiguousArtists: [],
    failures: [],
    skipped: [],
    unmatchedCurrentPhotos: [],
  };

  for (const file of legacyFiles) {
    const resolution = resolveArtistMatchForKey(file.matchKey, artistIndex);

    if (resolution.status === "matched") {
      appendMapList(legacyFilesByArtistId, resolution.artist.id, file);
      continue;
    }

    if (resolution.status === "ambiguous") {
      ambiguousFiles.push({
        artistIds: resolution.artists.map(artist => artist.id),
        artistNames: resolution.artists.map(artist => artist.name),
        matchKey: file.matchKey,
        path: file.path,
      });
      continue;
    }

    unmatchedFiles.push({ matchKey: file.matchKey, path: file.path });
  }

  summary.ambiguousMatches = ambiguousFiles.length;

  for (const artist of artists) {
    const nameMatchKey = normaliseArtistMatchKey(artist.name || "");
    const nameResolution = resolveArtistMatchForKey(nameMatchKey, artistIndex);
    const currentLegacyPath = deriveStoragePathFromPublicUrl(config.legacyBucket, artist.photo_url || "");
    const currentLegacyFile = currentLegacyPath?.startsWith(`${config.legacyPrefix}/`)
      ? legacyFilesByPath.get(currentLegacyPath)
      : null;
    const matchedByName = nameResolution.status === "matched"
      ? legacyFilesByArtistId.get(artist.id) || []
      : [];

    const filesToCopy = dedupeFilesByPath([
      ...matchedByName,
      ...(currentLegacyFile ? [currentLegacyFile] : []),
    ]);

    if (nameResolution.status === "ambiguous") {
      details.ambiguousArtists.push({
        artistId: artist.id,
        artistName: artist.name,
        matchKey: nameMatchKey,
      });
    }

    if (currentLegacyPath && !currentLegacyFile) {
      details.unmatchedCurrentPhotos.push({
        artistId: artist.id,
        artistName: artist.name,
        photoPath: currentLegacyPath,
      });
    }

    if (filesToCopy.length === 0) {
      summary.skippedArtists += 1;
      details.skipped.push({
        artistId: artist.id,
        artistName: artist.name,
        reason: currentLegacyPath
          ? "Current legacy photo not found and no unambiguous legacy headshots matched this artist."
          : "No unambiguous legacy headshots matched this artist.",
      });
      logArtistResult({
        artist,
        copiedFiles: [],
        dryRun: options.dryRun,
        reason: details.skipped.at(-1)?.reason,
      });
      continue;
    }

    const copiedFiles = [];
    let nextLivePhotoUrl = "";

    try {
      for (const file of filesToCopy) {
        const destinationPath = buildStoragePath({
          artistId: artist.id,
          fileName: file.name,
          kind: "profile",
          timestamp: getSourceFileTimestamp(file),
        });

        if (options.dryRun) {
          copiedFiles.push({
            fromPath: file.path,
            path: destinationPath,
            publicUrl: getPublicUrl(supabase, config.profileBucket, destinationPath),
          });
        } else {
          const uploadedFile = await copyLegacyFile({
            destinationBucket: config.profileBucket,
            destinationPath,
            sourceBucket: config.legacyBucket,
            sourceFile: file,
            supabase,
          });

          copiedFiles.push({
            fromPath: file.path,
            ...uploadedFile,
          });
        }

        summary.copiedFiles += 1;

        if (currentLegacyFile && file.path === currentLegacyFile.path) {
          nextLivePhotoUrl = copiedFiles.at(-1).publicUrl;
        }
      }

      if (currentLegacyFile && nextLivePhotoUrl) {
        if (!options.dryRun) {
          await updateArtistPhotoUrl(supabase, artist.id, nextLivePhotoUrl);
        }

        summary.updatedArtists += 1;
      }

      logArtistResult({
        artist,
        copiedFiles,
        dryRun: options.dryRun,
        livePhotoUpdated: Boolean(currentLegacyFile && nextLivePhotoUrl),
      });
    } catch (error) {
      summary.failedArtists += 1;
      details.failures.push({
        artistId: artist.id,
        artistName: artist.name,
        error: error.message,
      });
      console.error(`[error] ${artist.name} (${artist.id}): ${error.message}`);
    }
  }

  console.log("\nSummary");
  console.log(`Artists processed: ${summary.processedArtists}`);
  console.log(`Files copied${options.dryRun ? " (planned)" : ""}: ${summary.copiedFiles}`);
  console.log(`Artists updated${options.dryRun ? " (planned)" : ""}: ${summary.updatedArtists}`);
  console.log(`Artists skipped: ${summary.skippedArtists}`);
  console.log(`Ambiguous legacy files: ${summary.ambiguousMatches}`);
  console.log(`Artist failures: ${summary.failedArtists}`);

  if (ambiguousFiles.length > 0) {
    console.log("\nAmbiguous legacy files");
    for (const file of ambiguousFiles) {
      console.log(`- ${file.path} -> ${file.artistNames.join(", ")}`);
    }
  }

  if (details.ambiguousArtists.length > 0) {
    console.log("\nArtists with ambiguous name matches");
    for (const item of details.ambiguousArtists) {
      console.log(`- ${item.artistName} (${item.artistId})`);
    }
  }

  if (unmatchedFiles.length > 0) {
    console.log("\nUnmatched legacy files");
    for (const file of unmatchedFiles) {
      console.log(`- ${file.path}`);
    }
  }

  if (details.unmatchedCurrentPhotos.length > 0) {
    console.log("\nCurrent legacy photos not found in storage");
    for (const item of details.unmatchedCurrentPhotos) {
      console.log(`- ${item.artistName} (${item.artistId}): ${item.photoPath}`);
    }
  }

  if (details.failures.length > 0) {
    process.exitCode = 1;
  }
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
