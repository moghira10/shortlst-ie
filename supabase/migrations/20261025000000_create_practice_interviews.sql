-- Practice (mock) interviews taken by individual candidates on shortlst-ie.
--
-- Kept separate from public.interviews on purpose: those rows belong to a hiring
-- organization, count against its plan, and trigger recruiter emails. Practice
-- sessions belong to the candidate who took them and nobody else.

create table if not exists public.practice_interviews (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  -- Engine session id (also used as the Daily room / candidate_id on the engine side)
  session_id      text not null unique,
  job_role        text not null default 'product_manager',
  interview_type  text not null,
  level           text not null,
  target_company  text,
  candidate_name  text not null,
  status          text not null default 'created'
                    check (status in ('created', 'in_progress', 'completed', 'failed')),
  transcript      jsonb,
  evaluation      jsonb,
  created_at      timestamptz not null default now(),
  started_at      timestamptz,
  completed_at    timestamptz
);

comment on table public.practice_interviews is
  'Mock interviews candidates take on shortlst-ie (practice mode). Not tied to any organization.';

create index if not exists practice_interviews_user_created_idx
  on public.practice_interviews (user_id, created_at desc);

-- Candidates can read their own practice interviews. All writes go through the
-- shortlst-ie API with the service role key, so no insert/update policies.
alter table public.practice_interviews enable row level security;

drop policy if exists "practice_interviews_select_own" on public.practice_interviews;
create policy "practice_interviews_select_own"
  on public.practice_interviews
  for select
  to authenticated
  using (auth.uid() = user_id);
