import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";
import { parseFile } from "music-metadata";

import {
  buildDemoWritePayload,
  buildIndexedDemoTitle,
  roundDemoDurationSeconds,
} from "../src/lib/demo-records.js";
import {
  buildStoragePath,
  createArtistMatchIndex,
  normaliseLegacyFileMatchKey,
  resolveArtistMatchForKey,
} from "../src/lib/storage-paths.js";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "..");
const AUDIO_CONTENT_TYPE = "audio/mpeg";
const APPROVED_CATEGORY_BY_FILE = {
  "andrea-moor-1.mp3": "Commercial",
  "ashlee-lollback-1.mp3": "Commercial",
  "ashlee-lollback-2.mp3": "Commercial",
  "brie-jurss-1.mp3": "Commercial",
  "chris-crickmay-1.mp3": "Commercial",
  "chris-crickmay-2.mp3": "Character",
  "chris-crickmay-3.mp3": "E-Learning",
  "chris-crickmay-4.mp3": "Commercial",
  "chris-crickmay-5.mp3": "Commercial",
  "damien-garvey-1.mp3": "Commercial",
  "digby-gillings-1.mp3": "Corporate",
  "digby-gillings-2.mp3": "Character",
  "digby-gillings-3.mp3": "Retail",
  "digby-gillings-4.mp3": "Commercial",
  "digby-gillings-5.mp3": "Commercial",
  "emily-dickson-1.mp3": "Commercial",
  "fotene-maroulis-1.mp3": "Commercial",
  "helen-cassidy-1.mp3": "Commercial",
  "helen-cassidy-2.mp3": "Retail",
  "hugh-parker-1.mp3": "Commercial",
  "jackie-bowker-1.mp3": "Corporate",
  "jackie-bowker-2.mp3": "Commercial",
  "jackie-bowker-3.mp3": "Commercial",
  "jennifer-mary-1.mp3": "E-Learning",
  "jennifer-mary-2.mp3": "Commercial",
  "leon-murray-1.mp3": "Corporate",
  "leon-murray-2.mp3": "Retail",
  "leon-murray-3.mp3": "Commercial",
  "leon-murray-4.mp3": "Corporate",
  "leon-murray-5.mp3": "Commercial",
  "leon-murray-6.mp3": "Commercial",
  "leon-murray-7.mp3": "Corporate",
  "liz-buchanan-1.mp3": "Commercial",
  "liz-buchanan-2.mp3": "Corporate",
  "marcus-oborn-1.mp3": "Commercial",
  "marcus-oborn-2.mp3": "Commercial",
  "marcus-oborn-3.mp3": "Corporate",
  "marcus-oborn-4.mp3": "E-Learning",
  "marcus-oborn-5.mp3": "IVR & On Hold",
  "marcus-oborn-6.mp3": "Commercial",
  "megan-shapcott-1.mp3": "Commercial",
  "megan-shapcott-2.mp3": "Commercial",
  "megan-shapcott-3.mp3": "Corporate",
  "megan-shapcott-4.mp3": "Commercial",
  "megan-shapcott-5.mp3": "Character",
  "mikee-joaquin-1.mp3": "Character",
  "mikee-joaquin-2.mp3": "Character",
  "mikee-joaquin-3.mp3": "Character",
  "mikee-joaquin-4.mp3": "Commercial",
  "nelle-lee-1.mp3": "Commercial",
  "paul-davies-1.mp3": "Corporate",
  "robert-coleby-1.mp3": "Commercial",
  "ross-newth-1.mp3": "Corporate",
  "ross-newth-2.mp3": "Commercial",
  "steven-grives-1.mp3": "Commercial",
  "teresa-lim-1.mp3": "Commercial",
  "teresa-lim-2.mp3": "Corporate",
  "teresa-lim-3.mp3": "Corporate",
  "teresa-lim-4.mp3": "IVR & On Hold",
  "teresa-lim-5.mp3": "Retail",
  "teresa-lim-6.mp3": "E-Learning",
  "thomas-larkin-1.mp3": "Corporate",
  "thomas-larkin-2.mp3": "Character",
  "thomas-larkin-3.mp3": "Commercial",
  "thomas-larkin-4.mp3": "Audiobook",
  "thomas-larkin-5.mp3": "Commercial",
  "thomas-larkin-6.mp3": "Character",
  "thomas-murray-1.mp3": "Commercial",
  "thomas-murray-2.mp3": "Commercial",
  "todd-macdonald-1.mp3": "Commercial",
  "walter-williams-1.mp3": "Character",
  "walter-williams-2.mp3": "Audiobook",
  "walter-williams-3.mp3": "Commercial",
  "walter-williams-4.mp3": "Corporate",
  "walter-williams-5.mp3": "Corporate",
  "walter-williams-6.mp3": "Commercial",
  "walter-williams-7.mp3": "Retail",
};
const ALLOWED_CATEGORIES = new Set([
  "Corporate",
  "Commercial",
  "Character",
  "Retail",
  "Audiobook",
  "E-Learning",
  "Female",
  "Male",
  "IVR & On Hold",
  "Jingle",
]);

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
    dir: "",
    dryRun: true,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--live") {
      options.dryRun = false;
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

    if (arg === "--dir") {
      const value = argv[index + 1];

      if (!value) {
        throw new Error("Missing value for --dir.");
      }

      options.dir = path.resolve(value);
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!options.dir) {
    throw new Error("Missing required argument: --dir <path>.");
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
    demoBucket: process.env.DEMO_AUDIO_BUCKET || process.env.VITE_SUPABASE_DEMO_BUCKET || "artist-demos",
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

function isMp3(fileName) {
  return path.extname(fileName).toLowerCase() === ".mp3";
}

function parseLocalDemoFile(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const base = path.basename(fileName, ext);
  const match = base.match(/^(.*)-(\d+)$/);

  if (!match || ext !== ".mp3") {
    return null;
  }

  return {
    ext,
    order: Number(match[2]),
    slug: match[1],
  };
}

function getPublicUrl(supabase, bucket, storagePath) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  return data.publicUrl;
}

function asCategoryArray(value) {
  if (Array.isArray(value)) {
    return value.filter(category => typeof category === "string" && category.trim());
  }

  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }

  return [];
}

function mergeArtistCategories(currentCategories, importedCategories) {
  const merged = [];
  const seen = new Set();

  for (const category of [...asCategoryArray(currentCategories), ...importedCategories]) {
    if (!category || seen.has(category)) continue;
    seen.add(category);
    merged.push(category);
  }

  return merged;
}

function categoriesChanged(left, right) {
  if (left.length !== right.length) return true;
  return left.some((category, index) => category !== right[index]);
}

function getNextSortOrder(demos = []) {
  let maxSortOrder = -1;

  for (const demo of demos) {
    const sortOrder = Number(demo?.sort_order);

    if (Number.isFinite(sortOrder) && sortOrder > maxSortOrder) {
      maxSortOrder = sortOrder;
    }
  }

  return maxSortOrder + 1;
}

async function loadArtists(supabase, artistId) {
  let query = supabase
    .from("artists")
    .select("id, name, categories")
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

async function loadExistingDemosByArtist(supabase, artistIds) {
  if (artistIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("demos")
    .select("artist_id, sort_order")
    .in("artist_id", artistIds);

  if (error) {
    throw new Error(`Unable to load existing demos: ${error.message}`);
  }

  const demosByArtist = new Map();

  for (const demo of data || []) {
    const demos = demosByArtist.get(demo.artist_id) || [];
    demos.push(demo);
    demosByArtist.set(demo.artist_id, demos);
  }

  return demosByArtist;
}

async function removeStorageObject(supabase, bucket, storagePath) {
  const { error } = await supabase.storage.from(bucket).remove([storagePath]);

  if (error) {
    throw new Error(error.message || `Unable to remove ${bucket}/${storagePath}.`);
  }
}

async function getLocalDemoMetadata(localPath) {
  const [metadata, stats] = await Promise.all([
    parseFile(localPath),
    fs.promises.stat(localPath),
  ]);

  return {
    durationSecs: roundDemoDurationSeconds(metadata.format.duration),
    fileSizeBytes: stats.size,
  };
}

function planImports(preparedFiles, existingDemosByArtist) {
  const groupedByArtist = new Map();

  for (const file of preparedFiles) {
    const entries = groupedByArtist.get(file.artist.id) || [];
    entries.push(file);
    groupedByArtist.set(file.artist.id, entries);
  }

  const plannedImports = [];

  for (const artistEntries of groupedByArtist.values()) {
    artistEntries.sort((left, right) => left.order - right.order || left.fileName.localeCompare(right.fileName));

    const categoryCounts = new Map();
    let sortOrder = getNextSortOrder(existingDemosByArtist.get(artistEntries[0].artist.id) || []);

    for (const entry of artistEntries) {
      const nextCategoryIndex = (categoryCounts.get(entry.category) || 0) + 1;
      categoryCounts.set(entry.category, nextCategoryIndex);

      plannedImports.push({
        ...entry,
        sortOrder,
        title: buildIndexedDemoTitle(entry.category, nextCategoryIndex),
      });

      sortOrder += 1;
    }
  }

  return plannedImports.sort(
    (left, right) =>
      left.artist.name.localeCompare(right.artist.name) ||
      left.order - right.order ||
      left.fileName.localeCompare(right.fileName),
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
  const directoryEntries = await fs.promises.readdir(options.dir, { withFileTypes: true });
  const localFiles = directoryEntries.filter(entry => entry.isFile()).map(entry => entry.name);
  const candidateFiles = localFiles.filter(isMp3);
  const fileResults = [];
  const preparedFiles = [];

  for (const fileName of candidateFiles) {
    const parsed = parseLocalDemoFile(fileName);

    if (!parsed) {
      fileResults.push({
        file: fileName,
        reason: "filename must be <artist-slug>-<order>.mp3",
        status: "SKIPPED",
      });
      continue;
    }

    const category = APPROVED_CATEGORY_BY_FILE[fileName];

    if (!category) {
      fileResults.push({
        file: fileName,
        reason: "no approved category mapping found",
        status: "MISSING_MAPPING",
      });
      continue;
    }

    const resolution = resolveArtistMatchForKey(normaliseLegacyFileMatchKey(fileName), artistIndex);

    if (resolution.status === "missing") {
      fileResults.push({
        file: fileName,
        reason: `no artist match for slug ${parsed.slug}`,
        status: "MISSING_ARTIST",
      });
      continue;
    }

    if (resolution.status === "ambiguous") {
      fileResults.push({
        file: fileName,
        reason: resolution.artists.map(artist => artist.name).join(", "),
        status: "AMBIGUOUS_ARTIST",
      });
      continue;
    }

    preparedFiles.push({
      artist: resolution.artist,
      category,
      fileName,
      localPath: path.join(options.dir, fileName),
      order: parsed.order,
    });
  }

  const existingDemosByArtist = await loadExistingDemosByArtist(
    supabase,
    [...new Set(preparedFiles.map(file => file.artist.id))],
  );
  const plannedImports = planImports(preparedFiles, existingDemosByArtist);
  const importedCategoriesByArtist = new Map();

  for (const plannedImport of plannedImports) {
    let metadata;

    try {
      metadata = await getLocalDemoMetadata(plannedImport.localPath);
    } catch (error) {
      fileResults.push({
        artist: plannedImport.artist.name,
        file: plannedImport.fileName,
        reason: error.message,
        status: "METADATA_ERROR",
      });
      continue;
    }

    const storagePath = buildStoragePath({
      artistId: plannedImport.artist.id,
      fileName: plannedImport.fileName,
      kind: "demos",
    });
    const payload = buildDemoWritePayload({
      artistId: plannedImport.artist.id,
      durationSecs: metadata.durationSecs,
      fileSizeBytes: metadata.fileSizeBytes,
      fileUrl: getPublicUrl(supabase, config.demoBucket, storagePath),
      name: plannedImport.title,
      sortOrder: plannedImport.sortOrder,
    });

    if (options.dryRun) {
      const importedCategories = importedCategoriesByArtist.get(plannedImport.artist.id) || [];
      importedCategories.push(plannedImport.category);
      importedCategoriesByArtist.set(plannedImport.artist.id, importedCategories);

      fileResults.push({
        artist: plannedImport.artist.name,
        category: plannedImport.category,
        dest: storagePath,
        duration_secs: payload.duration_secs,
        file: plannedImport.fileName,
        file_size_bytes: payload.file_size_bytes,
        sort_order: payload.sort_order,
        status: "DRY_RUN",
        title: payload.name,
      });
      continue;
    }

    try {
      const fileBuffer = await fs.promises.readFile(plannedImport.localPath);
      const { error: uploadError } = await supabase.storage
        .from(config.demoBucket)
        .upload(storagePath, fileBuffer, {
          contentType: AUDIO_CONTENT_TYPE,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      const { error: insertError } = await supabase
        .from("demos")
        .insert(payload);

      if (insertError) {
        try {
          await removeStorageObject(supabase, config.demoBucket, storagePath);
        } catch {
          // Best-effort cleanup only.
        }

        throw new Error(`Insert failed: ${insertError.message}`);
      }

      const importedCategories = importedCategoriesByArtist.get(plannedImport.artist.id) || [];
      importedCategories.push(plannedImport.category);
      importedCategoriesByArtist.set(plannedImport.artist.id, importedCategories);

      fileResults.push({
        artist: plannedImport.artist.name,
        category: plannedImport.category,
        dest: storagePath,
        duration_secs: payload.duration_secs,
        file: plannedImport.fileName,
        file_size_bytes: payload.file_size_bytes,
        sort_order: payload.sort_order,
        status: "UPLOADED",
        title: payload.name,
      });
    } catch (error) {
      fileResults.push({
        artist: plannedImport.artist.name,
        category: plannedImport.category,
        file: plannedImport.fileName,
        reason: error.message,
        status: "IMPORT_ERROR",
        title: payload.name,
      });
    }
  }

  const categoryResults = [];

  for (const artist of artists) {
    const importedCategories = [...new Set((importedCategoriesByArtist.get(artist.id) || []).filter(category => ALLOWED_CATEGORIES.has(category)))];

    if (importedCategories.length === 0) {
      continue;
    }

    const currentCategories = asCategoryArray(artist.categories);
    const mergedCategories = mergeArtistCategories(currentCategories, importedCategories);
    const changed = categoriesChanged(currentCategories, mergedCategories);

    if (options.dryRun) {
      categoryResults.push({
        artist: artist.name,
        current_categories: currentCategories.join(", "),
        imported_categories: importedCategories.join(", "),
        merged_categories: mergedCategories.join(", "),
        status: changed ? "CATEGORY_DRY_RUN" : "CATEGORY_UNCHANGED",
      });
      continue;
    }

    if (!changed) {
      categoryResults.push({
        artist: artist.name,
        merged_categories: mergedCategories.join(", "),
        status: "CATEGORY_UNCHANGED",
      });
      continue;
    }

    const { error } = await supabase
      .from("artists")
      .update({ categories: mergedCategories })
      .eq("id", artist.id);

    if (error) {
      categoryResults.push({
        artist: artist.name,
        merged_categories: mergedCategories.join(", "),
        reason: error.message,
        status: "CATEGORY_UPDATE_ERROR",
      });
      continue;
    }

    categoryResults.push({
      artist: artist.name,
      merged_categories: mergedCategories.join(", "),
      status: "CATEGORY_UPDATED",
    });
  }

  if (fileResults.length > 0) {
    console.table(fileResults);
  } else {
    console.log("No MP3 files were found to import.");
  }

  if (categoryResults.length > 0) {
    console.table(categoryResults);
  }

  console.log(
    `${options.dryRun ? "[dry-run]" : "[live]"} processed ${plannedImports.length} mapped demo file(s) from ${options.dir}`,
  );
}

main().catch(error => {
  console.error("FATAL:", error);
  process.exit(1);
});
