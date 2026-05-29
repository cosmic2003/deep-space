// Pulls the frontier-LLM leaderboard from the Artificial Analysis API and
// replaces the model_benchmarks table with the current top-N by Intelligence
// Index. New models (e.g. a fresh Claude Opus release) show up automatically
// once Artificial Analysis benchmarks them — no manual edits.
//
// Wipe-and-insert on purpose: the leaderboard is small (~15 rows) and we only
// ever want the latest snapshot, so the frontend can read every row by rank.
//
// Run by GitHub Actions on a daily cron (see .github/workflows/poll-benchmarks.yml).
// AA free tier allows ~1000 req/day; one call per run is comfortably under it.
// Attribution to https://artificialanalysis.ai/ is required by their terms and
// is rendered in the footer of the benchmarks section.
//
// Env: SUPABASE_URL, SUPABASE_SECRET_KEY, AA_API_KEY, BENCHMARK_LIMIT (optional)

import { createClient } from "@supabase/supabase-js";

const AA_ENDPOINT = "https://artificialanalysis.ai/api/v2/data/llms/models";
const TOP_N = Number(process.env.BENCHMARK_LIMIT ?? 12);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;
const aaKey       = process.env.AA_API_KEY;

if (!supabaseUrl || !supabaseKey || !aaKey) {
  console.error("Missing env: SUPABASE_URL, SUPABASE_SECRET_KEY, AA_API_KEY");
  process.exit(1);
}

const sb = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

// AA nests scores under `evaluations` and pricing under `pricing`, but exact
// key names have shifted between API revisions. Probe a few candidates and take
// the first finite number so a rename degrades to null instead of crashing.
function pickNum(obj, keys) {
  if (!obj) return null;
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return null;
}

function round(v, dp = 1) {
  if (v == null) return null;
  const f = 10 ** dp;
  return Math.round(v * f) / f;
}

async function fetchModels() {
  const res = await fetch(AA_ENDPOINT, {
    headers: { "x-api-key": aaKey, Accept: "application/json" },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Artificial Analysis ${res.status}: ${body.slice(0, 300)}`);
  }
  const json = await res.json();
  // Response shape is { status, data: [...] }; tolerate a bare array too.
  const list = Array.isArray(json) ? json : json.data;
  if (!Array.isArray(list)) {
    throw new Error(`Unexpected AA response shape: ${JSON.stringify(json).slice(0, 200)}`);
  }
  return list;
}

function toRow(m) {
  const evals = m.evaluations ?? m.evaluation ?? {};
  const pricing = m.pricing ?? {};
  const intelligence = pickNum(evals, [
    "artificial_analysis_intelligence_index",
    "intelligence_index",
  ]);
  return {
    name: m.name ?? m.model_name ?? "Unknown",
    creator: m.model_creator?.name ?? m.creator?.name ?? m.model_creator ?? "—",
    slug: m.slug ?? m.id ?? null,
    intelligence: round(intelligence),
    coding: round(pickNum(evals, ["artificial_analysis_coding_index", "coding_index"])),
    math: round(pickNum(evals, ["artificial_analysis_math_index", "math_index"])),
    price_input: round(
      pickNum(pricing, ["price_1m_input_tokens", "price_1m_input", "input_price_per_1m"]),
      2
    ),
    price_output: round(
      pickNum(pricing, ["price_1m_output_tokens", "price_1m_output", "output_price_per_1m"]),
      2
    ),
    _intelligenceRaw: intelligence,
  };
}

async function main() {
  console.log(`=== poll-benchmarks start ${new Date().toISOString()} ===`);

  const list = await fetchModels();
  console.log(`AA returned ${list.length} models`);

  // One-time visibility into the live schema — invaluable when AA renames a
  // field and scores silently go null.
  if (list[0]) {
    console.log("sample model keys:", Object.keys(list[0]).join(", "));
    if (list[0].evaluations) {
      console.log("sample evaluation keys:", Object.keys(list[0].evaluations).join(", "));
    }
    if (list[0].pricing) {
      console.log("sample pricing keys:", Object.keys(list[0].pricing).join(", "));
    }
  }

  const ranked = list
    .map(toRow)
    .filter((r) => r._intelligenceRaw != null)
    .sort((a, b) => b._intelligenceRaw - a._intelligenceRaw)
    .slice(0, TOP_N)
    .map((r, i) => {
      const { _intelligenceRaw, ...rest } = r;
      return { ...rest, rank: i + 1 };
    });

  if (ranked.length === 0) {
    console.error("No models with an intelligence score — leaving table untouched.");
    process.exit(1);
  }

  // Replace the whole snapshot. Delete first so a shrinking leaderboard never
  // leaves stale rows behind; `id > 0` matches every row (id is identity ≥ 1).
  const { error: delErr } = await sb.from("model_benchmarks").delete().gt("id", 0);
  if (delErr) {
    console.error("delete failed:", delErr.message);
    process.exit(1);
  }

  const { error: insErr } = await sb.from("model_benchmarks").insert(ranked);
  if (insErr) {
    console.error("insert failed:", insErr.message);
    process.exit(1);
  }

  console.log(`Inserted ${ranked.length} models. Top: ${ranked[0].name} (${ranked[0].intelligence}).`);
  console.log(`=== poll-benchmarks end ${new Date().toISOString()} ===`);
}

main().catch((e) => {
  console.error("fatal:", e);
  process.exit(1);
});
