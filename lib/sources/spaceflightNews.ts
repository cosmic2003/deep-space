// Spaceflight News API v4 — public, no auth.
// Docs: https://api.spaceflightnewsapi.net/v4/docs/

const BASE = "https://api.spaceflightnewsapi.net/v4";

export interface SpaceArticle {
  id: number;
  title: string;
  url: string;
  image_url: string | null;
  news_site: string;
  summary: string;
  published_at: string;
}

interface SpaceArticleResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: SpaceArticle[];
}

export async function getSpaceNews(
  opts: { days?: number; limit?: number } = {}
): Promise<SpaceArticle[]> {
  const { days = 7, limit = 9 } = opts;
  const since = new Date(Date.now() - days * 86400 * 1000).toISOString();

  const url = new URL(`${BASE}/articles/`);
  url.searchParams.set("published_at_gte", since);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("ordering", "-published_at");

  try {
    const res = await fetch(url, {
      next: { revalidate: 600 }, // 10 minutes — news doesn't need to be cache-fresher than that
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      console.error(`[SNAPI] ${res.status} ${res.statusText}`);
      return [];
    }
    const data = (await res.json()) as SpaceArticleResponse;
    return data.results ?? [];
  } catch (e) {
    console.error("[SNAPI] fetch failed:", e);
    return [];
  }
}
