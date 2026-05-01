import { searchHNMulti } from "./hackernews";
import { fetchSubreddit } from "./reddit";

export type Topic = "memory" | "process" | "equipment" | "ai-accelerator" | "general";

export interface NewsItem {
  source: "hn" | "reddit";
  id: string;
  title: string;
  url: string;
  score: number;
  comments: number;
  author?: string;
  postedAt: string; // ISO
  subreddit?: string;
  topics: Topic[];
  companies: string[];
  commentsUrl?: string;
  /** Auto-extracted Korean event tag (e.g. "실적", "신제품") if detected. */
  actionLabel?: string;
}

const ACTION_PATTERNS: Array<[string, RegExp]> = [
  ["실적/매출", /\b(earning|revenue|profit|loss|beat|miss|forecast|guidance|q[1-4] result|quarterly)\b/i],
  ["신제품/발표", /\b(launch(es|ed|ing)?|unveil|announce|release|debut|introduce|reveal)\b/i],
  ["양산/수율", /\b(production|mass produce|ramp|yield|fab |output|tape ?out)\b/i],
  ["공급/품귀", /\b(shortage|supply|demand|allocation|capacity|backlog|sold out)\b/i],
  ["인수합병", /\b(acqui|merger|m&a|takeover|buyout|acquired)\b/i],
  ["투자/자금", /\b(invest|fund|capex|raise.{0,8}billion|billion.{0,8}invest)\b/i],
  ["협력/파트너십", /\b(partner|collab|deal with|sign with|order from)\b/i],
  ["규제/법적", /\b(lawsuit|regulat|ban|sanction|fine|court|antitrust|tariff)\b/i],
  ["중국/지정학", /\b(china|chinese|smic|huawei|export control|chip war)\b/i],
];

export function detectAction(title: string): string | undefined {
  for (const [label, re] of ACTION_PATTERNS) {
    if (re.test(title)) return label;
  }
  return undefined;
}

export function googleTranslateUrl(text: string): string {
  return `https://translate.google.com/?sl=en&tl=ko&op=translate&text=${encodeURIComponent(text)}`;
}

export function groupByTopic(items: NewsItem[]): Map<Topic, NewsItem[]> {
  const map = new Map<Topic, NewsItem[]>();
  for (const item of items) {
    // Use first non-general topic, fall back to general
    const primary = item.topics.find((t) => t !== "general") ?? "general";
    if (!map.has(primary)) map.set(primary, []);
    map.get(primary)!.push(item);
  }
  return map;
}

export interface TrendSummary {
  totalSignals: number;
  topCompanies: Array<{ name: string; count: number }>;
  topTopic: { topic: Topic; count: number } | null;
}

export function summarizeTrends(items: NewsItem[]): TrendSummary {
  const companyCounts = new Map<string, number>();
  const topicCounts = new Map<Topic, number>();
  for (const item of items) {
    for (const c of item.companies) {
      companyCounts.set(c, (companyCounts.get(c) ?? 0) + 1);
    }
    for (const t of item.topics) {
      if (t === "general") continue;
      topicCounts.set(t, (topicCounts.get(t) ?? 0) + 1);
    }
  }
  const topCompanies = Array.from(companyCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
  const topTopicEntry = Array.from(topicCounts.entries()).sort((a, b) => b[1] - a[1])[0];
  return {
    totalSignals: items.length,
    topCompanies,
    topTopic: topTopicEntry ? { topic: topTopicEntry[0], count: topTopicEntry[1] } : null,
  };
}

export const TOPIC_LABELS: Record<Topic, string> = {
  memory: "메모리",
  process: "공정",
  equipment: "장비",
  "ai-accelerator": "AI 가속기",
  general: "기타",
};

const TOPIC_PATTERNS: Array<[Exclude<Topic, "general">, RegExp]> = [
  ["memory", /\b(hbm|hbm[234]|dram|nand|gddr[567]?|ddr[345]|memory chip|micron memory)\b/i],
  ["process", /\b(2nm|3nm|4nm|5nm|7nm|10nm|14nm|node|finfet|gaa|gate-?all-?around|wafer|fab|foundry|18a)\b/i],
  ["equipment", /\b(asml|euv|lithograph(?:y|er)|tokyo electron|applied materials|kla|extreme ultraviolet)\b/i],
  ["ai-accelerator", /\b(h100|h200|b100|b200|gb200|tpu|trainium|inferentia|mi300|mi325|gaudi|ai chip|ai accelerator|gpu cluster|nvlink)\b/i],
];

const COMPANY_PATTERNS: Array<{ name: string; re: RegExp }> = [
  { name: "TSMC", re: /\btsmc\b/i },
  { name: "NVIDIA", re: /\b(nvidia|nvda|jensen huang|geforce|rtx ?\d{4})\b/i },
  { name: "Samsung", re: /\bsamsung\b/i },
  { name: "SK Hynix", re: /\b(sk ?hynix|hynix)\b/i },
  { name: "AMD", re: /\b(amd|ryzen|epyc|radeon)\b/i },
  { name: "Intel", re: /\bintel\b/i },
  { name: "ASML", re: /\basml\b/i },
  { name: "Qualcomm", re: /\b(qualcomm|snapdragon)\b/i },
  { name: "Micron", re: /\bmicron\b/i },
  { name: "Apple", re: /\b(apple silicon|m[1-4] (?:chip|pro|max|ultra)|a1[7-9] ?(?:bionic|pro)?)\b/i },
  { name: "Broadcom", re: /\bbroadcom\b/i },
  { name: "Arm", re: /\b(arm holdings|arm cpu|arm chip|softbank arm)\b/i },
];

function detectTopics(text: string): Topic[] {
  const found: Topic[] = [];
  for (const [topic, re] of TOPIC_PATTERNS) {
    if (re.test(text)) found.push(topic);
  }
  return found.length > 0 ? found : ["general"];
}

function detectCompanies(text: string): string[] {
  return COMPANY_PATTERNS.filter((p) => p.re.test(text)).map((p) => p.name);
}

const HN_QUERIES = [
  "TSMC",
  "Nvidia chip",
  "Samsung HBM",
  "ASML",
  "Intel foundry",
  "semiconductor",
  "Micron memory",
  "AMD GPU",
];

const REDDIT_SUBS = ["hardware", "semiconductors", "Amd", "nvidia", "intel"];

const REDDIT_FILTER =
  /\b(tsmc|nvidia|samsung|sk ?hynix|amd|intel|asml|euv|wafer|foundry|hbm|dram|nand|chip|silicon|2nm|3nm|gpu|node|micron|broadcom|qualcomm|snapdragon)\b/i;

export async function getSemiNews(
  { hours = 48 }: { hours?: number } = {}
): Promise<NewsItem[]> {
  const [hn, reddit] = await Promise.all([
    searchHNMulti(HN_QUERIES, { hours, limit: 20 }),
    fetchSubreddit(REDDIT_SUBS, { sort: "hot", limit: 50 }),
  ]);

  const cutoff = Date.now() - hours * 3600 * 1000;
  const items: NewsItem[] = [];
  const seen = new Set<string>();

  for (const h of hn) {
    const url =
      h.url ?? `https://news.ycombinator.com/item?id=${h.story_id ?? h.objectID}`;
    if (seen.has(url)) continue;
    seen.add(url);
    const text = `${h.title} ${url}`;
    items.push({
      source: "hn",
      id: h.objectID,
      title: h.title,
      url,
      score: h.points,
      comments: h.num_comments,
      author: h.author,
      postedAt: h.created_at,
      topics: detectTopics(text),
      companies: detectCompanies(text),
      commentsUrl: `https://news.ycombinator.com/item?id=${h.story_id ?? h.objectID}`,
      actionLabel: detectAction(h.title),
    });
  }

  for (const r of reddit) {
    const text = `${r.title} ${r.selftext ?? ""}`;
    if (!REDDIT_FILTER.test(text)) continue;
    if (r.created_utc * 1000 < cutoff) continue;
    const url = r.url.startsWith("/r/") ? `https://www.reddit.com${r.url}` : r.url;
    if (seen.has(url)) continue;
    seen.add(url);
    items.push({
      source: "reddit",
      id: r.id,
      title: r.title,
      url,
      score: r.score,
      comments: r.num_comments,
      author: r.author,
      postedAt: new Date(r.created_utc * 1000).toISOString(),
      subreddit: r.subreddit,
      topics: detectTopics(text),
      companies: detectCompanies(text),
      commentsUrl: `https://www.reddit.com${r.permalink}`,
      actionLabel: detectAction(r.title),
    });
  }

  return items.sort((a, b) => {
    const aS = a.score + a.comments * 0.5;
    const bS = b.score + b.comments * 0.5;
    return bS - aS;
  });
}
