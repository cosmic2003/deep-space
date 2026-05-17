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
