// Site-specific HTML parser for https://www.anthropic.com/news.
// Anthropic's listing page is server-rendered Next.js with no JSON-LD and no
// __NEXT_DATA__ blob. Each article appears as:
//
//   <a href="/news/<slug>" class="...">
//     <h2 class="...">Title</h2>
//     ...
//     <span class="caption bold">Category</span>
//     <time class="...">Apr 16, 2026</time>
//     <p class="body-3 serif ...">Lead paragraph</p>
//   </a>
//
// We pull (slug, title, date, optional body) per anchor. Date format is the
// US-locale "MMM DD, YYYY" rendered by the page.

import { stripHtml } from "../base.mjs";

function tagText(snippet, tag) {
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = snippet.match(re);
  return m ? stripHtml(m[1]) : "";
}

export function parseAnthropicNews(html, { company }) {
  const out = [];
  const seen = new Set();

  // Each card is one anchor with href="/news/<slug>". Capture the anchor body
  // up to a generous window (cards are <~2KB each).
  const cardRe = /<a\b[^>]*href="\/news\/([^"#]+)"[^>]*>([\s\S]{0,4000}?)<\/a>/gi;

  let m;
  while ((m = cardRe.exec(html)) !== null) {
    const slug = m[1];
    const body = m[2];
    if (seen.has(slug)) continue;

    const title =
      tagText(body, "h2") ||
      tagText(body, "h3") ||
      tagText(body, "h4");
    const dateText = tagText(body, "time");
    const lead = tagText(body, "p");
    if (!title || !dateText) continue;

    const parsed = new Date(dateText);
    if (Number.isNaN(parsed.getTime())) continue;

    const url = `https://www.anthropic.com/news/${slug}`;
    seen.add(slug);
    out.push({
      id: url,
      company,
      title,
      body: lead || title,
      url,
      publishedAt: parsed.toISOString(),
      source: "blog",
    });
  }

  out.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return out;
}
