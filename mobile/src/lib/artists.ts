import { insertRow, invokeFunction, selectRows } from "./supabase";
import type { ArtistDetail, ArtistSummary, Demo, EnquiryInput } from "./types";

type RawArtist = Partial<ArtistSummary> & { bio?: string | null; demos?: Demo[] };

/** Same ordering rule the website uses, so demo numbering matches across both. */
export function sortDemos(demos: Demo[]): Demo[] {
  return [...demos].sort((left, right) => {
    const delta = (left.sort_order ?? 0) - (right.sort_order ?? 0);
    if (delta !== 0) return delta;
    return String(left.id).localeCompare(String(right.id));
  });
}

function normaliseSummary(artist: RawArtist, demoCount = 0): ArtistSummary {
  return {
    id: String(artist.id ?? ""),
    name: artist.name ?? "",
    photo_url: artist.photo_url ?? "",
    brand_color: artist.brand_color ?? "",
    categories: Array.isArray(artist.categories) ? artist.categories : [],
    gender: artist.gender ?? "",
    demo_count: Math.max(0, Number(demoCount) || 0),
  };
}

export async function fetchPublishedArtists(): Promise<ArtistSummary[]> {
  const artists = await selectRows<RawArtist>(
    "artists?select=id,name,photo_url,brand_color,categories,gender&is_published=eq.true",
  );

  const ids = artists.map(artist => artist.id).filter(Boolean) as string[];
  const demoCounts = new Map<string, number>();

  if (ids.length > 0) {
    const demos = await selectRows<{ artist_id: string }>(
      `demos?select=artist_id&artist_id=in.(${ids.map(id => `"${id}"`).join(",")})`,
    );
    for (const demo of demos) {
      demoCounts.set(demo.artist_id, (demoCounts.get(demo.artist_id) ?? 0) + 1);
    }
  }

  return artists
    .map(artist => normaliseSummary(artist, demoCounts.get(String(artist.id)) ?? 0))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export async function fetchArtistDetail(
  artistId: string,
  fallback?: ArtistSummary,
): Promise<ArtistDetail> {
  const rows = await selectRows<RawArtist>(
    `artists?select=id,name,photo_url,brand_color,categories,gender,bio,demos(*)&id=eq.${encodeURIComponent(artistId)}&is_published=eq.true&limit=1`,
  );

  const artist = rows[0];
  if (!artist) throw new Error("This voice is no longer available.");

  const demos = sortDemos(Array.isArray(artist.demos) ? artist.demos : []);

  return {
    ...normaliseSummary(
      {
        ...fallback,
        ...artist,
        categories: Array.isArray(artist.categories) ? artist.categories : fallback?.categories,
      },
      demos.length,
    ),
    bio: artist.bio ?? "",
    demos,
  };
}

export async function submitEnquiry(enquiry: EnquiryInput): Promise<void> {
  await insertRow("enquiries", enquiry);
}

export async function subscribeToNewsletter(name: string, email: string): Promise<void> {
  await invokeFunction("newsletter-signup", { name, email });
}
