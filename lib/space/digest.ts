import { supabase } from "../ai/supabase";

export interface SpaceDigestItem {
  title: string;
  desc: string;
  source: string;
  url: string;
}

export interface SpaceDigest {
  generatedAt: string;
  summary: string;
  items: SpaceDigestItem[];
  sourceCount: number;
  windowDays: number;
}

interface DbRow {
  generated_at: string;
  summary: string;
  items: SpaceDigestItem[];
  source_count: number;
  window_days: number;
}

export async function getLatestSpaceDigest(): Promise<SpaceDigest | null> {
  const { data, error } = await supabase
    .from("space_digest")
    .select("generated_at, summary, items, source_count, window_days")
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[space] getLatestSpaceDigest failed:", error);
    return null;
  }
  if (!data) return null;
  const r = data as DbRow;
  return {
    generatedAt: r.generated_at,
    summary: r.summary,
    items: r.items ?? [],
    sourceCount: r.source_count,
    windowDays: r.window_days,
  };
}
