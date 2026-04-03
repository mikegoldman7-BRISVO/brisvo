const STORAGE_PUBLIC_SEGMENT = "/storage/v1/object/public/";
const GENERATED_STORAGE_PREFIX_PATTERN = /^\d{10,}-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i;

function requireRandomUuid() {
  const randomUuid = globalThis.crypto?.randomUUID?.bind(globalThis.crypto);

  if (!randomUuid) {
    throw new Error("crypto.randomUUID() is not available in this runtime.");
  }

  return randomUuid();
}

export function normaliseWhitespace(value = "") {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

export function sanitiseFileStem(value = "", fallback = "file") {
  const sanitised = normaliseWhitespace(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return sanitised || fallback;
}

export function stripFileExtension(fileName = "") {
  const baseName = String(fileName ?? "").split("/").pop() || "";
  return baseName.replace(/\.[^.]+$/, "");
}

export function getFileExtension(fileName = "") {
  const baseName = String(fileName ?? "").split("/").pop() || "";
  return baseName.includes(".") ? baseName.split(".").pop().toLowerCase() : "bin";
}

export function getDisplayFileName(fileName = "") {
  const baseName = String(fileName ?? "").split("/").pop() || "";

  if (!baseName) {
    return "";
  }

  const stem = stripFileExtension(baseName);
  const extension = baseName.includes(".") ? `.${getFileExtension(baseName)}` : "";
  const displayStem = stem.replace(GENERATED_STORAGE_PREFIX_PATTERN, "");

  return `${displayStem || stem}${extension}`;
}

export function stripLegacyNumericSuffix(value = "") {
  return String(value ?? "").replace(/-\d+$/, "");
}

export function normaliseArtistMatchKey(name = "") {
  return sanitiseFileStem(name, "");
}

export function normaliseLegacyFileMatchKey(fileName = "") {
  return stripLegacyNumericSuffix(sanitiseFileStem(stripFileExtension(fileName), ""));
}

export function createArtistMatchIndex(artists = []) {
  const index = new Map();

  for (const artist of artists) {
    const matchKey = normaliseArtistMatchKey(artist?.name || "");

    if (!matchKey) continue;

    const entries = index.get(matchKey) || [];
    entries.push(artist);
    index.set(matchKey, entries);
  }

  return index;
}

export function resolveArtistMatchForKey(matchKey, artistIndex) {
  const artists = artistIndex instanceof Map ? artistIndex.get(matchKey) || [] : [];

  if (!matchKey || artists.length === 0) {
    return { status: "missing", matchKey, artists: [] };
  }

  if (artists.length > 1) {
    return { status: "ambiguous", matchKey, artists };
  }

  return { status: "matched", matchKey, artist: artists[0], artists };
}

export function buildStoragePath({
  artistId,
  kind,
  fileName,
  timestamp = Date.now(),
  randomId = requireRandomUuid(),
}) {
  const extension = getFileExtension(fileName);
  const stem = sanitiseFileStem(stripFileExtension(fileName));

  return `${artistId}/${kind}/${timestamp}-${randomId}-${stem}.${extension}`;
}

export function createStoragePath({ artistId, kind, fileName }) {
  return buildStoragePath({
    artistId,
    kind,
    fileName,
    timestamp: Date.now(),
    randomId: requireRandomUuid(),
  });
}

export function deriveStoragePathFromPublicUrl(bucket, publicUrl) {
  if (!publicUrl) return "";

  const marker = `${STORAGE_PUBLIC_SEGMENT}${bucket}/`;
  const markerIndex = publicUrl.indexOf(marker);

  if (markerIndex === -1) return "";

  return decodeURIComponent(publicUrl.slice(markerIndex + marker.length));
}
