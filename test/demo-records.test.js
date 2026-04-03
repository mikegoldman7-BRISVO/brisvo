import test from "node:test";
import assert from "node:assert/strict";

import {
  buildDemoWritePayload,
  buildIndexedDemoTitle,
  roundDemoDurationSeconds,
} from "../src/lib/demo-records.js";

test("buildDemoWritePayload preserves the schema-compatible demo fields", () => {
  assert.deepEqual(
    buildDemoWritePayload({
      artistId: "artist-123",
      durationSecs: 12.6,
      fileSizeBytes: 123456,
      fileUrl: "https://example.com/demo.mp3",
      id: "demo-456",
      name: "  Commercial   1 ",
      sortOrder: 3,
    }),
    {
      artist_id: "artist-123",
      duration_secs: 13,
      file_size_bytes: 123456,
      file_url: "https://example.com/demo.mp3",
      id: "demo-456",
      name: "Commercial 1",
      sort_order: 3,
    },
  );
});

test("buildIndexedDemoTitle appends an index to the imported category label", () => {
  assert.equal(buildIndexedDemoTitle("IVR & On Hold", 2), "IVR & On Hold 2");
});

test("roundDemoDurationSeconds rejects invalid values", () => {
  assert.throws(() => roundDemoDurationSeconds(0), /invalid demo duration/i);
});
