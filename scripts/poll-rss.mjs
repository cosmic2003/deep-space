// Polls each company's RSS/Atom feed, summarizes any new items with Gemini,
// and upserts them into Supabase. Then regenerates today's daily digest.
//
// Run by GitHub Actions on a 30-minute cron (see .github/workflows/poll-rss.yml).
// Env: SUPABASE_URL, SUPABASE_SECRET_KEY, GEMINI_API_KEY, GEMINI_MODEL (optional)

import { createClient } from "@supabase/supabase-js";
import { XMLParser } from "fast-xml-parser";

const FEEDS = [
  { company: "openai",          url: "https://openai.com/news/rss.xml" },
  { company: "google-deepmind", url: "https://deepmind.google/blog/rss.xml" },
  // anthropic: no working public RSS found at /news/rss.xml. Try RSSHub
  //   (https://rsshub.app/anthropic/news) or an HTML scraper later.
  // meta-ai: no working public RSS found at /blog/rss/. Same deal — RSSHub or scraper.
  // xai: no public RSS at all. HTML scraper required.
];

const MAX_ITEMS_PER_FEED   = 8;
const SUMMARY_MAX_TOKENS   = 300;
const DIGEST_MAX_TOKENS    = 600;
const DIGEST_LOOKBACK_HOURS = 168; // 7 days

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;
const geminiKey   = process.env.GEMINI_API_KEY;
const geminiModel = process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite";

if (!supabaseUrl || !supabaseKey || !geminiKey) {
  console.error("Missing env: SUPABASE_URL, SUPABASE_SECRET_KEY, GEMINI_API_KEY");
  process.exit(1);
}

const sb = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
});

function stripHtml(s) {
  return String(s ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function pickText(v) {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object") return v["#text"] ?? v["@_href"] ?? "";
  return String(v);
}

function pickLink(item) {
  if (typeof item.link === "string") return item.link;
  if (Array.isArray(item.link)) {
    const alt = item.link.find((l) => l["@_rel"] === "alternate" || !l["@_rel"]);
    return alt?.["@_href"] ?? item.link[0]?.["@_href"] ?? "";
  }
  if (typeof item.link === "object") return item.link["@_href"] ?? item.link["#text"] ?? "";
  return "";
}

function pickId(item) {
  if (item.guid) return pickText(item.guid);
  if (item.id) return pickText(item.id);
  return pickLink(item);
}

function pickDate(item) {
  return item.pubDate ?? item.published ?? item.updated ?? item["dc:date"] ?? null;
}

// Free-tier rate limits vary by model (5–15 RPM). Enforce a minimum gap
// between calls; retry once on 429 with a long sleep as safety net.
const MIN_GEMINI_INTERVAL_MS = 6500; // ~9 RPM, safely under flash-lite free tier
let lastGeminiCall = 0;

async function throttleGemini() {
  const wait = lastGeminiCall + MIN_GEMINI_INTERVAL_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastGeminiCall = Date.now();
}

async function callGemini(prompt, maxTokens) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    await throttleGemini();
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature: 0.3,
          },
        }),
      }
    );
    if (res.status === 429 && attempt === 1) {
      console.warn(`Gemini 429 on attempt ${attempt}; sleeping 30s then retrying`);
      await new Promise((r) => setTimeout(r, 30_000));
      continue;
    }
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Gemini ${res.status}: ${body.slice(0, 400)}`);
    }
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
  }
  throw new Error("Gemini: max retries exceeded");
}

async function summarizePost(title, body) {
  const prompt = [
    "다음 AI 회사 블로그 글을 한국어 1~2문장(최대 200자)으로 요약해.",
    "마케팅 어투 제거하고 팩트·수치 위주. 불릿 없이 평문.",
    "",
    `제목: ${title}`,
    "",
    "본문:",
    body.slice(0, 4000),
  ].join("\n");
  return callGemini(prompt, SUMMARY_MAX_TOKENS);
}

async function pollFeed(feed) {
  console.log(`\n[${feed.company}] GET ${feed.url}`);
  let xml;
  try {
    const res = await fetch(feed.url, {
      headers: { "User-Agent": "deep-space-poller/1.0 (+https://github.com/cosmic2003/deep-space)" },
    });
    if (!res.ok) {
      console.error(`[${feed.company}] HTTP ${res.status} — skipping`);
      return { added: 0 };
    }
    xml = await res.text();
  } catch (e) {
    console.error(`[${feed.company}] fetch failed:`, e.message);
    return { added: 0 };
  }

  let parsed;
  try {
    parsed = parser.parse(xml);
  } catch (e) {
    console.error(`[${feed.company}] XML parse failed:`, e.message);
    return { added: 0 };
  }

  const rawItems = parsed?.rss?.channel?.item ?? parsed?.feed?.entry ?? [];
  const items = Array.isArray(rawItems) ? rawItems : [rawItems];
  console.log(`[${feed.company}] ${items.length} items found`);

  let added = 0;
  for (const item of items.slice(0, MAX_ITEMS_PER_FEED)) {
    const id = pickId(item);
    const title = stripHtml(pickText(item.title));
    const link = pickLink(item);
    const dateStr = pickDate(item);
    const rawBody =
      pickText(item["content:encoded"]) ||
      pickText(item.content) ||
      pickText(item.description) ||
      pickText(item.summary) ||
      "";
    const body = stripHtml(rawBody);

    if (!id || !title || !dateStr) {
      console.warn(`[${feed.company}] skipping incomplete item: ${title || id || "(unknown)"}`);
      continue;
    }

    let publishedAt;
    try {
      publishedAt = new Date(dateStr).toISOString();
    } catch {
      console.warn(`[${feed.company}] invalid date: ${dateStr}`);
      continue;
    }

    const { data: existing, error: selErr } = await sb
      .from("ai_posts")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (selErr) {
      console.error(`[${feed.company}] select failed:`, selErr.message);
      continue;
    }
    if (existing) continue;

    let summary;
    try {
      summary = await summarizePost(title, body);
    } catch (e) {
      console.error(`[${feed.company}] summarize failed for "${title}":`, e.message);
      continue;
    }
    if (!summary) {
      console.warn(`[${feed.company}] empty summary for "${title}", skipping`);
      continue;
    }

    const { error: upErr } = await sb.from("ai_posts").upsert({
      id,
      company: feed.company,
      title,
      summary,
      url: link,
      published_at: publishedAt,
      source: "blog",
      tags: [],
    });
    if (upErr) {
      console.error(`[${feed.company}] upsert failed:`, upErr.message);
    } else {
      console.log(`[${feed.company}] + ${title}`);
      added++;
    }
  }
  return { added };
}

async function regenerateDigest() {
  const since = new Date(Date.now() - DIGEST_LOOKBACK_HOURS * 3600_000).toISOString();
  const { data: recent, error } = await sb
    .from("ai_posts")
    .select("title, company, url, summary")
    .gte("published_at", since)
    .order("published_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("[digest] select failed:", error.message);
    return;
  }
  if (!recent || recent.length === 0) {
    console.log("[digest] no posts in last 24h, skipping");
    return;
  }

  const list = recent
    .map((p) => `- [${p.company}] ${p.title} — ${p.summary}`)
    .join("\n");
  const prompt = [
    "다음은 지난 7일 AI 업계 블로그 글들이야.",
    '이 흐름을 종합한 "이번 주 주요 이슈" 요약을 한국어 3~5문장(최대 500자)으로 써.',
    "마케팅 어투 X. 큰 흐름·맥락·의미 위주로. 불릿 없이 평문.",
    "",
    list,
  ].join("\n");

  let summary;
  try {
    summary = await callGemini(prompt, DIGEST_MAX_TOKENS);
  } catch (e) {
    console.error("[digest] gemini failed:", e.message);
    return;
  }
  if (!summary) {
    console.warn("[digest] empty summary, skipping");
    return;
  }

  const highlights = recent.slice(0, 3).map((p) => ({
    title: p.title,
    company: p.company,
    url: p.url,
  }));

  const today = new Date().toISOString().slice(0, 10);
  const { error: upErr } = await sb.from("daily_digest").upsert({
    date: today,
    summary,
    highlights,
  });
  if (upErr) console.error("[digest] upsert failed:", upErr.message);
  else console.log(`[digest] updated ${today} (${recent.length} posts considered)`);
}

async function main() {
  console.log(`=== poll-rss start ${new Date().toISOString()} ===`);
  let totalAdded = 0;
  for (const feed of FEEDS) {
    try {
      const { added } = await pollFeed(feed);
      totalAdded += added;
    } catch (e) {
      console.error(`[${feed.company}] fatal:`, e.message);
    }
  }
  console.log(`\n${totalAdded} new post(s) ingested.`);
  await regenerateDigest();
  console.log(`=== poll-rss end ${new Date().toISOString()} ===`);
}

main().catch((e) => {
  console.error("fatal:", e);
  process.exit(1);
});
