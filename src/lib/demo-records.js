import { normaliseWhitespace } from "./storage-paths.js";

export function normaliseDemoName(value = "", fallback = "Untitled demo") {
  const normalised = normaliseWhitespace(String(value ?? ""));
  return normalised || fallback;
}

export function roundDemoDurationSeconds(value) {
  const duration = Number(value);

  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error("Missing or invalid demo duration.");
  }

  return Math.max(1, Math.round(duration));
}

function requirePositiveInteger(value, fieldName) {
  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    throw new Error(`Missing or invalid ${fieldName}.`);
  }

  return Math.round(number);
}

function requireNonNegativeInteger(value, fieldName) {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    throw new Error(`Missing or invalid ${fieldName}.`);
  }

  return Math.round(number);
}

export function buildIndexedDemoTitle(category, index) {
  const title = normaliseDemoName(category);
  const position = requirePositiveInteger(index, "demo index");
  return `${title} ${position}`;
}

export function buildDemoWritePayload({
  artistId,
  durationSecs,
  fileSizeBytes,
  fileUrl,
  id,
  name,
  sortOrder,
}) {
  const nextArtistId = String(artistId ?? "").trim();
  const nextFileUrl = String(fileUrl ?? "").trim();

  if (!nextArtistId) {
    throw new Error("Missing artist ID for demo write.");
  }

  if (!nextFileUrl) {
    throw new Error("Missing file URL for demo write.");
  }

  const payload = {
    artist_id: nextArtistId,
    duration_secs: roundDemoDurationSeconds(durationSecs),
    file_size_bytes: requirePositiveInteger(fileSizeBytes, "demo file size"),
    file_url: nextFileUrl,
    name: normaliseDemoName(name),
    sort_order: requireNonNegativeInteger(sortOrder, "demo sort order"),
  };

  if (id !== undefined && id !== null && String(id).trim()) {
    payload.id = id;
  }

  return payload;
}
