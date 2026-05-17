-- Deep Space — AI sector schema
-- Apply in Supabase SQL Editor (or via `supabase db push` if using the CLI).
--
-- Roles:
--   anon         : read-only (dashboard reads)
--   service_role : full access (n8n writes via service_role key, bypasses RLS)

-- ──────────────────────────────────────────────────────────────────────────────
-- Enums
-- ──────────────────────────────────────────────────────────────────────────────

do $$ begin
  create type ai_company as enum (
    'openai',
    'anthropic',
    'google-deepmind',
    'xai',
    'meta-ai'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type post_source as enum ('blog', 'x', 'paper');
exception when duplicate_object then null; end $$;

-- ──────────────────────────────────────────────────────────────────────────────
-- ai_posts
--   One row per article / tweet / paper. `id` is a stable upstream identifier
--   (RSS <guid>, X status id, arXiv id) so n8n can upsert safely.
-- ──────────────────────────────────────────────────────────────────────────────

create table if not exists ai_posts (
  id            text         primary key,
  company       ai_company   not null,
  title         text         not null,
  summary       text         not null,
  url           text         not null,
  published_at  timestamptz  not null,
  source        post_source  not null default 'blog',
  tags          text[]       not null default '{}',
  created_at    timestamptz  not null default now()
);

create index if not exists ai_posts_published_at_desc
  on ai_posts (published_at desc);

create index if not exists ai_posts_company_published_at
  on ai_posts (company, published_at desc);

-- ──────────────────────────────────────────────────────────────────────────────
-- daily_digest
--   One row per day. `highlights` is a JSON array of
--   { title: string, company: ai_company, url?: string }.
-- ──────────────────────────────────────────────────────────────────────────────

create table if not exists daily_digest (
  date         date         primary key,
  summary      text         not null,
  highlights   jsonb        not null default '[]'::jsonb,
  created_at   timestamptz  not null default now()
);

-- ──────────────────────────────────────────────────────────────────────────────
-- Row Level Security — public read, service_role writes (bypasses RLS)
-- ──────────────────────────────────────────────────────────────────────────────

alter table ai_posts     enable row level security;
alter table daily_digest enable row level security;

drop policy if exists "ai_posts_public_read"      on ai_posts;
drop policy if exists "daily_digest_public_read"  on daily_digest;

create policy "ai_posts_public_read"
  on ai_posts for select
  to anon, authenticated
  using (true);

create policy "daily_digest_public_read"
  on daily_digest for select
  to anon, authenticated
  using (true);

-- ──────────────────────────────────────────────────────────────────────────────
-- n8n upsert patterns (reference — not executed here)
-- ──────────────────────────────────────────────────────────────────────────────
--
-- Posts (idempotent on RSS re-polls):
--   insert into ai_posts (id, company, title, summary, url, published_at, source, tags)
--   values ($1, $2, $3, $4, $5, $6, $7, $8)
--   on conflict (id) do update set
--     title        = excluded.title,
--     summary      = excluded.summary,
--     url          = excluded.url,
--     published_at = excluded.published_at,
--     tags         = excluded.tags;
--
-- Daily digest (one row per day, overwrite if regenerated):
--   insert into daily_digest (date, summary, highlights)
--   values ($1, $2, $3::jsonb)
--   on conflict (date) do update set
--     summary    = excluded.summary,
--     highlights = excluded.highlights;
