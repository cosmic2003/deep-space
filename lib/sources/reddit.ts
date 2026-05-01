const UA =
  "deep-space-hub/0.1 (https://deep-space-umber-gamma.vercel.app)";

export interface RedditPost {
  id: string;
  subreddit: string;
  title: string;
  url: string;
  permalink: string;
  score: number;
  num_comments: number;
  author: string;
  created_utc: number;
  selftext?: string;
  link_flair_text?: string | null;
  over_18: boolean;
  is_self: boolean;
  stickied?: boolean;
}

interface RedditChild {
  kind: string;
  data: RedditPost;
}

interface RedditListing {
  data: { children: RedditChild[] };
}

const REDDIT_BASE = "https://www.reddit.com";

export async function fetchSubreddit(
  subreddits: string[],
  opts: {
    sort?: "hot" | "top" | "new";
    limit?: number;
    t?: "day" | "week" | "month";
  } = {}
): Promise<RedditPost[]> {
  const { sort = "hot", limit = 50, t = "day" } = opts;
  const path = subreddits.join("+");
  const tParam = sort === "top" ? `&t=${t}` : "";
  const url = `${REDDIT_BASE}/r/${path}/${sort}.json?limit=${limit}${tParam}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      next: { revalidate: 600 },
    });
    if (!res.ok) {
      console.error(`[Reddit] ${res.status} ${res.statusText} for ${path}`);
      return [];
    }
    const data = (await res.json()) as RedditListing;
    return (data.data?.children ?? [])
      .map((c) => c.data)
      .filter((p) => p && !p.over_18 && !p.stickied && p.title);
  } catch (e) {
    console.error("[Reddit] fetch error", e);
    return [];
  }
}
