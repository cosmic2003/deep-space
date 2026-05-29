-- Frontier-LLM leaderboard, sourced from the Artificial Analysis API
-- (https://artificialanalysis.ai/). Each poll wipes the table and reinserts the
-- current top-N by the Artificial Analysis Intelligence Index, so the frontend
-- just reads every row ordered by rank. `fetched_at` doubles as the snapshot
-- date shown in the UI. Refreshed daily by .github/workflows/poll-benchmarks.yml.

create table if not exists model_benchmarks (
  id            bigint generated always as identity primary key,
  rank          int         not null,
  name          text        not null,
  creator       text        not null,
  slug          text,
  intelligence  numeric,                       -- AA Intelligence Index
  coding        numeric,                       -- AA Coding Index
  math          numeric,                       -- AA Math Index
  price_input   numeric,                       -- USD / 1M input tokens
  price_output  numeric,                       -- USD / 1M output tokens
  fetched_at    timestamptz not null default now()
);

create index if not exists model_benchmarks_rank_asc
  on model_benchmarks (rank asc);

alter table model_benchmarks enable row level security;

drop policy if exists "model_benchmarks_public_read" on model_benchmarks;
create policy "model_benchmarks_public_read"
  on model_benchmarks for select
  to anon, authenticated
  using (true);
