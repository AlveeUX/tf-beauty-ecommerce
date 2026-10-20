# CLAUDE.md

This is the **ThemeForest copy** of the Cosmia storefront, branch `themeforest`. The goal is a sellable Next.js eCommerce front-end template (JSON mock data, no database, no admin). The original full-stack app lives at `C:\Projects\beauty-ecommerce` and on `main`; never modify the original folder.

Read first, in this order: `docs/themeforest-plan.md` (the plan we execute and its task-contract template), `docs/context.md` (current state), `docs/decision-log.md` (why things are the way they are), then the document that owns your task (`docs/PRD.md` for requirements and the Figma inventory, `docs/e2e-testing-strategy.md` for tests). PRD sections about the database, auth, orders and the admin describe the full-stack `main` branch and do not apply here (D-050).

## Rules

- **Local only, except Git.** The user approved a local Git repo and one GitHub remote, `https://github.com/AlveeUX/tf-beauty-ecommerce.git` (D-051; **public**, the user chose to keep it public). Commit locally as work is finished; **ask before each push**. Still needing explicit approval: Vercel/deploy, production config, real payment/shipping/email providers, any other remote. Never rewrite history or force-push.
- **One phase/task at a time** per `docs/themeforest-plan.md` (phases TF0-TF8). Do not start the next phase without user approval. Define the task contract (plan section 3) and show it before coding.
- **Do not build the admin dashboard** (P7-P9). It is out of scope on this branch (TF-D3).
- **Figma is the visual source of truth** (file key `sXBQCd1Az2To21ejk56Yjc`). Fetch the specific frame via Figma MCP before building it; never fetch the whole page; never commit temporary Figma asset URLs. Use design tokens, not hardcoded values.
- **Nothing ships in the zip that we cannot redistribute:** no Figma-sourced photos, no AI-generated images, no author branding (TF5).
- **No module is done until** its E2E lifecycle passes (`docs/e2e-testing-strategy.md` section 3). Never report an unrun test as passed.
- **Keep `docs/figma-page-checklist.md` current:** when a Figma frame is built and tested, change its ❌ to ✅ (and the totals) in the same step.
- **Log decisions.** Append to `docs/decision-log.md` when you choose a tool, default, or approach (never rewrite history). Update `docs/context.md` and tick the master checklist in `docs/themeforest-plan.md` when status changes.
- Money is integer cents. No secrets in the repo.

## Commands

`npm run dev` - `npm run typecheck` - `npm run lint` - `npm test` - `npm run e2e` (see README). Until TF1 removes the database, `npm install` needs Node 22 or a copy of the original's `node_modules` (plan TF1-T00).
