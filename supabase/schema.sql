-- =============================================================================
-- Pepclaw — Supabase / Postgres schema
-- Paste into Supabase → SQL Editor → Run.
-- Idempotent: safe to re-run on an existing project.
-- =============================================================================

-- ---- missions ---------------------------------------------------------------
create table if not exists public.missions (
  id              text        primary key,
  query           text        not null,
  target_class    text,
  depth           text        not null default 'standard',  -- scout | standard | deep
  status          text        not null default 'queued',    -- queued | running | completed | failed | cancelled
  budget_cents    integer     not null default 800,
  spent_cents     integer     not null default 0,
  created_at      timestamptz not null default now(),
  started_at      timestamptz,
  completed_at    timestamptz,
  failure_reason  text,
  commit_hash     text,
  commit_salt     text,
  revealed_at     timestamptz
);

create index if not exists missions_created_idx on public.missions (created_at desc);
create index if not exists missions_status_idx  on public.missions (status);

-- ---- tasks ------------------------------------------------------------------
create table if not exists public.tasks (
  id            text        primary key,
  mission_id    text        not null references public.missions(id) on delete cascade,
  pool          text        not null,
  agent_index   integer     not null default 0,
  status        text        not null default 'queued',
  input         jsonb,
  output        jsonb,
  error         text,
  started_at    timestamptz,
  completed_at  timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists tasks_mission_idx on public.tasks (mission_id);
create index if not exists tasks_pool_idx    on public.tasks (pool);
create index if not exists tasks_status_idx  on public.tasks (status);

-- ---- findings ---------------------------------------------------------------
create table if not exists public.findings (
  id               text        primary key,
  mission_id       text        not null references public.missions(id) on delete cascade,
  task_id          text                 references public.tasks(id)    on delete set null,
  pool             text        not null,
  source_type      text        not null,
  source_ref       text        not null,
  title            text,
  content          text        not null,
  url              text,
  relevance_score  real,
  evidence_grade   text,
  target           text,
  metadata         jsonb,
  created_at       timestamptz not null default now()
);

create index if not exists findings_mission_idx on public.findings (mission_id);
create index if not exists findings_grade_idx   on public.findings (evidence_grade);
create index if not exists findings_source_idx  on public.findings (source_type);

-- ---- theses -----------------------------------------------------------------
create table if not exists public.theses (
  id                text        primary key,
  mission_id        text        not null references public.missions(id) on delete cascade,
  title             text        not null,
  hypothesis        text        not null,
  mechanism         text,
  target            text,
  evidence_summary  text,
  conviction        real,
  evidence_grade    text,
  status            text        not null default 'draft',
  created_at        timestamptz not null default now()
);

create index if not exists theses_mission_idx on public.theses (mission_id);

-- ---- critiques --------------------------------------------------------------
create table if not exists public.critiques (
  id                text        primary key,
  mission_id        text        not null references public.missions(id) on delete cascade,
  thesis_id         text                 references public.theses(id)   on delete set null,
  persona           text        not null,
  severity          text        not null,
  category          text,
  specific_concern  text        not null,
  suggested_fix     text,
  blocks            boolean     not null default false,
  created_at        timestamptz not null default now()
);

create index if not exists critiques_mission_idx on public.critiques (mission_id);

-- ---- dossiers ---------------------------------------------------------------
create table if not exists public.dossiers (
  id             text        primary key,
  mission_id     text        not null references public.missions(id) on delete cascade,
  title          text        not null,
  content        text        not null,
  content_chars  integer     not null,
  doc_type       text        not null,
  created_at     timestamptz not null default now()
);

create index if not exists dossiers_mission_idx on public.dossiers (mission_id);

-- ---- events -----------------------------------------------------------------
-- Append-only swarm event log. Powers /api/stream (SSE) and live dashboard.
create table if not exists public.events (
  id          bigserial   primary key,
  mission_id  text,
  kind        text        not null,
  pool        text,
  payload     jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists events_mission_idx on public.events (mission_id);

-- =============================================================================
-- Row Level Security
-- All Pepclaw access goes through the SUPABASE_SERVICE_ROLE_KEY which bypasses
-- RLS. We still enable RLS so anon/authenticated keys cannot read the tables.
-- =============================================================================
alter table public.missions  enable row level security;
alter table public.tasks     enable row level security;
alter table public.findings  enable row level security;
alter table public.theses    enable row level security;
alter table public.critiques enable row level security;
alter table public.dossiers  enable row level security;
alter table public.events    enable row level security;

-- =============================================================================
-- Realtime (optional — enables Supabase Realtime channel on events for live UI)
-- =============================================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'events'
  ) then
    alter publication supabase_realtime add table public.events;
  end if;
end $$;
