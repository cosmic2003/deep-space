// Declares every source the poller should fetch on each cron tick.
// Each entry is one adapter instance attributed to one ai_company.
//
// Add or comment out entries here — poll-rss.mjs reads this and iterates.

import {
  RSSAdapter,
  ScraperAdapter,
  ArxivAdapter,
  GitHubAdapter,
  RedditAdapter,
  HackerNewsAdapter,
} from "./adapters/index.mjs";
import { parseAnthropicNews } from "./adapters/parsers/anthropic.mjs";

export const SOURCES = [
  // ── RSS (working public feeds) ─────────────────────────────────────────────
  new RSSAdapter({ company: "openai",          url: "https://openai.com/news/rss.xml" }),
  new RSSAdapter({ company: "google-deepmind", url: "https://deepmind.google/blog/rss.xml" }),

  // ── HTML scrapers (no working RSS) ─────────────────────────────────────────
  // Anthropic uses a site-specific parser (no JSON-LD, no __NEXT_DATA__).
  new ScraperAdapter({
    company: "anthropic",
    url: "https://www.anthropic.com/news",
    parse: parseAnthropicNews,
  }),
  // xAI returns HTTP 403 to plain `fetch` (Cloudflare bot block) and Meta's
  // /blog returns a Facebook error page. Both need a headless browser or a
  // residential proxy — out of scope for a free cron. Live with the loss.
  // new ScraperAdapter({ company: "xai",     url: "https://x.ai/news" }),
  // new ScraperAdapter({ company: "meta-ai", url: "https://ai.meta.com/blog/" }),

  // ── X (Twitter) ────────────────────────────────────────────────────────────
  // Removed — X killed free public access in 2023 and Nitter mirrors are
  // unreliable + ToS-gray. Major announcements still arrive via blog/GitHub.

  // ── arXiv (filtered by author) ─────────────────────────────────────────────
  // Names match arXiv's author field — keep them in canonical form.
  new ArxivAdapter({
    company: "google-deepmind",
    authors: ["Demis Hassabis", "David Silver", "Oriol Vinyals", "Koray Kavukcuoglu"],
  }),
  new ArxivAdapter({
    company: "openai",
    authors: ["Ilya Sutskever", "John Schulman", "Jakub Pachocki"],
  }),
  new ArxivAdapter({
    company: "anthropic",
    authors: ["Dario Amodei", "Tom Brown", "Jared Kaplan", "Chris Olah"],
  }),
  new ArxivAdapter({
    company: "meta-ai",
    authors: ["Yann LeCun", "Hugo Touvron"],
  }),

  // ── GitHub releases ────────────────────────────────────────────────────────
  // GITHUB_TOKEN env var optional but recommended (60→5000/hr rate limit).
  new GitHubAdapter({ company: "openai",          repo: "openai/openai-python" }),
  new GitHubAdapter({ company: "openai",          repo: "openai/openai-node" }),
  new GitHubAdapter({ company: "anthropic",       repo: "anthropics/anthropic-sdk-python" }),
  new GitHubAdapter({ company: "anthropic",       repo: "anthropics/anthropic-sdk-typescript" }),
  new GitHubAdapter({ company: "anthropic",       repo: "anthropics/claude-code" }),
  new GitHubAdapter({ company: "google-deepmind", repo: "google-deepmind/alphafold" }),
  new GitHubAdapter({ company: "meta-ai",         repo: "meta-llama/llama-models" }),
  new GitHubAdapter({ company: "meta-ai",         repo: "facebookresearch/segment-anything-2" }),

  // ── Reddit ─────────────────────────────────────────────────────────────────
  // Sort by "top" with high minScore for signal-to-noise; subs are too noisy
  // for raw /new. Flair filters were too strict (most posts lack flair) — rely
  // on score instead.
  new RedditAdapter({
    company: "openai",
    subreddit: "OpenAI",
    sort: "top",
    minScore: 200,
  }),
  new RedditAdapter({
    company: "anthropic",
    subreddit: "ClaudeAI",
    sort: "top",
    minScore: 100,
  }),
  new RedditAdapter({
    company: "anthropic",
    subreddit: "Anthropic",
    sort: "top",
    minScore: 50,
  }),

  // ── Hacker News (Algolia search) ───────────────────────────────────────────
  // Per-company keyword queries — only stories where the title/URL/body
  // matches at least one term and that cleared the points threshold.
  // Lookback is 14 days so we don't reprocess the same viral stories forever.
  new HackerNewsAdapter({
    company: "openai",
    terms: ["OpenAI", "ChatGPT", "GPT-4", "GPT-5", "Sora", "Codex", "Dall-E"],
    minPoints: 100,
  }),
  new HackerNewsAdapter({
    company: "anthropic",
    terms: ["Anthropic", "Claude", "Claude Code"],
    minPoints: 100,
  }),
  new HackerNewsAdapter({
    company: "google-deepmind",
    terms: ["DeepMind", "Gemini", "AlphaFold", "AlphaEvolve", "AlphaCode"],
    minPoints: 100,
  }),
  new HackerNewsAdapter({
    company: "meta-ai",
    terms: ["Llama", "Meta AI", "Segment Anything"],
    minPoints: 100,
  }),
  new HackerNewsAdapter({
    company: "xai",
    terms: ["xAI", "Grok"],
    minPoints: 100,
  }),
];
