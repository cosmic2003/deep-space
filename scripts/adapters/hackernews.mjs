import { SourceAdapter, httpGet, stripHtml } from "./base.mjs";

// Hacker News exposes its full archive through Algolia's search backend
// (hosted by HN itself at hn.algolia.com). Docs: https://hn.algolia.com/api.
// No auth, generous rate limits, JSON. Far cleaner than scraping the frontpage.
//
// Note: Algolia's `query` param does NOT support boolean OR — multi-term
// queries are treated as AND. We work around by issuing one request per term
// and merging+deduping by objectID.
const API = "https://hn.algolia.com/api/v1/search_by_date";

function buildOneTermUrl({ term, minPoints, sinceTs, hitsPerPage }) {
  // numericFilters uses LITERAL comma as AND separator. URLSearchParams
  // encodes commas as %2C which Algolia parses as a single broken filter
  // (returns 200 with 0 hits — easy to miss). Build manually.
  const qs = [
    `query=${encodeURIComponent(`"${term}"`)}`,
    `tags=story`,
    `numericFilters=${encodeURIComponent(`points>=${minPoints}`)},${encodeURIComponent(`created_at_i>=${sinceTs}`)}`,
    `hitsPerPage=${hitsPerPage}`,
  ].join("&");
  return `${API}?${qs}`;
}

/**
 * Pulls AI-relevant Hacker News stories. One adapter instance = one company
 * × one keyword list; the adapter fans out to one Algolia call per term and
 * merges. Each story is attributed to the configured company.
 */
export class HackerNewsAdapter extends SourceAdapter {
  /**
   * @param {{
   *   company: string,
   *   terms: string[],           // matched in title/url/story_text
   *   minPoints?: number,
   *   maxItems?: number,
   *   lookbackHours?: number,
   * }} config
   */
  constructor(config) {
    super({ name: `hn:${config.company}` });
    this.config = config;
  }

  async fetch() {
    const {
      company,
      terms,
      minPoints = 50,
      maxItems = 5,
      lookbackHours = 24 * 30,
    } = this.config;
    if (!terms || terms.length === 0) return [];

    const sinceTs = Math.floor((Date.now() - lookbackHours * 3600_000) / 1000);
    const hitsPerPage = Math.max(maxItems * 2, 10);

    const hitsById = new Map();
    for (const term of terms) {
      const url = buildOneTermUrl({ term, minPoints, sinceTs, hitsPerPage });
      let data;
      try {
        const res = await httpGet(url);
        data = await res.json();
      } catch (e) {
        console.warn(`[${this.name}] term "${term}" failed: ${e.message}`);
        continue;
      }
      for (const h of data?.hits ?? []) {
        if (!h.objectID) continue;
        if (!hitsById.has(h.objectID)) hitsById.set(h.objectID, h);
      }
    }

    // Newest first, then take top-N by date.
    const merged = [...hitsById.values()].sort(
      (a, b) => (b.created_at_i ?? 0) - (a.created_at_i ?? 0)
    );

    const out = [];
    for (const h of merged) {
      if (!h.title || !h.created_at) continue;
      const externalUrl = h.url || `https://news.ycombinator.com/item?id=${h.objectID}`;
      const hnUrl = `https://news.ycombinator.com/item?id=${h.objectID}`;
      const body = stripHtml(h.story_text ?? "").slice(0, 2000);
      // Tags become visible chips in the UI; keep them short. Full URL caused
      // mobile card overflow. Domain conveys "where does this link" cleanly.
      const domain = (() => {
        try { return new URL(externalUrl).hostname.replace(/^www\./, ""); }
        catch { return null; }
      })();
      out.push({
        id: `hn:${h.objectID}`,
        company,
        title: h.title,
        body:
          body ||
          `HN 게시물 (${h.points}점, 댓글 ${h.num_comments}개). 외부 링크: ${externalUrl}`,
        url: hnUrl,
        publishedAt: new Date(h.created_at).toISOString(),
        source: "hn",
        tags: [`${h.points}점`, ...(domain ? [domain] : [])],
      });
      if (out.length >= maxItems) break;
    }
    return out;
  }
}
