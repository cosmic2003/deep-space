import { SourceAdapter, httpGet, stripHtml } from "./base.mjs";

/**
 * Pulls new posts from a subreddit via Reddit's public JSON endpoint.
 * Each config entry attributes a subreddit to one company (e.g. r/OpenAI →
 * openai, r/StableDiffusion → meta-ai is a stretch — pick the subreddit that
 * meaningfully maps).
 *
 * Optional `minScore` skips low-effort posts; `flairs` filters by flair name
 * for subs that use them for "News" vs "Discussion" vs "Question".
 */
export class RedditAdapter extends SourceAdapter {
  /**
   * @param {{
   *   company: string,
   *   subreddit: string,             // without "r/"
   *   sort?: 'new' | 'hot' | 'top',
   *   maxItems?: number,
   *   minScore?: number,
   *   flairs?: string[],             // case-insensitive whitelist
   * }} config
   */
  constructor(config) {
    super({ name: `reddit:r/${config.subreddit}` });
    this.config = config;
  }

  async fetch() {
    const {
      company,
      subreddit,
      sort = "new",
      maxItems = 8,
      minScore = 0,
      flairs,
    } = this.config;

    const url = `https://www.reddit.com/r/${encodeURIComponent(subreddit)}/${sort}.json?limit=${Math.max(maxItems * 2, 25)}`;
    const res = await httpGet(url);
    const data = await res.json();
    const children = data?.data?.children ?? [];

    const flairSet = flairs?.length
      ? new Set(flairs.map((f) => f.toLowerCase()))
      : null;

    const out = [];
    for (const c of children) {
      const p = c?.data;
      if (!p) continue;
      if (p.stickied || p.over_18) continue;
      if ((p.score ?? 0) < minScore) continue;
      if (flairSet) {
        const flair = String(p.link_flair_text ?? "").toLowerCase();
        if (!flair || !flairSet.has(flair)) continue;
      }
      const created = p.created_utc ? p.created_utc * 1000 : null;
      if (!created || !p.id || !p.title || !p.permalink) continue;

      const link = `https://www.reddit.com${p.permalink}`;
      const body = stripHtml(p.selftext ?? "").slice(0, 4000);
      out.push({
        id: `reddit:${p.id}`,
        company,
        title: `[r/${subreddit}] ${p.title}`,
        body: body || `링크 게시물: ${p.url ?? link}`,
        url: link,
        publishedAt: new Date(created).toISOString(),
        source: "reddit",
        tags: p.link_flair_text ? [String(p.link_flair_text)] : [],
      });
      if (out.length >= maxItems) break;
    }
    return out;
  }
}
