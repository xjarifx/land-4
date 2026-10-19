# NID Citizen Portal

Next.js Bangladesh land due-diligence prototype with National ID (NID) authentication, Prisma, a project-local SQLite database, and an explainable fraud/double-selling risk analyzer.

The main workflow is intentionally simple: a buyer enters one registered deed/document number and receives a BUY/CLEAR, HOLD, or STOP status. The synthetic registry adapter checks the recorded owner, prior or duplicate sales, pending mutation, deed registration, mortgage/encumbrance, court cases, acquisition/khas status, and recent land tax. The adapter boundary is designed for a future authorized government integration.

The underlying analyzer also extracts transaction and parcel attributes, compares CS/SA/RS/BS plot numbers, calculates the deed-registration-to-mutation interval, checks title-chain and evidence gaps, and emits the required JSON report shape:

```json
{
  "summary": "...",
  "chain_of_title_status": "Valid | Incomplete | Broken",
  "double_selling_risk_level": "High | Medium | Low",
  "identified_loopholes_and_flags": [],
  "recommended_verification_steps": []
}
```

The rules are intentionally deterministic and explainable for a prototype. They are not a substitute for verification by the Sub-Registry Office, AC Land Office, a licensed surveyor, or a qualified Bangladeshi lawyer.

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. (Optional) Create the local environment file:

   ```bash
   copy .env.example .env
   ```


3. Create the project-local SQLite database and seed the demo user:

   ```bash
   npm run db:push
   npm run db:seed
   ```

   The database file is created at `prisma/dev.db` and is ignored by Git, so no separate database service or deployment is required.

4. Start the app at [http://localhost:3000](http://localhost:3000):

   ```bash
   npm run dev
   ```

## Demo account

- NID: `1987654321098`
- Password: `Demo@1234`

Passwords are hashed with bcrypt. Sessions are represented by signed HTTP-only cookies, so they do not require a writable database at runtime. The demo credentials are for local development only.

The production build runs `prisma db push` and `prisma db seed` automatically. This keeps the SQLite database setup inside the project, so a hosted deployment does not need a separate database service or migration step. Login sessions use signed HTTP-only cookies rather than database writes, which also works on hosts with read-only or ephemeral deployment filesystems. Set `SESSION_SECRET` in the host environment if you want to replace the built-in demo fallback secret.

After signing in, enter one of these synthetic demo deed numbers:

- `DEMO-1001` — STOP: pending mutation and later transfer warning
- `DEMO-2002` — CLEAR: no synthetic blocking status found

An unknown deed number returns HOLD and instructs the buyer to obtain official verification. The supplied LandTech rulebook prohibits collecting or displaying real personal data or real land records in the demonstration.

## Rulebook compliance

- **Chosen problem statements:** P3 (Fraud & Double-Selling Detection) and P5 (Citizen Pre-Purchase Verification).
- **Synthetic data:** The demo account, people, parcels, deeds, dates, and registry checks are fictional. Do not enter real personal or land information.
- **No live access:** The prototype uses local deterministic records only; it does not scrape, query, bulk-download, or security-test any government or third-party system.
- **Security scope:** Authentication and session behavior are demonstrated only on this local prototype. The project-local SQLite database is intended for a self-contained deployment and is not a substitute for a managed production database with backups and concurrency controls.
- **AI disclosure:** GitHub Copilot SDK in VS Code was used for scaffolding and implementation assistance. The student team remains responsible for understanding and presenting the code.

## Data sources and limitations

All records in `lib/registry-lookup.ts` are fictional records created for this demonstration. No government portal, external API, public personal-data source, or real deed is queried. The analyzer is a deterministic decision-support prototype: `CLEAR` means no blocking flag was found in the supplied synthetic record, not legal clearance or proof of ownership. Official Sub-Registry, AC Land, tax, possession, and litigation verification remains required before a real transaction.

## Validation

```bash
npm run test
npm run lint
npm run build
```

## AI tool disclosure

AI coding assistance using GitHub Copilot SDK in VS Code was used to scaffold the authentication flow, Prisma setup, UI, and deterministic analyzer. The implementation was reviewed and build-validated by the student team.

## Useful commands

```bash
npm run db:studio  # Open Prisma Studio
```
