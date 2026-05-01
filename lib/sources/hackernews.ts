const API = "https://hn.algolia.com/api/v1";

export interface HNStory {
  objectID: string;
  title: string;
  url?: string | null;
  story_id?: number | null;
  points: number;
  num_comments: number;
  author: string;
  created_at: string;
  created_at_i: number;
}

interface HNResponse {
  hits: HNStory[];
}

export async function searchHN(
  query: string,
  opts: { hours?: number; limit?: number } = {}
): Promise<HNStory[]> {
  const { hours = 72, limit = 30 } = opts;
  const sinceEpoch = Math.floor(Date.now() / 1000) - hours * 3600;
  const url =
    `${API}/search?query=${encodeURIComponent(query)}` +
    `&tags=story&numericFilters=created_at_i>${sinceEpoch}&hitsPerPage=${limit}`;
  try {
    const res = await fetch(url, {
      next: { revalidate: 600 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      console.error(`[HN] ${res.status} ${res.statusText} for "${query}"`);
      return [];
    }
    const data = (await res.json()) as HNResponse;
    return (data.hits ?? []).filter((h) => h.title);
  } catch (e) {
    console.error("[HN] fetch error", e);
    return [];
  }
}

export async function searchHNMulti(
  queries: string[],
  opts: { hours?: number; limit?: number } = {}
): Promise<HNStory[]> {
  const results = await Promise.all(queries.map((q) => searchHN(q, opts)));
  const seen = new Set<string>();
  const merged: HNStory[] = [];
  for (const arr of results) {
    for (const h of arr) {
      const key = h.url ?? `hn:${h.objectID}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(h);
    }
  }
  return merged;
}
