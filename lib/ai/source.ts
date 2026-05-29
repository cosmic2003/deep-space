import { supabase } from "./supabase";
import type { AICompany, AIPost, DailyDigest, PostSource } from "./types";

interface DbPost {
  id: string;
  company: AICompany;
  title: string;
  summary: string;
  url: string;
  published_at: string;
  source: PostSource;
  tags: string[] | null;
}

function rowToPost(r: DbPost): AIPost {
  return {
    id: r.id,
    company: r.company,
    title: r.title,
    summary: r.summary,
    url: r.url,
    publishedAt: r.published_at,
    source: r.source,
    tags: r.tags ?? [],
  };
}

export async function getRecentPosts(
  opts: { company?: AICompany; limit?: number } = {}
): Promise<AIPost[]> {
  let query = supabase
    .from("ai_posts")
    .select("id, company, title, summary, url, published_at, source, tags")
    .order("published_at", { ascending: false });

  if (opts.company) query = query.eq("company", opts.company);
  if (opts.limit) query = query.limit(opts.limit);

  const { data, error } = await query;
  if (error) {
    console.error("[ai] getRecentPosts failed:", error);
    return [];
  }
  return (data ?? []).map((r) => rowToPost(r as DbPost));
}

interface DbDigest {
  date: string;
  summary: string;
  highlights: DailyDigest["highlights"];
}

export async function getDailyDigest(): Promise<DailyDigest | null> {
  const { data, error } = await supabase
    .from("daily_digest")
    .select("date, summary, highlights")
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[ai] getDailyDigest failed:", error);
    return null;
  }
  if (!data) return null;
  const d = data as DbDigest;
  return {
    date: d.date,
    summary: d.summary,
    highlights: d.highlights ?? [],
  };
}

export interface BenchmarkModel {
  rank: number;
  name: string;
  creator: string;
  intelligence: number | null;
  coding: number | null;
  math: number | null;
  inPrice: number | null;
  outPrice: number | null;
}

interface DbBenchmark {
  rank: number;
  name: string;
  creator: string;
  intelligence: number | null;
  coding: number | null;
  math: number | null;
  price_input: number | null;
  price_output: number | null;
  fetched_at: string;
}

// Returns the latest Artificial Analysis leaderboard snapshot plus the date it
// was fetched. Empty array (e.g. before the first cron run, or if the API key
// isn't wired up yet) — the component renders a "연동 대기" placeholder.
export async function getModelBenchmarks(): Promise<{
  models: BenchmarkModel[];
  snapshotDate: string | null;
}> {
  const { data, error } = await supabase
    .from("model_benchmarks")
    .select(
      "rank, name, creator, intelligence, coding, math, price_input, price_output, fetched_at"
    )
    .order("rank", { ascending: true });

  if (error) {
    console.error("[ai] getModelBenchmarks failed:", error);
    return { models: [], snapshotDate: null };
  }
  const rows = (data ?? []) as DbBenchmark[];
  return {
    models: rows.map((r) => ({
      rank: r.rank,
      name: r.name,
      creator: r.creator,
      intelligence: r.intelligence,
      coding: r.coding,
      math: r.math,
      inPrice: r.price_input,
      outPrice: r.price_output,
    })),
    snapshotDate: rows[0]?.fetched_at ?? null,
  };
}
