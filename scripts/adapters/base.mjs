// SourceAdapter — common base class + shared helpers.
//
// A concrete adapter knows where to fetch from and how to parse the response
// into RawItem[]. The orchestrator (../poll-rss.mjs) does dedup, Gemini
// summarisation, and Supabase upsert — adapters never touch the DB.

export const USER_AGENT =
  "deep-space-poller/1.0 (+https://github.com/cosmic2003/deep-space)";

/**
 * @typedef {Object} RawItem
 * @property {string} id           Stable upstream id (RSS guid, X status, arXiv id, etc.)
 * @property {string} company      Matches the ai_company enum
 * @property {string} title
 * @property {string} body         Free-form text fed to the Gemini summariser
 * @property {string} url
 * @property {string} publishedAt  ISO 8601
 * @property {'blog'|'x'|'paper'|'github'|'reddit'} source
 * @property {string[]} [tags]
 */

export function stripHtml(s) {
  return String(s ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/\s+/g, " ")
    .trim();
}

export function pickText(v) {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object") return v["#text"] ?? v["@_href"] ?? "";
  return String(v);
}

export async function httpGet(url, init = {}) {
  const res = await fetch(url, {
    ...init,
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html, application/xhtml+xml, application/xml, application/json;q=0.9, */*;q=0.8",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return res;
}

export function safeIso(dateStr) {
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch {
    return null;
  }
}

export class SourceAdapter {
  constructor({ name }) {
    this.name = name;
  }

  /**
   * Fetch raw items from this source.
   * @returns {Promise<RawItem[]>}
   */
  async fetch() {
    throw new Error(`${this.name}: fetch() not implemented`);
  }
}
