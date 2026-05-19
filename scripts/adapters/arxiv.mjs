import { XMLParser } from "fast-xml-parser";
import { SourceAdapter, USER_AGENT, pickText, safeIso, stripHtml } from "./base.mjs";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
});

const API = "http://export.arxiv.org/api/query";

// arXiv asks for >=3s between API requests. Multiple ArxivAdapter instances
// share this throttle. No in-call retries on 429/503 — the workflow timeout
// is more valuable than one paper; failures will retry on the next cron tick
// once the IP cools down.
const MIN_ARXIV_INTERVAL_MS = 4000;
let lastArxivCall = 0;
async function throttleArxiv() {
  const wait = lastArxivCall + MIN_ARXIV_INTERVAL_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastArxivCall = Date.now();
}

async function arxivFetch(url) {
  await throttleArxiv();
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res;
}

function buildQuery({ authors = [], categories = [], extraTerms = [] }) {
  const parts = [];
  if (authors.length) {
    const a = authors
      .map((n) => `au:"${n}"`)
      .join("+OR+");
    parts.push(`(${a})`);
  }
  if (categories.length) {
    const c = categories.map((c) => `cat:${c}`).join("+OR+");
    parts.push(`(${c})`);
  }
  for (const t of extraTerms) parts.push(t);
  return parts.join("+AND+");
}

function entryAuthors(entry) {
  const a = entry.author;
  if (!a) return [];
  const arr = Array.isArray(a) ? a : [a];
  return arr.map((x) => pickText(x?.name ?? x)).filter(Boolean);
}

function entryLink(entry) {
  if (typeof entry.id === "string") return entry.id;
  if (Array.isArray(entry.link)) {
    const alt = entry.link.find((l) => l["@_rel"] === "alternate") ?? entry.link[0];
    return alt?.["@_href"] ?? "";
  }
  if (entry.link?.["@_href"]) return entry.link["@_href"];
  return pickText(entry.id);
}

/**
 * arXiv search API → Atom feed of papers, filtered by author list.
 *
 * Each configured author list is attributed to a single company. e.g.
 * Hassabis + Silver papers → google-deepmind. Authors are matched
 * case-insensitively against the paper's author list to confirm membership
 * before tagging (arXiv's `au:` search is fuzzy on transliteration).
 */
export class ArxivAdapter extends SourceAdapter {
  /**
   * @param {{
   *   company: string,
   *   authors: string[],
   *   categories?: string[],
   *   maxItems?: number,
   * }} config
   */
  constructor(config) {
    super({ name: `arxiv:${config.company}` });
    this.config = config;
  }

  async fetch() {
    const { company, authors, categories = ["cs.AI", "cs.LG", "cs.CL"], maxItems = 5 } = this.config;
    if (!authors || authors.length === 0) return [];

    const q = buildQuery({ authors, categories });
    const url = `${API}?search_query=${encodeURIComponent(q)}&start=0&max_results=${maxItems * 2}&sortBy=submittedDate&sortOrder=descending`;

    const res = await arxivFetch(url);
    const xml = await res.text();
    const parsed = parser.parse(xml);
    const raw = parsed?.feed?.entry ?? [];
    const entries = Array.isArray(raw) ? raw : raw ? [raw] : [];

    const wanted = new Set(authors.map((a) => a.toLowerCase()));
    const out = [];
    for (const entry of entries) {
      const id = pickText(entry.id);
      const title = stripHtml(pickText(entry.title));
      const summary = stripHtml(pickText(entry.summary));
      const published = pickText(entry.published) || pickText(entry.updated);
      const link = entryLink(entry);
      const names = entryAuthors(entry);
      const matched = names.some((n) =>
        Array.from(wanted).some((w) => n.toLowerCase().includes(w))
      );
      if (!matched) continue;

      const publishedAt = safeIso(published);
      if (!id || !title || !publishedAt) continue;

      out.push({
        id,
        company,
        title,
        body: `${summary}\n\n저자: ${names.join(", ")}`,
        url: link || id,
        publishedAt,
        source: "paper",
        tags: names.slice(0, 8),
      });
      if (out.length >= maxItems) break;
    }
    return out;
  }
}
