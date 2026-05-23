// Pulls the past week from Spaceflight News API v4 and asks Gemini to curate
// 2-4 highlights as a Korean digest. Result lands in space_digest. Designed
// to run once a day from GitHub Actions — see .github/workflows/poll-space-news.yml.
//
// Env: SUPABASE_URL, SUPABASE_SECRET_KEY, GEMINI_API_KEY, GEMINI_MODEL (optional)

import { createClient } from "@supabase/supabase-js";

const WINDOW_DAYS = 7;
const ARTICLE_LIMIT = 30;        // upper bound fed to the LLM
const DIGEST_MAX_TOKENS = 2000;

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

async function fetchSpaceNews(days, limit) {
  const since = new Date(Date.now() - days * 86400 * 1000).toISOString();
  const url = new URL("https://api.spaceflightnewsapi.net/v4/articles/");
  url.searchParams.set("published_at_gte", since);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("ordering", "-published_at");

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`SNAPI ${res.status} ${res.statusText}`);
  const data = await res.json();
  return (data.results ?? []).map((a) => ({
    title: a.title,
    summary: a.summary,
    source: a.news_site,
    url: a.url,
    publishedAt: a.published_at,
  }));
}

function buildDigestPrompt(articles) {
  return `너는 우주·항공우주 분야 뉴스 요약 에디터야.
아래는 지난 일주일간 수집된 우주 관련 뉴스 기사 목록이야 (JSON).

규칙:
- 한국어로 요약할 것
- 아래 기사들에 실제로 있는 내용만 사용. 없는 내용을 지어내지 말 것
- 비슷한 주제의 기사는 하나로 묶을 것
- 가장 중요한 항목 2~4개만 선별 (사소한 건 제외)
- 반드시 아래 JSON 형식으로만 답할 것. 다른 텍스트·설명·마크다운 금지

출력 형식:
{
  "summary": "이번주 우주 분야 전체를 1~2문장으로 요약",
  "items": [
    {
      "title": "핵심을 담은 짧은 제목",
      "desc": "2~3줄 설명",
      "source": "출처명",
      "url": "원문 링크"
    }
  ]
}

기사 목록:
${JSON.stringify(articles, null, 2)}`;
}

// Daily cron makes exactly one Gemini call. If that call fails on a transient
// 429/503/500, we lose the day's digest until tomorrow — so retry with backoff
// here is worth the wall-clock cost (unlike the per-item AI cron).
const TRANSIENT_STATUSES = new Set([429, 500, 502, 503, 504]);
const RETRY_DELAYS_MS = [20_000, 45_000, 90_000];

async function callGeminiJson(prompt) {
  let lastErr;
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: DIGEST_MAX_TOKENS,
            temperature: 0.2,
            responseMimeType: "application/json",
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      }
    );
    if (res.ok) {
      const data = await res.json();
      const finishReason = data?.candidates?.[0]?.finishReason;
      if (finishReason && finishReason !== "STOP") {
        console.warn(`Gemini finished with ${finishReason} (not STOP) — output may be truncated`);
      }
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
      if (!text) throw new Error("Gemini returned empty text");
      return JSON.parse(text);
    }
    const body = await res.text();
    lastErr = new Error(`Gemini ${res.status}: ${body.slice(0, 300)}`);
    if (!TRANSIENT_STATUSES.has(res.status) || attempt === RETRY_DELAYS_MS.length) {
      throw lastErr;
    }
    const wait = RETRY_DELAYS_MS[attempt];
    console.warn(`Gemini ${res.status} on attempt ${attempt + 1}; sleeping ${wait / 1000}s and retrying`);
    await new Promise((r) => setTimeout(r, wait));
  }
  throw lastErr ?? new Error("Gemini: max retries exceeded");
}

function isValidDigest(obj) {
  if (!obj || typeof obj !== "object") return false;
  if (typeof obj.summary !== "string" || !obj.summary.trim()) return false;
  if (!Array.isArray(obj.items)) return false;
  return obj.items.every(
    (it) =>
      it &&
      typeof it.title === "string" &&
      typeof it.desc === "string" &&
      typeof it.source === "string" &&
      typeof it.url === "string"
  );
}

async function main() {
  console.log(`=== poll-space-news start ${new Date().toISOString()} ===`);
  const articles = await fetchSpaceNews(WINDOW_DAYS, ARTICLE_LIMIT);
  console.log(`Fetched ${articles.length} articles from SNAPI`);
  if (articles.length === 0) {
    console.warn("No articles in the window — skipping digest");
    return;
  }

  const prompt = buildDigestPrompt(articles);
  const digest = await callGeminiJson(prompt);
  if (!isValidDigest(digest)) {
    console.error("Gemini returned malformed digest:", JSON.stringify(digest).slice(0, 400));
    process.exit(1);
  }
  // Trim to 4 items defensively even if Gemini ignores the cap.
  const items = digest.items.slice(0, 4);

  const { error } = await sb.from("space_digest").insert({
    summary: digest.summary,
    items,
    source_count: articles.length,
    window_days: WINDOW_DAYS,
  });
  if (error) {
    console.error("space_digest insert failed:", error.message);
    process.exit(1);
  }
  console.log(
    `Stored digest — summary len=${digest.summary.length}, items=${items.length}, sources=${articles.length}`
  );
  console.log(`=== poll-space-news end ${new Date().toISOString()} ===`);
}

main().catch((e) => {
  console.error("fatal:", e);
  process.exit(1);
});
