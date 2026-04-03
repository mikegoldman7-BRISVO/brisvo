import test from "node:test";
import assert from "node:assert/strict";

import {
  buildStoragePath,
  createArtistMatchIndex,
  getDisplayFileName,
  normaliseArtistMatchKey,
  normaliseLegacyFileMatchKey,
  resolveArtistMatchForKey,
  stripLegacyNumericSuffix,
} from "../src/lib/storage-paths.js";

test("buildStoragePath preserves the artist/profile upload contract", () => {
  const path = buildStoragePath({
    artistId: "artist-123",
    fileName: "Andrea Moor Final.JPG",
    kind: "profile",
    randomId: "123e4567-e89b-12d3-a456-426614174000",
    timestamp: 1712123456789,
  });

  assert.equal(
    path,
    "artist-123/profile/1712123456789-123e4567-e89b-12d3-a456-426614174000-andrea-moor-final.jpg",
  );
});

test("getDisplayFileName strips generated storage prefixes for UI labels", () => {
  assert.equal(
    getDisplayFileName("1712123456789-123e4567-e89b-12d3-a456-426614174000-andrea-moor-final.jpg"),
    "andrea-moor-final.jpg",
  );
  assert.equal(getDisplayFileName("plain-file-name.jpg"), "plain-file-name.jpg");
});

test("normaliseArtistMatchKey collapses whitespace and punctuation", () => {
  assert.equal(normaliseArtistMatchKey("  Chris   Crickmay "), "chris-crickmay");
});

test("normaliseLegacyFileMatchKey strips legacy numeric suffixes", () => {
  assert.equal(normaliseLegacyFileMatchKey("andrea-moor-2.jpg"), "andrea-moor");
  assert.equal(stripLegacyNumericSuffix("ashlee-lollback-10"), "ashlee-lollback");
});

test("resolveArtistMatchForKey detects ambiguous artist names", () => {
  const artistIndex = createArtistMatchIndex([
    { id: "artist-1", name: "Chris Crickmay" },
    { id: "artist-2", name: "Chris Crickmay" },
  ]);

  const resolution = resolveArtistMatchForKey("chris-crickmay", artistIndex);

  assert.equal(resolution.status, "ambiguous");
  assert.deepEqual(
    resolution.artists.map(artist => artist.id),
    ["artist-1", "artist-2"],
  );
});

test("resolveArtistMatchForKey returns a single matched artist when unambiguous", () => {
  const artistIndex = createArtistMatchIndex([
    { id: "artist-1", name: "Andrea Moor" },
    { id: "artist-2", name: "Chris Crickmay" },
  ]);

  const resolution = resolveArtistMatchForKey("andrea-moor", artistIndex);

  assert.equal(resolution.status, "matched");
  assert.equal(resolution.artist.id, "artist-1");
});
