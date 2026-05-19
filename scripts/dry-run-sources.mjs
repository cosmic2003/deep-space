// Local-only adapter smoke test. Runs every configured adapter, prints the
// first few items it returns, and reports per-source success/failure.
// No DB writes, no Gemini calls — pure fetch + parse.
//
// Run:  npm run sources:dry
//   or  node scripts/dry-run-sources.mjs [companyPrefix|adapterNamePrefix]
//
// Optional first arg filters by adapter.name substring (e.g. "rss:openai",
// "scraper:", "arxiv"). Useful when debugging one source.

import { SOURCES } from "./sources.config.mjs";

const filter = process.argv[2]?.toLowerCase();
const targets = filter
  ? SOURCES.filter((a) => a.name.toLowerCase().includes(filter))
  : SOURCES;

if (targets.length === 0) {
  console.error(`No adapters matched filter "${filter}".`);
  console.error("Available:", SOURCES.map((a) => a.name).join(", "));
  process.exit(1);
}

console.log(`Running ${targets.length} adapter(s)${filter ? ` matching "${filter}"` : ""}...\n`);

const results = [];

for (const adapter of targets) {
  const started = Date.now();
  try {
    const items = await adapter.fetch();
    const ms = Date.now() - started;
    results.push({ name: adapter.name, count: items.length, ms, ok: true });
    console.log(`✓ ${adapter.name}  ${items.length} items  (${ms}ms)`);
    for (const item of items.slice(0, 3)) {
      console.log(`    · ${item.publishedAt.slice(0, 10)}  [${item.source}]  ${item.title}`);
    }
    if (items.length > 3) console.log(`    … and ${items.length - 3} more`);
  } catch (e) {
    const ms = Date.now() - started;
    results.push({ name: adapter.name, count: 0, ms, ok: false, error: e.message });
    console.log(`✗ ${adapter.name}  FAILED  (${ms}ms)  — ${e.message}`);
  }
  console.log("");
}

const ok = results.filter((r) => r.ok).length;
const total = results.length;
const items = results.reduce((s, r) => s + r.count, 0);
console.log(`\nSummary: ${ok}/${total} adapters OK, ${items} total items.`);
const failed = results.filter((r) => !r.ok);
if (failed.length) {
  console.log("\nFailures:");
  for (const f of failed) console.log(`  - ${f.name}: ${f.error}`);
  process.exit(1);
}
