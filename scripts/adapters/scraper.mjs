import { SourceAdapter, httpGet, stripHtml } from "./base.mjs";

// Pulls every JSON-LD blob out of an HTML page. Most modern marketing sites
// (Anthropic, xAI, Meta) emit one per article card via Next.js / Astro SSR.
function extractJsonLdBlocks(html) {
  const out = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const raw = m[1].trim();
    if (!raw) continue;
    try {
      out.push(JSON.parse(raw));
    } catch {
      // Some sites wrap the blob in HTML comments — strip and retry once.
      try {
        out.push(JSON.parse(raw.replace(/^<!--/, "").replace(/-->$/, "")));
      } catch {
        // give up on this block
      }
    }
  }
  return out;
}

// Walk a JSON-LD tree and collect Article-like nodes regardless of nesting
// (ItemList → itemListElement → Article, Graph → @graph → Article, etc.)
function collectArticles(node, acc) {
  if (!node) return;
  if (Array.isArray(node)) {
    for (const n of node) collectArticles(n, acc);
    return;
  }
  if (typeof node !== "object") return;
  const type = node["@type"];
  const types = Array.isArray(type) ? type : type ? [type] : [];
  if (
    types.some((t) =>
      ["Article", "NewsArticle", "BlogPosting", "TechArticle", "Report"].includes(t)
    )
  ) {
    acc.push(node);
  }
  for (const v of Object.values(node)) {
    if (v && typeof v === "object") collectArticles(v, acc);
  }
}

function articleToItem(article, { company, defaultUrl }) {
  const url = article.url ?? article.mainEntityOfPage?.["@id"] ?? article.mainEntityOfPage ?? defaultUrl;
  const title = stripHtml(article.headline ?? article.name ?? "");
  const body = stripHtml(article.articleBody ?? article.description ?? "");
  const datePublished = article.datePublished ?? article.dateModified ?? article.dateCreated;
  if (!url || !title || !datePublished) return null;
  const publishedAt = new Date(datePublished).toISOString();
  return {
    id: String(url),
    company,
    title,
    body,
    url: String(url),
    publishedAt,
    source: "blog",
  };
}

/**
 * Generic HTML scraper. Default parser pulls structured data out of JSON-LD
 * (works for Anthropic, xAI, Meta, most modern static-site blogs). For sites
 * that don't expose JSON-LD, pass a custom `parse(html, ctx)` returning
 * RawItem[].
 */
export class ScraperAdapter extends SourceAdapter {
  /**
   * @param {{
   *   company: string,
   *   url: string,
   *   maxItems?: number,
   *   parse?: (html: string, ctx: { company: string, url: string }) => any[],
   * }} config
   */
  constructor(config) {
    super({ name: `scraper:${config.company}` });
    this.config = config;
  }

  async fetch() {
    const { company, url, maxItems = 8, parse } = this.config;
    const res = await httpGet(url);
    const html = await res.text();

    const items = parse
      ? parse(html, { company, url })
      : this.defaultParse(html, { company, url });

    return items.slice(0, maxItems);
  }

  defaultParse(html, { company, url }) {
    const blocks = extractJsonLdBlocks(html);
    const articles = [];
    for (const b of blocks) collectArticles(b, articles);

    const seen = new Set();
    const out = [];
    for (const a of articles) {
      const item = articleToItem(a, { company, defaultUrl: url });
      if (!item) continue;
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      out.push(item);
    }
    // Newest first
    out.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    return out;
  }
}
