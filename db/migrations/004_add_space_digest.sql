-- Space-news weekly digest. Each row is one Gemini summarisation pass over
-- the last N days of Spaceflight News API articles. We keep history (no
-- ON CONFLICT) so we can debug regressions and run a few times per day if
-- needed; the frontend just reads the latest by generated_at.

create table if not exists space_digest (
  id            bigint generated always as identity primary key,
  generated_at  timestamptz not null default now(),
  summary       text        not null,
  items         jsonb       not null default '[]'::jsonb,  -- [{title, desc, source, url}]
  source_count  int         not null,
  window_days   int         not null
);

create index if not exists space_digest_generated_at_desc
  on space_digest (generated_at desc);

alter table space_digest enable row level security;

drop policy if exists "space_digest_public_read" on space_digest;
create policy "space_digest_public_read"
  on space_digest for select
  to anon, authenticated
  using (true);
