# Security Operations

## Immediate credential response

Production credentials must never be committed, copied into issues, or included in logs. If a secret reaches Git history, treat it as compromised even when the file is later ignored or deleted.

1. Rotate the PostgreSQL password and Supabase service-role/JWT keys in Supabase.
2. Replace affected Vercel and GitHub Actions secrets.
3. Rotate Laravel `APP_KEY` with a maintenance plan, then revoke all Sanctum tokens.
4. Restrict repository access and enable history-aware secret scanning and push protection.
5. Verify Storage bucket policies and RLS in Supabase after rotation.

These actions require access to Supabase, Vercel, and GitHub and cannot be completed from source code alone.

## Data handling

- Do not place credentials in `.env.example` or application documentation.
- Backups contain sensitive data. Keep the bucket private, use short-lived authenticated downloads, and prefer encrypted managed PostgreSQL backups.
- Audit records exclude direct identifiers and retain at most `AUDIT_THRESHOLD` records per auditable model. Set the threshold according to the legal retention policy.

## Release gate

Production deploys run only after CI passes. Before releasing a database migration, test it against PostgreSQL and confirm that the production migration command is available to the deploy platform.
