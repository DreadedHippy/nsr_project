# NSR Beneficiary Identity Verification System

Next.js + Supabase implementation for the National Social Register beneficiary verification workflow.

## Stack

- Next.js App Router
- Supabase Auth, Postgres, and Row Level Security
- Vercel deployment
- Server-side NIMC adapter with a local mock fallback

## Features Implemented

- Role-based access for administrators and verification agents
- Admin user invitation, resend, and deactivation workflows
- 72-hour account setup tokens
- Agent NIN verification with 11-digit validation
- Mock NIMC provider when `NIMC_API_URL` or `NIMC_API_KEY` is not configured
- Secure NIN masking, hashing, and encrypted storage
- Required feedback submission before the next verification
- NSR Social Register ID to NIN match validation
- Immutable feedback records
- Feedback search, filtering, pagination, and CSV export
- Supabase migration with RLS policies

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment variables:

   ```bash
   cp .env.example .env.local
   ```

3. Fill in:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   APP_URL=http://localhost:3000
   NIN_ENCRYPTION_KEY=
   ```

4. Apply the Supabase migration in `supabase/migrations/001_initial_schema.sql`.

5. Create the first admin in Supabase Auth, then insert the matching profile using `supabase/seed.sql`.

   Or seed an administrator from the command line:

   ```bash
   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='change-this-password' ADMIN_FULL_NAME='System Administrator' npm run seed:admin
   ```

   If `ADMIN_PASSWORD` is omitted, the script generates and prints a temporary password.

6. Seed a test NSR record:

   ```bash
   npm run seed:nsr
   ```

   Default test values:

   ```text
   Social Register ID: NSR-TEST-001
   NIN: 12345678902
   ```

   Seed a standalone `not_verified` verification for the first active agent:

   ```bash
   npm run seed:not-verified
   ```

   Seed feedback for a standalone `not_verified` verification:

   ```bash
   npm run seed:not-verified-feedback
   ```

7. Run the app:

   ```bash
   npm run dev
   ```

## NIMC Integration

Set these variables when real provider credentials are available:

```bash
NIMC_API_URL=
NIMC_API_KEY=
```

Without them, the app uses a mock provider:

- NIN ending in `0000`: service unavailable
- NIN ending in an even digit: verified
- NIN ending in an odd digit: not verified

## Deployment

Deploy to Vercel with the same environment variables. Keep `SUPABASE_SERVICE_ROLE_KEY` and `NIN_ENCRYPTION_KEY` server-only.

## Production Notes

- Wire email delivery for invitation links. The current implementation logs setup links on the server.
- New and resent invitation links are also shown on the admin users page after the action completes.
- Import real NSR data using the same encryption and SHA-256 hash strategy used by `lib/security.ts`.
- Confirm the real NIMC response contract and update `lib/nimc.ts` if field names differ.
- Add rate limiting around verification submissions before public rollout.
