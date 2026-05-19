// Orchestrator: iterates over every SourceAdapter declared in
// ./sources.config.mjs, dedupes against Supabase, summarises new items with
// Gemini, upserts to ai_posts, then regenerates the daily digest.
//
// Adapters never touch the DB — they just return RawItem[]. This file owns
// all I/O against Supabase and Gemini.
//
// Run by GitHub Actions on a 30-minute cron (see .github/workflows/poll-rss.yml).
// Env: SUPABASE_URL, SUPABASE_SECRET_KEY, GEMINI_API_KEY,
//      GEMINI_MODEL (optional), GITHUB_TOKEN (optional — for higher rate limit)

import { createClient } from "@supabase/supabase-js";
import { SOURCES } from "./sources.config.mjs";

const SUMMARY_MAX_TOKENS    = 1000; // Korean text is token-heavy; 300 caused mid-sentence cuts
const DIGEST_MAX_TOKENS     = 2000;
const DIGEST_LOOKBACK_HOURS = 168; // 7 days
const DIGEST_LIMIT          = 30;

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
            thinkingConfig: { thinkingBudget: 0 },
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
    const finishReason = data?.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== "STOP") {
      console.warn(`Gemini finished with ${finishReason} (not STOP) — output may be truncated`);
    }
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
  }
  throw new Error("Gemini: max retries exceeded");
}

// Different source types deserve slightly different summariser instructions.
// Blog posts want fact-distilled prose; tweets are already short, so we just
// clean them up; papers benefit from being framed as research findings.
function summaryPromptFor(item) {
  const head = `제목: ${item.title}\n\n본문:\n${(item.body ?? "").slice(0, 4000)}`;
  switch (item.source) {
    case "x":
      return [
        "다음 X(Twitter) 게시물을 한국어 1문장(최대 120자)으로 요약해.",
        "농담·이모지 제거. 사실/숫자/링크만. 불릿 없이 평문.",
        "",
        head,
      ].join("\n");
    case "paper":
      return [
        "다음 arXiv 논문 초록을 한국어 1~2문장(최대 250자)으로 요약해.",
        "연구 목적·방법·결과 핵심만. 마케팅 X. 불릿 없이 평문.",
        "",
        head,
      ].join("\n");
    case "github":
      return [
        "다음 GitHub 릴리즈 노트를 한국어 1~2문장(최대 200자)으로 요약해.",
        "주요 변경/추가/버그픽스만 압축. 불릿 없이 평문.",
        "",
        head,
      ].join("\n");
    case "reddit":
      return [
        "다음 Reddit 게시물을 한국어 1문장(최대 150자)으로 요약해.",
        "주관·감탄 제거하고 무슨 일이 일어났는지만. 불릿 없이 평문.",
        "",
        head,
      ].join("\n");
    case "hn":
      return [
        "다음 Hacker News 게시물(테크 커뮤니티 화제글)을 한국어 1문장(최대 150자)으로 요약해.",
        "왜 화제가 됐는지·핵심 사실만. 코멘트는 무시. 불릿 없이 평문.",
        "",
        head,
      ].join("\n");
    case "blog":
    default:
      return [
        "다음 AI 회사 블로그 글을 한국어 1~2문장(최대 200자)으로 요약해.",
        "마케팅 어투 제거하고 팩트·수치 위주. 불릿 없이 평문.",
        "",
        head,
      ].join("\n");
  }
}

async function summarize(item) {
  return callGemini(summaryPromptFor(item), SUMMARY_MAX_TOKENS);
}

async function processItems(adapter, items) {
  let added = 0;
  for (const item of items) {
    if (!item.id || !item.title || !item.publishedAt || !item.url) {
      console.warn(`[${adapter.name}] skipping incomplete item: ${item.title || item.id || "(unknown)"}`);
      continue;
    }

    const { data: existing, error: selErr } = await sb
      .from("ai_posts")
      .select("id")
      .eq("id", item.id)
      .maybeSingle();
    if (selErr) {
      console.error(`[${adapter.name}] select failed:`, selErr.message);
      continue;
    }
    if (existing) continue;

    let summary;
    try {
      summary = await summarize(item);
    } catch (e) {
      console.error(`[${adapter.name}] summarize failed for "${item.title}":`, e.message);
      continue;
    }
    if (!summary) {
      console.warn(`[${adapter.name}] empty summary for "${item.title}", skipping`);
      continue;
    }

    const { error: upErr } = await sb.from("ai_posts").upsert({
      id: item.id,
      company: item.company,
      title: item.title,
      summary,
      url: item.url,
      published_at: item.publishedAt,
      source: item.source,
      tags: item.tags ?? [],
    });
    if (upErr) {
      console.error(`[${adapter.name}] upsert failed:`, upErr.message);
    } else {
      console.log(`[${adapter.name}] + ${item.title}`);
      added++;
    }
  }
  return added;
}

async function regenerateDigest() {
  const since = new Date(Date.now() - DIGEST_LOOKBACK_HOURS * 3600_000).toISOString();
  const { data: recent, error } = await sb
    .from("ai_posts")
    .select("title, company, url, summary, source")
    .gte("published_at", since)
    .order("published_at", { ascending: false })
    .limit(DIGEST_LIMIT);

  if (error) {
    console.error("[digest] select failed:", error.message);
    return;
  }
  if (!recent || recent.length === 0) {
    console.log("[digest] no posts in lookback window, skipping");
    return;
  }

  const list = recent
    .map((p) => `- [${p.company}/${p.source}] ${p.title} — ${p.summary}`)
    .join("\n");
  const prompt = [
    "다음은 지난 7일 AI 업계 소식(블로그·X·논문·GitHub·Reddit)이야.",
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
  console.log(`Configured sources: ${SOURCES.length}`);

  let totalAdded = 0;
  for (const adapter of SOURCES) {
    console.log(`\n--- ${adapter.name} ---`);
    let items;
    try {
      items = await adapter.fetch();
    } catch (e) {
      console.error(`[${adapter.name}] fetch failed:`, e.message);
      continue;
    }
    console.log(`[${adapter.name}] ${items.length} items returned`);
    try {
      const added = await processItems(adapter, items);
      totalAdded += added;
    } catch (e) {
      console.error(`[${adapter.name}] process failed:`, e.message);
    }
  }

  console.log(`\n${totalAdded} new post(s) ingested across ${SOURCES.length} sources.`);
  await regenerateDigest();
  console.log(`=== poll-rss end ${new Date().toISOString()} ===`);
}

main().catch((e) => {
  console.error("fatal:", e);
  process.exit(1);
});
