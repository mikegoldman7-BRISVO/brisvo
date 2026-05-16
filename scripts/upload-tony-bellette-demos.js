import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";
import { parseFile } from "music-metadata";

import {
  buildDemoWritePayload,
  roundDemoDurationSeconds,
} from "../src/lib/demo-records.js";
import { deriveStoragePathFromPublicUrl } from "../src/lib/storage-paths.js";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, "..");
const DEFAULT_SOURCE_DIR = path.join(
  process.env.HOME || "",
  "Downloads",
  "UPWORK MG MAY",
  "tony",
);
const DEMO_BUCKET = "artist-demos";
const ARTIST_NAME = "Tony Bellette";
const ARTIST_SLUG = "tony-bellette";
const STORAGE_PREFIX = `demos/${ARTIST_SLUG}`;
const AUDIO_CONTENT_TYPE = "audio/mpeg";

const DEMOS = [
  ["tony-bellette-animation.mp3", "Animation"],
  ["tony-bellette-anzac-read.mp3", "ANZAC Read"],
  ["tony-bellette-character.mp3", "Character"],
  ["tony-bellette-country-clancy.mp3", "Country / Clancy"],
  ["tony-bellette-full-compile.mp3", "Full Compile"],
  ["tony-bellette-promo-sports.mp3", "Promo / Sports"],
  ["tony-bellette-santa-demo.mp3", "Santa Demo"],
  ["tony-bellette-straight-soft-sell.mp3", "Straight or Soft Sell"],
].map(([fileName, title], sortOrder) => ({
  fileName,
  sortOrder,
  storagePath: `${STORAGE_PREFIX}/${fileName}`,
  title,
}));

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return false;

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

  return true;
}

function loadProjectEnv() {
  const loaded = [
    loadEnvFile(path.join(PROJECT_ROOT, ".env.local")) ? ".env.local" : "",
    loadEnvFile(path.join(PROJECT_ROOT, ".env")) ? ".env" : "",
  ].filter(Boolean);

  if (loaded.length > 0) {
    console.log(`Loaded environment from ${loaded.join(", ")}.`);
  }
}

function parseArgs(argv) {
  const options = {
    dir: DEFAULT_SOURCE_DIR,
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

function createSupabaseAdminClient() {
  return createClient(
    readRequiredEnv("SUPABASE_URL", ["VITE_SUPABASE_URL"]),
    readRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

function getPublicUrl(supabase, storagePath) {
  const { data } = supabase.storage.from(DEMO_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

function getDemoStoragePath(fileUrl) {
  return deriveStoragePathFromPublicUrl(DEMO_BUCKET, fileUrl || "");
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

async function loadTonyArtist(supabase) {
  const { data, error } = await supabase
    .from("artists")
    .select("id, slug, name, is_published")
    .ilike("name", ARTIST_NAME);

  if (error) {
    throw new Error(`Unable to load artist record: ${error.message}`);
  }

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`No artist record found for ${ARTIST_NAME}.`);
  }

  if (data.length > 1) {
    throw new Error(
      `Multiple artist records found for ${ARTIST_NAME}: ${data.map(artist => `${artist.name} (${artist.id})`).join(", ")}`,
    );
  }

  return data[0];
}

async function loadExistingDemos(supabase, artistId) {
  const { data, error } = await supabase
    .from("demos")
    .select("id, artist_id, name, file_url, duration_secs, file_size_bytes, sort_order")
    .eq("artist_id", artistId)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`Unable to load existing demos: ${error.message}`);
  }

  return data || [];
}

async function uploadDemoFile(supabase, localPath, storagePath) {
  const fileBuffer = await fs.promises.readFile(localPath);
  const { data, error } = await supabase.storage
    .from(DEMO_BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: AUDIO_CONTENT_TYPE,
      upsert: true,
    });

  if (error) {
    throw new Error(`Upload failed for ${storagePath}: ${error.message}`);
  }

  return data;
}

async function upsertDemoRow(supabase, existingDemo, payload) {
  const query = existingDemo
    ? supabase.from("demos").update(payload).eq("id", existingDemo.id)
    : supabase.from("demos").insert(payload);

  const { data, error } = await query.select().single();

  if (error) {
    throw new Error(`Demo row write failed for ${payload.name}: ${error.message}`);
  }

  return data;
}

function findExistingDemo(existingDemos, title, storagePath) {
  const matches = existingDemos.filter(demo => {
    const demoStoragePath = getDemoStoragePath(demo.file_url);
    return demoStoragePath === storagePath || demo.name === title;
  });

  return {
    duplicateCount: Math.max(0, matches.length - 1),
    existingDemo: matches[0] || null,
  };
}

async function main() {
  loadProjectEnv();

  const options = parseArgs(process.argv.slice(2));
  const supabase = createSupabaseAdminClient();
  const sourceDir = path.resolve(options.dir);

  console.log(`Mode: ${options.dryRun ? "dry run" : "live"}`);
  console.log(`Source: ${sourceDir}`);
  console.log(`Bucket: ${DEMO_BUCKET}`);
  console.log(`Storage prefix: ${STORAGE_PREFIX}`);

  const artist = await loadTonyArtist(supabase);
  console.log(`Artist: ${artist.name} (${artist.id}) slug=${artist.slug || ""} published=${artist.is_published}`);

  const existingDemos = await loadExistingDemos(supabase, artist.id);
  const rows = [];

  for (const demo of DEMOS) {
    const localPath = path.join(sourceDir, demo.fileName);

    if (!fs.existsSync(localPath)) {
      throw new Error(`Missing local file: ${localPath}`);
    }

    const metadata = await getLocalDemoMetadata(localPath);
    const publicUrl = getPublicUrl(supabase, demo.storagePath);
    const payload = buildDemoWritePayload({
      artistId: artist.id,
      durationSecs: metadata.durationSecs,
      fileSizeBytes: metadata.fileSizeBytes,
      fileUrl: publicUrl,
      name: demo.title,
      sortOrder: demo.sortOrder,
    });
    const { duplicateCount, existingDemo } = findExistingDemo(
      existingDemos,
      demo.title,
      demo.storagePath,
    );

    if (!options.dryRun) {
      await uploadDemoFile(supabase, localPath, demo.storagePath);
      const dbRow = await upsertDemoRow(supabase, existingDemo, payload);
      rows.push({
        id: dbRow.id,
        status: existingDemo ? "UPDATED" : "INSERTED",
        title: dbRow.name,
        sort_order: dbRow.sort_order,
        duration_secs: dbRow.duration_secs,
        file_size_bytes: dbRow.file_size_bytes,
        storage_path: demo.storagePath,
        public_url: dbRow.file_url,
        duplicate_matches_skipped: duplicateCount,
      });
      continue;
    }

    rows.push({
      id: existingDemo?.id || null,
      status: existingDemo ? "WOULD_UPDATE" : "WOULD_INSERT",
      title: payload.name,
      sort_order: payload.sort_order,
      duration_secs: payload.duration_secs,
      file_size_bytes: payload.file_size_bytes,
      storage_path: demo.storagePath,
      public_url: payload.file_url,
      duplicate_matches_skipped: duplicateCount,
    });
  }

  console.table(rows);

  if (!options.dryRun) {
    const refreshedDemos = await loadExistingDemos(supabase, artist.id);
    console.log("DB rows for Tony Bellette:");
    console.log(JSON.stringify(refreshedDemos, null, 2));
  }
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
