# Shortlst Practice (shortlst-ie)

Mock interviews for **interviewees**. Candidates sign in, pick a Product Manager
round, sit a live ~20 minute voice interview with **Jane** (the same AI
interviewer hiring teams use on [shortlst.me](https://shortlst.me)), and get a
rubric-scored feedback report.

This app owns no interview logic of its own. It reuses the existing Shortlst
infrastructure:

| Piece | Reused from | Notes |
|---|---|---|
| Interview engine (Daily room + Jane bot + evaluation) | Same engine as `asparagus` (`INTERVIEW_ENGINE_URL`) | `POST /api/session/create`, `GET /join`, `POST /start`, `POST /end` |
| Completion webhook | Same HMAC scheme (`x-interview-signature`, `WEBHOOK_SECRET`) | Engine calls our `callback_url` per session |
| Rubrics & scoring | Engine `interview_config.py` | `product_sense`, `execution`, `analytical`, `behavioural` |
| Auth + database | Same Supabase project | New table `practice_interviews`, nothing else touched |
| Interview room UI | `asparagus/src/components/InterviewRoom.jsx` | Ported to `src/components/PracticeRoom.jsx` without proctoring, recording upload, branding |

## Scope (v1)

- **Role:** Product Manager only (`src/lib/practiceConfig.ts`).
- **Rounds:** Product Sense, Execution, Analytical & Metrics, Behavioural.
- **Levels:** Associate PM / PM / Senior PM, sent to the engine as `junior` / `mid` / `senior`.
  If the engine rejects a level other than `mid`, the session is created at `mid` instead.
- **Personalisation:** optional target company and resume. Both go into the engine's `job_description` / `candidate_resume`.
- **Limits:** `PRACTICE_MONTHLY_LIMIT` sessions per user per rolling 30 days (default 3). Failed sessions don't count.

Adding another role means adding a `PracticeRole` to `PRACTICE_ROLES` that uses
engine interview types which already exist.

## Flow

```
/            landing
/signin      Google or email magic link (Supabase Auth)
/practice    choose round + level → POST /api/practice → engine session created
/practice/:id/room   lobby → Daily call with Jane → hang up (or Jane ends it)
/practice/:id        polls until the engine webhook lands, then shows the report
```

Practice data is kept apart from hiring data on purpose. Practice sessions never
write to `interviews` or `organizations`, never count against an org's plan, and
never email a recruiter.

## Setup

1. Apply the migration in `supabase/migrations/` to the Shortlst Supabase project.
2. In Supabase → Authentication → URL Configuration, add `https://<this-app>/auth/callback`
   (and `http://localhost:3100/auth/callback` for dev) to the redirect allow-list.
3. `cp .env.example .env.local` and fill it in. The engine URL, API key and webhook secret
   are the same values asparagus uses.
4. `npm install && npm run dev` (port 3100).

The engine has to be able to reach `NEXT_PUBLIC_APP_URL/api/webhooks/interview-complete`.
For local dev, expose the app through a tunnel.
