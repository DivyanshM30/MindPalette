# Mood ownership verification

Last verified: 2026-09-13 against the configured Mind Palette project.

## Result

The live `public.moods` CRUD policies enforce per-user ownership. No production
policy change was necessary. RLS is enabled, the table belongs to `postgres`, and
neither `anon` nor `authenticated` is a superuser or has `BYPASSRLS`.

Observed policies (all apply to PUBLIC):

| Operation | USING | WITH CHECK |
| --- | --- | --- |
| SELECT | `auth.uid() = user_id` | Not applicable |
| INSERT | Not applicable | `auth.uid() = user_id` |
| UPDATE | `auth.uid() = user_id` | Inherits USING |
| DELETE | `auth.uid() = user_id` | Not applicable |

An omitted UPDATE `WITH CHECK` inherits `USING`; it does not disable ownership
validation. See [PostgreSQL CREATE POLICY](https://www.postgresql.org/docs/current/sql-createpolicy.html).

## Repeat the check

1. Open the project's Supabase SQL Editor using the `postgres` role.
2. Paste and run the **entire** `moods_rls.sql` file in one execution.
3. Expect `PASS: mood CRUD ownership, forged writes, upserts and anonymous access`.
   Any SQL error means the check did not pass and must be investigated.

The script checks live RLS metadata, copies the table structure and current
policies to a temporary table, and mirrors effective CRUD grants. It switches
to the real API roles and supplies synthetic JWT claims to exercise `auth.uid()`.
Only synthetic fixtures are inserted. It reads no real moods, creates no auth
accounts, and ends with ROLLBACK. Foreign keys and triggers are not copied by
`LIKE`; this is a policy test, not a complete replica of the application backend.

Verified cases:

- A and B see only their own entries.
- Cross-user UPDATE and DELETE affect zero rows.
- Forged INSERT, forged UPSERT and ownership reassignment are rejected.
- Own INSERT, UPSERT, UPDATE and DELETE succeed.
- Anonymous SELECT, INSERT, UPDATE and DELETE are denied or affect zero rows.

Test sensitivity was also checked using deliberately weakened policies only in
the temporary copy: open reads failed the ownership assertion, and a permitted
ownership transfer failed the reassignment assertion. The unchanged-policy test
passed again afterwards. No weakened policy was installed on `public.moods`.

## Limits and separate follow-ups

- This verifies database CRUD isolation, not JWT signature validation or a full
  two-account browser/API flow. For UI verification, use two test accounts in
  separate browser profiles and confirm entries stay separate after reloading.
- Existing grants include TRUNCATE, REFERENCES and TRIGGER for API roles. RLS
  does not cover TRUNCATE. Standard PostgREST CRUD does not expose it; assess
  least-privilege grant hardening separately before adding SQL/RPC surfaces.
- `public.delete_account()` was absent during this review, despite the checked-in
  `supabase/migrations/20260719_delete_account.sql`. Verify and deploy that RPC as
  a separate task before marking account deletion operational.
- There were no non-internal triggers on `moods` or public views during review.
  New triggers, views, RPCs or policies require renewed review.
