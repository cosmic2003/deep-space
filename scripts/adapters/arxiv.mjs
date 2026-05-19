import { XMLParser } from "fast-xml-parser";
import { SourceAdapter, USER_AGENT, pickText, safeIso, stripHtml } from "./base.mjs";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
});

const API = "http://export.arxiv.org/api/query";

// arXiv asks for >=3s between API requests AND has an IP-level burst limit
// that takes several minutes to cool down. Multiple ArxivAdapter instances
// share this throttle. On 429/503 we back off and retry once with a long pause.
const MIN_ARXIV_INTERVAL_MS = 4000;
const RETRY_SLEEP_MS = 60_000;
let lastArxivCall = 0;
async function throttleArxiv() {
  const wait = lastArxivCall + MIN_ARXIV_INTERVAL_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastArxivCall = Date.now();
}

async function arxivFetch(url, { name }) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    await throttleArxiv();
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (res.ok) return res;
    if ((res.status === 429 || res.status === 503) && attempt === 1) {
      console.warn(`[${name}] arXiv ${res.status}; sleeping ${RETRY_SLEEP_MS / 1000}s and retrying once`);
      await new Promise((r) => setTimeout(r, RETRY_SLEEP_MS));
      continue;
    }
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  throw new Error(`arXiv: max retries exceeded for ${url}`);
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

    const res = await arxivFetch(url, { name: this.name });
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
