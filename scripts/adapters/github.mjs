import { SourceAdapter, httpGet, stripHtml } from "./base.mjs";

const API = "https://api.github.com";

/**
 * Tracks repository activity — currently releases, which carry the most signal
 * (commits are too noisy, issues too community-driven). Each config entry
 * targets one repo and attributes its releases to a single company.
 *
 * GITHUB_TOKEN env var bumps the rate limit from 60/hr (unauth) to 5000/hr
 * (auth) — optional but recommended for cron use.
 */
export class GitHubAdapter extends SourceAdapter {
  /**
   * @param {{
   *   company: string,
   *   repo: string,            // "owner/name"
   *   kind?: 'releases',       // future: 'commits' | 'events'
   *   maxItems?: number,
   * }} config
   */
  constructor(config) {
    super({ name: `github:${config.repo}` });
    this.config = config;
  }

  async fetch() {
    const { company, repo, kind = "releases", maxItems = 5 } = this.config;
    if (!repo.includes("/")) {
      console.warn(`[${this.name}] repo must be "owner/name"`);
      return [];
    }
    const headers = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };
    const token = process.env.GITHUB_TOKEN;
    if (token) headers.Authorization = `Bearer ${token}`;

    if (kind !== "releases") {
      console.warn(`[${this.name}] unsupported kind "${kind}"`);
      return [];
    }

    const url = `${API}/repos/${repo}/releases?per_page=${maxItems}`;
    const res = await httpGet(url, { headers });
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    const out = [];
    for (const r of data) {
      if (r.draft) continue;
      const published = r.published_at ?? r.created_at;
      if (!published || !r.html_url || !r.tag_name) continue;
      const title = `${repo} ${r.name || r.tag_name}${r.prerelease ? " (pre-release)" : ""}`;
      const body = stripHtml(r.body ?? "").slice(0, 4000);
      out.push({
        id: `gh:${repo}@${r.id ?? r.tag_name}`,
        company,
        title,
        body,
        url: r.html_url,
        publishedAt: new Date(published).toISOString(),
        source: "github",
        tags: [r.tag_name],
      });
    }
    return out;
  }
}
