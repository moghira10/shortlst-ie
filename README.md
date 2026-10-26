# Shortlst Practice (shortlst-ie)

Mock interviews for **interviewees**, served at **shortlst.me/practice**.
Candidates sign in, pick a Product Manager round, sit a live ~20 minute voice
interview with **Jane** (the same AI interviewer hiring teams use on Shortlst),
and get a rubric-scored feedback report.

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
shortlst.me/practice                    landing
shortlst.me/practice/signin             Google or email magic link (Supabase Auth)
shortlst.me/practice/dashboard          choose round + level → engine session created
shortlst.me/practice/interviews/:id/room  lobby → Daily call with Jane → hang up (or Jane ends it)
shortlst.me/practice/interviews/:id     polls until the engine webhook lands, then shows the report
```

## How it shares shortlst.me (multi-zones)

This app is deployed on its own, with Next.js `basePath: '/practice'`
(`next.config.js`). asparagus, which owns shortlst.me, rewrites `/practice` and
`/practice/*` to this deployment when `PRACTICE_APP_URL` is set (asparagus
`next.config.js`). Everything else on shortlst.me is untouched.

- Inside this app, `<Link>` and `router.push` add `/practice` automatically. `fetch`,
  `<img src>` and plain `<a href>` don't, so use `withBase()` from `src/lib/paths.ts`
  (`authFetch` already does).
- Same origin + same Supabase project means the browser session is shared with
  the recruiter app: signing in or out on one signs in or out on the other.

Practice data is kept apart from hiring data on purpose. Practice sessions never
write to `interviews` or `organizations`, never count against an org's plan, and
never email a recruiter.

## Setup

1. Apply the migrations in `supabase/migrations/` to the Shortlst Supabase project (done).
2. In Supabase → Authentication → URL Configuration, add
   `https://shortlst.me/practice/auth/callback` (and `http://localhost:3100/practice/auth/callback`
   for dev) to the redirect allow-list.
3. Deploy this repo as its own project (e.g. a second Vercel project). Set its env vars from
   `.env.example`, with `NEXT_PUBLIC_APP_URL=https://shortlst.me`. The engine URL, API key and
   webhook secret are the same values asparagus uses.
4. In asparagus, set `PRACTICE_APP_URL` to this deployment's origin (e.g.
   `https://shortlst-ie.vercel.app`) and redeploy.

Local dev: `npm install && npm run dev`, then open http://localhost:3100/practice. To test
through asparagus, run it with `PRACTICE_APP_URL=http://localhost:3100` and open
http://localhost:3000/practice.

The engine posts completion webhooks to
`https://shortlst.me/practice/api/webhooks/interview-complete`, which reaches this app
through the asparagus rewrite.
