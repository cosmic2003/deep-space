import { XMLParser } from "fast-xml-parser";
import { SourceAdapter, httpGet, pickText, safeIso, stripHtml } from "./base.mjs";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
});

function pickLink(item) {
  if (typeof item.link === "string") return item.link;
  if (Array.isArray(item.link)) {
    const alt = item.link.find((l) => l["@_rel"] === "alternate" || !l["@_rel"]);
    return alt?.["@_href"] ?? item.link[0]?.["@_href"] ?? "";
  }
  if (typeof item.link === "object") {
    return item.link["@_href"] ?? item.link["#text"] ?? "";
  }
  return "";
}

function pickId(item) {
  if (item.guid) return pickText(item.guid);
  if (item.id) return pickText(item.id);
  return pickLink(item);
}

function pickDate(item) {
  return (
    item.pubDate ?? item.published ?? item.updated ?? item["dc:date"] ?? null
  );
}

/**
 * Parse an RSS/Atom XML string into RawItem-shaped entries.
 * Exposed so other adapters (Nitter) can reuse the same parser.
 */
export function parseRssXml(xml, { company, source = "blog", maxItems = 8 }) {
  const parsed = parser.parse(xml);
  const rawItems = parsed?.rss?.channel?.item ?? parsed?.feed?.entry ?? [];
  const items = Array.isArray(rawItems) ? rawItems : [rawItems];

  const out = [];
  for (const item of items.slice(0, maxItems)) {
    const id = pickId(item);
    const title = stripHtml(pickText(item.title));
    const url = pickLink(item);
    const dateStr = pickDate(item);
    const rawBody =
      pickText(item["content:encoded"]) ||
      pickText(item.content) ||
      pickText(item.description) ||
      pickText(item.summary) ||
      "";
    const body = stripHtml(rawBody);
    const publishedAt = safeIso(dateStr);

    if (!id || !title || !publishedAt) continue;
    out.push({ id, company, title, body, url, publishedAt, source });
  }
  return out;
}

export class RSSAdapter extends SourceAdapter {
  /**
   * @param {{ company: string, url: string, maxItems?: number }} config
   */
  constructor(config) {
    super({ name: `rss:${config.company}` });
    this.config = config;
  }

  async fetch() {
    const { company, url, maxItems = 8 } = this.config;
    const res = await httpGet(url);
    const xml = await res.text();
    return parseRssXml(xml, { company, source: "blog", maxItems });
  }
}
